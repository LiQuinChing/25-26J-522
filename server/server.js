require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const mongoose = require('mongoose');
const fs = require('fs');
const FormData = require('form-data');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// ==========================================
// 1. MONGODB CONNECTION & MODELS
// ==========================================
// Replace this with your actual MongoDB Atlas Connection String
const MONGODB_URI = process.env.MONGO_URI;

mongoose.connect(MONGODB_URI)
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => console.error('❌ MongoDB connection error:', err));

// Schema for Auto-Incrementing Patient ID
const counterSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    seq: { type: Number, default: 0 }
});
const Counter = mongoose.model('Counter', counterSchema);

// Schema for the Analysis Result
const analysisSchema = new mongoose.Schema({
    patientName: { type: String, required: true },
    patientId: { type: Number, required: true },
    fileName: { type: String, required: true },
    predictedClass: { type: String, required: true },
    doctorId: { type: String, default: 'pending_auth_system' }, // Placeholder for the login system
    createdAt: { type: Date, default: Date.now }
});
const Analysis = mongoose.model('Analysis', analysisSchema);

// ==========================================
// 2. ROUTES
// ==========================================
const upload = multer({ dest: 'uploads/' });

//route to actually forward the CSV to your new Python server instead of making up mock data.
app.post('/api/upload-ecg', upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    
    const patientName = req.body.patientName || 'Unknown Patient';

    try {
        // 1. Send the file to the Python FastAPI Server
        const fileStream = fs.createReadStream(req.file.path);
        const formData = new FormData();
        formData.append('file', fileStream, req.file.originalname);

        const pythonResponse = await axios.post('http://localhost:8001/upload-csv', formData, {
            headers: {
                ...formData.getHeaders(),
            },
        });
        
        // This is the real prediction from your PyTorch model!
        const resultData = pythonResponse.data;

        // 2. Generate Auto-Incrementing Patient ID
        const counter = await Counter.findByIdAndUpdate(
            { _id: 'patientId' }, 
            { $inc: { seq: 1 } }, 
            { new: true, upsert: true }
        );

        // 3. Save Result to MongoDB
        const newAnalysis = new Analysis({
            patientName: patientName,
            patientId: counter.seq,
            fileName: req.file.originalname,
            predictedClass: resultData.predicted_class
        });
        await newAnalysis.save();

        fs.unlinkSync(req.file.path); // Clean up temp file
        res.json(resultData);

    } catch (error) {
        console.error('Error connecting to ML server:', error.message);
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        res.status(500).json({ error: 'Failed to get prediction from ML model.' });
    }
});

// Upload and Analyze Route
// app.post('/api/upload-ecg', upload.single('file'), async (req, res) => {
//     if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    
//     // Extract the patient name sent from the frontend
//     const patientName = req.body.patientName || 'Unknown Patient';

//     try {
//         // --- MOCK ML RESPONSE (Replace with actual Python API Call later) ---
//         const predicted_class = Math.random() > 0.5 ? 'Normal' : 'Atrial Fibrillation';
//         const resultData = {
//             predicted_class: predicted_class,
//             confidence: 0.92 + (Math.random() * 0.07),
//             is_uncertain: false,
//             Normal: predicted_class === 'Normal' ? 0.95 : 0.05,
//             Supraventricular: 0.02,
//             Ventricular: 0.00,
//             Fusion: 0.00,
//             Unknown: 0.03,
//         };

//         // 1. Generate Auto-Incrementing Patient ID
//         const counter = await Counter.findByIdAndUpdate(
//             { _id: 'patientId' }, 
//             { $inc: { seq: 1 } }, 
//             { new: true, upsert: true }
//         );

//         // 2. Save Result to MongoDB
//         const newAnalysis = new Analysis({
//             patientName: patientName,
//             patientId: counter.seq,
//             fileName: req.file.originalname,
//             predictedClass: resultData.predicted_class
//         });
//         await newAnalysis.save();

//         fs.unlinkSync(req.file.path); // Clean up temp file
//         res.json(resultData);

//     } catch (error) {
//         console.error('Error:', error);
//         if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
//         res.status(500).json({ error: 'Failed to process and save ECG file.' });
//     }
// });

// Fetch Recent Analyses Route
app.get('/api/recent', async (req, res) => {
    try {
        // Fetch top 5 most recent scans, sorted by newest first
        const recents = await Analysis.find().sort({ createdAt: -1 }).limit(50);
        res.json(recents);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch recent analyses.' });
    }
});

app.listen(PORT, () => console.log(`Node server running on http://localhost:${PORT}`));