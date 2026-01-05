# ECG Myocardial Infarction Detection - React Frontend

A modern, responsive React application for detecting myocardial infarction (heart attack) from ECG data using a deep learning model.

## Features

- 🎨 Modern, responsive UI with gradient design
- 📊 Real-time ECG signal visualization
- 🔄 Live API status monitoring
- ✅ Comprehensive prediction results
- 📈 Statistical analysis of ECG data
- ⚡ Fast and intuitive user experience

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Flask API server running on http://localhost:5000

## Installation

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

## Running the Application

1. Make sure the Flask API server is running:
```bash
python api_server.py
```

2. Start the React development server:
```bash
npm start
```

3. Open your browser and navigate to:
```
http://localhost:3000
```

## Usage

1. **Enter ECG Data**: Input 187 comma-separated values representing ECG readings
2. **Load Sample Data**: Click "Load Sample Data" to use pre-filled example values
3. **Predict**: Click "Predict" to analyze the ECG data
4. **View Results**: See the prediction, confidence level, and ECG visualization

## Project Structure

```
frontend/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── ECGChart.js          # ECG signal visualization
│   │   ├── ECGChart.css
│   │   ├── PredictionResult.js  # Results display
│   │   └── PredictionResult.css
│   ├── App.js                   # Main application
│   ├── App.css
│   ├── index.js
│   └── index.css
├── package.json
└── README.md
```

## API Endpoints Used

- `GET /health` - Check API and model status
- `POST /predict` - Submit ECG data for prediction

## Technologies

- **React 18** - UI framework
- **Axios** - HTTP client
- **Recharts** - Data visualization
- **CSS3** - Styling with gradients and animations

## Build for Production

```bash
npm run build
```

This creates an optimized production build in the `build/` directory.

## Troubleshooting

**API Connection Error:**
- Ensure Flask server is running on port 5000
- Check if CORS is enabled in the Flask API

**Chart Not Displaying:**
- Verify that ECG data has exactly 187 values
- Check browser console for errors

## License

MIT
