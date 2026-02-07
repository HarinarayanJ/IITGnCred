import React, { useState, useEffect } from 'react';
import './HolderDashboard.css';
import { getHolderCredentials } from '../utils/api';
import { ellipsis } from '../utils/crypto';

const HolderDashboard = ({ user, onLogout }) => {
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCredential, setSelectedCredential] = useState(null);

  // Load credentials on mount or when user wallet changes
  useEffect(() => {
    if (user && user.wallet) {
      loadCredentials();
    }
  });

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (selectedCredential) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [selectedCredential]);

  const loadCredentials = async () => {
    setLoading(true);
    try {
      const creds = await getHolderCredentials(user.wallet);
      console.log("Fetched credentials for wallet:", user.wallet);
      setCredentials(creds || []);
    } catch (error) {
      console.error('Failed to load credentials:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper to construct IPFS URL
  const getFileUrl = (credential) => {
    return `http://localhost:8080/ipfs/${credential.cid}`;
  };

  const handleDownload = (credential) => {
    const fileUrl = getFileUrl(credential);
    console.log("Constructed file URL for download:", fileUrl);
    
    if (!fileUrl) {
      alert("File data not available");
      return;
    }

    const link = document.createElement('a');
    link.href = fileUrl;
    link.target = '_blank';
    link.download = credential.fileName || `credential-${credential.id}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const closeModal = () => {
    setSelectedCredential(null);
  };

  return (
    <div className="holder-dashboard-container fade-in">
      {/* Header Section */}
      <div className="dashboard-header">
        <div className="header-info">
          <h1 className="dashboard-title">Holder Dashboard</h1>
          <p className="dashboard-subtitle">
            Welcome back, {user.name} 
          </p>
        </div>
        <button className="btn btn-secondary logout-btn" onClick={onLogout}>
          Logout
        </button>
      </div>

      <div className="credentials-section">
        {/* Count/Stats Bar */}
        <div className="section-header">
          <h2 className="section-title">Your Credentials</h2>
          <div className="credential-count">
            {/* <span className="count-number">{credentials.length}</span> */}
            <span className="count-label">Total: {credentials.length}</span>
          </div>
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading credentials...</p>
          </div>
        ) : credentials.length === 0 ? (
          <div className="empty-state card">
            <div className="empty-icon">📭</div>
            <h3>No Credentials Yet</h3>
            <p>Your credentials will appear here once issued by your Issuer.</p>
          </div>
        ) : (
          <div className="credentials-grid">
            {credentials.map((credential, index) => (
              <div 
                key={credential.id || index} 
                className="credential-card card"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="credential-header">
                  <div className="credential-icon">
                    {(credential.fileType || '').includes('pdf') ? '📄' : '🎓'}
                  </div>
                  <div className="credential-badge">Verified</div>
                </div>
                
                <div className="credential-body">
                  <h3 className="credential-name">
                    {credential.courseName || credential.fileName || "Credential"}
                  </h3>
                  
                  <div className="credential-meta">
                    <div className="meta-item">
                      <span className="meta-label">Issuer:</span>
                      <span className="meta-value">{ellipsis(credential.issuerName || credential.issuer, 10)}</span>
                    </div>
                    
                    <div className="meta-item">
                      <span className="meta-label">Issued:</span>
                      <span className="meta-value">
                        {credential.timestamp 
                          ? new Date(credential.timestamp).toLocaleDateString() 
                          : new Date().toLocaleDateString()}
                      </span>
                    </div>

                    <div className="meta-item">
                      <span className="meta-label">ID:</span>
                      <span className="meta-value credential-id" title={credential.id}>
                        {credential.id ? credential.id.toString().slice(0, 8) + '...' : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="credential-actions">
                  <button className="btn btn-primary action-btn" onClick={() => handleDownload(credential)}>
                    Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* --- RESPONSIVE MODAL --- */}
      {selectedCredential && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {selectedCredential.courseName || selectedCredential.fileName}
              </h2>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>
            
            <div className="modal-body">
              {(selectedCredential.fileType || '').includes('image') ? (
                <img 
                  src={getFileUrl(selectedCredential)} 
                  alt="Credential"
                  className="image-viewer"
                />
              ) : (
                <div className="pdf-wrapper">
                  {console.log("Rendering PDF for credential:", selectedCredential) ? "": ""}
                  <iframe 
                    src={getFileUrl(selectedCredential)} 
                    className="pdf-viewer"
                    title="Credential Preview"
                  />
                  {/* Fallback for mobile devices that don't support iframes well */}
                  <div className="mobile-pdf-link">
                    <p>Mobile preview may be limited.</p>
                    <button 
                      className="btn btn-secondary" 
                      onClick={() => window.open(getFileUrl(selectedCredential), '_blank')}
                    >
                      Open in New Tab
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn btn-primary" 
                onClick={() => handleDownload(selectedCredential)}
              >
                Download Original
              </button>
              <button className="btn btn-secondary" onClick={closeModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HolderDashboard;
