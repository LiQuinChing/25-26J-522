# ECG Backend - Quick Start Guide

## What is This?

This is a **Node.js + Express + MongoDB** backend server that manages ECG analysis results and patient history. It automatically fills in patient names if a patient ID exists in the database.

## System Requirements

- **Node.js** 14.0 or higher ([Download](https://nodejs.org/))
- **npm** (comes with Node.js)
- **Internet Connection** (for MongoDB Atlas)
- Windows/Mac/Linux

## Installation (3 Steps)

### Step 1: Install Dependencies

```bash
cd backend
npm install
```

This installs all required packages from `package.json`.

### Step 2: Verify MongoDB Connection (Optional)

```bash
node test-connection.js
```

Expected output:
```
✓ Successfully connected to MongoDB!
✓ Database Ready for use
```

### Step 3: Start the Server

**Option A: Development Mode** (auto-reloads on file changes)
```bash
npm run dev
```

**Option B: Production Mode**
```bash
npm start
```

**Option C: Windows Users** - Double-click `START_BACKEND.bat`

Expected output:
```
✓ Connected to MongoDB
╔═══════════════════════════════════════╗
║  ECG Backend Server Running           ║
║  Port: 5000                           ║
║  http://localhost:5000/               ║
╚═══════════════════════════════════════╝
```

## Quick Test

Once server is running, test it:

```bash
# In a new terminal
curl http://localhost:5000/health
```

Expected response:
```json
{
  "status": "OK",
  "message": "ECG Backend Server is running",
  "timestamp": "2026-03-05T10:30:00.000Z"
}
```

## API Quick Reference

### 1. Check Patient (Auto-fill Name)

```bash
curl http://localhost:5000/api/patient/P001
```

Response if exists:
```json
{
  "success": true,
  "found": true,
  "name": "John Doe"
}
```

Response if not exists:
```json
{
  "success": true,
  "found": false,
  "patientId": "P001"
}
```

### 2. Create Patient

```bash
curl -X POST http://localhost:5000/api/patient \
  -H "Content-Type: application/json" \
  -d '{"patientId":"P001","name":"John Doe"}'
```

### 3. Save ECG Result

```bash
curl -X POST http://localhost:5000/api/result \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "P001",
    "patientName": "John Doe",
    "prediction": "Normal",
    "confidence": 95.5
  }'
```

Prediction options:
- `"Normal"`
- `"History of MI"`
- `"Myocardial Infarction"`

### 4. Get Patient Results History

```bash
curl http://localhost:5000/api/results/P001
```

### 5. Get All Results (Paginated)

```bash
curl "http://localhost:5000/api/results?page=1&limit=50"
```

## Folder Structure

```
backend/
├── server.js                 # Main server file
├── package.json              # Dependencies
├── .env                      # MongoDB credentials
├── models/
│   ├── Patient.js           # Patient schema
│   └── Result.js            # Result schema
├── routes/
│   └── api.js               # All API endpoints
├── test-connection.js        # Test MongoDB connection
├── START_BACKEND.bat         # Windows batch file
├── ResultsService.js         # Frontend service example
├── INTEGRATION_EXAMPLE.jsx   # Frontend example code
└── README.md                 # Full documentation
```

## Database Schema

### Patients Collection
```
{
  patientId: "P001",      // Unique ID
  name: "John Doe",
  email: "john@example.com",
  phone: "123-456-7890",
  createdAt: Date,
  updatedAt: Date
}
```

### Results Collection
```
{
  patientId: "P001",
  patientName: "John Doe",
  prediction: "Normal",              // Normal | History of MI | Myocardial Infarction
  confidence: 95.5,
  date: Date,                        // 2026-03-05
  time: "10:30:45 AM",
  imageFile: "ecg_001.jpg",
  additionalNotes: "Regular pattern",
  createdAt: Date
}
```

## Frontend Integration

1. Copy `ResultsService.js` to your React `src/` folder
2. Import and use in your component:

```javascript
import ResultsService from './ResultsService';

// Check if patient exists (auto-fill name)
const patient = await ResultsService.getPatientName('P001');

// Save result
await ResultsService.saveResult(
  patientId,
  patientName,
  'Normal',
  95.5
);

// Get history
const history = await ResultsService.getPatientResults('P001');
```

See `INTEGRATION_EXAMPLE.jsx` for a complete React example.

## Troubleshooting

### Error: Cannot find module 'mongoose'

**Solution:**
```bash
cd backend
npm install
```

### Error: MONGODB connection error

**Check:**
1. Internet connection is working
2. MongoDB Atlas credentials in `.env` are correct
3. Space in MongoDB Atlas firewall/IP whitelist

**Test connection:**
```bash
node test-connection.js
```

### Error: Port 5000 already in use

**Solution 1:** Close other processes using port 5000

**Solution 2:** Use different port
```bash
PORT=5001 npm start
```

### Error: CORS issues in frontend

The backend is already configured for CORS. If you get CORS errors:
1. Ensure backend is running on `http://localhost:5000`
2. Ensure frontend is making requests to the same URL

## MongoDB Atlas Dashboard

Monitor your data:
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Login with: `research` / `1234`
3. View **Cluster0 → Collections**
4. See your data in real-time

## Environment Variables

Edit `.env` to customize:

```env
MONGODB_URI=mongodb+srv://research:1234@cluster0.yxuwo8u.mongodb.net/?appName=Cluster0
PORT=5000
NODE_ENV=development
```

## Next Steps

1. ✓ Install dependencies: `npm install`
2. ✓ Test connection: `node test-connection.js`
3. ✓ Start server: `npm start`
4. ✓ Test endpoints: Use curl examples above
5. ✓ Integrate with frontend: Copy `ResultsService.js`
6. ✓ Monitor data: Check MongoDB Atlas dashboard

## Additional Resources

- [Full API Documentation](./README.md)
- [Frontend Integration Example](./INTEGRATION_EXAMPLE.jsx)
- [MongoDB Atlas Console](https://www.mongodb.com/cloud/atlas)
- [Express Documentation](https://expressjs.com/)
- [MongoDB Documentation](https://docs.mongodb.com/)

## Support

For issues:
1. Check the [README.md](./README.md) for detailed API documentation
2. Review the [INTEGRATION_EXAMPLE.jsx](./INTEGRATION_EXAMPLE.jsx) for frontend usage
3. Check error messages in console for specific issues
4. Verify MongoDB connection with `node test-connection.js`

---

**Backend Server is ready to use!** 🚀
