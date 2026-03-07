import React from 'react';
import './SVTResultDisplay.css';

function SVTResultDisplay({ result }) {
  if (!result || !result.prediction) return null;

  const { label, svt_probability, decision_threshold, messages } = result.prediction;
  const isSVT = label === 'SVT';
  const probability = (svt_probability * 100).toFixed(1);

  const getConfidenceLevel = (prob) => {
    if (prob < 0.3) return 'Low';
    if (prob < 0.7) return 'Moderate';
    return 'High';
  };

  const confidence = getConfidenceLevel(svt_probability);

  const renderMessages = () => {
    if (!messages || messages.length === 0) return null;

    return (
      <div className="messages-section">
        <h4>Clinical Notes:</h4>
        <ul className="message-list">
          {messages.map((msg, index) => {
            let icon = 'ℹ️';
            let className = 'info';

            if (msg.startsWith('ERROR:')) {
              icon = '❌';
              className = 'error';
            } else if (msg.startsWith('WARN:')) {
              icon = '⚠️';
              className = 'warning';
            }

            const cleanMsg = msg.replace(/^(ERROR:|WARN:|INFO:)\s*/, '');

            return (
              <li key={index} className={`message-item ${className}`}>
                <span className="message-icon">{icon}</span>
                <span>{cleanMsg}</span>
              </li>
            );
          })}
        </ul>
      </div>
    );
  };

  return (
    <div className={`result-display ${isSVT ? 'svt-detected' : 'healthy-detected'}`}>
      <div className="result-header">
        <div className="result-icon">
          {isSVT ? '⚡' : '✅'}
        </div>
        <div className="result-title">
          <h3>Prediction Result</h3>
          <p className="result-label">{label}</p>
        </div>
      </div>

      <div className="result-metrics">
        <div className="metric-card">
          <div className="metric-label">SVT Probability</div>
          <div className="metric-value">{probability}%</div>
          <div className="probability-bar">
            <div 
              className="probability-fill" 
              style={{ width: `${probability}%` }}
            ></div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Confidence Level</div>
          <div className={`metric-value confidence-${confidence.toLowerCase()}`}>
            {confidence}
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Decision Threshold</div>
          <div className="metric-value small">
            {(decision_threshold * 100).toFixed(1)}%
          </div>
          <div className="threshold-note">
            {svt_probability >= decision_threshold 
              ? '✓ Above threshold → SVT'
              : '✓ Below threshold → Healthy'
            }
          </div>
        </div>
      </div>

      {renderMessages()}

      <div className="result-interpretation">
        <h4>Interpretation:</h4>
        <div className="interpretation-content">
          {isSVT ? (
            <>
              <p className="interpretation-main">
                <strong>SVT Pattern Detected</strong>
              </p>
              <p>
                The model identified a pattern consistent with Supraventricular Tachycardia 
                with a probability of {probability}%. This exceeds the decision threshold of{' '}
                {(decision_threshold * 100).toFixed(1)}%.
              </p>
              <div className="recommendation svt">
                <strong>⚠️ Recommendation:</strong> Immediate clinical evaluation recommended. 
                This is a machine learning prediction and should not replace professional medical judgment.
              </div>
            </>
          ) : (
            <>
              <p className="interpretation-main">
                <strong>No SVT Detected</strong>
              </p>
              <p>
                The model predicts a normal rhythm with an SVT probability of {probability}%. 
                This is below the decision threshold of {(decision_threshold * 100).toFixed(1)}%.
              </p>
              <div className="recommendation healthy">
                <strong>✅ Note:</strong> Pattern appears consistent with normal sinus rhythm. 
                However, clinical correlation is always recommended.
              </div>
            </>
          )}
        </div>
      </div>

      <div className="input-summary">
        <h4>Input Parameters:</h4>
        <div className="input-grid">
          <div className="input-item">
            <span className="input-label">Heart Rate:</span>
            <span className="input-value">{result.input.heart_rate_bpm} bpm</span>
          </div>
          <div className="input-item">
            <span className="input-label">PR Interval:</span>
            <span className="input-value">{result.input.pr_interval_s} s</span>
          </div>
          <div className="input-item">
            <span className="input-label">QRS Duration:</span>
            <span className="input-value">{result.input.qrs_duration_s} s</span>
          </div>
          <div className="input-item">
            <span className="input-label">RR Regularity:</span>
            <span className="input-value">{result.input.rr_regularity}</span>
          </div>
          <div className="input-item">
            <span className="input-label">P-Wave:</span>
            <span className="input-value">
              {result.input.p_wave_presence ? 'Present' : 'Absent'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SVTResultDisplay;
