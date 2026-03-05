const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/svt_patient_db';

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

const patientRecordSchema = new mongoose.Schema(
  {
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
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
    versionKey: false,
  }
);

const PatientRecord = mongoose.model('PatientRecord', patientRecordSchema);

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

  if (rr === 'irregular') {
    score += 10;
  }

  if (!pWavePresent) {
    score += 10;
  }

  score += Math.max(0, (probability - 0.5) * 30);

  const finalScore = Math.max(0, Math.min(100, Number(score.toFixed(2))));

  let noveltyLabel = 'Typical';
  if (finalScore >= 70) {
    noveltyLabel = 'High-risk Novel Pattern';
  } else if (finalScore >= 45) {
    noveltyLabel = 'Moderately Atypical';
  }

  return { noveltyScore: finalScore, noveltyLabel };
};

const validatePayload = (payload) => {
  const patient = payload.patient;
  const ecg = payload.ecg;
  const prediction = payload.prediction;

  if (!patient || !ecg || !prediction) {
    return 'patient, ecg, and prediction objects are required.';
  }

  const requiredPatient = ['patient_id', 'full_name', 'age', 'gender'];
  const missingPatient = requiredPatient.filter((field) => patient[field] === undefined || patient[field] === null || patient[field] === '');
  if (missingPatient.length > 0) {
    return `Missing patient fields: ${missingPatient.join(', ')}`;
  }

  const requiredEcg = ['heart_rate_bpm', 'pr_interval_s', 'qrs_duration_s', 'rr_regularity', 'p_wave_presence'];
  const missingEcg = requiredEcg.filter((field) => ecg[field] === undefined || ecg[field] === null || ecg[field] === '');
  if (missingEcg.length > 0) {
    return `Missing ECG fields: ${missingEcg.join(', ')}`;
  }

  const requiredPrediction = ['label', 'svt_probability'];
  const missingPrediction = requiredPrediction.filter((field) => prediction[field] === undefined || prediction[field] === null || prediction[field] === '');
  if (missingPrediction.length > 0) {
    return `Missing prediction fields: ${missingPrediction.join(', ')}`;
  }

  return null;
};

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'Patient History API', database: MONGODB_URI });
});

app.post('/api/patients', async (req, res) => {
  try {
    const validationError = validatePayload(req.body);
    if (validationError) {
      res.status(400).json({ status: 'error', message: validationError });
      return;
    }

    const { patient, ecg, prediction } = req.body;
    const { noveltyScore, noveltyLabel } = calculateNovelty(ecg, prediction);

    const created = await PatientRecord.create({
      patient: {
        patient_id: String(patient.patient_id).trim(),
        full_name: String(patient.full_name).trim(),
        age: Number(patient.age),
        gender: String(patient.gender).trim(),
        contact_number: patient.contact_number ? String(patient.contact_number).trim() : null,
        notes: patient.notes ? String(patient.notes).trim() : null,
      },
      ecg: {
        heart_rate_bpm: Number(ecg.heart_rate_bpm),
        pr_interval_s: Number(ecg.pr_interval_s),
        qrs_duration_s: Number(ecg.qrs_duration_s),
        rr_regularity: String(ecg.rr_regularity).trim(),
        p_wave_presence: Boolean(ecg.p_wave_presence),
      },
      prediction: {
        label: String(prediction.label).trim(),
        svt_probability: Number(prediction.svt_probability),
      },
      novelty: {
        score: noveltyScore,
        label: noveltyLabel,
      },
    });

    res.status(201).json({
      status: 'success',
      message: 'Patient record saved successfully.',
      recordId: String(created._id),
      novelty: {
        score: noveltyScore,
        label: noveltyLabel,
      },
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

app.get('/api/patients/history', async (req, res) => {
  try {
    const { patientId, search = '', limit = '100' } = req.query;
    const parsedLimit = Math.min(Math.max(Number(limit) || 100, 1), 500);

    const filter = {};

    if (patientId) {
      filter['patient.patient_id'] = String(patientId).trim();
    }

    if (search.trim()) {
      const term = search.trim();
      filter.$or = [
        { 'patient.full_name': { $regex: term, $options: 'i' } },
        { 'patient.patient_id': { $regex: term, $options: 'i' } },
      ];
    }

    const rows = await PatientRecord.find(filter)
      .sort({ created_at: -1 })
      .limit(parsedLimit)
      .lean();

    const formatted = rows.map((row) => ({
      id: String(row._id),
      patient: row.patient,
      ecg: row.ecg,
      prediction: row.prediction,
      novelty: row.novelty,
      created_at: row.created_at,
    }));

    res.json({ status: 'success', total: formatted.length, records: formatted });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

app.get('/api/patients/:patientId/history', async (req, res) => {
  try {
    const { patientId } = req.params;

    const rows = await PatientRecord.find({ 'patient.patient_id': String(patientId).trim() })
      .sort({ created_at: -1 })
      .lean();

    const formatted = rows.map((row) => ({
      id: String(row._id),
      patient: row.patient,
      ecg: row.ecg,
      prediction: row.prediction,
      novelty: row.novelty,
      created_at: row.created_at,
    }));

    res.json({ status: 'success', total: formatted.length, records: formatted });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Patient history server running on http://localhost:${PORT}`);
      console.log(`Connected to MongoDB: ${MONGODB_URI}`);
    });
  })
  .catch((error) => {
    console.error('Failed to connect MongoDB:', error.message);
    process.exit(1);
  });
