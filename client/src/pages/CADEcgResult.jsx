import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import jsPDF from "jspdf";
import { toPng } from "html-to-image";
import Navbar from "../components/Navbar.jsx";

function CADEcgResult() {

  const { state } = useLocation();
  const navigate = useNavigate();
  const [animatedScore, setAnimatedScore] = useState(0);
  const [userName, setUserName] = useState("");
  const ecgData = state.ecg_signal || [];
  const pathRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const reportRef = useRef(null);
  const heartRate = state.heart_rate || 0;
  const prInterval = state.pr_interval || 0;
  const qrsDuration = state.qrs_duration || 0;
  const qtcInterval = state.qtc_interval || 0;
  const [animatedP95, setAnimatedP95] = useState(0);
  const [animatedBurden, setAnimatedBurden] = useState(0);
  const [animatedSegments, setAnimatedSegments] = useState(0);

  const heartRateStatus =
    heartRate > 100 ? "Tachycardia" :
    heartRate < 60 ? "Bradycardia" :
    "Normal";

  const prStatus =
    prInterval < 120 ? "Short PR" :
    prInterval > 200 ? "Prolonged" :
    "Normal Range";

  const qrsStatus =
    qrsDuration > 120 ? "Wide QRS" :
    "Normal Range";

  const qtcStatus =
    qtcInterval > 450 ? "Prolonged" :
    "Normal Range";

  useEffect(() => {
    document.title = "QCardio - ECG Analysis Result";
  }, []);

  useEffect(() => {

    if (state) {
      setTimeout(() => {
        setAnimatedScore(state.cad_score);
      }, 300);
    }

    // get logged user name from storage
    const storedUser =
      localStorage.getItem("users") ||
      sessionStorage.getItem("users");

    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUserName(parsedUser.full_name || "Users");
    }

  }, [state]);

  useEffect(() => {

    const path = pathRef.current;
    if (!path) return;

    const length = path.getTotalLength();

    // hide path initially
    path.style.strokeDasharray = length;
    path.style.strokeDashoffset = length;

    // force browser repaint
    path.getBoundingClientRect();

    // animate drawing
    path.style.transition = "stroke-dashoffset 6s linear";
    path.style.strokeDashoffset = "0";

  }, []);

  useEffect(() => {

    setTimeout(() => {

        setAnimatedP95(state.p95);
        setAnimatedBurden(state.ischemic_burden);
        setAnimatedSegments(Math.min(state.max_consecutive_segments * 10, 100));

    }, 300);

  }, [state]);

  if (!state) {
    return (
      <div className="p-10">
        <p>No ECG result found</p>
        <button
          onClick={() => navigate("/upload-cad-ecg")}
          className="mt-4 px-4 py-2 bg-teal-700 text-white rounded"
        >
          Go Back
        </button>
      </div>
    );
  }

  const zoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.2, 3)); // max zoom 3x
  };

    const zoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.2, 0.5)); // min zoom 0.5x
  };

  const generateECGPath = (data, width = 1200, height = 200) => {

    if (!data.length) return "";

    const stepX = width / data.length;

    const min = Math.min(...data);
    const max = Math.max(...data);

    const scaleY = height / (max - min);

    let path = "";

    data.forEach((v, i) => {

        const x = i * stepX;
        const y = height - (v - min) * scaleY;

        if (i === 0) path += `M ${x} ${y}`;
        else path += ` L ${x} ${y}`;

    });

    return path;
  };

  const score = animatedScore;

  const currentDate = new Date().toLocaleString();

  const goBack = () => {
    navigate(-1);
  };

//   const exportReport = async () => {

//     const element = reportRef.current;

//     const canvas = await html2canvas(element, {
//         scale: 2,
//         useCORS: true
//     });

//     const imgData = canvas.toDataURL("image/png");

//     const pdf = new jsPDF({
//         orientation: "portrait",
//         unit: "mm",
//         format: "a4"
//     });

//     const imgWidth = 210;
//     const imgHeight = (canvas.height * imgWidth) / canvas.width;

//     pdf.addImage(imgData, "PNG", 0, 10, imgWidth, imgHeight);

//     pdf.save(`ECG_Report_${state.scan_id}.pdf`);

//   };

  const exportReport = async () => {
    if (!reportRef.current) return;

    try {

        const dataUrl = await toPng(reportRef.current, {
        cacheBust: true,
        pixelRatio: 3,
        backgroundColor: "#ffffff" // forces white background in PDF
        });

        const pdf = new jsPDF("p", "mm", "a4");

        const imgProps = pdf.getImageProperties(dataUrl);

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

        pdf.addImage(dataUrl, "PNG", 0, 0, pdfWidth, pdfHeight);

        pdf.save(`ECG_Report_${state.scan_id}.pdf`);

    } catch (error) {
        console.error("PDF export failed:", error);
    }
  };

  return (
    <>

        <div className="min-h-screen bg-[#B2EBF2] p-8">

        <div className="max-w-7xl mx-auto space-y-6">

            {/* TOP NAVIGATION */}

            <div className="flex items-center justify-between">

            {/* Breadcrumb */}

            <div className="flex items-center gap-2 text-gray-500 text-sm">

            <button
            onClick={goBack}
            className="hover:text-teal-700 font-medium"
            >
            Upload ECG
            </button>

            <span className="material-symbols-outlined text-[18px] text-teal-400">
            chevron_right
            </span>

            {/* <span>{userName}</span>

            <span className="material-symbols-outlined text-[18px] text-teal-400">
            chevron_right
            </span> */}

            <span className="font-semibold text-teal-700">
            Scan #{state.scan_id} Result
            </span>

            </div>

            {/* ACTION BUTTONS */}

            <div className="flex gap-3">

            {/* Export Button */}

            <button
            onClick={() => {
                console.log("Export clicked");
                exportReport();
            }}
            className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg border-white shadow-sm hover:bg-gray-50 text-teal-700 text-sm font-bold transition duration-200 cursor-pointer"
            >
                
            <span className="material-symbols-rounded text-teal-600 text-[18px]">
                picture_as_pdf
            </span>

            Export Report

            </button>

            {/* Consult Specialist */}

            {/* <button
            className="flex items-center gap-2 px-4 py-2 bg-teal-700 text-white rounded-lg shadow hover:bg-teal-800 text-sm font-bold"
            >

            <span className="material-symbols-outlined text-[18px]">
            medical_services
            </span>

            Consult Specialist

            </button> */}

            </div>

            </div>

            <div ref={reportRef} className="space-y-6 p-1">

                {/* PATIENT HEADER */}

                <div className="bg-white/60 backdrop-blur-lg rounded-xl shadow-lg p-6 flex items-center gap-6">

                {/* Avatar */}
                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-teal-600 to-blue-600 flex items-center justify-center shadow-lg">

                    <span className="material-symbols-outlined text-white text-4xl">
                        person
                    </span>

                </div>

                <div className="flex-1">

                    <div className="flex items-center gap-3">

                    <h1 className="text-2xl font-bold text-teal-900">
                        {userName}
                    </h1>

                    <span className="px-2 py-1 text-xs rounded bg-gray-100">
                        Scan ID: #{state.scan_id}
                    </span>

                    <span
                        className={`px-2 py-1 text-xs rounded ${
                            state.cad_detected ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                        }`}
                    >
                        {state.cad_detected ? "High Risk" : "Low Risk"}
                    </span>

                    {/* {state.cad_detected && (
                        <span className="px-2 py-1 text-xs rounded bg-red-100 text-red-700">
                        High Risk
                        </span>
                    )} */}

                    </div>

                    {/* META INFO */}

                    <div className="flex gap-6 text-sm text-gray-600 mt-2 items-center">

                    <span className="flex items-center gap-1">

                        <span className="material-symbols-outlined text-blue-600 text-[18px]">
                        calendar_today
                        </span>

                        {currentDate}

                    </span>

                    <span className="flex items-center gap-1">

                        <span className="material-symbols-outlined text-blue-600 text-[18px]">
                        monitor_heart
                        </span>

                        CAD (Ischemia) ECG Analysis

                    </span>

                    </div>

                </div>

                </div>

                {/* MAIN GRID */}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* PROBABILITY SECTION */}

                <div className="bg-white/50 backdrop-blur-lg rounded-xl shadow-lg p-6 flex flex-col items-center border-t-4 border-red-400">

                    <h2 className="text-xs font-bold uppercase text-gray-500 mb-6">
                    Probability of Pathology
                    </h2>

                    <div className="relative w-72 h-72 flex items-center justify-center">

                    <svg viewBox="0 0 200 200" className="w-full h-full">

                        <circle
                        cx="100"
                        cy="100"
                        r="85"
                        stroke="#E5E7EB"
                        strokeWidth="14"
                        fill="none"
                        />

                        <circle
                        cx="100"
                        cy="100"
                        r="85"
                        stroke={state.cad_detected ? "#DC2626" : "#16A34A"}
                        strokeWidth="10"
                        fill="none"
                        strokeDasharray={534}
                        strokeDashoffset={534 - (score / 100) * 534}
                        strokeLinecap="round"
                        transform="rotate(-90 100 100)"
                        style={{ transition: "stroke-dashoffset 1s ease" }}
                        />

                    </svg>

                    <div className="absolute text-center">

                        {/* CAD DETECTION TEXT */}

                        <p
                            className={`text-[28px] font-bold mt-6 ${
                                state.cad_detected ? "text-red-600" : "text-green-600"
                            }`}
                        >

                        {state.cad_detected ? (
                            "CAD (Ischemia) Detected"
                        ) : (
                            <>
                            No <br />
                            CAD (Ischemia) Detected
                            </>
                        )}

                        </p>

                        {/* Status */}

                        <span
                            className={`text-sm uppercase tracking-widest mt-1 gap-2 ${
                                state.cad_detected ? "text-red-600" : "text-green-600"
                            }`}
                        >
                            {state.cad_detected ? "Abnormal" : "Normal"}
                        </span>

                    </div>

                    </div>

                    {/* CAD SUB TEXT */}

                    <p className="text-sm text-gray-500 text-center mt-2">

                    {state.cad_detected
                        ? "AI analysis indicates signs of myocardial ischemia which may suggest coronary artery disease."
                        : "No significant ischemic patterns detected in the ECG signal."}

                    </p>

                </div>

                {/* DIAGNOSTIC FINDINGS */}

                <div className="lg:col-span-2 bg-white/50 backdrop-blur-lg rounded-xl shadow-lg p-6 border-t-4 border-teal-500">

                {/* HEADER */}

                <div className="flex justify-between items-center mb-6">

                    <h2 className="text-lg font-bold text-teal-900 flex items-center gap-2">
                    <span className="material-symbols-outlined text-teal-600">
                        analytics
                    </span>
                    Diagnostic Findings
                    </h2>

                    <span className="text-xs font-semibold text-teal-700 bg-teal-100 px-3 py-1 rounded-lg">
                        Confidence Score: 
                            <span
                            className={`${
                                state.cad_detected ? "text-red-600" : "text-green-600"
                            }`}
                        >
                            {state.cad_detected ? " High" : " Low"}
                        </span>
                    </span>

                </div>


                <div className="space-y-4">

                    {/* P95 PROBABILITY */}

                    <div className="bg-red-50 border border-red-100 rounded-lg p-4 flex gap-4">

                    {/* Icon */}

                    <div className="p-3 bg-red-100 rounded-lg text-red-600 flex items-center justify-center">
                        <span className="material-symbols-outlined">
                        favorite
                        </span>
                    </div>

                    <div className="flex-1">

                        <div className="flex justify-between items-center mb-2">

                        <h3 className="font-bold text-teal-900">
                            P95 Probability
                        </h3>

                        <span className="text-red-600 font-bold">
                            {state.p95}%
                        </span>

                        </div>

                        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">

                        <div
                            className="bg-red-600 h-2 rounded-full transition-all duration-1000 ease-out"
                            style={{ width: `${animatedP95}%` }}
                        />

                        </div>

                        <p className="text-sm text-gray-600">
                        High probability of ischemic ECG patterns associated with coronary artery disease.
                        </p>

                    </div>

                    </div>


                    {/* ISCHEMIC BURDEN */}

                    <div className="bg-white border border-teal-100 rounded-lg p-4 flex gap-4">

                    <div className="p-3 bg-teal-100 rounded-lg text-teal-600 flex items-center justify-center">
                        <span className="material-symbols-outlined">
                        monitor_heart
                        </span>
                    </div>

                    <div className="flex-1">

                        <div className="flex justify-between items-center mb-2">

                        <h3 className="font-semibold text-teal-800">
                            Ischemic Burden
                        </h3>

                        <span className="font-bold text-gray-700">
                            {state.ischemic_burden}%
                        </span>

                        </div>

                        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">

                        <div
                            className="bg-blue-500 h-2 rounded-full transition-all duration-1000 ease-out"
                            style={{ width: `${animatedBurden}%` }}
                        />

                        </div>

                        <p className="text-sm text-gray-600">
                        Percentage of ECG segments indicating myocardial ischemia.
                        </p>

                    </div>

                    </div>


                    {/* MAX CONSECUTIVE SEGMENTS */}

                    <div className="bg-white border border-teal-100 rounded-lg p-4 flex gap-4">

                    <div className="p-3 bg-teal-100 rounded-lg text-teal-600 flex items-center justify-center">
                        <span className="material-symbols-outlined">
                        timeline
                        </span>
                    </div>

                    <div className="flex-1">

                        <div className="flex justify-between items-center mb-2">

                        <h3 className="font-semibold text-teal-800">
                            Max Consecutive Segments
                        </h3>

                        <span className="font-bold text-gray-700">
                            {state.max_consecutive_segments}
                        </span>

                        </div>

                        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">

                        <div
                            className="bg-gray-500 h-2 rounded-full transition-all duration-1000 ease-out"
                            style={{ width: `${animatedSegments}%` }}
                        />

                        </div>

                        <p className="text-sm text-gray-600">
                        Longest continuous sequence of ischemic ECG segments detected.
                        </p>

                    </div>

                    </div>

                </div>

                </div>

                </div>

                {/* ECG TRACE */}

                <div className="bg-white/50 backdrop-blur-lg rounded-xl shadow-lg overflow-hidden border-t-4 border-blue-400">

                {/* HEADER */}

                <div className="p-4 border-b flex justify-between items-center bg-blue-50/40">

                    <h2 className="font-bold text-teal-900 flex items-center gap-2">
                    <span className="material-symbols-outlined text-blue-600">
                        vital_signs
                    </span>
                    Lead II Trace
                    </h2>

                    <div className="flex items-center gap-4">

                    <span className="flex items-center gap-1 text-blue-600 text-sm font-semibold">
                        <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>
                        LIVE
                    </span>

                    <div className="flex bg-white rounded border">

                        <button className="p-1 hover:bg-gray-100 rounded transition duration-200" onClick={zoomIn}>
                        <span className="material-symbols-outlined text-[18px] p-1 text-teal-900">
                            zoom_in
                        </span>
                        </button>

                        <button className="p-1 hover:bg-gray-100 rounded transition duration-200" onClick={zoomOut}>
                        <span className="material-symbols-outlined text-[18px] p-1 text-teal-900">
                            zoom_out
                        </span>
                        </button>

                    </div>

                    </div>

                </div>

                {/* ECG AREA */}

                <div className="relative w-full h-64 overflow-hidden">

                    {/* ECG GRID */}

                    <div
                    className="absolute inset-0"
                    style={{
                        backgroundImage: `
                        linear-gradient(rgba(0,131,143,0.15) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(0,131,143,0.15) 1px, transparent 1px)
                        `,
                        backgroundSize: "20px 20px"
                    }}
                    />

                    <div
                    className="absolute inset-0"
                    style={{
                        backgroundImage: `
                        linear-gradient(rgba(0,131,143,0.2) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(0,131,143,0.2) 1px, transparent 1px)
                        `,
                        backgroundSize: "100px 100px"
                    }}
                    />

                    {/* ECG SIGNAL CONTAINER */}

                    <div className="absolute top-1/2 left-0 -translate-y-1/2 w-full">

                    <svg
                        viewBox="0 0 1200 200"
                        className="w-full h-40"
                        style={{
                            transform: `scale(${zoom}, 1)`,
                            transformOrigin: "center"
                        }}
                    >

                    <path
                        ref={pathRef}
                        d={generateECGPath(ecgData)}
                        fill="none"
                        stroke="#1E64B7"
                        strokeWidth="2"
                    />

                    </svg>

                    </div>

                    {/* IRREGULARITY BADGE */}

                    <div
                        className={`absolute top-2 left-10 px-2 py-1 text-xs rounded border font-semibold ${
                            state.cad_detected ? "bg-red-50 text-red-700 border-red-200" : "bg-green-50 text-green-700 border-green-200"
                        }`}
                    >
                        {state.cad_detected ? "Irregularity Detected" : "Irregularity Not Detected"}
                    </div>

                    {/* {state.cad_detected && (

                    <div className="absolute top-2 left-10 px-2 py-1 bg-red-50 text-red-700 text-xs rounded border border-red-200 font-semibold">
                        Irregularity Detected
                    </div>

                    )} */}

                    {/* LEAD LABEL */}

                    <div className="absolute top-2 right-10 px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded border border-blue-200 font-semibold">
                    Lead II
                    </div>

                </div>

                </div>

                {/* ECG METRICS */}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                {/* HEART RATE */}

                <div className="bg-white/50 backdrop-blur-lg rounded-xl shadow-lg p-6 border-l-4 border-red-500">

                <div className="flex items-center gap-2 text-gray-600 font-semibold mb-3">
                <span className="material-symbols-outlined text-red-500">favorite</span>
                Heart Rate
                </div>

                <div className="flex items-end gap-2">
                <span className="text-4xl font-bold text-teal-900">{heartRate}</span>
                <span className="text-gray-500 mb-1">BPM</span>
                </div>

                <span className={`inline-block mt-3 px-3 py-1 text-xs rounded-full ${
                heartRateStatus === "Normal"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-600"
                }`}>
                {heartRateStatus}
                </span>

                </div>


                {/* PR INTERVAL */}

                <div className="bg-white/50 backdrop-blur-lg rounded-xl shadow-lg p-6 border-l-4 border-teal-600">

                <div className="flex items-center gap-2 text-gray-600 font-semibold mb-3">
                <span className="material-symbols-outlined text-teal-600">timeline</span>
                PR Interval
                </div>

                <div className="flex items-end gap-2">
                <span className="text-4xl font-bold text-teal-900">{prInterval}</span>
                <span className="text-gray-500 mb-1">ms</span>
                </div>

                <span className={`inline-block mt-3 px-3 py-1 text-xs rounded-full ${
                prStatus === "Normal Range"
                ? "bg-teal-100 text-teal-700"
                : "bg-red-100 text-red-600"
                }`}>
                {prStatus}
                </span>

                </div>


                {/* QRS DURATION */}

                <div className="bg-white/50 backdrop-blur-lg rounded-xl shadow-lg p-6 border-l-4 border-teal-600">

                <div className="flex items-center gap-2 text-gray-600 font-semibold mb-3">
                <span className="material-symbols-outlined text-teal-600">equalizer</span>
                QRS Duration
                </div>

                <div className="flex items-end gap-2">
                <span className="text-4xl font-bold text-teal-900">{qrsDuration}</span>
                <span className="text-gray-500 mb-1">ms</span>
                </div>

                <span className={`inline-block mt-3 px-3 py-1 text-xs rounded-full ${
                qrsStatus === "Normal Range"
                ? "bg-teal-100 text-teal-700"
                : "bg-red-100 text-red-600"
                }`}>
                {qrsStatus}
                </span>

                </div>


                {/* QTc INTERVAL */}

                <div className="bg-white/50 backdrop-blur-lg rounded-xl shadow-lg p-6 border-l-4 border-red-500">

                <div className="flex items-center gap-2 text-gray-600 font-semibold mb-3">
                <span className="material-symbols-outlined text-red-500">monitor_heart</span>
                QTc Interval
                </div>

                <div className="flex items-end gap-2">
                <span className="text-4xl font-bold text-teal-900">{qtcInterval}</span>
                <span className="text-gray-500 mb-1">ms</span>
                </div>

                <span className={`inline-block mt-3 px-3 py-1 text-xs rounded-full ${
                qtcStatus === "Normal Range"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-600"
                }`}>
                {qtcStatus}
                </span>

                </div>

                </div>
            
            </div>

        </div>

        </div>
    </>
  );
}

export default CADEcgResult;