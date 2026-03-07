import axios from 'axios';

const BACKEND_API_URL = process.env.REACT_APP_BACKEND_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: `${BACKEND_API_URL}/api`,
  timeout: 10000,
});

const ResultsService = {
  async getPatient(patientId) {
    const response = await api.get(`/patient/${encodeURIComponent(patientId)}`);
    return response.data;
  },

  async savePatient(patient) {
    const response = await api.post('/patient', patient);
    return response.data;
  },

  async saveResult(resultPayload) {
    const response = await api.post('/result', resultPayload);
    return response.data;
  },

  async getPatientResults(patientId) {
    const response = await api.get(`/results/${encodeURIComponent(patientId)}`);
    return response.data;
  },

  async getRecentResults(limit = 20) {
    const response = await api.get('/results', {
      params: { page: 1, limit },
    });
    return response.data;
  },
};

export default ResultsService;
