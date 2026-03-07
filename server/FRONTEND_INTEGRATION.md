# Frontend Integration Guide - Node.js Backend

This guide explains how to integrate your React frontend with the new Node.js/Express/MongoDB backend.

## Option 1: Minimal Integration (Recommended for Quick Start)

Just save results without modifying the existing UI much.

### Step 1: Copy Service File
Copy `backend/ResultsService.js` to your React project:
```
frontend/src/ResultsService.js
```

### Step 2: Update App.js Import
At the top of your `frontend/src/App.js`, add:
```javascript
import ResultsService from './ResultsService';
```

### Step 3: Save Results After Prediction
In the `handleUpload` function, after getting the prediction, add:

```javascript
// After successful prediction from your model:
const response = await axios.post(`${API_URL}/api/predict`, formData, {...});

if (response.data.success) {
  // NEW: Save to MongoDB
  try {
    await ResultsService.saveResult(
      patientId,                    // Get from input
      patientName,                  // Get from input
      response.data.prediction,     // From model
      response.data.confidence || 0 // From model
    );
    console.log('Result saved to MongoDB');
  } catch (error) {
    console.error('Failed to save to database:', error);
  }
  
  setResult(response.data);
}
```

---

## Option 2: Complete Integration (Recommended)

Fully integrate with patient management, auto-fill, and history.

### Step 1: Install Dependencies (Frontend)
```bash
cd frontend
npm install axios
```
(axios should already be installed, but make sure)

### Step 2: Copy Service File
```
Copy: backend/ResultsService.js → frontend/src/ResultsService.js
```

### Step 3: Update App.js

Replace your `App.js` with code similar to `backend/INTEGRATION_EXAMPLE.jsx`:

```javascript
import React, { useState } from 'react';
import axios from 'axios';
import ResultsService from './ResultsService';

const API_URL = 'http://localhost:5000';

function App() {
  const [patientId, setPatientId] = useState('');
  const [patientName, setPatientName] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  // Check patient exists (auto-fill name)
  const handleCheckPatient = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const data = await ResultsService.getPatientName(patientId);
      
      if (data.found) {
        setPatientName(data.name); // Auto-filled!
        setError(null);
      } else {
        setPatientName('');
        // Show form to create new patient
      }
    } catch (err) {
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Upload and analyze
  const handleUpload = async () => {
    if (!selectedFile || !patientId || !patientName) {
      setError('Please select patient and image');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('image', selectedFile);

    try {
      // Get prediction from your model
      const prediction = await axios.post(
        `${API_URL}/api/predict`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      // Save result to MongoDB
      await ResultsService.saveResult(
        patientId,
        patientName,
        prediction.data.prediction,
        prediction.data.confidence || 0,
        selectedFile.name
      );

      setResult(prediction.data);
      setSelectedFile(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Patient Selection Form */}
      <form onSubmit={handleCheckPatient}>
        <input
          type="text"
          placeholder="Patient ID"
          value={patientId}
          onChange={(e) => setPatientId(e.target.value)}
        />
        <button type="submit" disabled={loading}>
          Check Patient
        </button>
      </form>

      {patientName && <p>Patient: {patientName}</p>}

      {/* File Upload */}
      <input
        type="file"
        onChange={(e) => setSelectedFile(e.target.files[0])}
      />
      <button onClick={handleUpload} disabled={loading}>
        Analyze & Save
      </button>

      {/* Results */}
      {result && <div>Prediction: {result.prediction}</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}
    </div>
  );
}

export default App;
```

---

## Step-by-Step Implementation

### 1. Prepare Backend
```bash
cd backend
npm install
npm start
```
Backend will be running on `http://localhost:5000`

### 2. Install Frontend Dependencies
```bash
cd frontend
npm install axios
```

### 3. Create Patient ID Input
Add a form to accept Patient ID:
```javascript
<input 
  type="text"
  placeholder="Enter Patient ID (e.g., P001)"
  value={patientId}
  onChange={(e) => setPatientId(e.target.value)}
/>
```

### 4. Add Check Patient Button
```javascript
const handleCheckPatient = async () => {
  const data = await ResultsService.getPatientName(patientId);
  if (data.found) {
    setPatientName(data.name); // Auto-fill!
  }
};
```

### 5. Save Results After Analysis
```javascript
// After getting prediction from your model
await ResultsService.saveResult(
  patientId,
  patientName,
  predictionResult,
  confidenceScore
);
```

### 6. Display Patient History
```javascript
const handleViewHistory = async () => {
  const history = await ResultsService.getPatientResults(patientId);
  // Display history.results in a table
};
```

---

## API Flow Diagram

```
Frontend                          Backend                        MongoDB
=========                         =======                        =======

User enters Patient ID
    |
    v
[Check Patient] ------GET /api/patient/:id-----> [MongoDB Query]
                       (auto-fill patient name) |
    |<------------- {found: true, name: "John"}-|
    |
    v
User selects Image
    |
    v
[Analyze] ----------POST /api/predict---------> [Python Model]
    |                                           (your existing API)
    |<---------- {prediction, confidence}-------|
    |
    v
[Save Result] ------POST /api/result---------> [Save to MongoDB]
    |                                          |
    v                              <-----------|
    |
    v
Show: "Prediction: Normal, Saved at 10:30 AM"
```

---

## Code Examples

### Check Patient (Auto-fill Name)
```javascript
const patient = await ResultsService.getPatientName('P001');
console.log(patient.found);  // true
console.log(patient.name);   // "John Doe"
```

### Create Patient
```javascript
await ResultsService.createOrUpdatePatient(
  'P001',
  'John Doe',
  'john@example.com'
);
```

### Save Result
```javascript
await ResultsService.saveResult(
  'P001',
  'John Doe',
  'Normal',
  95.5,
  'ecg_image.jpg',
  'Some notes here'
);
```

### Get Results History
```javascript
const results = await ResultsService.getPatientResults('P001');
console.log(results.results); // Array of results
console.log(results.count);   // Number of results
```

---

## Testing Integration

### Test 1: Check Patient doesn't exist
```bash
curl http://localhost:5000/api/patient/P999
# Response: {success: true, found: false}
```

### Test 2: Create Patient
```bash
curl -X POST http://localhost:5000/api/patient \
  -H "Content-Type: application/json" \
  -d '{"patientId":"P001","name":"Test User"}'
# Response: {success: true, message: "Patient saved successfully", ...}
```

### Test 3: Check Patient exists (auto-fill)
```bash
curl http://localhost:5000/api/patient/P001
# Response: {success: true, found: true, name: "Test User"}
```

### Test 4: Save Result
```bash
curl -X POST http://localhost:5000/api/result \
  -H "Content-Type: application/json" \
  -d '{
    "patientId":"P001",
    "patientName":"Test User",
    "prediction":"Normal",
    "confidence":95.5
  }'
```

### Test 5: Get Patient History
```bash
curl http://localhost:5000/api/results/P001
# Response: {success: true, count: 1, results: [...]}
```

Or use the interactive API tester in Visual Studio Code:
```
Open: backend/api-tester.html in browser
```

---

## Complete Form Example

```javascript
import React, { useState } from 'react';
import ResultsService from './ResultsService';

export default function ECGForm() {
  const [patientId, setPatientId] = useState('');
  const [patientName, setPatientName] = useState('');
  const [patientFound, setPatientFound] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showNewPatientForm, setShowNewPatientForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');

  const handleCheckPatient = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = await ResultsService.getPatientName(patientId);

      if (data.found) {
        setPatientName(data.name);
        setPatientFound(true);
        setShowNewPatientForm(false);
      } else {
        setPatientFound(false);
        setPatientName('');
        setShowNewPatientForm(true);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePatient = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await ResultsService.createOrUpdatePatient(
        patientId,
        newName,
        newEmail
      );
      setPatientName(newName);
      setPatientFound(true);
      setShowNewPatientForm(false);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Patient Selection</h2>

      {!patientFound ? (
        <>
          <form onSubmit={handleCheckPatient}>
            <input
              type="text"
              placeholder="Patient ID (e.g., P001)"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              disabled={loading}
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Checking...' : 'Check Patient'}
            </button>
          </form>

          {showNewPatientForm && (
            <form onSubmit={handleCreatePatient}>
              <h3>New Patient</h3>
              <input
                type="text"
                placeholder="Patient Name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
              <input
                type="email"
                placeholder="Email (optional)"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
              <button type="submit" disabled={loading}>
                Create Patient
              </button>
            </form>
          )}
        </>
      ) : (
        <div style={{ backgroundColor: '#e8f5e9', padding: '10px' }}>
          ✓ Patient: <strong>{patientName}</strong>
        </div>
      )}
    </div>
  );
}
```

---

## Troubleshooting

### CORS Error: "Cross-Origin Request Blocked"
Solution: Make sure both servers are running
- Backend: `npm start` (runs on port 5000)
- Frontend: `npm start` (runs on port 3000)

### "Cannot find module 'ResultsService'"
Solution: Make sure you copied `ResultsService.js` to `frontend/src/`

### Patient name not auto-filling
Check:
1. Patient ID is correct
2. Patient exists in database
3. Network tab in browser showing successful API call

### Results not saving
Check:
1. Backend server is running
2. MongoDB connection is working: `node test-connection.js`
3. Check browser console for error messages

---

## Next Steps

1. Copy `ResultsService.js` to frontend
2. Add Patient ID input field to form
3. Add "Check Patient" button
4. Call `ResultsService.saveResult()` after prediction
5. Display results history with `ResultsService.getPatientResults()`
6. Test with the `api-tester.html` tool

---

## Files to Modify

1. **frontend/src/App.js** - Add patient input and save result call
2. **frontend/src/ResultsService.js** - NEW FILE (copy from backend)

That's it! Your frontend will now save all results to MongoDB with auto-fill patient names.
