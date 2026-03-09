const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const router = express.Router();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY_MI || process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

function extractImagePayload(imageDataUrl) {
  if (!imageDataUrl || typeof imageDataUrl !== 'string') {
    return null;
  }

  const match = imageDataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) {
    return null;
  }

  return {
    mimeType: match[1],
    data: match[2]
  };
}

function extractGeminiText(responseData) {
  const candidate = responseData?.candidates?.[0];
  const parts = candidate?.content?.parts || [];

  return parts
    .map((part) => part?.text || '')
    .join('')
    .trim();
}

function normalizeGuidancePayload(parsed) {
  const fallback = 'Cannot be determined from an ECG image alone. A time-to-heart-attack estimate would be medically unreliable. Urgent symptoms require immediate in-person medical care.';

  return {
    summary: typeof parsed?.summary === 'string' ? parsed.summary : 'No summary available.',
    preventionSteps: Array.isArray(parsed?.preventionSteps) ? parsed.preventionSteps.filter(Boolean).slice(0, 8) : [],
    urgentSigns: Array.isArray(parsed?.urgentSigns) ? parsed.urgentSigns.filter(Boolean).slice(0, 8) : [],
    followUpQuestions: Array.isArray(parsed?.followUpQuestions) ? parsed.followUpQuestions.filter(Boolean).slice(0, 6) : [],
    timeToEventAssessment: typeof parsed?.timeToEventAssessment === 'string' ? parsed.timeToEventAssessment : fallback,
    disclaimer: typeof parsed?.disclaimer === 'string' ? parsed.disclaimer : 'This is educational information only and not a diagnosis or emergency triage decision.'
  };
}

function buildFallbackGuidance(prediction) {
  const normalizedPrediction = String(prediction || 'Unknown');
  const summaryMap = {
    Normal: 'The model did not flag a myocardial infarction pattern in this ECG image, but symptoms and clinical history still matter.',
    'History of MI': 'The model output is more consistent with a previous myocardial infarction pattern than an acute event. Follow-up with a clinician is still important.',
    'Myocardial Infarction': 'The model flagged a pattern concerning for myocardial infarction. This is not a confirmed diagnosis, but urgent medical evaluation is important, especially if symptoms are present.'
  };

  return {
    summary: summaryMap[normalizedPrediction] || 'The model output needs clinician review together with symptoms, vital signs, and a medical history.',
    preventionSteps: [
      'Do not rely on this ECG image alone. Arrange prompt review by a qualified clinician.',
      'Control major risk factors such as smoking, high blood pressure, diabetes, cholesterol, and inactivity.',
      'Take prescribed heart medications exactly as directed and do not stop them without medical advice.',
      'Keep a record of chest pain episodes, shortness of breath, dizziness, and activity triggers.',
      'Seek same-day medical advice if symptoms are new, worsening, or recurring.'
    ],
    urgentSigns: [
      'Crushing or persistent chest pain or pressure',
      'Shortness of breath at rest or with minimal activity',
      'Fainting, severe weakness, or confusion',
      'Pain spreading to the arm, jaw, back, or shoulder',
      'Blue lips, cold sweats, or rapidly worsening symptoms'
    ],
    followUpQuestions: [
      'Do I need a 12-lead ECG, troponin test, or emergency evaluation?',
      'Which risk factors should I manage first based on my history?',
      'What symptoms mean I should call emergency services immediately?',
      'Do I need follow-up with a cardiologist or additional imaging?',
      'What lifestyle changes would most reduce my heart risk right now?'
    ],
    timeToEventAssessment: 'Cannot be determined from an ECG image alone. A prediction of when a heart attack might happen would be medically unsafe and unreliable.',
    disclaimer: 'Gemini guidance was unavailable, so this fallback uses general educational heart-care advice. It is not a diagnosis or emergency triage decision.'
  };
}

async function generateMiGuidance({ patientId, patientName, prediction, confidence, imageDataUrl }) {
  if (!GEMINI_API_KEY) {
    const error = new Error('Gemini API key is not configured on the backend.');
    error.statusCode = 503;
    throw error;
  }

  const imagePayload = extractImagePayload(imageDataUrl);
  if (!imagePayload) {
    const error = new Error('A valid ECG image is required for AI guidance.');
    error.statusCode = 400;
    throw error;
  }

  const prompt = [
    'You are assisting with educational follow-up information for a myocardial infarction screening app.',
    'Use the supplied ECG image and model output only to provide patient-friendly educational guidance.',
    'Do not claim a diagnosis, do not estimate when a heart attack will happen, and do not give a probability of imminent death or timing.',
    'If asked for timing, explicitly say it cannot be determined from an ECG image alone and requires clinician evaluation.',
    'Keep the tone clear and readable for a patient.',
    'Return strict JSON with these keys only: summary, preventionSteps, urgentSigns, followUpQuestions, timeToEventAssessment, disclaimer.',
    'preventionSteps, urgentSigns, and followUpQuestions must be arrays of short strings.',
    `Patient ID: ${patientId || 'Unknown'}`,
    `Patient name: ${patientName || 'Unknown'}`,
    `Model prediction: ${prediction || 'Unknown'}`,
    `Model confidence: ${typeof confidence === 'number' ? confidence : 'Unknown'}`,
    'The output must include advice to seek emergency care for symptoms such as crushing chest pain, severe shortness of breath, fainting, blue lips, or new worsening symptoms.'
  ].join('\n');

  const response = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: imagePayload.mimeType,
                data: imagePayload.data
              }
            }
          ]
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
  } catch (error) {
    const parseError = new Error('Gemini returned an unreadable response.');
    parseError.statusCode = 502;
    throw parseError;
  }

  return normalizeGuidancePayload(parsed);
}

// ============================================
// 1. BRANCH 4 MONGODB SCHEMAS (Defined locally)
// ============================================
const patientSchema = new mongoose.Schema({
  patientId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, default: '' },
  phone: { type: String, default: '' },
  dateOfBirth: { type: Date, default: null },
  gender: { type: String, default: '' },
  updatedAt: { type: Date, default: Date.now }
});
const Patient = mongoose.model('MIPatient', patientSchema);

const resultSchema = new mongoose.Schema({
  patientId: { type: String, required: true },
  patientName: { type: String, required: true },
  prediction: { type: String, required: true },
  confidence: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  time: { type: String, required: true },
  imageFile: { type: String, default: '' },
  additionalNotes: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});
const Result = mongoose.model('MIResult', resultSchema);


// ============================================
// PATIENT ENDPOINTS
// ============================================

/**
 * GET /api/patient/:patientId
 * Check if patient exists and get their info
 */
router.get('/patient/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    const patient = await Patient.findOne({ patientId });
    
    if (patient) {
      res.json({ success: true, exists: true, patient });
    } else {
      res.json({ success: true, exists: false, message: 'Patient not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/patient
 * Create or update patient
 */
router.post('/patient', async (req, res) => {
  try {
    const { patientId, name, email, phone, dateOfBirth, gender } = req.body;
    
    // Validation
    if (!patientId || !name) {
      return res.status(400).json({
        success: false,
        error: 'Patient ID and name are required'
      });
    }
    
    // Find existing patient or create new one
    let patient = await Patient.findOne({ patientId });
    
    if (patient) {
      // Update existing patient
      patient.name = name;
      patient.email = email || patient.email;
      patient.phone = phone || patient.phone;
      patient.dateOfBirth = dateOfBirth || patient.dateOfBirth;
      patient.gender = gender || patient.gender;
      patient.updatedAt = Date.now();
      await patient.save();
      
      res.json({
        success: true,
        message: 'Patient updated successfully',
        patient: {
          patientId: patient.patientId,
          name: patient.name,
          email: patient.email,
          phone: patient.phone,
          dateOfBirth: patient.dateOfBirth,
          gender: patient.gender
        }
      });
    } else {
      // Create new patient
      patient = new Patient({
        patientId,
        name,
        email: email || '',
        phone: phone || '',
        dateOfBirth: dateOfBirth || null,
        gender: gender || ''
      });
      
      await patient.save();
      
      res.status(201).json({
        success: true,
        message: 'Patient created successfully',
        patient: {
          patientId: patient.patientId,
          name: patient.name,
          email: patient.email,
          phone: patient.phone,
          dateOfBirth: patient.dateOfBirth,
          gender: patient.gender
        }
      });
    }
  } catch (error) {
    console.error('Error saving patient:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// RESULT ENDPOINTS
// ============================================

/**
 * POST /api/result
 * Save ECG analysis result
 */
router.post('/result', async (req, res) => {
  try {
    const {
      patientId,
      patientName,
      prediction,
      confidence,
      date,
      time,
      imageFile,
      additionalNotes
    } = req.body;
    
    // Validation
    if (!patientId || !patientName || !prediction || confidence === undefined || !time) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: patientId, patientName, prediction, confidence, time'
      });
    }
    
    // Validate prediction value
    const validPredictions = ['Normal', 'History of MI', 'Myocardial Infarction'];
    if (!validPredictions.includes(prediction)) {
      return res.status(400).json({
        success: false,
        error: `Invalid prediction. Must be one of: ${validPredictions.join(', ')}`
      });
    }
    
    // Create new result
    const result = new Result({
      patientId,
      patientName,
      prediction,
      confidence: parseFloat(confidence),
      date: date ? new Date(date) : new Date(),
      time,
      imageFile: imageFile || '',
      additionalNotes: additionalNotes || ''
    });
    
    await result.save();
    
    res.status(201).json({
      success: true,
      message: 'Result saved successfully',
      result: {
        id: result._id,
        patientId: result.patientId,
        patientName: result.patientName,
        prediction: result.prediction,
        confidence: result.confidence,
        date: result.date,
        time: result.time,
        imageFile: result.imageFile,
        additionalNotes: result.additionalNotes,
        createdAt: result.createdAt
      }
    });
  } catch (error) {
    console.error('Error saving result:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/results/:patientId
 * Get all results for a specific patient
 */
router.get('/results/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    
    const results = await Result.find({ patientId })
      .sort({ createdAt: -1 })
      .lean();
    
    res.json({
      success: true,
      count: results.length,
      results: results.map(r => ({
        id: r._id,
        patientId: r.patientId,
        patientName: r.patientName,
        prediction: r.prediction,
        confidence: r.confidence,
        date: r.date,
        time: r.time,
        imageFile: r.imageFile,
        additionalNotes: r.additionalNotes,
        createdAt: r.createdAt
      }))
    });
  } catch (error) {
    console.error('Error fetching results:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/results
 * Get all results (with pagination)
 */
router.get('/results', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    
    const total = await Result.countDocuments();
    const results = await Result.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    res.json({
      success: true,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
      count: results.length,
      results: results.map(r => ({
        id: r._id,
        patientId: r.patientId,
        patientName: r.patientName,
        prediction: r.prediction,
        confidence: r.confidence,
        date: r.date,
        time: r.time,
        imageFile: r.imageFile,
        additionalNotes: r.additionalNotes,
        createdAt: r.createdAt
      }))
    });
  } catch (error) {
    console.error('Error fetching all results:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/mi-guidance', async (req, res) => {
  try {
    const { patientId, patientName, prediction, confidence, imageDataUrl } = req.body;

    if (!prediction || confidence === undefined || !imageDataUrl) {
      return res.status(400).json({
        success: false,
        error: 'prediction, confidence, and imageDataUrl are required'
      });
    }

    const guidance = await generateMiGuidance({
      patientId,
      patientName,
      prediction,
      confidence: Number(confidence),
      imageDataUrl
    });

    res.json({
      success: true,
      guidance
    });
  } catch (error) {
    if (error.response?.status === 429 || error.response?.status >= 500) {
      return res.json({
        success: true,
        guidance: buildFallbackGuidance(req.body.prediction),
        source: 'fallback'
      });
    }

    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      success: false,
      error: error.message || 'Failed to generate MI guidance'
    });
  }
});

/**
 * DELETE /api/result/:resultId
 * Delete a specific result
 */
router.delete('/result/:resultId', async (req, res) => {
  try {
    const { resultId } = req.params;
    
    const result = await Result.findByIdAndDelete(resultId);
    
    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Result not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Result deleted successfully',
      deletedResult: {
        id: result._id,
        patientId: result.patientId,
        prediction: result.prediction,
        date: result.date
      }
    });
  } catch (error) {
    console.error('Error deleting result:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
