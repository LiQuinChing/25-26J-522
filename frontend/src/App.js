import React, { useState } from 'react';
import axios from 'axios';
import './App.css';
import ECGChart from './components/ECGChart';
import PredictionResult from './components/PredictionResult';
import ImageUpload from './components/ImageUpload';

function App() {
  const [ecgData, setEcgData] = useState('');
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [apiStatus, setApiStatus] = useState(null);
  const [inputMode, setInputMode] = useState('text'); // 'text' or 'image'

  const API_URL = 'http://localhost:5000';

  // Check API health on component mount
  React.useEffect(() => {
    checkApiHealth();
  }, []);

  const checkApiHealth = async () => {
    try {
      const response = await axios.get(`${API_URL}/health`);
      setApiStatus(response.data);
    } catch (err) {
      setApiStatus({ status: 'offline', model_loaded: false });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setPrediction(null);
    setLoading(true);

    try {
      const dataArray = ecgData
        .split(',')
        .map(val => parseFloat(val.trim()))
        .filter(val => !isNaN(val));

      if (dataArray.length !== 187) {
        setError(`Please enter exactly 187 values. You entered ${dataArray.length} values.`);
        setLoading(false);
        return;
      }

      const response = await axios.post(`${API_URL}/predict`, {
        ecg_data: dataArray
      });

      setPrediction({
        ...response.data,
        ecgData: dataArray
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to connect to the API. Make sure the Flask server is running.');
    } finally {
      setLoading(false);
    }
  };

  const loadSampleData = () => {
    const sampleData = [
      -0.14, -0.13, -0.12, -0.11, -0.10, -0.09, -0.08, -0.07, -0.06, -0.05,
      -0.04, -0.03, -0.02, -0.01, 0.00, 0.01, 0.02, 0.03, 0.04, 0.05,
      0.06, 0.07, 0.08, 0.09, 0.10, 0.11, 0.12, 0.13, 0.14, 0.15,
      0.16, 0.17, 0.18, 0.19, 0.20, 0.21, 0.22, 0.23, 0.24, 0.25,
      0.26, 0.27, 0.28, 0.29, 0.30, 0.31, 0.32, 0.33, 0.34, 0.35,
      0.36, 0.37, 0.38, 0.39, 0.40, 0.41, 0.42, 0.43, 0.44, 0.45,
      0.46, 0.47, 0.48, 0.49, 0.50, 0.51, 0.52, 0.53, 0.54, 0.55,
      0.56, 0.57, 0.58, 0.59, 0.60, 0.61, 0.62, 0.63, 0.64, 0.65,
      0.66, 0.67, 0.68, 0.69, 0.70, 0.71, 0.72, 0.73, 0.74, 0.75,
      0.76, 0.77, 0.78, 0.79, 0.80, 0.81, 0.82, 0.83, 0.84, 0.85,
      0.86, 0.87, 0.88, 0.89, 0.90, 0.91, 0.92, 0.93, 0.94, 0.95,
      0.96, 0.97, 0.98, 0.99, 1.00, 0.99, 0.98, 0.97, 0.96, 0.95,
      0.94, 0.93, 0.92, 0.91, 0.90, 0.89, 0.88, 0.87, 0.86, 0.85,
      0.84, 0.83, 0.82, 0.81, 0.80, 0.79, 0.78, 0.77, 0.76, 0.75,
      0.74, 0.73, 0.72, 0.71, 0.70, 0.69, 0.68, 0.67, 0.66, 0.65,
      0.64, 0.63, 0.62, 0.61, 0.60, 0.59, 0.58, 0.57, 0.56, 0.55,
      0.54, 0.53, 0.52, 0.51, 0.50, 0.49, 0.48, 0.47, 0.46, 0.45,
      0.44, 0.43, 0.42, 0.41, 0.40, 0.39, 0.38, 0.37, 0.36, 0.35,
      0.34, 0.33, 0.32, 0.31, 0.30, 0.29, 0.28, 0.27
    ];
    setEcgData(sampleData.join(', '));
  };

  const clearData = () => {
    setEcgData('');
    setPrediction(null);
    setError('');
  };

  const handleImagesProcessed = async (base64Images) => {
    setError('');
    setPrediction(null);
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/predict_from_images`, {
        images: base64Images
      });

      setPrediction({
        ...response.data,
        ecgData: response.data.extracted_data
      });
      
      return response.data; // Return response for ImageUpload component
    } catch (err) {
      setError(
        err.response?.data?.error || 
        'Failed to process images. Please ensure you upload valid ECG images.'
      );
      throw err; // Re-throw for ImageUpload to handle
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <div className="container">
        <header className="app-header">
          <h1>🫀 ECG Myocardial Infarction Detection</h1>
          <p>AI-Powered Heart Attack Detection using Deep Learning</p>
          {apiStatus && (
            <div className={`api-status ${apiStatus.status === 'healthy' ? 'online' : 'offline'}`}>
              API Status: {apiStatus.status === 'healthy' ? '🟢 Online' : '🔴 Offline'}
              {apiStatus.model_loaded && ' | Model: ✅ Loaded'}
            </div>
          )}
        </header>

        <div className="main-content">
          <div className="input-section">
            <h2>Input ECG Data</h2>
            
            <div className="input-mode-selector">
              <button
                type="button"
                className={`mode-btn ${inputMode === 'text' ? 'active' : ''}`}
                onClick={() => setInputMode('text')}
              >
                📝 Text Input
              </button>
              <button
                type="button"
                className={`mode-btn ${inputMode === 'image' ? 'active' : ''}`}
                onClick={() => setInputMode('image')}
              >
                🖼️ Image Upload
              </button>
            </div>

            {inputMode === 'text' ? (
              <>
                <p className="instruction">
                  Enter 187 comma-separated values representing ECG readings
                </p>
                
                <form onSubmit={handleSubmit}>
                  <textarea
                    className="ecg-input"
                    value={ecgData}
                    onChange={(e) => setEcgData(e.target.value)}
                    placeholder="Example: -0.14, -0.13, -0.12, -0.11, 0.10, 0.11, 0.12, ... (187 values total)"
                    rows="8"
                  />
                  
                  <div className="button-group">
                    <button type="button" onClick={loadSampleData} className="btn-secondary">
                      Load Sample Data
                    </button>
                    <button type="button" onClick={clearData} className="btn-secondary">
                      Clear
                    </button>
                    <button type="submit" className="btn-primary" disabled={loading || !ecgData}>
                      {loading ? 'Analyzing...' : 'Predict'}
                    </button>
                  </div>
                </form>

                {error && (
                  <div className="error-message">
                    ⚠️ {error}
                  </div>
                )}
              </>
            ) : (
              <ImageUpload onImagesProcessed={handleImagesProcessed} />
            )}

            {loading && inputMode === 'image' && (
              <div className="loading-message">
                ⏳ Processing images and analyzing...
              </div>
            )}
          </div>

          {prediction && (
            <div className="results-section">
              <PredictionResult prediction={prediction} />
              <ECGChart data={prediction.ecgData} />
            </div>
          )}

          {!prediction && !error && (
            <div className="placeholder">
              <div className="placeholder-icon">📊</div>
              <p>Enter ECG data or upload images and click "Predict" to see results</p>
            </div>
          )}
        </div>

        <footer className="app-footer">
          <p>Powered by Convolutional Neural Networks | Accuracy: ~98.8%</p>
          <p className="info-text">
            0 = Normal ECG | 1 = Abnormal (Myocardial Infarction)
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;
