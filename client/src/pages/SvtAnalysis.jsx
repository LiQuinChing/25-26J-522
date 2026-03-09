import React, { useState } from 'react';
import axios from 'axios';
import SVTForm from '../components/SVTForm';
import SVTResultDisplay from '../components/SVTResultDisplay'; // Renamed to avoid clashing with Branch 1
import PatientDetailsForm from '../components/PatientDetailsForm';
import PatientHistory from '../components/PatientHistory';

// In Vite, we use import.meta.env instead of process.env
// We also default the ML backend to your port 8000 if no env variable is set
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8002').replace(/\/$/, '');
const PREDICT_URL = `${API_BASE_URL}/predict`;
// Pointing to your newly merged dev-main1 server on port 5000!
const PATIENT_API_URL = (import.meta.env.VITE_PATIENT_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');

export default function SvtAnalysis() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [guidance, setGuidance] = useState(null);
  const [guidanceLoading, setGuidanceLoading] = useState(false);
  const [guidanceError, setGuidanceError] = useState(null);
  const [error, setError] = useState(null);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
  const [saveMessage, setSaveMessage] = useState(null);
  const [patientDetails, setPatientDetails] = useState({
    patient_id: '',
    full_name: '',
    age: '',
    gender: '',
    contact_number: '',
    notes: '',
  });

  const isPatientDetailsValid = () => {
    return (
      patientDetails.patient_id.trim() &&
      patientDetails.full_name.trim() &&
      patientDetails.age &&
      patientDetails.gender
    );
  };

  const savePatientRecord = async (predictionData, ecgInput) => {
    const payload = {
      patient: {
        ...patientDetails,
        age: Number(patientDetails.age),
      },
      ecg: ecgInput,
      prediction: {
        label: predictionData.prediction.label,
        svt_probability: predictionData.prediction.svt_probability,
      },
    };

    const response = await axios.post(`${PATIENT_API_URL}/patients`, payload, {
      headers: { 'Content-Type': 'application/json' },
    });

    return response.data;
  };

  const requestSvtGuidance = async (predictionData, ecgInput, novelty = null) => {
    setGuidanceLoading(true);
    setGuidanceError(null);

    try {
      const response = await axios.post(`${PATIENT_API_URL}/svt-guidance`, {
        patient: {
          ...patientDetails,
          age: Number(patientDetails.age),
        },
        ecg: ecgInput,
        prediction: {
          label: predictionData.prediction.label,
          svt_probability: predictionData.prediction.svt_probability,
        },
        novelty,
      }, {
        headers: { 'Content-Type': 'application/json' },
      });

      setGuidance({
        ...response.data.guidance,
        source: response.data.source || 'gemini',
      });
    } catch (requestError) {
      setGuidance(null);
      setGuidanceError(requestError.response?.data?.error || requestError.message || 'Failed to generate SVT guidance.');
    } finally {
      setGuidanceLoading(false);
    }
  };

  const handlePredict = async (formData) => {
    if (!isPatientDetailsValid()) {
      setError('Please enter Patient ID, Full Name, Age, and Gender before running prediction.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setGuidance(null);
    setGuidanceError(null);
    setSaveMessage(null);

    try {
      const response = await axios.post(PREDICT_URL, formData, {
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.data.status === 'success') {
        setResult(response.data);
        let novelty = null;

        try {
          const saveResponse = await savePatientRecord(response.data, formData);
          novelty = saveResponse.novelty;
          setSaveMessage(`Patient record saved. Novelty Score: ${saveResponse.novelty.score} (${saveResponse.novelty.label})`);
          setHistoryRefreshKey((prev) => prev + 1);
        } catch (saveError) {
          setSaveMessage(`Prediction complete, but saving failed: ${saveError.response?.data?.message || saveError.message}`);
        }

        await requestSvtGuidance(response.data, formData, novelty);
      } else {
        setError(response.data.message || 'Prediction failed');
      }
    } catch (err) {
      if (err.response) setError(err.response.data.message || 'Server error occurred');
      else if (err.request) setError(`Cannot connect to API server at ${PREDICT_URL}. Make sure the Flask server is running.`);
      else setError('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setGuidance(null);
    setGuidanceError(null);
    setError(null);
    setSaveMessage(null);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <section className="mb-8">
        <h2 className="text-3xl font-bold text-teal-900 mb-2">Supraventricular Tachycardia (SVT Detection)</h2>
        <p className="text-gray-600">Enter clinical input values for model prediction below.</p>
      </section>

      <div className="bg-white shadow-md rounded-lg p-6 border border-cyan-100">
        <PatientDetailsForm value={patientDetails} onChange={setPatientDetails} />
        
        <SVTForm 
          onSubmit={handlePredict} 
          loading={loading} 
          onReset={handleReset} 
          hasResult={result !== null || error !== null} 
        />

        {saveMessage && (
          <div className="mt-4 p-4 bg-teal-50 text-teal-800 rounded-md border border-teal-200">
            {saveMessage}
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-50 text-red-800 rounded-md border border-red-200 flex items-start gap-3">
            <span className="text-xl">⚠️</span>
            <div>
              <h3 className="font-bold">Prediction Error</h3>
              <p>{error}</p>
            </div>
          </div>
        )}

        {result && <SVTResultDisplay result={result} />}

        {(guidanceLoading || guidance || guidanceError) && (
          <div className="mt-6 rounded-lg border border-cyan-100 bg-white p-6 shadow-sm">
            <div className="mb-4">
              <h3 className="text-xl font-bold text-teal-900">AI Guidance</h3>
              <p className="text-sm text-gray-500 mt-1">Readable follow-up advice based on the SVT model output and entered clinical values.</p>
            </div>

            {guidanceLoading && (
              <div className="flex items-center gap-3 text-gray-600">
                <span className="material-symbols-outlined animate-spin">refresh</span>
                <span>Generating SVT guidance...</span>
              </div>
            )}

            {guidanceError && (
              <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-red-700">
                {guidanceError}
              </div>
            )}

            {guidance && (
              <div className="space-y-5">
                <div className="rounded-lg border border-cyan-100 bg-cyan-50 p-4">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Summary</h4>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${guidance.source === 'fallback' ? 'bg-amber-100 text-amber-800' : 'bg-teal-100 text-teal-800'}`}>
                      {guidance.source === 'fallback' ? 'Fallback guidance' : 'Gemini guidance'}
                    </span>
                  </div>
                  <p className="text-gray-800 leading-7">{guidance.summary}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="rounded-lg border border-teal-100 p-4">
                    <h4 className="text-lg font-bold text-teal-900 mb-3">Prevention And Next Steps</h4>
                    <ul className="space-y-3 text-gray-800">
                      {guidance.preventionSteps?.map((item, index) => (
                        <li key={`svt-prevention-${index}`} className="flex items-start gap-3">
                          <span className="material-symbols-outlined text-teal-600 mt-0.5">check_circle</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-lg border border-red-100 p-4">
                    <h4 className="text-lg font-bold text-red-700 mb-3">Urgent Warning Signs</h4>
                    <ul className="space-y-3 text-gray-800">
                      {guidance.urgentSigns?.map((item, index) => (
                        <li key={`svt-urgent-${index}`} className="flex items-start gap-3">
                          <span className="material-symbols-outlined text-red-600 mt-0.5">warning</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="rounded-lg border border-cyan-100 p-4">
                  <h4 className="text-lg font-bold text-teal-900 mb-3">Daily Care</h4>
                  <ul className="space-y-3 text-gray-800">
                    {guidance.dailyCare?.map((item, index) => (
                      <li key={`svt-daily-${index}`} className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-cyan-700 mt-0.5">favorite</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-lg border border-cyan-100 p-4">
                  <h4 className="text-lg font-bold text-teal-900 mb-3">Questions To Ask A Clinician</h4>
                  <ul className="space-y-3 text-gray-800">
                    {guidance.followUpQuestions?.map((item, index) => (
                      <li key={`svt-question-${index}`} className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-cyan-700 mt-0.5">help</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-gray-700">
                  <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-2">Important</h4>
                  <p className="leading-7">{guidance.disclaimer}</p>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-8 border-t border-gray-200 pt-8">
            <PatientHistory apiBaseUrl={PATIENT_API_URL} refreshKey={historyRefreshKey} />
        </div>
      </div>
    </div>
  );
}