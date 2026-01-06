import React, { useState } from "react";

export default function LabUpload({ onSummaryReady }) {
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const uploadAndSummarize = async () => {
    if (!file) return;
    setBusy(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("labFile", file);

      // Backend endpoint (you'll add this in Part B)
      const res = await fetch("/api/labs/summarize", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Upload failed");
      }

      const data = await res.json();

      // data.summary is a formatted string
      onSummaryReady?.(data.summary);
    } catch (e) {
      setError(e.message || "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="lab-upload-card">
      <div className="lab-upload-title">Upload labs (demo)</div>
      <div className="lab-upload-subtitle">
        For safety, upload de-identified labs when possible (remove name/DOB/MRN).
        Files are processed temporarily and not stored.
      </div>

      <div className="lab-upload-row">
        <input
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.txt"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
        <button onClick={uploadAndSummarize} disabled={!file || busy}>
          {busy ? "Analyzing…" : "Summarize"}
        </button>
      </div>

      {file && (
        <div className="lab-upload-file">
          Selected: <b>{file.name}</b>
        </div>
      )}

      {error && <div className="lab-upload-error">{error}</div>}
    </div>
  );
}
