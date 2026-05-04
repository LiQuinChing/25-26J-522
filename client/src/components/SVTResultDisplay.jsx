import React from 'react';
import './SVTResultDisplay.css';

function SVTResultDisplay({ result }) {
  if (!result || !result.prediction) return null;

  const { label, svt_probability, decision_threshold, messages } = result.prediction;
  const isSVT = label === 'SVT';
  const probabilityValue = Math.max(0, Math.min(100, svt_probability * 100));
  const probability = probabilityValue.toFixed(1);
  const csvAnalysis = result.csv_analysis;
  const input = result.input || {};

  const getConfidenceLevel = (prob) => {
    if (prob < 0.3) return 'Low';
    if (prob < 0.7) return 'Moderate';
    return 'High';
  };

  const confidence = getConfidenceLevel(svt_probability);

  const messageIcon = (msg) => {
    if (msg.startsWith('ERROR:')) return 'error';
    if (msg.startsWith('WARN:')) return 'warning';
    return 'info';
  };

  const renderMessages = () => {
    if (!messages || messages.length === 0) return null;

    return (
      <div className="messages-section">
        <h4>Clinical Notes</h4>
        <ul className="message-list">
          {messages.map((msg, index) => {
            const className = msg.startsWith('ERROR:') ? 'error' : msg.startsWith('WARN:') ? 'warning' : 'info';
            const cleanMsg = msg.replace(/^(ERROR:|WARN:|INFO:)\s*/, '');

            return (
              <li key={index} className={`message-item ${className}`}>
                <span className="material-symbols-outlined message-icon">{messageIcon(msg)}</span>
                <span>{cleanMsg}</span>
              </li>
            );
          })}
        </ul>
      </div>
    );
  };

  const renderCsvAnalysis = () => {
    if (!csvAnalysis) return null;
    const rows = csvAnalysis.row_predictions?.slice(0, 5) || [];

    return (
      <div className="csv-analysis">
        <h4>CSV Analysis</h4>
        <div className="input-grid">
          <div className="input-item">
            <span className="input-label">Source</span>
            <span className="input-value">{csvAnalysis.source || 'CSV'}</span>
          </div>
          <div className="input-item">
            <span className="input-label">Rows Used</span>
            <span className="input-value">{csvAnalysis.sample_count}</span>
          </div>
          <div className="input-item">
            <span className="input-label">SVT Rows</span>
            <span className="input-value">{csvAnalysis.svt_count}</span>
          </div>
          <div className="input-item">
            <span className="input-label">Max Probability</span>
            <span className="input-value">{(csvAnalysis.max_probability * 100).toFixed(1)}%</span>
          </div>
        </div>

        {rows.length > 0 && (
          <div className="row-preview">
            <table>
              <thead>
                <tr>
                  <th>Row</th>
                  <th>Label</th>
                  <th>SVT %</th>
                  <th>HR</th>
                  <th>QRS</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.row_index}>
                    <td>{row.row_index + 1}</td>
                    <td>{row.label}</td>
                    <td>{(row.svt_probability * 100).toFixed(1)}</td>
                    <td>{row.heart_rate_bpm.toFixed(0)}</td>
                    <td>{row.qrs_duration_s.toFixed(3)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`result-display ${isSVT ? 'svt-detected' : 'healthy-detected'}`}>
      <div className="result-header">
        <div className="result-icon">
          <span className="material-symbols-outlined">{isSVT ? 'warning' : 'check_circle'}</span>
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
            <div className="probability-fill" style={{ width: `${probabilityValue}%` }}></div>
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
            {svt_probability >= decision_threshold ? 'Above threshold: SVT' : 'Below threshold: Healthy'}
          </div>
        </div>
      </div>

      {renderMessages()}
      {renderCsvAnalysis()}

      <div className="result-interpretation">
        <h4>Interpretation</h4>
        <div className="interpretation-content">
          {isSVT ? (
            <>
              <p className="interpretation-main">
                <strong>SVT pattern detected</strong>
              </p>
              <p>
                The model identified a pattern consistent with Supraventricular Tachycardia
                with a probability of {probability}%.
              </p>
              <div className="recommendation svt">
                <strong>Recommendation:</strong> Immediate clinical evaluation is recommended.
                This machine learning result should be reviewed by a qualified clinician.
              </div>
            </>
          ) : (
            <>
              <p className="interpretation-main">
                <strong>No SVT detected</strong>
              </p>
              <p>
                The model predicts a non-SVT rhythm with an SVT probability of {probability}%.
              </p>
              <div className="recommendation healthy">
                <strong>Note:</strong> Pattern appears below the SVT threshold. Clinical correlation
                is still recommended.
              </div>
            </>
          )}
        </div>
      </div>

      <div className="input-summary">
        <h4>Input Summary</h4>
        <div className="input-grid">
          <div className="input-item">
            <span className="input-label">Heart Rate</span>
            <span className="input-value">{Number(input.heart_rate_bpm).toFixed(0)} bpm</span>
          </div>
          <div className="input-item">
            <span className="input-label">PR Interval</span>
            <span className="input-value">{Number(input.pr_interval_s).toFixed(3)} s</span>
          </div>
          <div className="input-item">
            <span className="input-label">QRS Duration</span>
            <span className="input-value">{Number(input.qrs_duration_s).toFixed(3)} s</span>
          </div>
          <div className="input-item">
            <span className="input-label">RR Regularity</span>
            <span className="input-value">{input.rr_regularity}</span>
          </div>
          <div className="input-item">
            <span className="input-label">P-Wave</span>
            <span className="input-value">{input.p_wave_presence ? 'Present' : 'Absent'}</span>
          </div>
          {input.source && (
            <div className="input-item">
              <span className="input-label">Input Source</span>
              <span className="input-value">{input.source}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SVTResultDisplay;
