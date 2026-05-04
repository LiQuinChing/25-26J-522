import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import './PatientHistory.css';

const formatDate = (value) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'N/A' : date.toLocaleString();
};

const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

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
          params: { limit: 200 },
        });

        setRecords(response.data.records || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load patient history');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [apiBaseUrl, refreshKey]);

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return records;

    return records.filter((item) => {
      const patientId = String(item.patient?.patient_id || '').toLowerCase();
      const fullName = String(item.patient?.full_name || '').toLowerCase();
      return patientId.includes(query) || fullName.includes(query);
    });
  }, [records, search]);

  const handlePrintReport = () => {
    if (filteredRecords.length === 0) return;

    const patientNames = new Set(filteredRecords.map((item) => item.patient?.full_name).filter(Boolean));
    const patientIds = new Set(filteredRecords.map((item) => item.patient?.patient_id).filter(Boolean));
    const reportScope = search.trim()
      ? `Filtered by: ${escapeHtml(search.trim())}`
      : 'All patient history records';
    const patientSummary = patientNames.size === 1 && patientIds.size === 1
      ? `${escapeHtml([...patientNames][0])} (${escapeHtml([...patientIds][0])})`
      : `${filteredRecords.length} records`;

    const rows = filteredRecords.map((item) => `
      <tr>
        <td>${escapeHtml(formatDate(item.created_at))}</td>
        <td>
          <strong>${escapeHtml(item.patient?.full_name)}</strong><br>
          ID: ${escapeHtml(item.patient?.patient_id)}<br>
          ${escapeHtml(item.patient?.age)} / ${escapeHtml(item.patient?.gender)}
        </td>
        <td>
          HR: ${escapeHtml(item.ecg?.heart_rate_bpm)}<br>
          PR: ${escapeHtml(item.ecg?.pr_interval_s)}<br>
          QRS: ${escapeHtml(item.ecg?.qrs_duration_s)}
        </td>
        <td>
          <strong>${escapeHtml(item.prediction?.label)}</strong><br>
          ${(Number(item.prediction?.svt_probability || 0) * 100).toFixed(1)}%
        </td>
        <td>
          ${escapeHtml(item.novelty?.score)}<br>
          ${escapeHtml(item.novelty?.label)}
        </td>
      </tr>
    `).join('');

    const printWindow = window.open('', '_blank', 'width=1100,height=800');
    if (!printWindow) {
      setError('Print window was blocked. Allow pop-ups and try again.');
      return;
    }

    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>SVT Patient History Report</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              color: #172b3f;
              margin: 32px;
            }
            h1 {
              font-size: 22px;
              margin: 0 0 8px;
            }
            .meta {
              color: #516b7c;
              font-size: 13px;
              margin-bottom: 18px;
            }
            .summary {
              border: 1px solid #cfe2e8;
              border-radius: 8px;
              padding: 12px 14px;
              margin-bottom: 18px;
              background: #f7fbfc;
            }
            table {
              width: 100%;
              border-collapse: collapse;
            }
            th,
            td {
              border: 1px solid #d9e8ed;
              padding: 9px;
              text-align: left;
              vertical-align: top;
              font-size: 12px;
            }
            th {
              background: #eaf5f7;
              color: #0f2b46;
            }
            @media print {
              body { margin: 18mm; }
            }
          </style>
        </head>
        <body>
          <h1>SVT Patient History Report</h1>
          <div class="meta">Generated: ${escapeHtml(new Date().toLocaleString())}</div>
          <div class="summary">
            <strong>Report Scope:</strong> ${reportScope}<br>
            <strong>Patient:</strong> ${patientSummary}<br>
            <strong>Total Records:</strong> ${filteredRecords.length}
          </div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Patient</th>
                <th>ECG</th>
                <th>Prediction</th>
                <th>Novelty</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <div className="history-card">
      <div className="history-header">
        <h3>Patient History</h3>
        <div className="history-actions">
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by patient ID or name"
          />
          <button
            type="button"
            className="history-print-button"
            onClick={handlePrintReport}
            disabled={filteredRecords.length === 0}
          >
            Print Report
          </button>
        </div>
      </div>

      {loading && <p className="history-note">Loading history...</p>}
      {error && <p className="history-error">{error}</p>}
      {!loading && !error && filteredRecords.length === 0 && <p className="history-note">No history records found.</p>}

      {!loading && !error && filteredRecords.length > 0 && (
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
              {filteredRecords.map((item) => (
                <tr key={item._id || item.id}>
                  <td>{formatDate(item.created_at)}</td>
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
