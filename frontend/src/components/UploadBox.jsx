import { useRef, useState } from "react";
export default function UploadBox({
  selectedFile,
  onFileSelect,
  progress = 0,
  uploading = false,
}) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  function handleDrop(event) {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) onFileSelect(file);
  }
  return (
    <div
      className={`upload-box ${dragging ? "dragging" : ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.csv"
        hidden
        onChange={(e) => onFileSelect(e.target.files?.[0])}
      />
      <div className="upload-glyph">↥</div>
      <h3>
        {selectedFile ? selectedFile.name : "Drop your Excel or CSV file here"}
      </h3>
      <p>
        Supports .xlsx and .csv files with dates, categories, numbers, and messy
        blanks.
      </p>
      {uploading ? (
        <div className="progress-track">
          <span style={{ width: `${progress}%` }} />
        </div>
      ) : (
        <button type="button" className="secondary-button">
          Choose File
        </button>
      )}
    </div>
  );
}
