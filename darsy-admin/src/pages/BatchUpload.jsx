import React, { useState } from 'react';
import { Search, Upload, AlertCircle, FileJson, CheckCircle2, Loader2, X } from 'lucide-react';
import './BatchUpload.css';

const BatchUpload = () => {
    const [dragActive, setDragActive] = useState(false);
    const [files, setFiles] = useState([]);
    const [isUploading, setIsUploading] = useState(false);

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFiles(e.dataTransfer.files);
        }
    };

    const handleChange = (e) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            handleFiles(e.target.files);
        }
    };

    const handleFiles = (newFiles) => {
        const jsonFiles = Array.from(newFiles).filter(file => file.type === "application/json" || file.name.endsWith('.json'));
        setFiles(prev => [...prev, ...jsonFiles]);
    };

    const removeFile = (index) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const uploadAll = async () => {
        setIsUploading(true);
        // Simulate upload process
        await new Promise(resolve => setTimeout(resolve, 2000));
        setIsUploading(false);
        setFiles([]);
        alert("Simulation: Batch upload complete!");
    };

    return (
        <div className="batch-upload">
            <div className="page-header">
                <h2>Batch Upload Content</h2>
                <p>Drop your Alloschool JSON files here to sync them with Firebase.</p>
            </div>

            <div className="upload-container card">
                <form
                    className={`drop-zone ${dragActive ? 'active' : ''}`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                >
                    <input
                        type="file"
                        id="file-upload"
                        multiple={true}
                        accept=".json"
                        onChange={handleChange}
                    />
                    <label htmlFor="file-upload" className="drop-label">
                        <div className="upload-icon">
                            <Upload size={48} />
                        </div>
                        <p className="primary-text">Drag and drop your JSON files here</p>
                        <p className="secondary-text">or click to browse from your computer</p>
                    </label>
                </form>

                {files.length > 0 && (
                    <div className="file-list-container">
                        <h3>Files to be processed ({files.length})</h3>
                        <ul className="selected-files">
                            {files.map((file, index) => (
                                <li key={index} className="file-item">
                                    <div className="file-icon">
                                        <FileJson size={20} />
                                    </div>
                                    <div className="file-meta">
                                        <span className="file-name">{file.name}</span>
                                        <span className="file-size">{(file.size / 1024).toFixed(1)} KB</span>
                                    </div>
                                    <button className="remove-btn" onClick={() => removeFile(index)}>
                                        <X size={16} />
                                    </button>
                                </li>
                            ))}
                        </ul>

                        <div className="action-footer">
                            <button
                                className="btn-primary upload-btn"
                                onClick={uploadAll}
                                disabled={isUploading}
                            >
                                {isUploading ? (
                                    <>
                                        <Loader2 size={18} className="spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 size={18} />
                                        Confirm & Sync to Firebase
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div className="upload-info card">
                <div className="info-icon">
                    <AlertCircle size={24} />
                </div>
                <div className="info-content">
                    <h4>Before you upload</h4>
                    <p>Make sure your JSON files follow the standard Alloschool hierarchy (Guidance - Level - Subject). The system will automatically detect existing items and update them if needed.</p>
                </div>
            </div>
        </div>
    );
};

export default BatchUpload;
