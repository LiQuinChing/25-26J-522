import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Dashboard() {

const navigate = useNavigate();

const [recentScans,setRecentScans] = useState([]);
const [counts,setCounts] = useState({
total:0,
cad:0,
normal:0,
hr:0
});



/* -------------------------------- */
/* FETCH RECENT ANALYSIS */
/* -------------------------------- */

useEffect(()=>{

const fetchRecent = async ()=>{

const token =
localStorage.getItem("token") ||
sessionStorage.getItem("token");

const res = await fetch("/cad/recent-analysis",{
headers:{
Authorization:`Bearer ${token}`
}
});

const data = await res.json();

setRecentScans(data);

};

fetchRecent();

},[]);



/* -------------------------------- */
/* COUNT ANIMATION */
/* -------------------------------- */

useEffect(()=>{

const target = {
total:142,
cad:36,
normal:106,
hr:72
};

const duration = 1200;
const steps = 60;
const interval = duration/steps;

let step=0;

const timer = setInterval(()=>{

step++;

setCounts({
total:Math.floor(target.total*(step/steps)),
cad:Math.floor(target.cad*(step/steps)),
normal:Math.floor(target.normal*(step/steps)),
hr:Math.floor(target.hr*(step/steps))
});

if(step>=steps) clearInterval(timer);

},interval);

},[]);



/* -------------------------------- */
/* ECG ANIMATION */
/* -------------------------------- */

const [,setOffset] = useState(0);

useEffect(()=>{

const timer = setInterval(()=>{
setOffset(prev=>prev-4);
},40);

return ()=>clearInterval(timer);

},[]);



/* -------------------------------- */
/* TIME AGO FUNCTION */
/* -------------------------------- */

const timeAgo = (date)=>{

const now = new Date();
const created = new Date(date);

const seconds = Math.floor((now-created)/1000);

const intervals = [
{label:"year",seconds:31536000},
{label:"month",seconds:2592000},
{label:"day",seconds:86400},
{label:"hour",seconds:3600},
{label:"minute",seconds:60}
];

for(let i of intervals){

const count = Math.floor(seconds/i.seconds);

if(count>0){
return `${count}${i.label[0]} ago`;
}

}

return "Just now";

};



/* -------------------------------- */
/* STATS */
/* -------------------------------- */

const stats = [

{
title:"Total ECG Scans",
value:counts.total,
icon:"monitor_heart",
color:"bg-teal-100 text-teal-700"
},

{
title:"CAD Detected",
value:counts.cad,
icon:"warning",
color:"bg-red-100 text-red-600"
},

{
title:"Normal ECG",
value:counts.normal,
icon:"check_circle",
color:"bg-green-100 text-green-600"
},

{
title:"Avg Heart Rate",
value:`${counts.hr} BPM`,
icon:"favorite",
color:"bg-blue-100 text-blue-600"
}

];



return (
<>
<div className="min-h-screen bg-cyan-100 p-8">
<div className="max-w-7xl mx-auto space-y-8">

{/* HEADER */}

<div className="flex justify-between items-center">

<div>

<h1 className="text-3xl font-extrabold text-teal-900 flex items-center gap-2">

Dashboard

<span className="material-symbols-outlined text-teal-700">
dashboard
</span>

</h1>

<p className="text-gray-600 mt-1">
Overview of ECG analyses and CAD detection statistics
</p>

</div>

<button
onClick={()=>navigate("/upload-ecg")}
className="flex items-center gap-2 px-4 py-2 bg-teal-700 text-white rounded-lg shadow hover:bg-teal-800 font-bold transition"
>

<span className="material-symbols-outlined">
upload_file
</span>

New ECG Analysis

</button>

</div>



{/* STATISTICS */}

<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

{stats.map((s,i)=>(

<div
key={i}
className="bg-white/50 backdrop-blur-lg rounded-xl shadow-lg p-6 flex items-center gap-4"
>

<div className={`w-12 h-12 rounded-full flex items-center justify-center ${s.color}`}>

<span className="material-symbols-outlined">
{s.icon}
</span>

</div>

<div>

<p className="text-gray-500 text-sm">
{s.title}
</p>

<p className="text-2xl font-bold text-teal-900">
{s.value}
</p>

</div>

</div>

))}

</div>


{/* MAIN GRID */}

<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

{/* ECG VISUAL */}

<div className="lg:col-span-2 bg-white/50 backdrop-blur-lg rounded-xl shadow-lg p-6">

<div className="flex justify-between items-center mb-4">

<h2 className="text-lg font-bold text-teal-900 flex items-center gap-2">
<span className="material-symbols-outlined text-teal-600">
monitor_heart
</span>
Live ECG Activity
</h2>

<span className="text-sm text-blue-600 font-semibold flex items-center gap-1">
<span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>
LIVE
</span>

</div>

<div className="relative h-48 overflow-hidden rounded-lg bg-ecg-grid">

<svg viewBox="0 0 1200 200" className="w-full h-full">

<path
className="ecg-line"
fill="none"
stroke="#14b8a6"
strokeWidth="3"
d="
M0 100
L80 100
L100 40
L120 160
L160 80
L200 100
L300 100
L320 40
L340 160
L380 80
L420 100
L520 100
L540 40
L560 160
L600 80
L640 100
L740 100
L760 40
L780 160
L820 80
L860 100
L960 100
L980 40
L1000 160
L1040 80
L1080 100
L1200 100
"
/>

</svg>

</div>

</div>


{/* RECENT ANALYSIS */}

<div className="bg-white/50 backdrop-blur-lg rounded-xl shadow-lg p-6 flex flex-col">

<h2 className="text-lg font-bold text-teal-900 mb-4 flex items-center gap-2">

<span className="material-symbols-outlined text-teal-600">
history
</span>

Recent Analysis

</h2>

<div className="space-y-4 overflow-y-auto max-h-[320px] pr-2">

{recentScans.length===0 && (
<p className="text-gray-500 text-sm">
No recent analysis
</p>
)}

{recentScans.slice(0,5).map((scan)=>(
<div
key={scan.scan_id}
className="flex items-center justify-between border-b border-teal-100 pb-2"
>

<div className="flex items-center gap-3">

<div
className={`w-10 h-10 rounded-full flex items-center justify-center
${scan.cad_detected
?"bg-red-100 text-red-600"
:"bg-green-100 text-green-600"}
`}
>

<span className="material-symbols-outlined">
{scan.cad_detected ? "warning" : "check_circle"}
</span>

</div>

<div>
<p className="font-bold text-teal-900 text-sm">
Scan ID: #{scan.scan_id}
</p>

<p className="text-xs text-teal-800">
Dr.{scan.user_name}
</p>
</div>

</div>

<span className="text-xs text-gray-500">
{timeAgo(scan.created_at)}
</span>

</div>
))}

</div>

</div>

</div>



{/* SYSTEM STATUS */}

<div className="bg-white/50 backdrop-blur-lg rounded-xl shadow-lg p-6">

<h2 className="text-lg font-bold text-teal-900 mb-4 flex items-center gap-2">

<span className="material-symbols-outlined text-teal-600">
analytics
</span>

System Status

</h2>



<div className="grid grid-cols-1 md:grid-cols-3 gap-4">

<div className="bg-teal-100 rounded-lg p-4 text-center">

<p className="text-teal-700 font-bold">
AI Model
</p>

<p className="text-sm text-gray-600">
Operational
</p>

</div>

<div className="bg-blue-100 rounded-lg p-4 text-center">

<p className="text-blue-700 font-bold">
Server
</p>

<p className="text-sm text-gray-600">
Healthy
</p>

</div>

<div className="bg-green-100 rounded-lg p-4 text-center">

<p className="text-green-700 font-bold">
ECG Engine
</p>

<p className="text-sm text-gray-600">
Running
</p>

</div>

</div>

</div>

</div>

</div>

</>

);

}

export default Dashboard;