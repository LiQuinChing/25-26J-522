import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './ECGChart.css';

function ECGChart({ data }) {
  // Convert array to chart data format
  const chartData = data.map((value, index) => ({
    index: index,
    value: value
  }));

  return (
    <div className="ecg-chart">
      <h3>ECG Signal Visualization</h3>
      <p className="chart-description">
        Displaying {data.length} data points from the ECG signal
      </p>
      
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis 
              dataKey="index" 
              label={{ value: 'Sample Index', position: 'insideBottom', offset: -5 }}
              stroke="#666"
            />
            <YAxis 
              label={{ value: 'Amplitude', angle: -90, position: 'insideLeft' }}
              stroke="#666"
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #ccc',
                borderRadius: '8px'
              }}
              formatter={(value) => [value.toFixed(4), 'Value']}
              labelFormatter={(label) => `Sample: ${label}`}
            />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="#667eea" 
              strokeWidth={2}
              dot={false}
              animationDuration={1000}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-stats">
        <div className="stat-item">
          <span className="stat-label">Min Value:</span>
          <span className="stat-value">{Math.min(...data).toFixed(4)}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Max Value:</span>
          <span className="stat-value">{Math.max(...data).toFixed(4)}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Mean Value:</span>
          <span className="stat-value">
            {(data.reduce((a, b) => a + b, 0) / data.length).toFixed(4)}
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Data Points:</span>
          <span className="stat-value">{data.length}</span>
        </div>
      </div>
    </div>
  );
}

export default ECGChart;
