import React, { useState, useRef } from 'react';
import './VerifierPage.css';
import { verifyCredential } from '../utils/api';

const VerifierPage = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedFile({
          name: file.name,
          type: file.type,
          data: reader.result // Base64
        });
      };
      reader.readAsDataURL(file);
      setVerificationResult(null); // Reset previous result
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    
    if (!selectedFile) return;

    setLoading(true);
    setVerificationResult(null);

    try {
      // Simulate API call delay for UX
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const result = await verifyCredential(selectedFile);
      setVerificationResult(result);
    } catch (error) {
      console.error("Verification Error:", error);
      setVerificationResult({
        isValid: false,
        message: 'Verification process failed.',
        details: { status: 'ERROR', error: error.message }
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setVerificationResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="verifier-page-container fade-in">
      <div className="verifier-header">
        <h1 className="verifier-title">Certificate Verification</h1>
        <p className="verifier-subtitle">
          Upload a digital certificate to cryptographically verify its authenticity and issuer.
        </p>
      </div>

      <div className="verifier-main-card card">
        <form onSubmit={handleVerify} className="verify-form">
          <div className="form-group">
            <label className="form-label">Select Credential File</label>
            <div className="file-upload-container">
              <input
                ref={fileInputRef}
                id="verify-file-input"
                type="file"
                className="file-input"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              />
              <label htmlFor="verify-file-input" className="file-upload-label">
                <div className="file-upload-icon">
                  {selectedFile ? '📄' : '📎'}
                </div>
                <div className="file-upload-text">
                  {selectedFile ? (
                    <>
                      <span className="file-name">{selectedFile.name}</span>
                      <span className="file-change">Click to change file</span>
                    </>
                  ) : (
                    <>
                      <span className="file-prompt">Click to upload credential</span>
                      <span className="file-formats">Supports PDF, JPG, PNG</span>
                    </>
                  )}
                </div>
              </label>
            </div>
          </div>

          <div className="verify-actions">
            <button 
              type="submit" 
              className="btn btn-primary verify-btn"
              disabled={loading || !selectedFile}
            >
              {loading ? 'Verifying on Blockchain...' : 'Verify Certificate'}
            </button>
            
            
          </div>
        </form>

        {verificationResult && (
          <div className={`verification-result ${verificationResult.isValid ? 'valid' : 'invalid'}`}>
            <div className="result-icon">
              {verificationResult.isValid ? '✓' : '✕'}
            </div>
            <div className="result-content">
              <h2 className="result-title">
                {verificationResult.isValid ? 'Valid Credential' : 'Invalid Credential'}
              </h2>
              <p className="result-message">{verificationResult.message}</p>
              
              <div className="result-details">
                <div className="detail-row">
                  <span className="detail-label">File Name:</span>
                  <span className="detail-value">
                    {verificationResult.details?.filename || selectedFile.name}
                  </span>
                </div>
                
                <div className="detail-row">
                  <span className="detail-label">Issuer:</span>
                  <span className="detail-value">
                    {verificationResult.details?.issuer || "Unknown"}
                  </span>
                </div>

                <div className="detail-row">
                  <span className="detail-label">Verification Time:</span>
                  <span className="detail-value">
                    {new Date().toLocaleString()}
                  </span>
                </div>

                <div className="detail-row">
                  <span className="detail-label">Status:</span>
                  <span className={`status-badge ${verificationResult.isValid ? 'verified' : 'rejected'}`}>
                    {verificationResult.isValid ? 'VERIFIED' : 'REJECTED'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      
    </div>
  );
};

export default VerifierPage;
