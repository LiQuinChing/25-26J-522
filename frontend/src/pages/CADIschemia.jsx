import { useState } from "react";

function CADIschemia() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setResult(null);
  };

  const handleAnalyze = async () => {
    if (!file) return alert("Please upload a ZIP or ECG file");

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://localhost:8000/analyze_ecg/", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.error) {
        alert(data.error);
      } else {
        // convert hex plot to base64
        const plotBase64 = "data:image/png;base64," + btoa(
          data.plot_bytes.match(/\w{2}/g).map(byte => String.fromCharCode(parseInt(byte, 16))).join("")
        );
        data.plot_base64 = plotBase64;
        setResult(data);
      }
    } catch (err) {
      console.error(err);
      alert("Error analyzing ECG");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-6 bg-gray-100">
      <div className="max-w-xl mx-auto bg-white p-6 rounded shadow">
        <h1 className="text-2xl font-bold mb-4">ECG CAD (Ischemia) Detection</h1>

        <input
          type="file"
          onChange={handleFileChange}
          className="mb-4"
        />
        <button
          onClick={handleAnalyze}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Analyzing..." : "Analyze"}
        </button>

        {result && (
          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-2">Results</h2>
            <p><strong>CAD Detected:</strong> {result.cad_detected ? "✅ Yes" : "❌ No"}</p>
            <p><strong>CAD Score:</strong> {result.cad_score}%</p>
            <p><strong>P95 Probability:</strong> {result.p95}</p>
            <p><strong>Ischemic Burden:</strong> {result.ischemic_burden}%</p>
            <p><strong>Max Consecutive Ischemic Segments:</strong> {result.max_consecutive_segments}</p>

            <div className="mt-4">
              <img src={result.plot_base64} alt="Segment-Level Ischemia Probabilities" className="w-full"/>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CADIschemia;
