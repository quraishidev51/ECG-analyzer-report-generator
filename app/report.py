def create_report(result):
  report = []
  report.append("ECG Analysis Report")
  report.append("-"*30)
  report.append("")
  report.append("Detected Conditions:")

  for prediction in sorted(
      result["predictions"],
      key=lambda x: x["confidence"],
      reverse=True
  ):
    label = prediction["label"]
    confidence = prediction["confidence"]
    report.append(
        f"✓ {label} ({confidence*100:.1f}%)"
    )

  predicted = {
    prediction["label"]
    for prediction in result["predictions"]
}

  report.append("")
  report.append("Other probabilities:")

  for label, prob in sorted(
    result["probabilities"].items(),
    key=lambda item: item[1],
    reverse=True
):
    if label not in predicted:
        report.append(
            f"{label: <28}: {prob*100:.1f}%"
        )
  return "\n".join(report)
