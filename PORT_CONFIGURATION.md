# ECG System - Port Configuration

## 🔌 Port Architecture

The ECG system runs on three separate ports:

| Service | Port | Purpose | Technology |
|---------|------|---------|------------|
| **Flask ML API** | 5000 | ECG image analysis & predictions | Python + Flask |
| **Node Backend API** | 3001 | Results storage & patient history | Node.js + Express + MongoDB |
| **React Frontend** | 3000 | User interface | React |

## 🔄 Data Flow

```
User → React Frontend (3000)
          ↓
          ├→ Flask ML API (5000) → ECG Predictions
          │
          └→ Node Backend API (3001) → Save/Retrieve Results → MongoDB
```

## 🚀 Starting the System

### Option 1: Start All at Once
Double-click: `START_BOTH.bat`

This will automatically start all three services.

### Option 2: Start Individually

#### Start Flask ML API (Port 5000)
```bash
python app.py
```

#### Start Node Backend API (Port 3001)
```bash
cd backend
npm start
```

#### Start React Frontend (Port 3000)
```bash
cd frontend
npm start
```

## ✅ Health Checks

After starting, verify all services are running:

- Flask ML API: http://localhost:5000/api/health
- Node Backend API: http://localhost:3001/health
- React Frontend: http://localhost:3000

## 📝 Environment Variables

### Flask ML API (app.py)
```bash
FLASK_PORT=5000  # Default
```

### Node Backend API (backend/.env)
```bash
PORT=3001
MONGODB_URI=mongodb+srv://...
```

### React Frontend (frontend/.env)
```bash
REACT_APP_ML_API_URL=http://localhost:5000  # Flask ML API
REACT_APP_BACKEND_API_URL=http://localhost:3001  # Node Backend API
```

## 🔧 Changing Ports

If you need to change a port due to conflicts:

### Flask ML API
Edit `app.py` or set environment variable:
```python
port = int(os.getenv('FLASK_PORT', '5000'))
```

### Node Backend API
Edit `backend/.env`:
```
PORT=3001
```

### React Frontend
React automatically uses port 3000, or the next available port if occupied.

## ❗ Common Port Conflicts

If you get "port already in use" errors:

1. **Port 5000**: Usually Flask ML API or other Python apps
2. **Port 3001**: Usually Node.js backend
3. **Port 3000**: Usually React or other Node.js apps

To check what's using a port on Windows:
```bash
netstat -ano | findstr :5000
```

To kill a process:
```bash
taskkill /PID <process_id> /F
```
