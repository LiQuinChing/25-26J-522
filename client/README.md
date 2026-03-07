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
