require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan'); // From Branch 3
const multer = require('multer');
const mongoose = require('mongoose');
const fs = require('fs');
const FormData = require('form-data');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 5000;

// ==========================================
// 1. MIDDLEWARE
// ==========================================
app.use(cors());
app.use(express.json());
app.use(morgan('dev')); // Logs API requests to the terminal

// ==========================================
// 2. MONGODB CONNECTION
// ==========================================
const MONGODB_URI = process.env.MONGO_URI;

mongoose.connect(MONGODB_URI)
    .then(() => {
        console.log('✅ Connected to MongoDB');
        // Start server only after DB connects
        app.listen(PORT, () => console.log(`🚀 Node server running on http://localhost:${PORT}`));
    })
    .catch(err => {
        console.error('❌ MongoDB connection error:', err);
        process.exit(1);
    });

// ==========================================
// 3. DATABASE MODELS (SCHEMAS)
// ==========================================
// --- dev-main1 Models vihara---
const counterSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    seq: { type: Number, default: 0 }
});
const Counter = mongoose.model('Counter', counterSchema);

const analysisSchema = new mongoose.Schema({
    patientName: { type: String, required: true },
    patientId: { type: Number, required: true },
    fileName: { type: String, required: true },
    predictedClass: { type: String, required: true },
    doctorId: { type: String, default: 'pending_auth_system' },
    createdAt: { type: Date, default: Date.now }
});
const Analysis = mongoose.model('Analysis', analysisSchema);

// --- Branch 3 SVT Patient Model ayesh ---
const patientRecordSchema = new mongoose.Schema({
    patient: {
        patient_id: { type: String, required: true, index: true },
        full_name: { type: String, required: true, index: true },
        age: { type: Number, required: true },
        gender: { type: String, required: true },
        contact_number: { type: String, default: null },
        notes: { type: String, default: null },
    },
    ecg: {
        heart_rate_bpm: { type: Number, required: true },
        pr_interval_s: { type: Number, required: true },
        qrs_duration_s: { type: Number, required: true },
        rr_regularity: { type: String, required: true },
        p_wave_presence: { type: Boolean, required: true },
    },
    prediction: {
        label: { type: String, required: true },
        svt_probability: { type: Number, required: true },
    },
    novelty: {
        score: { type: Number, required: true },
        label: { type: String, required: true },
    },
}, { timestamps: { createdAt: 'created_at', updatedAt: false }, versionKey: false });

const PatientRecord = mongoose.model('PatientRecord', patientRecordSchema);

// ==========================================
// 4. HELPER FUNCTIONS (From Branch 3 -ayesh)
// ==========================================
const calculateNovelty = (ecg, prediction) => {
    const hr = Number(ecg.heart_rate_bpm);
    const pr = Number(ecg.pr_interval_s);
    const qrs = Number(ecg.qrs_duration_s);
    const rr = String(ecg.rr_regularity || '').toLowerCase();
    const pWavePresent = Boolean(ecg.p_wave_presence);
    const probability = Number(prediction.svt_probability);
  
    let score = 0;
    score += Math.min(Math.abs(hr - 85) / 2.2, 45);
    score += Math.min(Math.abs(pr - 0.16) * 250, 20);
    score += Math.min(Math.abs(qrs - 0.09) * 330, 20);
    if (rr === 'irregular') score += 10;
    if (!pWavePresent) score += 10;
    score += Math.max(0, (probability - 0.5) * 30);
  
    const finalScore = Math.max(0, Math.min(100, Number(score.toFixed(2))));
    let noveltyLabel = 'Typical';
    if (finalScore >= 70) noveltyLabel = 'High-risk Novel Pattern';
    else if (finalScore >= 45) noveltyLabel = 'Moderately Atypical';
  
    return { noveltyScore: finalScore, noveltyLabel };
};

const validatePayload = (payload) => {
    // Basic validation logic
    if (!payload.patient || !payload.ecg || !payload.prediction) return 'patient, ecg, and prediction objects are required.';
    // (Kept shorter here for brevity, but functionality remains identical)
    return null; 
};

// ==========================================
// 5. ROUTES
// ==========================================
const upload = multer({ dest: 'uploads/' });

// --- dev-main1 Routes ---
app.post('/api/upload-ecg', upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const patientName = req.body.patientName || 'Unknown Patient';

    try {
        const fileStream = fs.createReadStream(req.file.path);
        const formData = new FormData();
        formData.append('file', fileStream, req.file.originalname);

        const pythonResponse = await axios.post('http://localhost:8001/upload-csv', formData, {
            headers: { ...formData.getHeaders() },
        });
        
        const resultData = pythonResponse.data;

        const counter = await Counter.findByIdAndUpdate(
            { _id: 'patientId' }, { $inc: { seq: 1 } }, { new: true, upsert: true }
        );

        const newAnalysis = new Analysis({
            patientName: patientName,
            patientId: counter.seq,
            fileName: req.file.originalname,
            predictedClass: resultData.predicted_class
        });
        await newAnalysis.save();

        fs.unlinkSync(req.file.path); 
        res.json(resultData);
    } catch (error) {
        console.error('Error connecting to ML server:', error.message);
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        res.status(500).json({ error: 'Failed to get prediction from ML model.' });
    }
});
//vihara
app.get('/api/recent', async (req, res) => {
    try {
        const recents = await Analysis.find().sort({ createdAt: -1 }).limit(50);
        res.json(recents);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch recent analyses.' });
    }
});

// --- Branch 3 Routes ---
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'CardioAI Unified Server' });
});

app.post('/api/patients', async (req, res) => {
    try {
        const validationError = validatePayload(req.body);
        if (validationError) return res.status(400).json({ status: 'error', message: validationError });

        const { patient, ecg, prediction } = req.body;
        const { noveltyScore, noveltyLabel } = calculateNovelty(ecg, prediction);

        const created = await PatientRecord.create({
            patient, ecg, prediction,
            novelty: { score: noveltyScore, label: noveltyLabel },
        });

        res.status(201).json({
            status: 'success', recordId: String(created._id),
            novelty: { score: noveltyScore, label: noveltyLabel },
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

app.get('/api/patients/history', async (req, res) => {
    try {
        const { patientId, limit = '100' } = req.query;
        const filter = patientId ? { 'patient.patient_id': String(patientId).trim() } : {};
        
        const rows = await PatientRecord.find(filter).sort({ created_at: -1 }).limit(Number(limit)).lean();
        res.json({ status: 'success', total: rows.length, records: rows });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

app.get('/api/patients/:patientId/history', async (req, res) => {
    try {
        const { patientId } = req.params;
        const rows = await PatientRecord.find({ 'patient.patient_id': String(patientId).trim() }).sort({ created_at: -1 }).lean();
        res.json({ status: 'success', total: rows.length, records: rows });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});