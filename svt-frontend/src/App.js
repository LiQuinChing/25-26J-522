import { useState } from "react";

function App() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState("");

  const uploadImage = async () => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("http://127.0.0.1:8000/predict", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    setResult(`Prediction: ${data.prediction}`);
  };

  return (
    <div style={{ padding: "40px" }}>
      <h2>SVT Detection System</h2>

      <input type="file" onChange={(e) => setFile(e.target.files[0])} />
      <br /><br />
      <button onClick={uploadImage}>Analyze ECG</button>

      <h3>{result}</h3>
    </div>
  );
}

export default App;
