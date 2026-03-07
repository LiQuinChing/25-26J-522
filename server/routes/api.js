const express = require('express');
const router = express.Router();
const Patient = require('../models/Patient');
const Result = require('../models/Result');

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
      res.json({
        success: true,
        exists: true,
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
      res.json({
        success: true,
        exists: false,
        message: 'Patient not found'
      });
    }
  } catch (error) {
    console.error('Error fetching patient:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
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
