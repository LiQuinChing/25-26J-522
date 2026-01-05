# 🚀 Quick Start Guide - ECG Detection Web App

## Step 1: Install React Dependencies

Open a **NEW terminal** (keep the Flask API running) and run:

```bash
cd frontend
npm install
```

This will install:
- React & React DOM
- Axios (for API calls)
- Recharts (for ECG visualization)
- React Scripts (development tools)

## Step 2: Start the React App

After installation completes, start the React development server:

```bash
npm start
```

The app will automatically open in your browser at: **http://localhost:3000**

## Step 3: Use the Application

1. **Check API Status**: The app shows API connection status at the top
2. **Enter ECG Data**: 
   - Click "Load Sample Data" for a quick test
   - Or enter your own 187 comma-separated values
3. **Click Predict**: Submit the data for analysis
4. **View Results**:
   - Prediction result (Normal/Abnormal)
   - Confidence level
   - ECG signal visualization
   - Statistical analysis

## Troubleshooting

### React App Won't Start
```bash
# Clean install
cd frontend
rm -rf node_modules package-lock.json
npm install
npm start
```

### API Connection Error
1. Make sure Flask server is running (`python api_server.py`)
2. Check that it's on port 5000
3. Verify CORS is enabled (flask-cors installed)

### Port Already in Use
```bash
# React will ask to use a different port (like 3001)
# Type 'Y' to accept
```

## Architecture

```
┌─────────────────┐         HTTP          ┌─────────────────┐
│  React Frontend │ ◄──────────────────► │   Flask API      │
│  (Port 3000)    │    JSON Request       │  (Port 5000)     │
│                 │    JSON Response      │                  │
└─────────────────┘                       └─────────────────┘
                                                   │
                                                   ▼
                                          ┌─────────────────┐
                                          │  CNN Model      │
                                          │  (ptbdb.h5)     │
                                          └─────────────────┘
```

## Features Included

✅ Real-time API health monitoring
✅ ECG signal visualization with Recharts
✅ Confidence score display
✅ Statistical analysis (min, max, mean)
✅ Sample data loader
✅ Responsive design (mobile-friendly)
✅ Professional medical-themed UI
✅ Error handling and validation

## Next Steps

- Deploy to production (build with `npm run build`)
- Add more visualization options
- Implement batch upload functionality
- Add historical predictions tracking
- Export results as PDF

Enjoy your ECG Detection Web App! 🫀
