# 🚀 Quick Start Guide - ECG System

## Port Configuration Summary

Your ECG system now runs on **three separate ports** to avoid conflicts:

| Service | Port | Purpose |
|---------|------|---------|
| **Flask ML Model** | 5000 | ECG image analysis and predictions |
| **Node.js Backend** | 3001 | Results storage and patient history (MongoDB) |
| **React Frontend** | 3000 | User interface |

## ✅ What Was Changed

1. **Backend Server** configured to run on port **3001** (instead of 5000)
2. **Frontend** updated to use:
   - Port **5000** for ML predictions (Flask)
   - Port **3001** for saving results (Node.js)
3. **Complete backend implementation** created with MongoDB integration
4. **Startup scripts** updated to start all three services

## 🏃 Starting the System

### Option 1: One-Click Start (Recommended)
Double-click: `START_BOTH.bat`

This will automatically start:
1. Flask ML API (port 5000)
2. Node.js Backend API (port 3001)  
3. React Frontend (port 3000)

### Option 2: Manual Start

#### Step 1: Start Flask ML Model (Terminal 1)
```bash
python app.py
```
Should show: `Server running at: http://localhost:5000`

#### Step 2: Start Node.js Backend (Terminal 2)
```bash
cd backend
npm start
```
Should show: `ECG Backend Server Running` on port 3001

#### Step 3: Start React Frontend (Terminal 3)
```bash
cd frontend
npm start
```
Should open browser at: http://localhost:3000

## ✓ Verify Everything is Running

Open these URLs to check:

1. **Flask ML API Health Check**  
   http://localhost:5000/api/health  
   Should show: `{"status": "ok", "model_loaded": true}`

2. **Node.js Backend Health Check**  
   http://localhost:3001/health  
   Should show: `{"status": "ok", "mongodb": "connected"}`

3. **React Frontend**  
   http://localhost:3000  
   Should show the ECG upload interface

## 📁 Important Files Created/Updated

### Backend (Port 3001)
- `backend/server.js` - Main Express server
- `backend/.env` - Port configuration (PORT=3001)
- `backend/routes/api.js` - All API endpoints
- `backend/models/Patient.js` - Patient schema
- `backend/models/Result.js` - Results schema
- `backend/START_BACKEND.bat` - Quick start script

### Frontend (Port 3000)
- `frontend/.env` - API URLs configuration
- `frontend/src/App.js` - Updated to use correct ports

### Documentation
- `PORT_CONFIGURATION.md` - Complete port reference
- `QUICK_START_GUIDE.md` - This file
- `backend/README.md` - Backend API documentation

## 🔧 Troubleshooting

### Error: "Port 5000 already in use"
Something else is using port 5000. Options:
1. Stop the other process using port 5000
2. Change Flask to use a different port in `app.py`

To find what's using port 5000:
```bash
netstat -ano | findstr :5000
```

### Error: "Port 3001 already in use"
Change the port in `backend/.env`:
```
PORT=3002
```
Then update `frontend/.env`:
```
REACT_APP_BACKEND_API_URL=http://localhost:3002
```

### Backend shows "MongoDB connection error"
Check your internet connection. The system uses MongoDB Atlas (cloud database).

### Frontend can't connect to APIs
Make sure both Flask (5000) and Node.js (3001) servers are running.

## 🎯 Next Steps

1. Test the system by uploading an ECG image
2. Check that results are being saved (you can verify in MongoDB)
3. Review the API documentation in `backend/README.md`
4. Use `backend/api-tester.html` to test backend endpoints directly

## 📞 API Endpoints

### Flask ML API (Port 5000)
- `GET  /api/health` - Health check
- `POST /api/predict` - ECG prediction

### Node.js Backend API (Port 3001)
- `GET    /health` - Health check
- `GET    /api/patient/:patientId` - Get patient info
- `POST   /api/patient` - Create/update patient
- `POST   /api/result` - Save ECG result
- `GET    /api/results/:patientId` - Get patient's results
- `GET    /api/results` - Get all results
- `DELETE /api/result/:resultId` - Delete result

## 🔄 Stopping the System

Press `Ctrl+C` in each terminal window, or close the terminal windows.

---

**Your system is now ready to use!** 🎉
