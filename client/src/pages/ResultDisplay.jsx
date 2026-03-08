import React, { useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function ResultDisplay({ result, chartData, onBack }) {
    useEffect(() => {
        document.title = "QCardio - ECG Analysis Result";
    }, []);
    
    // Data for the simple HTML-based Donut Chart visualization (replaces Recharts Pie)
    const confidencePct = Math.round(result.confidence * 100);
    const isAbnormal = result.predicted_class !== 'Normal';
    const mainColorClass = isAbnormal ? 'text-red-500' : 'text-teal-500';
    const mainBgClass = isAbnormal ? 'bg-red-500' : 'bg-teal-500';

    return (
        <div className="min-h-screen bg-cyan-50 p-8 font-sans">
            <div className="max-w-7xl mx-auto space-y-6">
                
                {/* Header Navbar Area */}
                <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-cyan-100">
                    <div className="flex items-center gap-4">
                        <button onClick={onBack} className="text-teal-600 hover:text-teal-800 font-bold">
                            <i className="fas fa-arrow-left mr-2"></i> Back to Upload
                        </button>
                        <div className="h-8 w-px bg-gray-200"></div>
                        <h2 className="text-xl font-bold text-teal-900">Scan Result Details</h2>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Verdict */}
                    <div className="bg-white rounded-xl shadow-sm border border-cyan-100 p-6 flex flex-col items-center justify-center text-center">
                        <p className="text-xs font-bold text-gray-500 tracking-wider uppercase mb-4">Diagnostic Assessment</p>
                        
                        {/* Static Clinical Status Circle */}
                        <div className={`relative w-40 h-40 flex items-center justify-center rounded-full border-8 mb-4 ${isAbnormal ? 'border-red-100 bg-red-50' : 'border-teal-100 bg-teal-50'}`}>
                            <div className="flex flex-col items-center z-10">
                                <i className={`fas ${isAbnormal ? 'fa-exclamation-triangle' : 'fa-check-circle'} text-5xl mb-2 ${mainColorClass}`}></i>
                                <span className={`text-lg font-bold tracking-widest ${mainColorClass}`}>
                                    {isAbnormal ? 'ABNORMAL' : 'NORMAL'}
                                </span>
                            </div>
                        </div>

                        <h3 className="text-xl font-bold text-gray-800 mt-4">
                            <i className={`fas fa-heartbeat mr-2 ${mainColorClass}`}></i>
                            {isAbnormal ? 'Arrhythmia Detected' : 'Rhythm Normal'}
                        </h3>
                        <p className="text-sm text-gray-500 mt-2 px-4">
                            AI analysis detects ECG patterns consistent with <strong>{result.predicted_class}</strong> rhythm.
                        </p>
                    </div>

                    {/* Right Column - Diagnostic Findings */}
                    <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-cyan-100 p-6">
                        <h3 className="text-lg font-bold text-teal-900 mb-6"><i className="fas fa-chart-bar mr-2 text-teal-500"></i>Diagnostic Findings</h3>
                        <div className="space-y-4">
                            {['Normal', 'Supraventricular', 'Ventricular', 'Fusion', 'Unknown'].map((cls) => {
                                const prob = result[cls] || 0;
                                const isPrimary = cls === result.predicted_class;
                                if (prob < 0.01 && !isPrimary) return null; 
                                
                                return (
                                    <div key={cls} className={`p-4 rounded-lg border ${isPrimary ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'}`}>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className={`font-bold ${isPrimary ? 'text-red-900' : 'text-teal-900'}`}>{cls} Rhythm</span>
                                            <span className={`font-bold ${isPrimary ? 'text-red-600' : 'text-teal-600'}`}>{(prob * 100).toFixed(1)}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div className={`${isPrimary ? 'bg-red-500' : 'bg-teal-400'} h-2 rounded-full`} style={{ width: `${prob * 100}%` }}></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* --- CHART.JS SECTION --- */}
                <div className="bg-white rounded-xl shadow-sm border border-cyan-100 p-6">
                    {chartData ? (
                        <div>
                            <h3 className="text-lg font-bold text-teal-900 mb-4">
                                <i className="fas fa-wave-square mr-2 text-teal-500"></i>
                                ECG Trace Segment ({chartData.datasets[0].label})
                            </h3>
                            <div className="w-full h-80 bg-cyan-50/30 rounded-lg border border-cyan-100 p-4 shadow-inner">
                                <Line 
                                    data={chartData} 
                                    options={{ 
                                        responsive: true, 
                                        maintainAspectRatio: false,
                                        animation: false,
                                        plugins: { legend: { display: false } },
                                        scales: {
                                            x: { display: false }, 
                                            y: { 
                                                title: { display: true, text: 'Voltage (mV)', color: '#0f766e', font: {weight: 'bold'} }, 
                                                grid: { color: '#ecfeff' } 
                                            }
                                        }
                                    }} 
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="w-full h-80 flex flex-col items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 mb-6">
                            <i className="fas fa-spinner fa-spin text-3xl text-teal-500 mb-3"></i>
                            <p className="text-gray-500 font-medium animate-pulse">Processing Chart Data...</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}