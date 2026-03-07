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

  const handlePredict = async (formData) => {
    if (!isPatientDetailsValid()) {
      setError('Please enter Patient ID, Full Name, Age, and Gender before running prediction.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setSaveMessage(null);

    try {
      const response = await axios.post(PREDICT_URL, formData, {
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.data.status === 'success') {
        setResult(response.data);

        try {
          const saveResponse = await savePatientRecord(response.data, formData);
          setSaveMessage(`Patient record saved. Novelty Score: ${saveResponse.novelty.score} (${saveResponse.novelty.label})`);
          setHistoryRefreshKey((prev) => prev + 1);
        } catch (saveError) {
          setSaveMessage(`Prediction complete, but saving failed: ${saveError.response?.data?.message || saveError.message}`);
        }
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

        <div className="mt-8 border-t border-gray-200 pt-8">
            <PatientHistory apiBaseUrl={PATIENT_API_URL} refreshKey={historyRefreshKey} />
        </div>
      </div>
    </div>
  );
}