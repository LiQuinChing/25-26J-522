import React, { useState } from 'react';
import axios from 'axios';
import SVTForm from '../components/SVTForm';
import SVTResultDisplay from '../components/SVTResultDisplay'; // Renamed to avoid clashing with Branch 1
import PatientDetailsForm from '../components/PatientDetailsForm';
import PatientHistory from '../components/PatientHistory';

// In Vite, we use import.meta.env instead of process.env
// We also default the ML backend to your port 8000 if no env variable is set
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/svt').replace(/\/$/, '');
const PREDICT_URL = `${API_BASE_URL}/predict`;
const PREDICT_CSV_URL = `${API_BASE_URL}/predict/csv`;
const CONVERT_IMAGE_URL = `${API_BASE_URL}/convert-image`;
const PREDICT_IMAGE_URL = `${API_BASE_URL}/predict/image`;
// Pointing to your newly merged dev-main1 server on port 5000!
const PATIENT_API_URL = (import.meta.env.VITE_PATIENT_API_URL || '/api').replace(/\/$/, '');

export default function SvtAnalysis() {
  const [loadingAction, setLoadingAction] = useState(null);
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

  const loading = loadingAction !== null;

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

  const runPrediction = async ({ requestFn, loadingKey, saveInput }) => {
    if (!isPatientDetailsValid()) {
      setError('Please enter Patient ID, Full Name, Age, and Gender before running prediction.');
      return;
    }

    setLoadingAction(loadingKey);
    setError(null);
    setResult(null);
    setSaveMessage(null);

    try {
      const response = await requestFn();

      if (response.data.status === 'success') {
        setResult(response.data);

        try {
          const saveResponse = await savePatientRecord(response.data, saveInput || response.data.input);
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
      else if (err.request) setError(`Cannot connect to SVT API server at ${API_BASE_URL}. Make sure the Flask server is running.`);
      else setError('Error: ' + err.message);
    } finally {
      setLoadingAction(null);
    }
  };

  const handlePredict = async (formData) => {
    await runPrediction({
      loadingKey: 'manual',
      saveInput: formData,
      requestFn: () => axios.post(PREDICT_URL, formData, {
        headers: { 'Content-Type': 'application/json' },
      }),
    });
  };

  const handleCsvPredict = async ({ csvFile, sampleRateHz }) => {
    const upload = new FormData();
    upload.append('csv', csvFile);
    if (sampleRateHz) upload.append('sample_rate_hz', sampleRateHz);

    await runPrediction({
      loadingKey: 'csv',
      requestFn: () => axios.post(PREDICT_CSV_URL, upload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    });
  };

  const handleImagePredict = async ({ imageFile, layout, sampleRateHz }) => {
    const upload = new FormData();
    upload.append('image', imageFile);
    upload.append('layout', layout);
    if (sampleRateHz) upload.append('sample_rate_hz', sampleRateHz);

    await runPrediction({
      loadingKey: 'image',
      requestFn: () => axios.post(PREDICT_IMAGE_URL, upload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    });
  };

  const handleImageConvert = async ({ imageFile, layout, sampleRateHz }) => {
    setLoadingAction('convert');
    setError(null);
    setSaveMessage(null);

    try {
      const upload = new FormData();
      upload.append('image', imageFile);
      upload.append('layout', layout);
      if (sampleRateHz) upload.append('sample_rate_hz', sampleRateHz);

      const response = await axios.post(CONVERT_IMAGE_URL, upload, {
        headers: { 'Content-Type': 'multipart/form-data' },
        responseType: 'blob',
      });

      const contentDisposition = response.headers['content-disposition'] || '';
      const match = contentDisposition.match(/filename="?([^"]+)"?/i);
      const fileName = match?.[1] || imageFile.name.replace(/\.[^.]+$/, '') + '_timeseries.csv';
      const convertedFile = new File([response.data], fileName, { type: 'text/csv' });
      return {
        file: convertedFile,
        message: response.headers['x-conversion-message'] || 'Image converted to CSV.',
      };
    } catch (err) {
      if (err.response?.data instanceof Blob) {
        const text = await err.response.data.text();
        try {
          const parsed = JSON.parse(text);
          setError(parsed.message || 'Image conversion failed');
        } catch {
          setError(text || 'Image conversion failed');
        }
      } else if (err.response) {
        setError(err.response.data.message || 'Image conversion failed');
      } else if (err.request) {
        setError(`Cannot connect to SVT API server at ${API_BASE_URL}.`);
      } else {
        setError('Error: ' + err.message);
      }
      return null;
    } finally {
      setLoadingAction(null);
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
        <p className="text-gray-600">Enter clinical values, upload an ECG CSV, or convert an ECG image before SVT prediction.</p>
      </section>

      <div className="bg-white shadow-md rounded-lg p-6 border border-cyan-100">
        <PatientDetailsForm value={patientDetails} onChange={setPatientDetails} />
        
        <SVTForm 
          onSubmit={handlePredict} 
          onCsvSubmit={handleCsvPredict}
          onImageConvert={handleImageConvert}
          onImageSubmit={handleImagePredict}
          loading={loading} 
          loadingAction={loadingAction}
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
