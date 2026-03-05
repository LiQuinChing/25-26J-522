import React, { useState } from 'react';
import axios from 'axios';
import './App.css';
import './knowledgebase.css';
import SVTForm from './components/SVTForm';
import ResultDisplay from './components/ResultDisplay';
import Header from './components/Header';
import PatientDetailsForm from './components/PatientDetailsForm';
import PatientHistory from './components/PatientHistory';
import EcgKnowledgeBase from './pages/EcgKnowledgeBase';

const API_BASE_URL = (process.env.REACT_APP_API_BASE_URL || '').replace(/\/$/, '');
const PREDICT_URL = `${API_BASE_URL}/predict`;
const PATIENT_API_URL = (process.env.REACT_APP_PATIENT_API_URL || 'http://localhost:5001/api').replace(/\/$/, '');

function App() {
  const [activeView, setActiveView] = useState('analysis');
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
      headers: {
        'Content-Type': 'application/json',
      },
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
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.data.status === 'success') {
        setResult(response.data);

        try {
          const saveResponse = await savePatientRecord(response.data, formData);
          setSaveMessage(
            `Patient record saved. Novelty Score: ${saveResponse.novelty.score} (${saveResponse.novelty.label})`
          );
          setHistoryRefreshKey((prev) => prev + 1);
        } catch (saveError) {
          setSaveMessage(
            `Prediction complete, but saving failed: ${saveError.response?.data?.message || saveError.message}`
          );
        }
      } else {
        setError(response.data.message || 'Prediction failed');
      }
    } catch (err) {
      if (err.response) {
        // Server responded with error
        setError(err.response.data.message || 'Server error occurred');
      } else if (err.request) {
        // Request made but no response
        setError(`Cannot connect to API server at ${PREDICT_URL}. Make sure the Flask server is running.`);
      } else {
        // Something else happened
        setError('Error: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
    setSaveMessage(null);
  };

  const handleNavigate = (view) => {
    setActiveView(view);
  };

  if (activeView === 'knowledge-base') {
    return <EcgKnowledgeBase onNavigate={handleNavigate} />;
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-card learning-card">
          <p className="sidebar-overline">Learning Path</p>
          <p className="sidebar-title">Intermediate Level</p>
        </div>

        <div className="sidebar-section">
          <p className="sidebar-heading">Topics</p>
          <ul className="sidebar-list">
            <li className="active">ECG Basics</li>
            <li>Arrhythmias</li>
            <li>Myocardial Infarction</li>
            <li>Lead Placement</li>
          </ul>
        </div>

        <div className="sidebar-section">
          <p className="sidebar-heading">Resources</p>
          <ul className="sidebar-list resources">
            <li>Video Tutorials</li>
            <li>Practice Quizzes</li>
          </ul>
        </div>
      </aside>

      <div className="app-main">
        <Header activeView={activeView} onNavigate={handleNavigate} />

        <main className="main-content">
          <div className="container">
            <section className="hero-section">
              <p className="breadcrumb">Home / Analysis / SVT Detection</p>
              <h2>Supraventricular Tachycardia (SVT Detection)</h2>
              
            </section>

            <div className="card">
              <div className="card-header">
                <h3>Enter ECG Parameters</h3>
                <p className="subtitle">Clinical input values for model prediction</p>
              </div>

              <PatientDetailsForm
                value={patientDetails}
                onChange={setPatientDetails}
              />

              <SVTForm
                onSubmit={handlePredict}
                loading={loading}
                onReset={handleReset}
                hasResult={result !== null || error !== null}
              />

              {saveMessage && (
                <div className="save-info">
                  {saveMessage}
                </div>
              )}

              {error && (
                <div className="error-box">
                  <div className="error-icon">⚠️</div>
                  <div className="error-content">
                    <h3>Prediction Error</h3>
                    <p>{error}</p>
                  </div>
                </div>
              )}

              {result && <ResultDisplay result={result} />}

              <PatientHistory
                apiBaseUrl={PATIENT_API_URL}
                refreshKey={historyRefreshKey}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
