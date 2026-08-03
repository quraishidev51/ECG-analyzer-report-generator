import { useRef, useState } from "react";
import axios from "axios";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis
} from "recharts";

function App() {
  const fileInputRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [ecgData, setEcgData] = useState([]);
  const [report, setReport] = useState("");
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

      setReport(response.data.report);
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
          }))
    : [];

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans">

      {/* HEADER */}

      <header className="border-b border-slate-800 bg-slate-900 px-10 py-6 flex justify-between items-center shadow-md">

        <div>
          <h1 className="text-4xl font-bold tracking-wide">
            🫀 ECG Analyzer
          </h1>

          <p className="text-slate-400 mt-2 text-sm tracking-wide">
            Professional Grade Clinical Diagnostic Dashboard
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

      {/* BODY */}

      <main className="grid grid-cols-3 gap-6 p-8">

        {/* ECG */}

        <section className="col-span-2 bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl">

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

              Show Grad-CAM Heatmap

            </label>

          </div>

          <div className="relative h-[560px] rounded-xl border border-slate-700 bg-[#0d1117] overflow-hidden shadow-inner flex flex-col justify-between">

            {/* Medical Grid Simulation (Major & Minor Grid Lines) */}
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(to_right,#ff4d4d15_1px,transparent_1px),linear-gradient(to_bottom,#ff4d4d15_1px,transparent_1px)] bg-[size:20px_20px]" />
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(to_right,#ff4d4d25_1px,transparent_1px),linear-gradient(to_bottom,#ff4d4d25_1px,transparent_1px)] bg-[size:100px_100px]" />

            <div className="absolute inset-0 pt-4">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                    <CartesianGrid stroke="transparent" />
                    <XAxis hide dataKey="x" />
                    <YAxis hide domain={['auto', 'auto']} />
                    <defs>
                      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
                        <feMerge>
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                    </defs>
                    <Line
                      type="linear"
                      dataKey="value"
                      stroke="#f87171"
                      strokeWidth={1.75}
                      dot={false}
                      isAnimationActive={false}
                      filter="url(#glow)"
                    />
                  </LineChart>
                </ResponsiveContainer>
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

            {showGradCAM && (
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-red-600/30 via-yellow-500/20 to-transparent mix-blend-screen transition-all duration-300" />
            )}

          </div>

        </section>

        {/* RIGHT COLUMN */}

        <div className="space-y-6">

          {/* REPORT */}

          <section className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl">

            <h2 className="text-2xl font-semibold mb-5">
              AI Report
            </h2>

            {loading ? (
              <div className="text-blue-400 animate-pulse flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-500 animate-ping"></span>
                Running ECG Analysis...
              </div>
            ) : report ? (
              <pre className="whitespace-pre-wrap text-slate-300 leading-7 font-mono text-sm bg-slate-950 p-4 rounded-xl border border-slate-800">
                {report}
              </pre>
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

          {/* XAI */}

          <section className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl">

            <h2 className="text-2xl font-semibold mb-5">
              Reasoning & Explainability
            </h2>

            <div className="text-slate-400 leading-7 text-sm">
              <p>
                Grad-CAM visualization will be integrated after
                the ECG waveform renderer is completed.
              </p>
              <br />
              <p>
                Future versions will also include:
              </p>
              <ul className="list-disc ml-6 mt-3 space-y-2 text-slate-300">
                <li>Grad-CAM explanation</li>
                <li>Attention visualization</li>
                <li>LLM-generated reasoning</li>
                <li>Clinical interpretation</li>
              </ul>
            </div>

          </section>

        </div>

      </main>

    </div>
  );
}

export default App;