import { useState, useRef } from "react";

function CADIschemia() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const fileInputRef = useRef(null);

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

  const handleClear = () => {
    setFile(null);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const score = result ? result.cad_score : 0;
  const radius = 100;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const progressColor = result?.cad_detected ? "#DC2626" : "#16A34A";

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center font-sans">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg p-8 m-10">

        {/* Header */}
        <h1 className="text-3xl font-bold text-center text-gray-800">
          ECG CAD (Ischemia) Detection
        </h1>
        <div className="w-24 h-1 bg-blue-600 mx-auto mt-2 rounded"></div>

        {/* Upload */}
        <div className="mt-8">
          <label className="flex flex-col items-center justify-center border-2 border-dashed border-blue-400 rounded-xl p-6 cursor-pointer hover:bg-blue-50 transition">
            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
            <p className="text-blue-600 font-medium">
              {file ? file.name : "Upload ECG ZIP (.hea + .dat)"}
            </p>
          </label>

          <button
            onClick={handleAnalyze}
            disabled={loading || result}
            className="w-full mt-4 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? "Analyzing..." : "Analyze ECG"}
          </button>

          <button
            onClick={handleClear}
            className="w-full mt-3 border border-gray-300 text-gray-600 py-2 rounded-xl font-medium hover:bg-gray-100 transition"
          >
            Clear & Upload New ECG
          </button>

        </div>

        {/* Results */}
        {result && (
          <div className="mt-12">

            <h2 className="text-xl font-semibold text-gray-700 mb-6 text-center">
              Results
            </h2>

            {/* Circular Score */}
            <div className="flex flex-col items-center">
              <svg width="260" height="260" className="mb-4">
                {/* Background circle */}
                <circle
                  cx="130"
                  cy="130"
                  r={radius}
                  stroke="#E5E7EB"
                  strokeWidth="18"
                  fill="none"
                />

                {/* Progress circle */}
                <circle
                  cx="130"
                  cy="130"
                  r={radius}
                  stroke={progressColor}
                  strokeWidth="18"
                  fill="none"
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  strokeLinecap="round"
                  transform="rotate(-90 130 130)"
                  style={{ transition: "stroke-dashoffset 0.8s ease, stroke 0.5s ease" }}
                />

                {/* Score text */}
                <text
                  x="50%"
                  y="50%"
                  dominantBaseline="middle"
                  textAnchor="middle"
                  className={`text-4xl font-bold ${
                    result?.cad_detected ? "fill-red-600" : "fill-green-600"
                  }`}
                >
                  {score}%
                </text>
              </svg>
              <p
                className={`text-2xl font-bold tracking-wide ${
                  result.cad_detected ? "text-red-600" : "text-green-600"
                }`}
              >
                {result.cad_detected
                  ? "CAD (Ischemia) Detected!"
                  : "No CAD (Ischemia) Detected!"}
              </p>
              <p className="text-sm text-gray-500">Your Coronary Artery Disease (Ischemia) level is {score}%</p>
            </div>

            {/* Metrics */}
            <div className="mt-8 space-y-4">
              {[
                ["P95 Probability", result.p95],
                ["Ischemic Burden", `${result.ischemic_burden}%`],
                ["Max Consecutive Ischemic Segments", result.max_consecutive_segments],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex justify-between border-b pb-2 text-gray-700"
                >
                  <strong className="font-medium">{label}</strong>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>

            {/* Plot */}
            <div className="mt-8 bg-gray-50 p-4 rounded-xl shadow-inner">
              <img
                src={result.plot_base64}
                alt="Ischemia Plot"
                className="rounded-lg"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CADIschemia;
