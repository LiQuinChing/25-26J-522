import React from 'react';
import './PredictionResult.css';

function PredictionResult({ prediction }) {
  const isAbnormal = prediction.prediction === 1;
  const confidencePercent = (prediction.confidence * 100).toFixed(2);

  return (
    <div className="prediction-result">
      <h2>Prediction Results</h2>
      
      <div className={`result-card ${isAbnormal ? 'abnormal' : 'normal'}`}>
        <div className="result-icon">
          {isAbnormal ? '⚠️' : '✅'}
        </div>
        <div className="result-details">
          <h3 className="result-title">{prediction.result}</h3>
          <p className="result-subtitle">
            {isAbnormal 
              ? 'Myocardial Infarction Detected' 
              : 'No Abnormalities Detected'}
          </p>
        </div>
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-label">Prediction</div>
          <div className="metric-value">{prediction.prediction}</div>
          <div className="metric-description">
            {isAbnormal ? 'Abnormal' : 'Normal'}
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Confidence</div>
          <div className="metric-value">{confidencePercent}%</div>
          <div className="confidence-bar">
            <div 
              className="confidence-fill" 
              style={{ 
                width: `${confidencePercent}%`,
                backgroundColor: isAbnormal ? '#f44336' : '#4caf50'
              }}
            />
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Classification</div>
          <div className="metric-value">
            {isAbnormal ? 'Class 1' : 'Class 0'}
          </div>
          <div className="metric-description">
            Binary Classification
          </div>
        </div>
      </div>

      {isAbnormal && (
        <div className="warning-box">
          <h4>⚠️ Medical Alert</h4>
          <p>
            This prediction indicates potential myocardial infarction (heart attack). 
            Please consult with a healthcare professional immediately for proper diagnosis and treatment.
          </p>
          <p className="disclaimer">
            <strong>Disclaimer:</strong> This is an AI prediction tool and should not be used as a 
            substitute for professional medical advice, diagnosis, or treatment.
          </p>
        </div>
      )}

      {!isAbnormal && (
        <div className="success-box">
          <h4>✅ Normal ECG Pattern</h4>
          <p>
            The analysis indicates a normal ECG pattern with no signs of myocardial infarction.
          </p>
          <p className="disclaimer">
            <strong>Note:</strong> Regular health check-ups are still recommended for maintaining 
            cardiovascular health.
          </p>
        </div>
      )}
    </div>
  );
}

export default PredictionResult;
