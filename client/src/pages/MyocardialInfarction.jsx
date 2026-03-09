import React, { useEffect, useState } from 'react';
import axios from 'axios';
// Note: Make sure to copy their ResultsService.js file into your services/components folder!
import ResultsService from '../ResultsService';

// Converted process.env to import.meta.env for Vite compatibility
const ML_API_URL = import.meta.env.VITE_ML_API_URL || 'http://localhost:8003'; 
const BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:5000';

export default function MyocardialInfarction() {
  const [patientId, setPatientId] = useState('');
  const [patientName, setPatientName] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [aiGuidance, setAiGuidance] = useState(null);
  const [aiGuidanceLoading, setAiGuidanceLoading] = useState(false);
  const [aiGuidanceError, setAiGuidanceError] = useState('');
  const [saveMessage, setSaveMessage] = useState('');
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const normalizePredictionForBackend = (className) => {
    if (className === 'Normal') return 'Normal';
    if (className === 'Previous_MI') return 'History of MI';
    if (className === 'Myocardial_Infarction') return 'Myocardial Infarction';
    return className.replace(/_/g, ' ');
  };

  const formatConfidence = (value) => {
    if (typeof value !== 'number' || Number.isNaN(value)) return 'N/A';
    const percent = value <= 1 ? value * 100 : value;
    return `${percent.toFixed(1)}%`;
  };

  const fileToDataUrl = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Could not read the ECG image for AI guidance.'));
    reader.readAsDataURL(file);
  });

  const requestAiGuidance = async (predictionResponse, imageDataUrl) => {
    setAiGuidanceLoading(true);
    setAiGuidanceError('');

    try {
      const response = await axios.post(`${BACKEND_API_URL}/api/mi-guidance`, {
        patientId: patientId.trim(),
        patientName: patientName.trim(),
        prediction: normalizePredictionForBackend(predictionResponse.predicted_class),
        confidence: predictionResponse.confidence,
        imageDataUrl,
      });

      setAiGuidance(response.data.guidance || null);
    } catch (err) {
      setAiGuidance(null);
      setAiGuidanceError(err.response?.data?.error || 'Failed to generate AI guidance.');
    } finally {
      setAiGuidanceLoading(false);
    }
  };

  const loadHistory = async (targetPatientId = '') => {
    setHistoryLoading(true);
    setHistoryError('');
    try {
      const data = targetPatientId
        ? await ResultsService.getPatientResults(targetPatientId)
        : await ResultsService.getRecentResults(20);
      setHistory(data.results || []);
    } catch (err) {
      setHistoryError(err.response?.data?.error || 'Failed to load history from backend');
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleCheckPatient = async () => {
    if (!patientId.trim()) {
      setError('Please enter a patient ID');
      return;
    }
    setError(null);
    setSaveMessage('');
    try {
      const data = await ResultsService.getPatient(patientId.trim());
      if (data.exists && data.patient?.name) {
        setPatientName(data.patient.name);
        await loadHistory(patientId.trim());
      } else {
        setPatientName('');
        setHistory([]);
        setSaveMessage('Patient not found. Enter a name and analyze to create one.');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Could not check patient in backend');
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setResult(null);
      setAiGuidance(null);
      setAiGuidanceError('');
      setError(null);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select an image first');
      return;
    }
    if (!patientId.trim() || !patientName.trim()) {
      setError('Please enter both Patient ID and Patient Name before analysis');
      return;
    }

    setLoading(true);
    setError(null);
    setSaveMessage('');
    setResult(null);
    setAiGuidance(null);
    setAiGuidanceError('');

    const formData = new FormData();
    formData.append('image', selectedFile);

    try {
      const imageDataUrl = preview || await fileToDataUrl(selectedFile);
      const response = await axios.post(`${ML_API_URL}/api/predict`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data.success) {
        setResult(response.data);
        await ResultsService.savePatient({
          patientId: patientId.trim(),
          name: patientName.trim(),
        });

        const now = new Date();
        await ResultsService.saveResult({
          patientId: patientId.trim(),
          patientName: patientName.trim(),
          prediction: normalizePredictionForBackend(response.data.predicted_class),
          confidence: response.data.confidence,
          date: now.toISOString(),
          time: now.toLocaleTimeString(),
          imageFile: selectedFile.name,
          additionalNotes: '',
        });

        setSaveMessage('Result saved to backend history successfully.');
        await loadHistory(patientId.trim());
        await requestAiGuidance(response.data, imageDataUrl);
      } else {
        setError(response.data.error || 'Prediction failed');
      }
    } catch (err) {
      if (err.response?.data?.validation) {
        const warnings = err.response.data.validation.warnings.join('. ');
        setError(`${err.response.data.error}. ${warnings}`);
      } else {
        setError(err.response?.data?.error || 'Failed to connect to server. Make sure Flask API is running.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreview(null);
    setResult(null);
    setAiGuidance(null);
    setAiGuidanceError('');
    setError(null);
  };

  const getResultColor = (className) => {
    if (className === 'Normal') return { bg: 'bg-green-500', text: 'text-green-500', border: 'border-green-500' };
    if (className === 'Previous_MI') return { bg: 'bg-amber-500', text: 'text-amber-500', border: 'border-amber-500' };
    return { bg: 'bg-red-500', text: 'text-red-500', border: 'border-red-500' };
  };

  const getResultIcon = (className) => {
    if (className === 'Normal') return 'check_circle';
    if (className === 'Previous_MI') return 'warning';
    return 'cancel';
  };

  return (
    <div className="flex flex-col items-center w-full max-w-7xl mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="w-full flex flex-col items-center text-center mb-12 space-y-6">
        <div className="bg-white/80 backdrop-blur-sm px-6 py-2 rounded-full border border-cyan-100 shadow-sm inline-flex items-center gap-2 mb-2">
          <span className="material-symbols-outlined text-teal-600 text-sm">ecg_heart</span>
          <span className="text-teal-900 text-sm font-semibold">AI-Powered ECG Analysis</span>
        </div>
        
        <h1 className="text-3xl md:text-5xl font-black text-teal-900 tracking-tight leading-tight">
          Myocardial Infarction Detection
        </h1>
        
        <p className="text-gray-500 text-lg max-w-2xl mx-auto leading-relaxed">
          Upload an ECG image to detect signs of myocardial infarction using advanced deep learning technology.
        </p>
      </div>

      {/* Upload Card */}
      <div className="w-full max-w-4xl bg-white rounded-xl shadow-md border border-cyan-100 overflow-hidden">
        <div className="p-8">
          <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <label className="block text-sm font-semibold text-gray-500 mb-2">Patient ID</label>
              <input type="text" value={patientId} onChange={(e) => setPatientId(e.target.value)} placeholder="e.g. P001" className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500/40" />
            </div>
            <div className="md:col-span-1">
              <label className="block text-sm font-semibold text-gray-500 mb-2">Patient Name</label>
              <input type="text" value={patientName} onChange={(e) => setPatientName(e.target.value)} placeholder="Enter patient name" className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500/40" />
            </div>
            <div className="md:col-span-1 flex items-end">
              <button onClick={handleCheckPatient} className="w-full h-[50px] flex items-center justify-center gap-2 px-5 bg-teal-100 hover:bg-teal-200 text-teal-900 rounded-lg text-sm font-bold transition-all">
                <span className="material-symbols-outlined">person_search</span> Check Patient
              </button>
            </div>
          </div>

          <div className="relative">
            <input type="file" id="file-input" accept="image/*" onChange={handleFileSelect} className="hidden" />
            <label htmlFor="file-input" className="block cursor-pointer border-3 border-dashed border-cyan-200 rounded-xl hover:border-teal-500 hover:bg-teal-50 transition-all duration-300 overflow-hidden bg-cyan-50/30">
              {preview ? (
                <div className="relative"><img src={preview} alt="Preview" className="w-full h-auto max-h-[500px] object-contain" /></div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 px-4">
                  <span className="material-symbols-outlined text-teal-600 text-[80px] mb-4">upload_file</span>
                  <p className="text-teal-900 text-lg font-semibold mb-2">Click to upload ECG image</p>
                  <p className="text-gray-500 text-sm">JPG, PNG, or JPEG formats supported</p>
                </div>
              )}
            </label>
          </div>

          <div className="flex gap-4 justify-center mt-8">
            <button onClick={handleUpload} disabled={!selectedFile || loading} className="flex items-center justify-center gap-2 px-8 py-4 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-base font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg">
              {loading ? (<><span className="material-symbols-outlined animate-spin">refresh</span><span>Analyzing...</span></>) : (<><span className="material-symbols-outlined">analytics</span><span>Analyze ECG</span></>)}
            </button>
            {(selectedFile || result) && (
              <button onClick={handleReset} className="flex items-center justify-center gap-2 px-8 py-4 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-base font-bold transition-all shadow-md">
                <span className="material-symbols-outlined">restart_alt</span><span>Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="w-full max-w-4xl mt-6 bg-red-50 border border-red-200 rounded-xl p-6 flex items-start gap-4">
          <span className="material-symbols-outlined text-red-600 text-2xl">error</span>
          <div><h3 className="text-red-900 font-bold mb-1">Analysis Error</h3><p className="text-red-800">{error}</p></div>
        </div>
      )}
      {saveMessage && (
        <div className="w-full max-w-4xl mt-6 bg-green-50 border border-green-200 rounded-xl p-6 flex items-start gap-4">
          <span className="material-symbols-outlined text-green-600 text-2xl">check_circle</span>
          <div><h3 className="text-green-900 font-bold mb-1">Backend Sync</h3><p className="text-green-800">{saveMessage}</p></div>
        </div>
      )}

      {/* Result Section */}
      {result && (
        <div className="w-full max-w-4xl mt-8">
          <div className={`bg-white rounded-xl shadow-md border-l-4 ${getResultColor(result.predicted_class).border} p-8`}>
            <div className="flex items-center gap-6 mb-8">
              <span className={`material-symbols-outlined text-6xl ${getResultColor(result.predicted_class).text}`}>{getResultIcon(result.predicted_class)}</span>
              <div>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Diagnosis Result</h2>
                <h3 className={`text-3xl font-bold ${getResultColor(result.predicted_class).text}`}>{result.predicted_class.replace('_', ' ')}</h3>
              </div>
            </div>
            <div className="mb-8">
              <div className="flex justify-between items-center mb-3">
                <p className="text-gray-500 font-semibold">Confidence Level</p>
                <p className="text-teal-900 font-bold text-xl">{(result.confidence * 100).toFixed(1)}%</p>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                <div className={`h-full ${getResultColor(result.predicted_class).bg} transition-all duration-1000 rounded-full`} style={{ width: `${result.confidence * 100}%` }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {(aiGuidanceLoading || aiGuidance || aiGuidanceError) && (
        <section className="w-full max-w-4xl mt-8">
          <div className="bg-white rounded-xl shadow-md border border-cyan-100 overflow-hidden">
            <div className="p-6 border-b border-cyan-100">
              <h3 className="text-xl font-bold text-teal-900">AI Guidance</h3>
              <p className="text-sm text-gray-500 mt-1">Readable follow-up information based on the ECG image and the MI model output.</p>
            </div>

            <div className="p-6 space-y-6">
              {aiGuidanceLoading && (
                <div className="flex items-center gap-3 text-gray-600">
                  <span className="material-symbols-outlined animate-spin">refresh</span>
                  <span>Generating readable guidance...</span>
                </div>
              )}

              {aiGuidanceError && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
                  {aiGuidanceError}
                </div>
              )}

              {aiGuidance && (
                <>
                  <div className="rounded-xl bg-cyan-50 border border-cyan-100 p-5">
                    <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-2">Summary</h4>
                    <p className="text-gray-800 leading-7">{aiGuidance.summary}</p>
                  </div>

                  <div className="rounded-xl bg-amber-50 border border-amber-100 p-5">
                    <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-2">Time-To-Event Assessment</h4>
                    <p className="text-gray-800 leading-7">{aiGuidance.timeToEventAssessment}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="rounded-xl border border-cyan-100 p-5">
                      <h4 className="text-lg font-bold text-teal-900 mb-3">Prevention And Next Steps</h4>
                      <ul className="space-y-3 text-gray-800">
                        {aiGuidance.preventionSteps?.map((item, index) => (
                          <li key={`prevention-${index}`} className="flex items-start gap-3">
                            <span className="material-symbols-outlined text-teal-600 mt-0.5">check_circle</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="rounded-xl border border-red-100 p-5">
                      <h4 className="text-lg font-bold text-red-700 mb-3">Get Urgent Medical Help If</h4>
                      <ul className="space-y-3 text-gray-800">
                        {aiGuidance.urgentSigns?.map((item, index) => (
                          <li key={`urgent-${index}`} className="flex items-start gap-3">
                            <span className="material-symbols-outlined text-red-600 mt-0.5">warning</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="rounded-xl border border-cyan-100 p-5">
                    <h4 className="text-lg font-bold text-teal-900 mb-3">Questions To Ask A Clinician</h4>
                    <ul className="space-y-3 text-gray-800">
                      {aiGuidance.followUpQuestions?.map((item, index) => (
                        <li key={`question-${index}`} className="flex items-start gap-3">
                          <span className="material-symbols-outlined text-cyan-700 mt-0.5">help</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-xl bg-slate-50 border border-slate-200 p-5">
                    <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-2">Important</h4>
                    <p className="text-gray-700 leading-7">{aiGuidance.disclaimer}</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>
      )}

      {/* History Section */}
      <section className="w-full max-w-4xl mt-8 mb-12">
        <div className="bg-white rounded-xl shadow-md border border-cyan-100 overflow-hidden">
          <div className="p-6 border-b border-cyan-100 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-bold text-teal-900">Analysis History</h3>
              <p className="text-sm text-gray-500">{patientId.trim() ? `Showing records for ${patientId.trim()}` : 'Showing recent records from backend'}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => loadHistory(patientId.trim())} className="px-4 py-2 rounded-lg bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 transition-colors">Refresh</button>
              <button onClick={() => loadHistory('')} className="px-4 py-2 rounded-lg border border-teal-300 text-teal-600 text-sm font-semibold hover:bg-teal-50 transition-colors">Recent All</button>
            </div>
          </div>
          <div className="p-6 overflow-x-auto">
            {historyLoading ? (<div className="text-gray-500">Loading history...</div>) : history.length === 0 ? (<div className="text-gray-500">No history records found yet.</div>) : (
              <table className="w-full min-w-[700px] text-left">
                <thead>
                  <tr className="text-xs uppercase tracking-wide text-gray-500 border-b border-cyan-100">
                    <th className="py-3 pr-4">Patient</th><th className="py-3 pr-4">Prediction</th><th className="py-3 pr-4">Confidence</th><th className="py-3 pr-4">Image</th><th className="py-3">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((entry) => (
                    <tr key={entry.id} className="border-b border-cyan-50 text-sm">
                      <td className="py-3 pr-4"><div className="font-semibold text-gray-900">{entry.patientName}</div><div className="text-gray-500">{entry.patientId}</div></td>
                      <td className="py-3 pr-4 text-gray-900">{entry.prediction}</td><td className="py-3 pr-4 text-gray-900">{formatConfidence(entry.confidence)}</td>
                      <td className="py-3 pr-4 text-gray-500">{entry.imageFile || '-'}</td><td className="py-3 text-gray-500">{entry.time || new Date(entry.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}