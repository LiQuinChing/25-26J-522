import React, { useState } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:5000';

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setResult(null);
      setError(null);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select an image first');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('image', selectedFile);

    try {
      const response = await axios.post(`${API_URL}/api/predict`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        setResult(response.data);
      } else {
        setError(response.data.error || 'Prediction failed');
      }
    } catch (err) {
      if (err.response?.data?.validation) {
        // Enhanced validation error with specific warnings
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
    <div className="bg-background-light font-display antialiased text-text-primary min-h-screen flex flex-col">
      {/* Top Navigation */}
      <header className="bg-surface-light border-b border-[#dcecf0] sticky top-0 z-50">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Brand */}
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary">
                <span className="material-symbols-outlined text-[24px]">cardiology</span>
              </div>
              <h1 className="text-xl font-bold tracking-tight text-accent-blue">PulseAI</h1>
            </div>
            
            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-8">
              <a className="text-sm font-medium text-primary" href="#">Dashboard</a>
              <a className="text-sm font-medium text-text-secondary hover:text-primary transition-colors" href="#">Upload</a>
              <a className="text-sm font-medium text-text-secondary hover:text-primary transition-colors" href="#">Analysis</a>
              <a className="text-sm font-medium text-text-secondary hover:text-primary transition-colors" href="#">Patients</a>
            </nav>
            
            {/* User Actions */}
            <div className="flex items-center gap-4">
              <button className="hidden md:flex items-center justify-center h-9 px-4 rounded-lg border border-primary/20 text-primary text-sm font-semibold hover:bg-primary/5 transition-colors">
                About
              </button>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent-blue flex items-center justify-center text-white font-bold shadow-sm cursor-pointer">
                AI
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow flex flex-col items-center w-full px-4 sm:px-6 py-8 sm:py-12">
        {/* Hero Section */}
        <div className="w-full max-w-4xl flex flex-col items-center text-center mb-12 space-y-6">
          <div className="bg-surface-light/80 backdrop-blur-sm px-6 py-2 rounded-full border border-white/50 shadow-sm inline-flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-primary text-sm">ecg_heart</span>
            <span className="text-accent-blue text-sm font-semibold">AI-Powered ECG Analysis</span>
          </div>
          
          <h1 className="text-3xl md:text-5xl font-black text-accent-blue tracking-tight leading-tight">
            Myocardial Infarction Detection
          </h1>
          
          <p className="text-text-secondary text-lg max-w-2xl mx-auto leading-relaxed">
            Upload an ECG image to detect signs of myocardial infarction using advanced deep learning technology.
          </p>
        </div>

        {/* Upload Card */}
        <div className="w-full max-w-4xl bg-surface-light rounded-xl shadow-lg border border-white/60 overflow-hidden">
          <div className="p-8">
            {/* Upload Box */}
            <div className="relative">
              <input
                type="file"
                id="file-input"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <label 
                htmlFor="file-input" 
                className="block cursor-pointer border-3 border-dashed border-gray-300 rounded-xl hover:border-primary hover:bg-secondary/20 transition-all duration-300 overflow-hidden"
              >
                {preview ? (
                  <div className="relative">
                    <img 
                      src={preview} 
                      alt="Preview" 
                      className="w-full h-auto max-h-[500px] object-contain"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 px-4">
                    <span className="material-symbols-outlined text-primary text-[80px] mb-4">
                      upload_file
                    </span>
                    <p className="text-text-primary text-lg font-semibold mb-2">
                      Click to upload ECG image
                    </p>
                    <p className="text-text-secondary text-sm">
                      JPG, PNG, or JPEG formats supported
                    </p>
                  </div>
                )}
              </label>
            </div>

            {/* Button Group */}
            <div className="flex gap-4 justify-center mt-8">
              <button
                onClick={handleUpload}
                disabled={!selectedFile || loading}
                className="flex items-center justify-center gap-2 px-8 py-4 bg-primary hover:bg-primary-dark text-white rounded-lg text-base font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 disabled:shadow-none"
              >
                {loading ? (
                  <>
                    <span className="material-symbols-outlined animate-spin">refresh</span>
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined">analytics</span>
                    <span>Analyze ECG</span>
                  </>
                )}
              </button>
              
              {(selectedFile || result) && (
                <button 
                  onClick={handleReset}
                  className="flex items-center justify-center gap-2 px-8 py-4 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-base font-bold transition-all shadow-md hover:shadow-lg"
                >
                  <span className="material-symbols-outlined">restart_alt</span>
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="w-full max-w-4xl mt-6">
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-start gap-4">
              <span className="material-symbols-outlined text-red-600 text-2xl">error</span>
              <div>
                <h3 className="text-red-900 font-bold mb-1">Analysis Error</h3>
                <p className="text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Result Section */}
        {result && (
          <div className="w-full max-w-4xl mt-8">
            <div className={`bg-surface-light rounded-xl shadow-lg border-l-4 ${getResultColor(result.predicted_class).border} p-8`}>
              {/* Result Header */}
              <div className="flex items-center gap-6 mb-8">
                <span className={`material-symbols-outlined text-6xl ${getResultColor(result.predicted_class).text}`}>
                  {getResultIcon(result.predicted_class)}
                </span>
                <div>
                  <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-2">
                    Diagnosis Result
                  </h2>
                  <h3 className={`text-3xl font-bold ${getResultColor(result.predicted_class).text}`}>
                    {result.predicted_class.replace('_', ' ')}
                  </h3>
                </div>
              </div>

              {/* Validation Warning */}
              {result.validation && !result.validation.is_likely_ecg && (
                <div className="mb-8 bg-amber-50 border border-amber-200 rounded-xl p-6">
                  <div className="flex items-start gap-4">
                    <span className="material-symbols-outlined text-amber-600 text-2xl">warning</span>
                    <div className="flex-1">
                      <h4 className="text-amber-900 font-bold mb-2">Warning: Image Validation Issues</h4>
                      <ul className="list-disc list-inside space-y-1 text-amber-800 text-sm mb-3">
                        {result.validation.warnings.map((warning, idx) => (
                          <li key={idx}>{warning}</li>
                        ))}
                      </ul>
                      <p className="text-amber-900 font-semibold text-sm">
                        Prediction results may be unreliable. Please upload a proper ECG image.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Confidence Section */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-3">
                  <p className="text-text-secondary font-semibold">Confidence Level</p>
                  <p className="text-accent-blue font-bold text-xl">
                    {(result.confidence * 100).toFixed(1)}%
                  </p>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                  <div
                    className={`h-full ${getResultColor(result.predicted_class).bg} transition-all duration-1000 rounded-full`}
                    style={{ width: `${result.confidence * 100}%` }}
                  />
                </div>
              </div>

              {/* All Probabilities */}
              <div>
                <h4 className="text-accent-blue font-bold text-lg mb-4">All Class Probabilities</h4>
                <div className="space-y-4">
                  {Object.entries(result.all_probabilities).map(([className, probability]) => (
                    <div key={className}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-text-primary font-medium">
                          {className.replace('_', ' ')}
                        </span>
                        <span className="text-text-secondary font-semibold">
                          {(probability * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-accent-blue transition-all duration-1000 rounded-full"
                          style={{ width: `${probability * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="mt-6 bg-gradient-to-br from-primary/10 to-accent-blue/10 rounded-xl p-6 border border-primary/20">
              <div className="flex items-start gap-4">
                <span className="material-symbols-outlined text-primary text-2xl">info</span>
                <div>
                  <h4 className="text-accent-blue font-bold mb-2">Important Disclaimer</h4>
                  <p className="text-text-secondary text-sm leading-relaxed">
                    This is a research and educational tool powered by artificial intelligence. 
                    Results should not be used for clinical diagnosis or treatment decisions. 
                    Always consult a qualified healthcare professional for medical advice and proper ECG interpretation.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-surface-light border-t border-[#dcecf0] mt-auto">
        <div className="max-w-[1280px] mx-auto px-4 py-8 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-text-secondary text-sm">© 2026 PulseAI. All rights reserved.</p>
          <div className="flex gap-6">
            <a className="text-text-secondary text-sm hover:text-primary transition-colors" href="#">Privacy Policy</a>
            <a className="text-text-secondary text-sm hover:text-primary transition-colors" href="#">Terms of Service</a>
            <a className="text-text-secondary text-sm hover:text-primary transition-colors" href="#">Contact Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
