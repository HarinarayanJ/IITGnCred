import React, { useState } from 'react';
import './IssuerDashboard.css';
import { issueCredential, revokeCredential } from '../utils/api';

const IssuerDashboard = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('create');

  // CREATE STATE
  const [holderWallet, setHolderWallet] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  // Optional: Add course name/metadata state if needed, but keeping it simple as per request
  const [courseName, setCourseName] = useState(''); 

  // REVOKE STATE
  const [revokeId, setRevokeId] = useState('');
  
  // UI STATE
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleFileChange = (e, setFile) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setFile({
        name: file.name,
        type: file.type,
        data: reader.result, // Base64 data
      });
    };
    reader.readAsDataURL(file);
  };

  const handleIssue = async (e) => {
    e.preventDefault();

    if (!holderWallet || !selectedFile) {
      setMessage({ type: 'error', text: 'Please provide holder wallet and select a file' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // API call expects wallet address and file object
      const result = await issueCredential(holderWallet, selectedFile, courseName);
      
      setMessage({ type: 'success', text: result.message || "Credential issued successfully!" });

      // Reset Form
      setHolderWallet('');
      setCourseName('');
      setSelectedFile(null);
      
      // Reset file input visually
      const fileInput = document.getElementById('create-file-input');
      if(fileInput) fileInput.value = '';
      
    } catch (err) {
      setMessage({ type: 'error', text: err.message || "Issuance failed" });
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (e) => {
    e.preventDefault();

    if (!revokeId) {
      setMessage({ type: 'error', text: 'Please provide the Credential ID to revoke' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const result = await revokeCredential(revokeId);
      setMessage({ type: 'success', text: result.message || "Credential revoked successfully" });

      setRevokeId('');
    } catch (err) {
      setMessage({ type: 'error', text: err.message || "Revocation failed" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="issuer-dashboard-container fade-in">
      {/* HEADER */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Issuer Dashboard</h1>
          <p className="dashboard-subtitle">
            Organization: <strong>{user.name}</strong>
          </p>
        </div>
        <button className="btn btn-secondary" onClick={onLogout}>
          Logout
        </button>
      </div>

      {/* TABS */}
      <div className="tab-header">
        <button
          className={`tab-btn ${activeTab === 'create' ? 'active' : ''}`}
          onClick={() => { setActiveTab('create'); setMessage({type:'', text:''}); }}
        >
          ➕ Issue Credential
        </button>
        <button
          className={`tab-btn ${activeTab === 'revoke' ? 'active' : ''}`}
          onClick={() => { setActiveTab('revoke'); setMessage({type:'', text:''}); }}
        >
          🗑️ Revoke Credential
        </button>
      </div>

      {/* MAIN CARD */}
      <div className="issuer-main-card card">
        <div className="card-header">
          <h2 className="card-title">
            {activeTab === 'create' ? 'Issue New Credential' : 'Revoke Credential'}
          </h2>
          <p className="card-description">
            {activeTab === 'create'
              ? 'Upload a document and issue it to a student\'s wallet address.'
              : 'Permanently revoke a credential using its ID.'}
          </p>
        </div>

        {message.text && (
          <div className={`message message-${message.type}`}>
            {message.text}
          </div>
        )}

        {/* --- CREATE TAB --- */}
        {activeTab === 'create' && (
          <form onSubmit={handleIssue} className="issue-form">
            <div className="form-group">
              <label className="form-label">Student Wallet Address</label>
              <input
                type="text"
                className="form-input mono"
                value={holderWallet}
                onChange={(e) => setHolderWallet(e.target.value)}
                placeholder="0x..."
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Course / Credential Name</label>
              <input
                type="text"
                className="form-input"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                placeholder="e.g. B.Tech Computer Science"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Credential Document</label>
              <div className="file-upload-container">
                <input
                  id="create-file-input"
                  type="file"
                  className="file-input"
                  onChange={(e) => handleFileChange(e, setSelectedFile)}
                  accept=".pdf,.jpg,.png"
                  required
                />
                <label htmlFor="create-file-input" className="file-upload-label">
                  {selectedFile ? (
                    <span>📄 {selectedFile.name}</span>
                  ) : (
                    <span>📂 Click to upload PDF or Image</span>
                  )}
                </label>
              </div>
            </div>

            <button className="btn btn-primary submit-btn" disabled={loading}>
              {loading ? 'Minting on Blockchain...' : '🚀 Issue Credential'}
            </button>
          </form>
        )}

        {/* --- REVOKE TAB --- */}
        {activeTab === 'revoke' && (
          <form onSubmit={handleRevoke} className="issue-form">
            <div className="form-group">
              <label className="form-label">Credential ID</label>
              <input
                type="text"
                className="form-input mono"
                value={revokeId}
                onChange={(e) => setRevokeId(e.target.value)}
                placeholder="Enter the ID of the credential to revoke"
                required
              />
              <small className="form-help">
                This action is irreversible. The credential will be marked as invalid on the blockchain.
              </small>
            </div>

            <button className="btn btn-danger submit-btn" disabled={loading}>
              {loading ? 'Revoking...' : '🗑️ Revoke Credential'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default IssuerDashboard;
