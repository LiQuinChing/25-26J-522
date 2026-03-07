import React, { useState } from 'react';
import './SVTForm.css';

function SVTForm({ onSubmit, loading, onReset, hasResult }) {
  const [formData, setFormData] = useState({
    heart_rate_bpm: '',
    pr_interval_s: '',
    qrs_duration_s: '',
    rr_regularity: 'regular',
    p_wave_presence: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Convert numeric strings to numbers
    const submitData = {
      heart_rate_bpm: parseFloat(formData.heart_rate_bpm),
      pr_interval_s: parseFloat(formData.pr_interval_s),
      qrs_duration_s: parseFloat(formData.qrs_duration_s),
      rr_regularity: formData.rr_regularity,
      p_wave_presence: formData.p_wave_presence,
    };

    onSubmit(submitData);
  };

  const handleReset = () => {
    setFormData({
      heart_rate_bpm: '',
      pr_interval_s: '',
      qrs_duration_s: '',
      rr_regularity: 'regular',
      p_wave_presence: false,
    });
    onReset();
  };

  const loadExample = (type) => {
    const examples = {
      svt: {
        heart_rate_bpm: '180',
        pr_interval_s: '0.10',
        qrs_duration_s: '0.08',
        rr_regularity: 'regular',
        p_wave_presence: false,
      },
      healthy: {
        heart_rate_bpm: '75',
        pr_interval_s: '0.16',
        qrs_duration_s: '0.08',
        rr_regularity: 'regular',
        p_wave_presence: true,
      },
      irregular: {
        heart_rate_bpm: '150',
        pr_interval_s: '0.14',
        qrs_duration_s: '0.09',
        rr_regularity: 'irregular',
        p_wave_presence: true,
      }
    };

    setFormData(examples[type]);
    onReset();
  };

  return (
    <form onSubmit={handleSubmit} className="svt-form">
      <div className="form-content">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="heart_rate_bpm">
              Heart Rate (bpm) *
              <span className="field-hint">Normal: 60-100</span>
            </label>
            <input
              type="number"
              id="heart_rate_bpm"
              name="heart_rate_bpm"
              value={formData.heart_rate_bpm}
              onChange={handleChange}
              min="30"
              max="240"
              step="1"
              required
              placeholder="e.g., 75"
            />
          </div>

          <div className="form-group">
            <label htmlFor="pr_interval_s">
              PR Interval (seconds) *
              <span className="field-hint">Normal: 0.12-0.20</span>
            </label>
            <input
              type="number"
              id="pr_interval_s"
              name="pr_interval_s"
              value={formData.pr_interval_s}
              onChange={handleChange}
              min="0.06"
              max="0.35"
              step="0.01"
              required
              placeholder="e.g., 0.16"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="qrs_duration_s">
              QRS Duration (seconds) *
              <span className="field-hint">Normal: 0.06-0.10</span>
            </label>
            <input
              type="number"
              id="qrs_duration_s"
              name="qrs_duration_s"
              value={formData.qrs_duration_s}
              onChange={handleChange}
              min="0.04"
              max="0.25"
              step="0.01"
              required
              placeholder="e.g., 0.08"
            />
          </div>

          <div className="form-group">
            <label htmlFor="rr_regularity">
              RR Regularity *
              <span className="field-hint">Rhythm pattern</span>
            </label>
            <select
              id="rr_regularity"
              name="rr_regularity"
              value={formData.rr_regularity}
              onChange={handleChange}
              required
            >
              <option value="regular">Regular</option>
              <option value="irregular">Irregular</option>
            </select>
          </div>
        </div>

        <div className="form-group checkbox-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="p_wave_presence"
              checked={formData.p_wave_presence}
              onChange={handleChange}
            />
            <span className="checkbox-text">
              P-Wave Present
              <span className="field-hint">Visible P-wave on ECG</span>
            </span>
          </label>
        </div>

        <div className="example-buttons">
          <p className="example-label">Quick Examples:</p>
          <div className="button-group">
            <button type="button" onClick={() => loadExample('svt')} className="btn-example">
              📈 SVT Pattern
            </button>
            <button type="button" onClick={() => loadExample('healthy')} className="btn-example">
              ✅ Healthy
            </button>
            <button type="button" onClick={() => loadExample('irregular')} className="btn-example">
              ⚡ Irregular
            </button>
          </div>
        </div>

        <div className="form-actions">
          <button 
            type="submit" 
            className="btn-primary" 
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Analyzing...
              </>
            ) : (
              <>
                🔍 Predict SVT
              </>
            )}
          </button>

          {hasResult && (
            <button 
              type="button" 
              onClick={handleReset} 
              className="btn-secondary"
            >
              🔄 Reset
            </button>
          )}
        </div>
      </div>
    </form>
  );
}

export default SVTForm;
