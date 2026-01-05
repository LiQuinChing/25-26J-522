import React, { useState } from 'react';
import './ImageUpload.css';

function ImageUpload({ onImagesProcessed }) {
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');
  const [invalidImages, setInvalidImages] = useState([]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length > 12) {
      setError('Maximum 12 images allowed');
      return;
    }

    // Validate file types
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    const invalidFiles = files.filter(file => !validTypes.includes(file.type));
    
    if (invalidFiles.length > 0) {
      setError('Only JPG and PNG images are allowed');
      return;
    }

    setError('');
    setWarning('');
    setInvalidImages([]);
    setImages(files);

    // Create previews
    const previewUrls = files.map(file => URL.createObjectURL(file));
    setPreviews(previewUrls);
  };

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  const handleUpload = async () => {
    if (images.length === 0) {
      setError('Please select at least one image');
      return;
    }

    setLoading(true);
    setError('');
    setWarning('');
    setInvalidImages([]);

    try {
      // Convert all images to base64
      const base64Images = await Promise.all(
        images.map(img => convertToBase64(img))
      );

      // Send to parent component
      const response = await onImagesProcessed(base64Images);
      
      // Check for warnings or invalid images in response
      if (response && response.warning) {
        setWarning(response.warning);
        setInvalidImages(response.invalid_images || []);
      }
      
    } catch (err) {
      if (err.response && err.response.data) {
        const errorData = err.response.data;
        
        if (errorData.details) {
          setError(errorData.error || 'Invalid ECG images detected');
          setInvalidImages(errorData.details);
        } else {
          setError(errorData.error || 'Error processing images');
        }
        
        if (errorData.help) {
          setWarning(errorData.help);
        }
      } else {
        setError('Error processing images: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const clearImages = () => {
    setImages([]);
    setPreviews([]);
    setError('');
    setWarning('');
    setInvalidImages([]);
  };

  return (
    <div className="image-upload">
      <h3>📸 Upload ECG Images</h3>
      <p className="upload-description">
        Upload up to 12 ECG images (JPG, PNG) - they will be converted to signal data
      </p>
      
      <div className="upload-instructions">
        <h4>✅ Valid ECG Images Should Have:</h4>
        <ul>
          <li>Clear ECG wave patterns (P, QRS, T waves)</li>
          <li>Grid lines or graph paper background</li>
          <li>Horizontal orientation (wider than tall)</li>
          <li>Good contrast and clarity</li>
        </ul>
        <p className="warning-text">⚠️ Photos of people, documents, or other non-ECG images will be rejected</p>
      </div>

      <div className="upload-controls">
        <label className="file-input-label">
          <input
            type="file"
            accept="image/jpeg,image/jpg,image/png"
            multiple
            onChange={handleFileChange}
            className="file-input"
          />
          <span className="file-input-button">
            📁 Choose ECG Images
          </span>
        </label>

        {images.length > 0 && (
          <div className="upload-actions">
            <span className="image-count">
              {images.length} image{images.length > 1 ? 's' : ''} selected
            </span>
            <button onClick={handleUpload} className="btn-upload" disabled={loading}>
              {loading ? '⏳ Processing...' : '🚀 Upload & Analyze'}
            </button>
            <button onClick={clearImages} className="btn-clear">
              Clear
            </button>
          </div>
        )}
      </div>

      {previews.length > 0 && (
        <div className="image-previews">
          {previews.map((preview, index) => (
            <div key={index} className="preview-item">
              <img src={preview} alt={`ECG ${index + 1}`} />
              <span className="preview-label">Image {index + 1}</span>
            </div>
          ))}
        </div>
      )}

      {warning && (
        <div className="upload-warning">
          ⚠️ {warning}
        </div>
      )}

      {invalidImages.length > 0 && (
        <div className="invalid-images-list">
          <h4>❌ Rejected Images:</h4>
          <ul>
            {invalidImages.map((item, idx) => (
              <li key={idx}>
                <strong>Image {item.image_number}:</strong> {item.error}
              </li>
            ))}
          </ul>
        </div>
      )}

      {error && (
        <div className="upload-error">
          ⚠️ {error}
        </div>
      )}
    </div>
  );
}

export default ImageUpload;
