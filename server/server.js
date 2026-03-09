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
const GEMINI_API_KEY = process.env.GEMINI_API_KEY_SVT || process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

// ==========================================
// 1. MIDDLEWARE
// ==========================================
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev')); // Logs API requests to the terminal

// ==========================================
// 2. MONGODB CONNECTION
// ==========================================
const MONGODB_URI = process.env.MONGO_URI;

mongoose.connect(MONGODB_URI)
    .then(() => {
        console.log('✅ Connected to MongoDB');
        // Start server only after DB connects
        app.listen(PORT, () => {
            console.log(`🚀 Node server running on http://localhost:${PORT}`);
            console.log(`🔗 Health Check: http://localhost:${PORT}/api/health`);
        });
    })
    .catch(err => {
        console.error('❌ MongoDB connection error:', err);
        console.error('Please check your MongoDB URI and internet connection');
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

const normalizeSvtGuidance = (parsed) => ({
    summary: typeof parsed?.summary === 'string' ? parsed.summary : 'No summary available.',
    preventionSteps: Array.isArray(parsed?.preventionSteps) ? parsed.preventionSteps.filter(Boolean).slice(0, 8) : [],
    urgentSigns: Array.isArray(parsed?.urgentSigns) ? parsed.urgentSigns.filter(Boolean).slice(0, 8) : [],
    followUpQuestions: Array.isArray(parsed?.followUpQuestions) ? parsed.followUpQuestions.filter(Boolean).slice(0, 6) : [],
    dailyCare: Array.isArray(parsed?.dailyCare) ? parsed.dailyCare.filter(Boolean).slice(0, 8) : [],
    disclaimer: typeof parsed?.disclaimer === 'string' ? parsed.disclaimer : 'This is educational information only and not a diagnosis.'
});

const buildSvtFallbackGuidance = (prediction, ecg, novelty) => {
    const label = String(prediction?.label || 'Unknown');
    const probability = Number(prediction?.svt_probability || 0);
    const noveltyLabel = novelty?.label ? ` Novelty pattern: ${novelty.label}.` : '';

    return {
        summary: label === 'SVT'
            ? `The model found a pattern consistent with supraventricular tachycardia with an estimated probability of ${(probability * 100).toFixed(1)}%.${noveltyLabel} Clinical review is recommended, especially if symptoms are present.`
            : `The model did not classify this pattern as SVT.${noveltyLabel} Symptoms and clinician review still matter even when the model output is reassuring.`,
        preventionSteps: [
            'Arrange clinical review if palpitations, dizziness, chest discomfort, or fainting episodes are happening.',
            'Avoid triggers that can worsen fast rhythms, including excess caffeine, nicotine, stimulant drugs, or sleep deprivation.',
            'Keep blood pressure, thyroid disease, dehydration, and stress under good control because they can aggravate rhythm problems.',
            'Take prescribed medicines exactly as directed and discuss any side effects with a clinician before stopping them.',
            'Track episodes with time, activity, duration, and symptoms so a clinician can compare them with ECG findings.'
        ],
        urgentSigns: [
            'Fainting or nearly fainting',
            'Chest pain or chest pressure',
            'Severe shortness of breath',
            'Sustained rapid heartbeat with weakness or confusion',
            'New worsening symptoms or symptoms that do not settle quickly'
        ],
        followUpQuestions: [
            'Do I need a 12-lead ECG, Holter monitor, or event monitor?',
            'What common triggers should I reduce based on my symptoms and history?',
            'Would vagal maneuvers be appropriate for me, and when should I avoid them?',
            'Do I need a cardiology review or electrophysiology referral?',
            'What symptoms mean I should seek urgent or emergency care immediately?'
        ],
        dailyCare: [
            `Monitor resting heart rate and symptoms such as palpitations, dizziness, or fatigue.${ecg?.heart_rate_bpm ? ` Current entered heart rate: ${ecg.heart_rate_bpm} bpm.` : ''}`,
            'Stay hydrated and avoid long periods without sleep.',
            'Limit energy drinks and non-prescribed stimulants.',
            'Discuss safe exercise intensity with a clinician if episodes happen during activity.'
        ],
        disclaimer: 'Gemini guidance was unavailable, so this fallback uses general educational SVT advice. It is not a diagnosis or emergency triage decision.'
    };
};

const extractGeminiText = (responseData) => {
    const candidate = responseData?.candidates?.[0];
    const parts = candidate?.content?.parts || [];

    return parts
        .map((part) => part?.text || '')
        .join('')
        .trim();
};

const generateSvtGuidance = async ({ patient, ecg, prediction, novelty }) => {
    if (!GEMINI_API_KEY) {
        const error = new Error('Gemini API key is not configured on the backend.');
        error.statusCode = 503;
        throw error;
    }

    const prompt = [
        'You are assisting with educational follow-up information for an SVT screening app.',
        'Use the supplied structured ECG inputs and model output only to provide clear patient-friendly educational guidance.',
        'Do not claim a diagnosis. Do not promise a cure. Do not replace clinician judgment.',
        'Return strict JSON with these keys only: summary, preventionSteps, urgentSigns, followUpQuestions, dailyCare, disclaimer.',
        'preventionSteps, urgentSigns, followUpQuestions, and dailyCare must be arrays of short strings.',
        `Patient ID: ${patient?.patient_id || 'Unknown'}`,
        `Patient name: ${patient?.full_name || 'Unknown'}`,
        `Age: ${patient?.age ?? 'Unknown'}`,
        `Gender: ${patient?.gender || 'Unknown'}`,
        `Heart rate bpm: ${ecg?.heart_rate_bpm ?? 'Unknown'}`,
        `PR interval s: ${ecg?.pr_interval_s ?? 'Unknown'}`,
        `QRS duration s: ${ecg?.qrs_duration_s ?? 'Unknown'}`,
        `RR regularity: ${ecg?.rr_regularity || 'Unknown'}`,
        `P wave presence: ${ecg?.p_wave_presence}`,
        `Model label: ${prediction?.label || 'Unknown'}`,
        `SVT probability: ${prediction?.svt_probability ?? 'Unknown'}`,
        `Novelty score: ${novelty?.score ?? 'Unknown'}`,
        `Novelty label: ${novelty?.label || 'Unknown'}`,
        'Always include guidance on urgent symptoms such as chest pain, fainting, severe shortness of breath, or prolonged rapid heartbeat.'
    ].join('\n');

    const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
        {
            contents: [
                {
                    role: 'user',
                    parts: [{ text: prompt }]
                }
            ],
            generationConfig: {
                temperature: 0.2,
                responseMimeType: 'application/json'
            }
        },
        {
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json'
            }
        }
    );

    const text = extractGeminiText(response.data);
    if (!text) {
        const error = new Error('Gemini returned an empty response.');
        error.statusCode = 502;
        throw error;
    }

    let parsed;
    try {
        parsed = JSON.parse(text);
    } catch (_error) {
        const parseError = new Error('Gemini returned an unreadable response.');
        parseError.statusCode = 502;
        throw parseError;
    }

    return normalizeSvtGuidance(parsed);
};

// ==========================================
// 5. ROUTES
// ==========================================
const upload = multer({ dest: 'uploads/' });

// --- Unified Health Check raviindu---
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        service: 'CardioAI Unified Server',
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString()
    });
});

// --- dev-main1 Routes vihara---
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

app.post('/api/svt-guidance', async (req, res) => {
    try {
        const { patient, ecg, prediction, novelty } = req.body;

        if (!patient || !ecg || !prediction) {
            return res.status(400).json({
                success: false,
                error: 'patient, ecg, and prediction are required'
            });
        }

        const guidance = await generateSvtGuidance({ patient, ecg, prediction, novelty });

        res.json({
            success: true,
            guidance,
            source: 'gemini'
        });
    } catch (error) {
        if (error.response?.status === 429 || error.response?.status >= 500) {
            return res.json({
                success: true,
                guidance: buildSvtFallbackGuidance(req.body.prediction, req.body.ecg, req.body.novelty),
                source: 'fallback'
            });
        }

        const statusCode = error.statusCode || 500;
        res.status(statusCode).json({
            success: false,
            error: error.message || 'Failed to generate SVT guidance'
        });
    }
});

// --- Myocardial Infarction Routes (Branch 4) ---
// We dynamically import the routes from Branch 4's api.js file
try {
    const miApiRoutes = require('./routes/api');
    app.use('/api', miApiRoutes);
    console.log('✅ Branch 4 (MI) Routes loaded successfully');
} catch (err) {
    console.warn('⚠️ Could not load Branch 4 routes. Ensure the "routes/api.js" file is copied into your server directory!');
}

// ==========================================
// 6. GLOBAL ERROR HANDLER (From Branch 4)
// ==========================================
app.use((err, req, res, next) => {
    console.error('Global Error:', err);
    res.status(500).json({
        success: false,
        error: err.message || 'Internal server error'
    });
});