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

      if (dataArray.length !== 188) {
        setError(`Please enter exactly 188 values. You entered ${dataArray.length} values.`);
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
      1.000000000000000000e+00, 7.946814894676208496e-01, 3.753865063190460205e-01, 1.168831139802932739e-01, 0.000000000000000000e+00,
      1.719233095645904541e-01, 2.838589847087860107e-01, 2.937538623809814453e-01, 3.259121775627136230e-01, 3.450834751129150391e-01,
      3.617810904979705811e-01, 3.623995184898376465e-01, 3.661100864410400391e-01, 3.679653704166412354e-01, 3.741496503353118896e-01,
      3.778602480888366699e-01, 3.821892440319061279e-01, 3.846629559993743896e-01, 3.988868296146392822e-01, 4.013605415821075439e-01,
      4.180581271648406982e-01, 4.434137344360351562e-01, 4.576376080513000488e-01, 4.879406392574310303e-01, 5.207173824310302734e-01,
      5.596784353256225586e-01, 6.042053103446960449e-01, 6.345083713531494141e-01, 6.536796689033508301e-01, 6.728509664535522461e-01,
      6.784168481826782227e-01, 6.604823470115661621e-01, 6.215213537216186523e-01, 5.559678673744201660e-01, 4.823747575283050537e-01,
      4.384663105010986328e-01, 3.784786760807037354e-01, 3.512677848339080811e-01, 3.197278976440429688e-01, 3.067408800125122070e-01,
      2.956091463565826416e-01, 2.931354343891143799e-01, 2.918985784053802490e-01, 2.925170063972473145e-01, 2.789115607738494873e-01,
      2.789115607738494873e-01, 2.807668447494506836e-01, 2.807668447494506836e-01, 2.857142984867095947e-01, 2.745825648307800293e-01,
      2.752009928226470947e-01, 2.739641368389129639e-01, 2.844774127006530762e-01, 2.764378488063812256e-01, 2.752009928226470947e-01,
      2.776747047901153564e-01, 2.795299887657165527e-01, 2.826221287250518799e-01, 2.795299887657165527e-01, 2.733457088470458984e-01,
      2.683982551097869873e-01, 2.690166831016540527e-01, 2.677798271179199219e-01, 2.572665512561798096e-01, 2.523190975189208984e-01,
      2.529375255107879639e-01, 2.572665512561798096e-01, 2.498453855514526367e-01, 2.510822415351867676e-01, 2.510822415351867676e-01,
      2.498453855514526367e-01, 2.418058067560195923e-01, 2.411873787641525269e-01, 2.436611056327819824e-01, 2.448979616165161133e-01,
      2.393320947885513306e-01, 2.418058067560195923e-01, 2.387136667966842651e-01, 2.424242496490478516e-01, 2.411873787641525269e-01,
      2.306740880012512207e-01, 2.325293719768524170e-01, 2.282003760337829590e-01, 2.374768108129501343e-01, 2.430426776409149170e-01,
      2.436611056327819824e-01, 2.430426776409149170e-01, 2.690166831016540527e-01, 2.634508311748504639e-01, 2.906617224216461182e-01,
      2.764378488063812256e-01, 2.782931327819824219e-01, 2.517006695270538330e-01, 2.566481232643127441e-01, 2.523190975189208984e-01,
      2.461348176002502441e-01, 2.467532455921173096e-01, 2.380952388048171997e-01, 2.207792252302169800e-01, 2.306740880012512207e-01,
      2.356215268373489380e-01, 2.461348176002502441e-01, 2.442795336246490479e-01, 2.504638135433197021e-01, 2.585034072399139404e-01,
      2.560296952724456787e-01, 3.469387888908386230e-01, 4.168212711811065674e-01, 5.170068144798278809e-01, 8.695114254951477051e-01,
      9.845392704010009766e-01, 5.553494095802307129e-01, 2.418058067560195923e-01, 3.092145919799804688e-02, 4.452690109610557556e-02,
      2.275819480419158936e-01, 2.683982551097869873e-01, 2.813852727413177490e-01, 3.166357576847076416e-01, 3.259121775627136230e-01,
      3.314780592918395996e-01, 3.395176231861114502e-01, 3.487940728664398193e-01, 3.469387888908386230e-01, 3.444650471210479736e-01,
      3.500309288501739502e-01, 3.593073487281799316e-01, 3.667285144329071045e-01, 3.766233623027801514e-01, 3.858998119831085205e-01,
      3.976499736309051514e-01, 4.168212711811065674e-01, 0.000000000000000000e+00, 0.000000000000000000e+00, 0.000000000000000000e+00,
      0.000000000000000000e+00, 0.000000000000000000e+00, 0.000000000000000000e+00, 0.000000000000000000e+00, 0.000000000000000000e+00,
      0.000000000000000000e+00, 0.000000000000000000e+00, 0.000000000000000000e+00, 0.000000000000000000e+00, 0.000000000000000000e+00,
      0.000000000000000000e+00, 0.000000000000000000e+00, 0.000000000000000000e+00, 0.000000000000000000e+00, 0.000000000000000000e+00,
      0.000000000000000000e+00, 0.000000000000000000e+00, 0.000000000000000000e+00, 0.000000000000000000e+00, 0.000000000000000000e+00,
      0.000000000000000000e+00, 0.000000000000000000e+00, 0.000000000000000000e+00, 0.000000000000000000e+00, 0.000000000000000000e+00,
      0.000000000000000000e+00, 0.000000000000000000e+00, 0.000000000000000000e+00, 0.000000000000000000e+00, 0.000000000000000000e+00,
      0.000000000000000000e+00, 0.000000000000000000e+00, 0.000000000000000000e+00, 0.000000000000000000e+00, 0.000000000000000000e+00,
      0.000000000000000000e+00, 0.000000000000000000e+00, 0.000000000000000000e+00, 0.000000000000000000e+00, 0.000000000000000000e+00,
      0.000000000000000000e+00, 0.000000000000000000e+00, 0.000000000000000000e+00, 0.000000000000000000e+00, 0.000000000000000000e+00,
      0.000000000000000000e+00, 0.000000000000000000e+00, 0.000000000000000000e+00, 0.000000000000000000e+00, 0.000000000000000000e+00,
      0.000000000000000000e+00, 0.000000000000000000e+00, 0.000000000000000000e+00
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
                  Enter 188 comma-separated values representing ECG readings
                </p>
                
                <form onSubmit={handleSubmit}>
                  <textarea
                    className="ecg-input"
                    value={ecgData}
                    onChange={(e) => setEcgData(e.target.value)}
                    placeholder="Example: -0.14, -0.13, -0.12, -0.11, 0.10, 0.11, 0.12, ... (188 values total)"
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
