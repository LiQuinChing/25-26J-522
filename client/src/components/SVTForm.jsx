import React, { useState } from 'react';
import './SVTForm.css';

function SVTForm({
  onSubmit,
  onCsvSubmit,
  onImageConvert,
  onImageSubmit,
  loading,
  loadingAction,
  onReset,
  hasResult,
}) {
  const [mode, setMode] = useState('manual');
  const [formData, setFormData] = useState({
    heart_rate_bpm: '',
    pr_interval_s: '',
    qrs_duration_s: '',
    rr_regularity: 'regular',
    p_wave_presence: false,
  });
  const [csvFile, setCsvFile] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imageLayout, setImageLayout] = useState('Standard 3x4');
  const [sampleRateHz, setSampleRateHz] = useState('500');
  const [conversionMessage, setConversionMessage] = useState('');

  const isBusy = loading;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      heart_rate_bpm: parseFloat(formData.heart_rate_bpm),
      pr_interval_s: parseFloat(formData.pr_interval_s),
      qrs_duration_s: parseFloat(formData.qrs_duration_s),
      rr_regularity: formData.rr_regularity,
      p_wave_presence: formData.p_wave_presence,
    });
  };

  const handleCsvSubmit = (e) => {
    e.preventDefault();
    if (!csvFile) return;
    onCsvSubmit({
      csvFile,
      sampleRateHz: sampleRateHz ? parseFloat(sampleRateHz) : undefined,
    });
  };

  const handleImageConvert = async () => {
    if (!imageFile) return;
    const result = await onImageConvert({
      imageFile,
      layout: imageLayout,
      sampleRateHz: sampleRateHz ? parseFloat(sampleRateHz) : undefined,
    });

    if (result?.file) {
      setCsvFile(result.file);
      setMode('csv');
      setConversionMessage(`${result.file.name} is ready for SVT prediction. ${result.message || ''}`.trim());
    }
  };

  const handleImageSubmit = () => {
    if (!imageFile) return;
    onImageSubmit({
      imageFile,
      layout: imageLayout,
      sampleRateHz: sampleRateHz ? parseFloat(sampleRateHz) : undefined,
    });
  };

  const handleReset = () => {
    setFormData({
      heart_rate_bpm: '',
      pr_interval_s: '',
      qrs_duration_s: '',
      rr_regularity: 'regular',
      p_wave_presence: false,
    });
    setCsvFile(null);
    setImageFile(null);
    setConversionMessage('');
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
      },
    };

    setFormData(examples[type]);
    onReset();
  };

  const renderSpinnerText = (action, fallback) => (
    loadingAction === action ? (
      <>
        <span className="spinner"></span>
        {fallback}
      </>
    ) : null
  );

  return (
    <div className="svt-form">
      <div className="svt-tabs" role="tablist" aria-label="SVT input mode">
        <button
          type="button"
          className={`svt-tab ${mode === 'manual' ? 'active' : ''}`}
          onClick={() => setMode('manual')}
          disabled={isBusy}
        >
          <span className="material-symbols-outlined">monitor_heart</span>
          Clinical Values
        </button>
        <button
          type="button"
          className={`svt-tab ${mode === 'csv' ? 'active' : ''}`}
          onClick={() => setMode('csv')}
          disabled={isBusy}
        >
          <span className="material-symbols-outlined">upload_file</span>
          CSV Upload
        </button>
        <button
          type="button"
          className={`svt-tab ${mode === 'image' ? 'active' : ''}`}
          onClick={() => setMode('image')}
          disabled={isBusy}
        >
          <span className="material-symbols-outlined">add_photo_alternate</span>
          ECG Image
        </button>
      </div>

      {mode === 'manual' && (
        <form onSubmit={handleSubmit} className="form-content">
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
                SVT Pattern
              </button>
              <button type="button" onClick={() => loadExample('healthy')} className="btn-example">
                Healthy
              </button>
              <button type="button" onClick={() => loadExample('irregular')} className="btn-example">
                Irregular
              </button>
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={isBusy}>
              {renderSpinnerText('manual', 'Analyzing...') || (
                <>
                  <span className="material-symbols-outlined">vital_signs</span>
                  Predict SVT
                </>
              )}
            </button>

            {hasResult && (
              <button type="button" onClick={handleReset} className="btn-secondary">
                <span className="material-symbols-outlined">restart_alt</span>
                Reset
              </button>
            )}
          </div>
        </form>
      )}

      {mode === 'csv' && (
        <form onSubmit={handleCsvSubmit} className="form-content upload-panel">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="csv_file">
                ECG CSV File *
                <span className="field-hint">Clinical values, MIT-BIH features, or digitized time series</span>
              </label>
              <input
                type="file"
                id="csv_file"
                accept=".csv,text/csv"
                onChange={(event) => setCsvFile(event.target.files?.[0] || null)}
                required={!csvFile}
              />
              {csvFile && <p className="selected-file">{csvFile.name}</p>}
            </div>

            <div className="form-group">
              <label htmlFor="sample_rate_hz">
                Sample Rate for Digitized CSV
                <span className="field-hint">Used only when CSV has ECG signal samples</span>
              </label>
              <input
                type="number"
                id="sample_rate_hz"
                value={sampleRateHz}
                onChange={(event) => setSampleRateHz(event.target.value)}
                min="50"
                max="1000"
                step="1"
              />
            </div>
          </div>

          {conversionMessage && <div className="conversion-message">{conversionMessage}</div>}

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={isBusy || !csvFile}>
              {renderSpinnerText('csv', 'Analyzing CSV...') || (
                <>
                  <span className="material-symbols-outlined">analytics</span>
                  Predict From CSV
                </>
              )}
            </button>
            {hasResult && (
              <button type="button" onClick={handleReset} className="btn-secondary">
                <span className="material-symbols-outlined">restart_alt</span>
                Reset
              </button>
            )}
          </div>
        </form>
      )}

      {mode === 'image' && (
        <div className="form-content upload-panel">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="image_file">
                ECG Image *
                <span className="field-hint">PNG, JPG, or JPEG</span>
              </label>
              <input
                type="file"
                id="image_file"
                accept="image/png,image/jpeg,image/jpg"
                onChange={(event) => setImageFile(event.target.files?.[0] || null)}
              />
              {imageFile && <p className="selected-file">{imageFile.name}</p>}
            </div>

            <div className="form-group">
              <label htmlFor="image_layout">
                ECG Layout
                <span className="field-hint">Used by Open ECG Digitizer when available</span>
              </label>
              <select
                id="image_layout"
                value={imageLayout}
                onChange={(event) => setImageLayout(event.target.value)}
              >
                <option value="Standard 3x4">Standard 3x4</option>
                <option value="Standard 6x2">Standard 6x2</option>
              </select>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={handleImageConvert} disabled={isBusy || !imageFile}>
              {renderSpinnerText('convert', 'Converting...') || (
                <>
                  <span className="material-symbols-outlined">table_chart</span>
                  Convert to CSV
                </>
              )}
            </button>
            <button type="button" className="btn-primary" onClick={handleImageSubmit} disabled={isBusy || !imageFile}>
              {renderSpinnerText('image', 'Converting and analyzing...') || (
                <>
                  <span className="material-symbols-outlined">monitor_heart</span>
                  Predict From Image
                </>
              )}
            </button>
            {hasResult && (
              <button type="button" onClick={handleReset} className="btn-secondary compact">
                <span className="material-symbols-outlined">restart_alt</span>
                Reset
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default SVTForm;
