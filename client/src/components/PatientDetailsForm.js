import React from 'react';
import './PatientDetailsForm.css';

function PatientDetailsForm({ value, onChange }) {
  const handleChange = (event) => {
    const { name, value: fieldValue } = event.target;
    onChange({
      ...value,
      [name]: fieldValue,
    });
  };

  return (
    <div className="patient-form">
      <h3>Patient Details</h3>
      <p className="subtitle">Enter patient information before ECG prediction</p>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="patient_id">Patient ID *</label>
          <input
            id="patient_id"
            name="patient_id"
            value={value.patient_id}
            onChange={handleChange}
            placeholder="e.g., P-1001"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="full_name">Full Name *</label>
          <input
            id="full_name"
            name="full_name"
            value={value.full_name}
            onChange={handleChange}
            placeholder="e.g., Nimal Perera"
            required
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="age">Age *</label>
          <input
            id="age"
            name="age"
            type="number"
            min="1"
            max="120"
            value={value.age}
            onChange={handleChange}
            placeholder="e.g., 45"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="gender">Gender *</label>
          <select id="gender" name="gender" value={value.gender} onChange={handleChange} required>
            <option value="">Select</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="contact_number">Contact Number</label>
          <input
            id="contact_number"
            name="contact_number"
            value={value.contact_number}
            onChange={handleChange}
            placeholder="e.g., +94 71 234 5678"
          />
        </div>

        <div className="form-group">
          <label htmlFor="notes">Clinical Notes</label>
          <input
            id="notes"
            name="notes"
            value={value.notes}
            onChange={handleChange}
            placeholder="Optional notes"
          />
        </div>
      </div>
    </div>
  );
}

export default PatientDetailsForm;
