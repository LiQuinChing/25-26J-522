import React, { useRef, useState, useEffect } from 'react';
import Papa from 'papaparse';
import ResultDisplay from './ResultDisplay';
import { uploadECGFile, getRecentAnalyses } from '../services/api';

export default function UploadECG({ onResult }) {
    const [isDragActive, setIsDragActive] = useState(false);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    
    // New States
    const [patientName, setPatientName] = useState('');
    const [recentAnalyses, setRecentAnalyses] = useState([]);
    
    const [result, setResult] = useState(null);
    const [chartData, setChartData] = useState(null);
    const inputRef = useRef(null);

    // Fetch recent analyses on mount
    const fetchRecents = async () => {
        const data = await getRecentAnalyses();
        setRecentAnalyses(data);
    };

    useEffect(() => {
        fetchRecents();
    }, []);

    const handleFile = async (file) => {
        setError(null);
        
        // Validation for Patient Name
        if (!patientName.trim()) {
            setError('Please enter the patient name before uploading.');
            return;
        }

        const validExtensions = ['.csv'];
        const fileExt = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
        if (!validExtensions.includes(fileExt)) {
            setError('Invalid file format. Please upload a CSV file.');
            return;
        }

        setIsLoading(true);
        
        // // 1. Parse CSV Locally for Chart.js
        // Papa.parse(file, {
        //     header: true,
        //     dynamicTyping: true,
        //     skipEmptyLines: true,
        //     complete: (results) => {
        //         if (results.data.length === 0) return;
        //         const headers = Object.keys(results.data[0]);
                
        //         const ignoreCols = ['time_ms', 'time', 'Unnamed: 0', ''];
        //         let targetCol = ['MLII', 'II', 'V1', 'V5', 'I'].find(lead => headers.includes(lead)) 
        //                         || headers.find(col => !ignoreCols.includes(col));

        //         const cleanData = results.data.slice(0, 1500).map(row => parseFloat(row[targetCol])).filter(val => !isNaN(val));

        //         setChartData({
        //             labels: Array.from({length: cleanData.length}, (_, i) => i),
        //             datasets: [{
        //                 label: targetCol || 'ECG Lead',
        //                 data: cleanData,
        //                 borderColor: '#06b6d4',
        //                 borderWidth: 2,
        //                 pointRadius: 0,
        //                 tension: 0.1 
        //             }]
        //         });
        //     }
        // });

        // 1. Parse CSV Locally for Chart.js
        Papa.parse(file, {
            header: false, // Turn off automatic headers to inspect the raw array structure
            dynamicTyping: true,
            skipEmptyLines: true,
            complete: (results) => {
                const data = results.data;
                if (data.length === 0) return;

                let cleanData = [];
                let labelName = 'ECG Signal';

                // Check format by looking at the first cell
                const firstRow = data[0];
                const isMultiColumnRaw = typeof firstRow[0] === 'string' || typeof firstRow[1] === 'string';

                if (isMultiColumnRaw) {
                    // It's the multi-column format (e.g., 100.csv) with text headers
                    const headers = firstRow;
                    const ignoreCols = ['time_ms', 'time', 'Unnamed: 0', ''];
                    
                    // Smartly pick the lead
                    let targetColIdx = headers.findIndex(col => ['MLII', 'II', 'V1', 'V5', 'I'].includes(col));
                    if (targetColIdx === -1) {
                        targetColIdx = headers.findIndex(col => !ignoreCols.includes(col));
                    }
                    if (targetColIdx === -1) targetColIdx = 1; // Default fallback

                    labelName = headers[targetColIdx] || 'ECG Lead';
                    
                    // Extract data down the column, skipping the first row (the text header)
                    cleanData = data.slice(1, 1500)
                        .map(row => parseFloat(row[targetColIdx]))
                        .filter(val => !isNaN(val));

                } else {
                    // It's the single-row pre-segmented format (e.g., sample_100_Supraventricular.csv)
                    // Data goes horizontally across the columns in the first row
                    cleanData = firstRow
                        .slice(0, 1500) // Usually 187 length
                        .map(val => parseFloat(val))
                        .filter(val => !isNaN(val));
                    labelName = 'Pre-Segmented Heartbeat (Kaggle MIT-BIH)';
                }

                setChartData({
                    labels: Array.from({length: cleanData.length}, (_, i) => i),
                    datasets: [{
                        label: labelName,
                        data: cleanData,
                        borderColor: '#06b6d4',
                        borderWidth: 2,
                        pointRadius: 0,
                        tension: 0.1 
                    }]
                });
            }
        });

        // 2. Send to Backend
        try {
            const formData = new FormData();
            // Important: Append text fields BEFORE the file
            formData.append('patientName', patientName);
            formData.append('file', file);
            
            const response = await uploadECGFile(formData);
            
            setResult(response);
            if (onResult) onResult(response);
            
            // Refresh the recent list after successful upload
            fetchRecents();
            
        } catch (err) {
            setError(err.message || 'Failed to process file on server');
            setResult(null);
        } finally {
            setIsLoading(false);
        }
    };

    // Helper function to format date
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    };

    if (result) {
        return <ResultDisplay result={result} chartData={chartData} onBack={() => { setResult(null); setChartData(null); setPatientName(''); }} />;
    }

    return (
        <div className="min-h-screen bg-cyan-100 p-8 font-sans">
            <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">
                
                {/* Main Upload Area */}
                <div className="flex-1 space-y-4">
                    <h1 className="text-3xl font-extrabold text-teal-900 mb-2">Upload Patient ECG <i className="fas fa-file-medical ml-2"></i></h1>
                    <p className="text-teal-700 mb-6">Enter the patient details and drop the digitized CSV file to begin AI analysis.</p>
                    
                    {/* Patient Name Input */}
                    <div className="bg-white/50 p-4 rounded-xl shadow-sm border border-cyan-100 mb-4">
                        <label className="block text-sm font-bold text-teal-900 mb-2">Patient Full Name</label>
                        <input 
                            type="text" 
                            value={patientName}
                            onChange={(e) => setPatientName(e.target.value)}
                            placeholder="e.g. Nimal Perera" 
                            className="bg-white w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                            disabled={isLoading}
                        />
                    </div>

                    <div
                        onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragActive(true); }}
                        onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragActive(false); }}
                        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        onDrop={(e) => {
                            e.preventDefault(); e.stopPropagation(); setIsDragActive(false);
                            if (e.dataTransfer?.files?.[0]) handleFile(e.dataTransfer.files[0]);
                        }}
                        onClick={() => !isLoading && inputRef.current?.click()}
                        className={`h-72 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all ${
                            isDragActive ? 'border-teal-500 bg-teal-50 scale-[1.02]' : 'border-teal-300 bg-white hover:border-teal-400 hover:bg-cyan-50'
                        } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <div className="bg-teal-100 p-4 rounded-full mb-4">
                            <i className="fas fa-heartbeat text-3xl text-teal-600"></i>
                        </div>
                        <p className="text-xl font-bold text-teal-900">
                            {isLoading ? 'Processing...' : 'Drop file here or Browse'}
                        </p>

                        {isLoading && (
                            <div className="mt-4 flex items-center gap-2 text-teal-600">
                                <i className="fas fa-circle-notch fa-spin text-xl"></i>
                                <span className="font-semibold">Processing your file...</span>
                            </div>
                        )}
                        <input
                            ref={inputRef}
                            type="file"
                            accept=".csv"
                            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                            className="hidden"
                        />
                    </div>

                    {error && (
                        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-sm mt-4">
                            <p className="font-medium"><i className="fas fa-exclamation-triangle mr-2"></i>{error}</p>
                        </div>
                    )}
                </div>

                {/* Right Sidebar (Recent Analysis & Formats) */}
                <div className="w-full lg:w-80 flex flex-col gap-6">
                    <div className="bg-white/50 rounded-xl shadow-sm p-6 border border-cyan-100">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-teal-900"><i className="fas fa-history mr-2"></i>Recent Analysis</h3>
                            <span className="text-xs text-teal-600 font-semibold bg-teal-50 px-2 py-1 rounded">Live DB</span>
                        </div>
                        
                        <div className="space-y-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                            {recentAnalyses.length === 0 ? (
                                <p className="text-sm text-gray-500 italic text-center py-4">No recent analyses found.</p>
                            ) : (
                                recentAnalyses.map((scan) => {
                                    const isNormal = scan.predictedClass === 'Normal';
                                    return (
                                        <div key={scan._id} className="flex items-start gap-3 border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                                            <i className={`fas ${isNormal ? 'fa-check-circle text-green-500' : 'fa-exclamation-triangle text-red-500'} text-xl mt-1`}></i>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-gray-800 truncate" title={`${scan.patientName} - #${scan.patientId}`}>
                                                    {scan.patientName} - #{scan.patientId}
                                                </p>
        
                                                <p className="text-[11px] text-teal-600 truncate mt-0.5" title={scan.fileName}>
                                                    <i className="fas fa-file-csv mr-1"></i>{scan.fileName}
                                                </p>

                                                <p className={`text-xs font-semibold mt-1 ${isNormal ? 'text-gray-500' : 'text-red-500'}`}>
                                                    {scan.predictedClass}
                                                </p>
                                                <p className="text-[10px] text-gray-400 mt-1">{formatDate(scan.createdAt)}</p>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}