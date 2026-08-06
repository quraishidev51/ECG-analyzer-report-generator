import { useRef, useState } from "react";
import axios from "axios";

function App() {
  const fileInputRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [ecgData, setEcgData] = useState([]);
  const [heatmap, setHeatmap] = useState([]);
  const [report, setReport] = useState("");
  const [probabilities, setProbabilities] = useState({});
  const [loading, setLoading] = useState(false);
  const [showGradCAM, setShowGradCAM] = useState(false);
  const [selectedLead, setSelectedLead] = useState(1); // Default to lead index 1

  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];

    if (!file) return;

    setSelectedFile(file);

    const text = await file.text();

    const json = JSON.parse(text);

    setEcgData(json.ecg_signal);
  };

  const analyzeECG = async () => {
    if (!selectedFile) {
      alert("Please upload a JSON ECG.");
      return;
    }

    try {
      setLoading(true);

      const text = await selectedFile.text();
      const json = JSON.parse(text);

      const response = await axios.post(
        "http://127.0.0.1:8000/predict",
        json
      );

      // 1. Set the AI report and probabilities
      setReport(response.data.report);
      if (response.data.probabilities) {
        setProbabilities(response.data.probabilities);
      }

      // 2. Update chart data with the preprocessed signal from backend
      if (response.data.processed_signal) {
        setEcgData(response.data.processed_signal);
      }

      // 3. Update and fully scale/normalize heatmap data between 0 and 1
      if (response.data.heatmap) {
        const rawHeatmap = response.data.heatmap;
        
        // Remove negatives (ReLU-style)
        const positiveHeatmap = rawHeatmap.map((v) => Math.max(0, v));

        // Find the peak activation value
        const maxHeat = Math.max(...positiveHeatmap);

        // Scale everything between 0 and 1 safely (avoiding divide-by-zero if flat)
        const normalizedHeatmap = positiveHeatmap.map(
          (v) => (maxHeat > 0 ? v / maxHeat : 0)
        );

        setHeatmap(normalizedHeatmap);

        console.log("max heat (raw):", Math.max(...rawHeatmap));
        console.log(
          "heat range:",
          Math.min(...normalizedHeatmap),
          Math.max(...normalizedHeatmap)
        );
      }
    } catch (err) {
      console.error(err);
      alert("Prediction failed.");
    } finally {
      setLoading(false);
    }
  };

  const DISPLAY_SAMPLES = 600;

  const chartData =
    ecgData.length > 0
      ? ecgData
          .slice(0, DISPLAY_SAMPLES)
          .map((sample, index) => ({
            x: index,
            value: sample[selectedLead] ?? sample[0],
            heat: heatmap[index] ?? 0, // Use fully normalized [0, 1] heatmap value
          }))
      : [];

  // Smoother Rainbow Color Mapping: Blue -> Cyan -> Yellow -> Orange -> Red with transparency
  const getRainbowColorAndOpacity = (heat) => {
    const h = Math.max(0, Math.min(1, heat));
    const opacity = 0.2 + h * 0.8;

    let hue = 240; // Default Blue
    if (h < 0.25) {
      hue = 240 - (h / 0.25) * 60;
    } else if (h < 0.5) {
      hue = 180 - ((h - 0.25) / 0.25) * 120;
    } else if (h < 0.75) {
      hue = 60 - ((h - 0.5) / 0.25) * 30;
    } else {
      hue = 30 - ((h - 0.75) / 0.25) * 30;
    }

    return {
      color: `hsl(${hue}, 100%, 50%)`,
      opacity: opacity,
    };
  };

  // SVG scaling calculations for custom renderer
  const svgWidth = 1200;
  const svgHeight = 600;
  const paddingX = 40;
  const paddingY = 60;

  const values = chartData.map((d) => d.value);
  const minY = values.length > 0 ? Math.min(...values) : -1;
  const maxY = values.length > 0 ? Math.max(...values) : 1;
  const yRange = maxY - minY === 0 ? 1 : maxY - minY;

  const getCoordinates = (index, value) => {
    const x = paddingX + (index / (DISPLAY_SAMPLES - 1 || 1)) * (svgWidth - paddingX * 2);
    const y = svgHeight - paddingY - ((value - minY) / yRange) * (svgHeight - paddingY * 2);
    return { x, y };
  };

  // Helper to extract top prediction info for dynamic summary
  const getTopPrediction = () => {
    const entries = Object.entries(probabilities);
    if (entries.length === 0) return null;
    entries.sort((a, b) => b[1] - a[1]);
    return { label: entries[0][0], val: (entries[0][1] * 100).toFixed(1) };
  };

  const topPred = getTopPrediction();

  // Detect R-peaks in the currently displayed signal (simple local-maxima +
  // prominence approach, similar to scipy.signal.find_peaks with
  // prominence=np.std(signal)), so region labeling is anchored to the
  // ACTUAL beats in this specific waveform instead of a fixed index range.
  const detectRPeaks = (data, minDistance = 40) => {
    const values = data.map((d) => d.value);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const std = Math.sqrt(
      values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length
    );
    const prominenceThreshold = std;

    const peaks = [];
    for (let i = 1; i < values.length - 1; i++) {
      const isLocalMax = values[i] > values[i - 1] && values[i] >= values[i + 1];
      const isProminent = values[i] - mean > prominenceThreshold;
      if (isLocalMax && isProminent) {
        // Enforce a minimum distance from the last detected peak so we
        // don't pick up multiple bumps within the same QRS complex.
        if (peaks.length === 0 || i - peaks[peaks.length - 1] >= minDistance) {
          peaks.push(i);
        }
      }
    }
    return peaks;
  };

  // Classify a sample index relative to the NEAREST real R-peak, instead of
  // a fixed absolute cutoff. This stays accurate regardless of where in the
  // multi-beat display window the Grad-CAM peak happens to fall.
  const classifyRegion = (index, rPeaks) => {
    if (rPeaks.length === 0) return "Unclear (no beat detected)";

    let nearestPeak = rPeaks[0];
    let minDist = Math.abs(index - rPeaks[0]);
    for (const r of rPeaks) {
      const dist = Math.abs(index - r);
      if (dist < minDist) {
        minDist = dist;
        nearestPeak = r;
      }
    }

    const offset = index - nearestPeak; // negative = before the beat, positive = after

    if (offset >= -35 && offset <= -12) return "P-wave";
    if (offset >= -11 && offset <= 11) return "QRS complex";
    if (offset >= 12 && offset <= 45) return "ST segment";
    if (offset >= 46 && offset <= 90) return "T-wave";
    return "Baseline / between beats";
  };

  // Derive real Grad-CAM-based reasoning: find where the heatmap peaks and
  // map that sample index to the ECG segment it most likely corresponds to,
  // anchored to the nearest actually-detected R-peak in this waveform.
  const getGradCAMReasoning = () => {
    if (!heatmap || heatmap.length === 0 || chartData.length === 0) return null;

    let peakIndex = 0;
    let peakVal = -Infinity;
    for (let i = 0; i < Math.min(heatmap.length, DISPLAY_SAMPLES); i++) {
      if (heatmap[i] > peakVal) {
        peakVal = heatmap[i];
        peakIndex = i;
      }
    }

    const rPeaks = detectRPeaks(chartData);
    const region = classifyRegion(peakIndex, rPeaks);

    return { peakIndex, region, rPeaks };
  };

  const gradCamReasoning = getGradCAMReasoning();

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans">

      {/* HEADER */}
      <header className="border-b border-slate-800 bg-slate-900 px-10 py-6 flex justify-between items-center shadow-md">

        <div>
          <h1 className="text-4xl font-bold tracking-wide">
            🫀 CardioXAI
          </h1>

          <p className="text-slate-400 mt-2 text-sm tracking-wide">
              ECG Analysis & AI Report Generator 
          </p>
        </div>

        <div className="flex gap-3 items-center">

          {/* Lead Selector Dropdown */}
          <div className="flex items-center gap-2 bg-slate-800 px-3 py-2 rounded-xl border border-slate-700">
            <span className="text-xs text-slate-400 font-mono">LEAD:</span>
            <select
              value={selectedLead}
              onChange={(e) => setSelectedLead(Number(e.target.value))}
              className="bg-slate-900 text-white text-sm font-semibold rounded px-2 py-1 outline-none cursor-pointer border border-slate-700"
            >
              <option value={0}>Lead I</option>
              <option value={1}>Lead II</option>
              <option value={2}>Lead III</option>
              <option value={3}>Lead aVR</option>
              <option value={4}>Lead aVL</option>
              <option value={5}>Lead aVF</option>
              <option value={6}>Lead V1</option>
              <option value={7}>Lead V2</option>
              <option value={8}>Lead V3</option>
              <option value={9}>Lead V4</option>
              <option value={10}>Lead V5</option>
              <option value={11}>Lead V6</option>
            </select>
          </div>

          <button
            onClick={handleUploadClick}
            className="bg-blue-600 hover:bg-blue-500 px-5 py-3 rounded-xl font-semibold transition shadow-lg shadow-blue-600/20"
          >
            Upload ECG
          </button>

          <button
            onClick={analyzeECG}
            disabled={loading}
            className="bg-green-600 hover:bg-green-500 disabled:bg-slate-600 px-5 py-3 rounded-xl font-semibold transition shadow-lg shadow-green-600/20"
          >
            {loading ? "Analyzing..." : "Analyze ECG"}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            hidden
            accept=".json"
            onChange={handleFileChange}
          />

        </div>

      </header>

      {/* BODY - Expanded layout: ECG takes 8 columns, Report takes 4 columns */}
      <main className="grid grid-cols-12 gap-6 p-8">

        {/* ECG SECTION (col-span-8 for an expansive widescreen presentation) */}
        <section className="col-span-12 lg:col-span-8 bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl flex flex-col justify-between">

          <div className="flex justify-between items-center mb-5">

            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-semibold">
                ECG Waveform
              </h2>
              {chartData.length > 0 && (
                <div className="flex items-center gap-2 text-xs bg-red-950/40 text-red-400 border border-red-800/50 px-3 py-1 rounded-full font-mono">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                  LEAD {selectedLead + 1} | 25 mm/s | 10 mm/mV
                </div>
              )}
            </div>

            <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showGradCAM}
                onChange={() => setShowGradCAM(!showGradCAM)}
                className="rounded accent-red-500 cursor-pointer w-4 h-4"
              />
              Model's Eyes 👁️👁️
            </label>

          </div>

          <div className="relative h-[520px] rounded-xl border border-slate-700 bg-[#0d1117] overflow-hidden shadow-inner flex flex-col justify-between">

            {/* Medical Grid Simulation */}
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(to_right,#ff4d4d15_1px,transparent_1px),linear-gradient(to_bottom,#ff4d4d15_1px,transparent_1px)] bg-[size:20px_20px]" />
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(to_right,#ff4d4d25_1px,transparent_1px),linear-gradient(to_bottom,#ff4d4d25_1px,transparent_1px)] bg-[size:100px_100px]" />

            <div className="absolute inset-0 pt-4 flex items-center justify-center">
              {chartData.length > 0 ? (
                <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full p-4">
                  <defs>
                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
                      <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>

                  {chartData.slice(0, chartData.length - 1).map((entry, index) => {
                    const nextEntry = chartData[index + 1];
                    const start = getCoordinates(entry.x, entry.value);
                    const end = getCoordinates(nextEntry.x, nextEntry.value);
                    const segmentHeat = showGradCAM ? entry.heat : 0;
                    const styling = showGradCAM ? getRainbowColorAndOpacity(segmentHeat) : { color: "#ffffff", opacity: 1 };

                    return (
                      <line
                        key={`svg-segment-${index}`}
                        x1={start.x}
                        y1={start.y}
                        x2={end.x}
                        y2={end.y}
                        stroke={styling.color}
                        strokeOpacity={styling.opacity}
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        filter="url(#glow)"
                      />
                    );
                  })}
                </svg>
              ) : selectedFile ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-lg font-medium text-slate-300">
                    {selectedFile.name}
                  </p>
                  <p className="text-slate-500 mt-2">
                    Processing waveform layout...
                  </p>
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-slate-500 tracking-wide">
                  Upload an ECG JSON file to initialize diagnostic grid.
                </div>
              )}
            </div>

            {/* Bottom clinical calibration marker */}
            <div className="relative z-10 px-4 py-3 flex items-end select-none pointer-events-none">
              <div className="flex items-center gap-1 text-[10px] font-mono text-slate-500">
                <div className="w-2.5 h-6 border-l-2 border-b-2 border-slate-500"></div>
                <span>1 mV | 25 mm/s</span>
              </div>
            </div>

          </div>

          {/* Legend */}
{showGradCAM && (
  <div className="mt-4 bg-slate-950/70 border border-slate-800 px-4 py-3 rounded-xl flex flex-col gap-2">
    <div className="flex justify-between items-center text-xs text-slate-400 font-mono">
      <span>Low Importance</span>
      <span className="font-semibold text-slate-200">Grad-CAM Attribution Scale</span>
      <span>High Importance</span>
    </div>

    {/* Gradient bar matching the exact hue math from getRainbowColorAndOpacity */}
    <div
      className="h-3 w-full rounded-full shadow-inner"
      style={{
        background:
          "linear-gradient(to right, hsl(240,100%,50%) 0%, hsl(180,100%,50%) 25%, hsl(120,100%,50%) 37.5%, hsl(60,100%,50%) 50%, hsl(30,100%,50%) 75%, hsl(0,100%,50%) 100%)",
      }}
    />

    {/* Labels positioned at the actual stop locations, not evenly spaced */}
    <div className="relative h-4 text-[11px] font-mono text-slate-400">
      <span className="absolute" style={{ left: "0%" }}>Blue</span>
      <span className="absolute -translate-x-1/2" style={{ left: "25%" }}></span>
      <span className="absolute -translate-x-1/2" style={{ left: "37.5%" }}></span>
      <span className="absolute -translate-x-1/2" style={{ left: "50%" }}>yellow</span>
      <span className="absolute -translate-x-1/2" style={{ left: "75%" }}></span>
      <span className="absolute -translate-x-full" style={{ left: "100%" }}>Red</span>
    </div>
  </div>
)}

        </section>

        {/* RIGHT COLUMN (col-span-4 for the AI report and metrics panel) */}
        <div className="col-span-12 lg:col-span-4 space-y-6">

          {/* REPORT & PROBABILITIES */}
          <section className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-5">
            <h2 className="text-2xl font-semibold">
              AI Report
            </h2>

            {loading ? (
              <div className="text-blue-400 animate-pulse flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-500 animate-ping"></span>
                Running ECG Analysis...
              </div>
            ) : report ? (
              <div className="space-y-4">
                <pre className="whitespace-pre-wrap text-slate-300 leading-6 font-mono text-xs bg-slate-950 p-4 rounded-xl border border-slate-800">
                  {report}
                </pre>
              </div>
            ) : (
              <div className="text-slate-400 leading-7">
                Upload a JSON ECG and press
                <span className="font-semibold text-white">
                  {" "}Analyze ECG
                </span>
                <br />
                <br />
                The generated report will appear here.
              </div>
            )}
          </section>

          {/* XAI & EXPLANATION */}
          <section className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-4">
            <h2 className="text-2xl font-semibold">
              Model's Reasoning 
            </h2>

            <div className="text-slate-300 leading-6 text-sm bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              {gradCamReasoning ? (
                <>
                  <p className="font-medium text-blue-400">
                    The model primarily focused on the {gradCamReasoning.region} to make predictions.
                  </p>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    Peak Grad-CAM activation occurred at sample {gradCamReasoning.peakIndex} of the displayed waveform.
                  </p>
                </>
              ) : (
                <p className="font-medium text-slate-400">
                  Run an analysis to generate Grad-CAM-based reasoning.
                </p>
              )}

            </div>

            
          </section>

        </div>

      </main>

    </div>
  );
}

export default App;

