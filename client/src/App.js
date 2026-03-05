import React, { useState } from 'react';
import axios from 'axios';
import './App.css';
import SVTForm from './components/SVTForm';
import ResultDisplay from './components/ResultDisplay';
import Header from './components/Header';

const API_BASE_URL = (process.env.REACT_APP_API_BASE_URL || '').replace(/\/$/, '');
const PREDICT_URL = `${API_BASE_URL}/predict`;

function App() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handlePredict = async (formData) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await axios.post(PREDICT_URL, formData, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.data.status === 'success') {
        setResult(response.data);
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
  };

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
        <Header />

        <main className="main-content">
          <div className="container">
            <section className="hero-section">
              <p className="breadcrumb">Home / Analysis / SVT Detection</p>
              <h2>ECG Analysis Workspace</h2>
              
            </section>

            <div className="card">
              <div className="card-header">
                <h3>Enter ECG Parameters</h3>
                <p className="subtitle">Clinical input values for model prediction</p>
              </div>

              <SVTForm
                onSubmit={handlePredict}
                loading={loading}
                onReset={handleReset}
                hasResult={result !== null || error !== null}
              />

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
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
