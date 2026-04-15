import React from 'react';

export default function ImageToCSV() {
  return (
    <div className="w-full h-full flex flex-col">
      <div className="p-2 bg-white border-b border-cyan-100">
        <h1 className="text-2xl font-bold text-gray-800">Image to CSV Digitizer</h1>
        <p className="text-sm text-gray-500 mt-1">Powered by Open ECG Digitizer</p>
      </div>
      
      {/* The iframe points directly to your locally running Streamlit app */}
      <div className="flex-1 w-full bg-gray-50">
        <iframe 
          src="http://localhost:8501" 
          title="Streamlit ECG Digitizer"
          className="w-full h-full border-0"
        />
      </div>
    </div>
  );
}