# ECG Backend API

Node.js + Express + MongoDB backend for storing and retrieving ECG analysis results.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Start the Server
```bash
npm start        # Production mode
npm run dev      # Development mode (auto-reload)
```

Or on Windows, double-click: `START_BACKEND.bat`

### 3. Verify It's Running
Visit: http://localhost:3001/health

## 📡 API Endpoints

**Base URL:** `http://localhost:3001/api`

### Patient Endpoints

#### Check if Patient Exists
```
GET /api/patient/:patientId
```
Returns patient info if exists, used for auto-fill functionality.

#### Create/Update Patient
```
POST /api/patient
Body: {
  "patientId": "P001",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "123-456-7890",
  "dateOfBirth": "1980-01-15",
  "gender": "Male"
}
```

### Result Endpoints

#### Save ECG Analysis Result
```
POST /api/result
Body: {
  "patientId": "P001",
  "patientName": "John Doe",
  "prediction": "Normal",
  "confidence": 95.5,
  "date": "2026-03-07T10:30:00Z",
  "time": "10:30 AM",
  "imageFile": "ecg_001.jpg",
  "additionalNotes": "Regular pattern"
}
```

#### Get Results for Patient
```
GET /api/results/:patientId
```

#### Get All Results (Paginated)
```
GET /api/results?page=1&limit=50
```

#### Delete a Result
```
DELETE /api/result/:resultId
```

## 🔧 Configuration

The backend runs on **port 3001** (configured in `.env`).

**Why port 3001?**
- Port 5000: Used by Flask ML model server
- Port 3000: Used by React frontend
- Port 3001: Backend API server

## 💾 Database

MongoDB Atlas (cloud database) is pre-configured. Connection details are in `.env`.

## ⚙️ Environment Variables

Create a `.env` file (already created):
```env
PORT=3001
MONGODB_URI=mongodb+srv://...
NODE_ENV=development
```

## 📦 Dependencies

- **express**: Web framework
- **mongoose**: MongoDB ODM
- **cors**: Cross-origin requests
- **dotenv**: Environment variables

## 🔍 Testing

Use the included `api-tester.html` to test all endpoints interactively in your browser.
