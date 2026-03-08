# SVT Detection React Frontend

A modern, user-friendly React web application for predicting Supraventricular Tachycardia (SVT) from ECG parameters using the Flask backend API.

## Features

- ✨ Clean, medical-themed UI
- 📊 Real-time prediction with probability scores
- 🎯 Decision threshold visualization
- 💡 Quick example inputs (SVT, Healthy, Irregular patterns)
- 📱 Fully responsive design
- ⚡ Clinical validation messages
- 🔄 Easy input reset functionality

---

## Setup Instructions

### Prerequisites

- **Node.js** (v14 or higher)
- **npm** (comes with Node.js)
- **Flask API server** running on `http://localhost:5000`

### Installation

1. **Navigate to the frontend directory:**
   ```powershell
   cd d:\train_ML\svt-frontend
   ```

2. **Install dependencies:**
   ```powershell
   npm install
   ```

3. **Make sure the Flask API is running:**
   ```powershell
   # In a separate terminal
   cd d:\train_ML
   python api_svt_predict.py
   ```

4. **Start the React development server:**
   ```powershell
   npm start
   ```

The app will automatically open in your browser at **http://localhost:3000**

---

## Usage

### 1. Enter ECG Parameters

Fill in the required fields:
- **Heart Rate (bpm)**: Patient's heart rate (30-240)
- **PR Interval (seconds)**: PR interval duration (0.06-0.35)
- **QRS Duration (seconds)**: QRS complex duration (0.04-0.25)
- **RR Regularity**: Select "Regular" or "Irregular"
- **P-Wave Present**: Check if P-wave is visible

### 2. Use Quick Examples

Click one of the example buttons to auto-fill:
- **📈 SVT Pattern**: High HR, narrow QRS, no P-wave
- **✅ Healthy**: Normal sinus rhythm
- **⚡ Irregular**: Irregular tachycardia pattern

### 3. Submit for Prediction

Click **"🔍 Predict SVT"** to send data to the API.

### 4. View Results

The result panel displays:
- **Prediction Label**: SVT or Healthy
- **SVT Probability**: Confidence score (0-100%)
- **Decision Threshold**: Model's threshold value
- **Clinical Notes**: Validation messages and warnings
- **Interpretation**: Detailed explanation
- **Input Summary**: Your submitted parameters

---

## Project Structure

```
svt-frontend/
├── public/
│   └── index.html          # HTML template
├── src/
│   ├── components/
│   │   ├── Header.js       # App header with logo
│   │   ├── Header.css
│   │   ├── SVTForm.js      # Input form component
│   │   ├── SVTForm.css
│   │   ├── ResultDisplay.js # Results visualization
│   │   └── ResultDisplay.css
│   ├── App.js              # Main app component
│   ├── App.css
│   ├── index.js            # React entry point
│   └── index.css           # Global styles
├── package.json            # Dependencies
└── README.md              # This file
```

---

## Available Scripts

### `npm start`
Runs the app in development mode.  
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

### `npm run build`
Builds the app for production to the `build` folder.  
Optimizes React for best performance.

### `npm test`
Launches the test runner in interactive watch mode.

---

## API Integration

The frontend communicates with the Flask backend at:
- **Base URL**: `http://localhost:5000`
- **Endpoint**: `/predict` (POST)
- **Content-Type**: `application/json`

### Request Format
```json
{
  "heart_rate_bpm": 160,
  "pr_interval_s": 0.12,
  "qrs_duration_s": 0.09,
  "rr_regularity": "regular",
  "p_wave_presence": false
}
```

### Response Format
```json
{
  "status": "success",
  "prediction": {
    "label": "SVT",
    "svt_probability": 0.85,
    "decision_threshold": 0.748,
    "messages": [...]
  },
  "input": {...}
}
```

---

## Troubleshooting

### "Cannot connect to API server" Error

**Solution:**
1. Make sure Flask API is running:
   ```powershell
   python api_svt_predict.py
   ```
2. Check that it's on `http://localhost:5000`
3. Verify CORS is enabled in Flask (already configured)

### Port 3000 Already in Use

**Solution:**
```powershell
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or use a different port
set PORT=3001 && npm start
```

### Dependencies Installation Fails

**Solution:**
```powershell
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -r node_modules
rm package-lock.json
npm install
```

---

## Customization

### Change API URL

Edit `package.json` proxy or update API calls in `App.js`:

```javascript
// Change from
const response = await axios.post('http://localhost:5000/predict', formData);

// To your custom URL
const response = await axios.post('http://your-api-url/predict', formData);
```

### Modify Theme Colors

Edit CSS files in `src/components/` to change color schemes.

Main gradient: `#667eea` to `#764ba2`

---

## Production Deployment

### Build for Production
```powershell
npm run build
```

This creates an optimized build in the `build/` folder.

### Serve Static Build
```powershell
# Install serve globally
npm install -g serve

# Serve the build
serve -s build -p 3000
```

### Deploy to Web Server

Upload the `build/` folder contents to:
- **Netlify**: Drag & drop `build/` folder
- **Vercel**: `vercel --prod`
- **AWS S3**: Upload to S3 bucket + CloudFront
- **GitHub Pages**: Use `gh-pages` package

**Remember**: Update API URL for production environment!

---

## Browser Compatibility

- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)
- ⚠️ IE11 (not supported)

---

## Medical Disclaimer

**⚠️ FOR EDUCATIONAL USE ONLY**

This application is a machine learning demonstration tool designed for:
- Educational purposes
- Research and development
- Academic projects

**NOT for:**
- Clinical diagnosis
- Patient treatment decisions
- Medical emergencies

Always consult qualified healthcare professionals for medical decisions.

---

## License

Educational use only. Not for clinical deployment without proper validation and regulatory approval.

---

## Support

For issues or questions:
1. Check Flask API is running correctly
2. Review browser console for errors
3. Verify input parameters are within valid ranges
4. Test with example inputs first

---

## Screenshots

### Main Form
Clean input interface with field validation and hints.

### SVT Detection Result
Red-themed alert with probability and clinical notes.

### Healthy Result
Green-themed confirmation with interpretation.

---

**Enjoy using the SVT Detection System! 🫀**

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

# MI Detection Frontend

React frontend for the Myocardial Infarction detection system.

## Setup

### Install Dependencies

```bash
cd frontend
npm install
```

### Start Development Server

```bash
npm start
```

The app will open at [http://localhost:3000](http://localhost:3000)

## Usage

1. **Start the Flask API** (in project root):
   ```bash
   python app.py
   ```

2. **Start the React frontend** (in frontend folder):
   ```bash
   npm start
   ```

3. **Upload an ECG image** and click "Analyze ECG"

4. **View results** including:
   - Predicted diagnosis
   - Confidence level
   - Probability for each class

## Features

- 📤 Drag & drop or click to upload ECG images
- 🎨 Beautiful, responsive UI
- 📊 Real-time prediction results
- 📈 Probability visualization for all classes
- ⚠️ Clear error handling and disclaimers

## Build for Production

```bash
npm run build
```

This creates an optimized production build in the `build/` folder.
