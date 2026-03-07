import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './PatientHistory.css';

function PatientHistory({ apiBaseUrl, refreshKey }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await axios.get(`${apiBaseUrl}/patients/history`, {
          params: {
            search,
            limit: 50,
          },
        });

        setRecords(response.data.records || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load patient history');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [apiBaseUrl, refreshKey, search]);

  return (
    <div className="history-card">
      <div className="history-header">
        <h3>Patient History</h3>
        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by patient ID or name"
        />
      </div>

      {loading && <p className="history-note">Loading history...</p>}
      {error && <p className="history-error">{error}</p>}
      {!loading && !error && records.length === 0 && <p className="history-note">No history records found.</p>}

      {!loading && !error && records.length > 0 && (
        <div className="history-table-wrap">
          <table className="history-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Patient</th>
                <th>ECG</th>
                <th>Prediction</th>
                <th>Novelty</th>
              </tr>
            </thead>
            <tbody>
              {records.map((item) => (
                <tr key={item.id}>
                  <td>{new Date(item.created_at).toLocaleString()}</td>
                  <td>
                    <strong>{item.patient.full_name}</strong>
                    <div>ID: {item.patient.patient_id}</div>
                    <div>{item.patient.age} / {item.patient.gender}</div>
                  </td>
                  <td>
                    <div>HR: {item.ecg.heart_rate_bpm}</div>
                    <div>PR: {item.ecg.pr_interval_s}</div>
                    <div>QRS: {item.ecg.qrs_duration_s}</div>
                  </td>
                  <td>
                    <div className={`prediction ${item.prediction.label === 'SVT' ? 'svt' : 'healthy'}`}>
                      {item.prediction.label}
                    </div>
                    <div>{(Number(item.prediction.svt_probability) * 100).toFixed(1)}%</div>
                  </td>
                  <td>
                    <div>{item.novelty.score}</div>
                    <div>{item.novelty.label}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default PatientHistory;
