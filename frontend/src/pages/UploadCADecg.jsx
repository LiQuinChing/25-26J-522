import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/navbar";

function UploadCADecg() {

  document.title = "QCardio - Upload ECG";
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recentScans, setRecentScans] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {

    const fetchRecent = async () => {

        const token =
        localStorage.getItem("token") ||
        sessionStorage.getItem("token");

        const res = await fetch("http://localhost:8000/recent-analysis", {
        headers: {
            Authorization: `Bearer ${token}`
        }
        });

        const data = await res.json();
        setRecentScans(data);

    };

    fetchRecent();

  }, []);

  const handleFileChange = (e) => {

    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setProgress(0);
    setIsUploading(true);
    setUploadResult(null);

    const token =
        localStorage.getItem("token") ||
        sessionStorage.getItem("token");

    const formData = new FormData();
    formData.append("file", selectedFile);

    const xhr = new XMLHttpRequest();

    xhr.open("POST", "http://localhost:8000/analyze_ecg/");
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);

    xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        setProgress(percent);
        }
    };

    xhr.onload = () => {

        setIsUploading(false);

        if (xhr.status === 200) {

        const data = JSON.parse(xhr.responseText);

        const plotBase64 =
            "data:image/png;base64," +
            btoa(
            data.plot_bytes
                .match(/\w{2}/g)
                .map((byte) =>
                String.fromCharCode(parseInt(byte, 16))
                )
                .join("")
            );

        data.plot_base64 = plotBase64;

        setUploadResult(data);

        } else {
        alert("Upload failed");
        }
    };

    xhr.onerror = () => {
        setIsUploading(false);
        alert("Upload error");
    };

    xhr.send(formData);
  };

  const handleAnalyze = () => {

    if (!uploadResult) {
        return alert("Please wait until upload finishes.");
    }

    setIsAnalyzing(true);

    setTimeout(() => {
        navigate("/cad-ecg-result", { state: uploadResult });
    }, 800); // small UI delay
  };

  const handleClear = () => {
    setFile(null);
    setUploadResult(null);
    setProgress(0);
    setIsUploading(false);
    setIsAnalyzing(false);
  };

  const timeAgo = (date) => {

    const now = new Date();
    const created = new Date(date);

    const seconds = Math.floor((now - created) / 1000);

    const intervals = [
        { label: "year", seconds: 31536000 },
        { label: "month", seconds: 2592000 },
        { label: "day", seconds: 86400 },
        { label: "hour", seconds: 3600 },
        { label: "minute", seconds: 60 }
    ];

    for (let i of intervals) {
        const count = Math.floor(seconds / i.seconds);
        if (count > 0) {
        return `${count}${i.label[0]} ago`;
        }
    }

    return "Just now";
  };

  return (
    <>
        <Navbar />

        <div className="min-h-screen bg-[#B2EBF2] relative font-sans">

            {/* BACKGROUND EFFECTS */}

            <div className="fixed inset-0 bg-gradient-to-br from-[#B2EBF2] via-white/20 to-[#E0F7FA] opacity-90"></div>

            {/* MAIN */}

            <main className="relative z-10 max-w-7xl mx-auto p-6 flex gap-8">

                {/* LEFT SECTION */}

                <div className="flex-1 flex flex-col gap-6">

                <div>

                    <h1 className="text-3xl font-extrabold text-teal-900 flex items-center gap-3 leading-tight">

                    Upload Patient ECG

                    <span className="material-symbols-outlined text-teal-700">
                        upload_file
                    </span>

                    </h1>

                    <p className="text-slate-600 mt-2">
                    Drag and drop your digitized ECG file here to begin AI-powered arrhythmia detection.
                    </p>

                </div>

                {/* UPLOAD BOX */}

                <label className="relative flex flex-col items-center justify-center h-[400px] rounded-xl border-2 border-dashed border-teal-900/20 bg-white/40 hover:bg-white/60 hover:border-teal-600 transition cursor-pointer p-10">

                    <input
                    type="file"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={handleFileChange}
                    />

                    <div className="flex flex-col items-center gap-4">

                    <div className="h-20 w-20 rounded-full bg-teal-100 flex items-center justify-center">

                        <span className="material-symbols-outlined text-5xl text-teal-700">
                        monitor_heart
                        </span>

                    </div>

                    <p className="text-xl font-bold text-teal-900">

                        {file ? file.name : "Drop file here or Browse"}

                    </p>

                    <p className="text-sm text-gray-500">
                        Supports .dat, .hea (Max 50MB)
                    </p>

                    </div>

                </label>

                {/* FILE INFO */}

                {file && (

                    <div className="bg-white/70 border border-teal-900/10 backdrop-blur-md rounded-xl p-4 shadow-sm flex items-center gap-4 relative overflow-hidden">

                    {/* progress line */}

                    <div className="absolute bottom-0 left-0 h-[3px] bg-gray-200 w-full">

                        <div
                        className="h-full bg-gradient-to-r from-teal-600 via-blue-600 to-teal-600 transition-all duration-300"
                        style={{ width: `${progress}%` }}
                        ></div>

                    </div>

                    {/* file icon */}

                    <div className="h-12 w-12 rounded-lg bg-teal-100 flex items-center justify-center text-teal-700">

                        <span className="material-symbols-outlined">
                        description
                        </span>

                    </div>

                    {/* file info */}

                    <div className="flex-1 min-w-0">

                        <div className="flex justify-between items-baseline mb-1">

                        <h4 className="text-teal-900 font-bold truncate">
                            {file.name}
                        </h4>

                        <span className="text-xs text-blue-600 font-mono font-bold">
                            {progress}%
                        </span>

                        </div>

                        <div className="text-xs text-gray-500 flex items-center gap-2">

                        <span>
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                        </span>

                        <span className="h-1 w-1 rounded-full bg-gray-400"></span>

                        <span className="text-gray-600">
                            {progress < 100 ? "Uploading ECG..." : "Scanning for malware..."}
                        </span>

                        </div>

                    </div>

                    </div>

                )}

                {/* ANALYZE BUTTON */}
                <div className="flex flex-row gap-4">
                    <button
                        onClick={handleAnalyze}
                        disabled={isUploading || isAnalyzing || !uploadResult}
                        className="w-full h-14 bg-gradient-to-r from-teal-700 to-[#006064] text-white font-bold text-lg rounded-lg shadow-lg hover:opacity-90 transition flex items-center justify-center gap-2"
                    >

                        <span className="material-symbols-outlined">
                        vital_signs
                        </span>

                        {isUploading
                            ? "Uploading..."
                            : isAnalyzing
                            ? "Analyzing..."
                            : "Analyze ECG"
                        }

                    </button>

                    <button
                        onClick={handleClear}
                        className="w-full h-14 bg-white/60 text-teal-700 font-bold text-lg rounded-lg shadow-lg hover:opacity-90 transition flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-outlined">
                        refresh
                        </span>
                        Reset uploaded ECG
                    </button>
                </div>

                </div>

                {/* RIGHT SIDEBAR */}

                <aside className="w-96 flex flex-col gap-6">

                {/* RECENT ANALYSIS */}

                <div className="bg-white/40 backdrop-blur-lg rounded-2xl shadow-xl p-5 h-[490px]">

                    {/* HEADER */}
                    <div className="flex justify-between items-center mb-4">

                        <div className="flex items-center gap-2">

                        <span className="material-symbols-outlined text-teal-700">
                            history
                        </span>

                        <h3 className="font-bold text-teal-900 text-md">
                            Recent Analysis
                        </h3>

                        </div>

                    </div>

                    <div className="border-b border-teal-200 mb-3"></div>

                    {/* LIST */}

                    <div className="space-y-5 max-h-[420px] overflow-y-auto pr-1">

                        {recentScans.length === 0 && (
                        <p className="text-gray-500 text-sm">
                            No recent analysis
                        </p>
                        )}

                        {recentScans.map((scan) => (

                        <div
                            key={scan.scan_id}
                            className="flex items-center justify-between"
                        >

                            {/* LEFT SIDE */}

                            <div className="flex items-center gap-4">

                            {/* STATUS ICON */}

                            <div
                                className={`h-10 w-10 rounded-full flex items-center justify-center
                                ${
                                scan.cad_detected
                                    ? "bg-red-100 text-red-600"
                                    : "bg-green-100 text-green-600"
                                }`}
                            >

                                <span className="material-symbols-outlined">

                                {scan.cad_detected ? "warning" : "check_circle"}

                                </span>

                            </div>

                            {/* TEXT */}

                            <div className="flex flex-col">

                                <span className="font-bold text-teal-900 text-sm">

                                    {/* USER NAME + SCAN ID */}
                                    {/* {JSON.parse(
                                        localStorage.getItem("users") ||
                                        sessionStorage.getItem("users")
                                    )?.full_name} - #{scan.scan_id} */}
                                    Scan ID: #{scan.scan_id}
                                </span>

                                <span
                                className={`text-xs font-semibold ${
                                    scan.cad_detected
                                    ? "text-red-600"
                                    : "text-green-600"
                                }`}
                                >
                                {scan.cad_detected
                                    ? "CAD (Ischemia) Detected"
                                    : "Normal Sinus Rhythm"}
                                </span>

                                <span className="text-teal-900 text-xs">
                                    Conducted by, Dr.{scan.user_name}
                                </span>

                            </div>

                            </div>

                            {/* TIME */}

                            <span className="text-xs text-gray-500">
                            {timeAgo(scan.created_at)}
                            </span>

                        </div>

                        ))}

                    </div>

                </div>

                {/* SUPPORTED FORMATS */}

                <div className="bg-gradient-to-br from-teal-700 to-blue-700 text-white p-5 rounded-xl">

                    <h4 className="font-bold mb-3">
                    Supported Formats
                    </h4>

                    <div className="flex gap-2 mb-3">

                    <span className="bg-white/20 px-2 py-1 rounded text-xs">
                        .dat
                    </span>

                    <span className="bg-white/20 px-2 py-1 rounded text-xs">
                        .hea
                    </span>

                    </div>

                    <p className="text-xs">
                    Ensure converted files are at least 300 DPI for optimal extraction.
                    </p>

                </div>

                </aside>

            </main>

        </div>
    </>
  );
}

export default UploadCADecg;