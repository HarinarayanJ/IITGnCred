import React, { useState } from 'react';
import CryptoJS from 'crypto-js';
import './AuthPage.css';
import { registerUser, adminLogin } from '../utils/api';

const AuthPage = ({ onAuthSuccess }) => {
  const [role, setRole] = useState('');
  const [isLogin, setIsLogin] = useState(true);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: ''
  });
  const [adminFile, setAdminFile] = useState(null);

  // UI State
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // --- STORAGE HELPERS ---

  // 1. Save keys Encrypted, Name Plaintext
  const saveCredentialsLocally = (username, name, walletData, password) => {
    try {
      // A. Save Name (Plaintext)
      localStorage.setItem(`user_name_${username}`, name);

      // B. Save Wallet Data (Encrypted)
      const ciphertext = CryptoJS.AES.encrypt(JSON.stringify(walletData), password).toString();
      localStorage.setItem(`user_wallet_${username}`, ciphertext);
      
      return true;
    } catch (err) {
      console.error("Save failed:", err);
      return false;
    }
  };

  // 2. Load and Decrypt
  const loadCredentialsLocally = (username, password) => {
    try {
      // A. Get Plaintext Name
      const name = localStorage.getItem(`user_name_${username}`);
      if (!name) return { success: false, error: "User not found." };

      // B. Get Encrypted Wallet
      const ciphertext = localStorage.getItem(`user_wallet_${username}`);
      if (!ciphertext) return { success: false, error: "Wallet data missing." };

      // C. Decrypt Wallet
      const bytes = CryptoJS.AES.decrypt(ciphertext, password);
      const originalText = bytes.toString(CryptoJS.enc.Utf8);
      
      if (!originalText) return { success: false, error: "Incorrect Password." };

      return { 
        success: true, 
        name: name, // Return the plaintext name
        wallet: JSON.parse(originalText) 
      };
    } catch (err) {
      return { success: false, error: "Decryption Failed." };
    }
  };

  // --- HANDLERS ---

  const handleRoleChange = (e) => {
    setRole(e.target.value);
    setAdminFile(null);
    setFormData({ name: '', username: '', password: '' });
    setMessage({ type: '', text: '' });
    setIsLogin(true);
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) setAdminFile(e.target.files[0]);
  };

  // --- MAIN SUBMIT LOGIC ---

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // -----------------------------
      // 1. VERIFIER (No Auth)
      // -----------------------------
      if (role === 'verifier') {
        onAuthSuccess({ role: 'verifier' }, 'verifier');
        return;
      }

      // -----------------------------
      // 2. ADMIN (Encrypted File + Password)
      // -----------------------------
      if (role === 'admin') {
        if (!adminFile) throw new Error("Please upload the Admin Keyfile");
        if (!formData.password) throw new Error("Please enter the decryption password");

        const reader = new FileReader();
        reader.onload = async (ev) => {
          try {
            const encryptedContent = ev.target.result;

            // --- Decrypt Logic ---
            const bytes = CryptoJS.AES.decrypt(encryptedContent, formData.password);
            const originalText = bytes.toString(CryptoJS.enc.Utf8);

            if (!originalText) {
              throw new Error("Decryption failed. Invalid Password or corrupt file.");
            }

            const json = JSON.parse(originalText);
            const address = json.walletAddress || json.address;
            
            if (!address) throw new Error("Invalid Admin File (Address missing)");

            // --- Verify with Server ---
            const res = await adminLogin(address);
            if (res.success) {
              onAuthSuccess({ wallet: address, role: 'Gov' }, 'Gov');
            } else {
              setMessage({ type: 'error', text: res.error || "Admin verification failed" });
            }
          } catch (err) {
            setMessage({ type: 'error', text: err.message });
          } finally {
            setLoading(false);
          }
        };
        reader.readAsText(adminFile);
        return; 
      }

      // -----------------------------
      // 3. ISSUER / HOLDER (Local Storage)
      // -----------------------------
      const apiRole = role === 'issuer' ? 'University' : 'Student';

      if (isLogin) {
        // --- LOGIN FLOW ---
        // Retrieve Name (Plaintext) + Wallet (Encrypted)
        const result = loadCredentialsLocally(formData.username, formData.password);

        if (!result.success) {
          throw new Error(result.error);
        }

        const { name, wallet } = result;

        // Verify Role Match
        if (wallet.role !== apiRole) {
          throw new Error(`This account is registered as ${wallet.role}, not ${apiRole}.`);
        }

        // Success
        onAuthSuccess({
          wallet: wallet.address,
          name: name, // Using the plaintext name
          role: apiRole
        }, apiRole);

      } else {
        // --- REGISTER FLOW ---
        const res = await registerUser(
            formData.name, 
            formData.username, 
            formData.password, 
            apiRole
        );

        if (res.success && res.account) {
          // Prepare Wallet Data (Keys Only)
          const walletData = {
            address: res.account.address,
            privateKey: res.account.privateKey,
            role: apiRole
          };

          // Save: Name (Plaintext) + Wallet (Encrypted)
          const saved = saveCredentialsLocally(
            formData.username, 
            formData.name, 
            walletData, 
            formData.password
          );

          if (saved) {
            setMessage({ type: 'success', text: "Registration Successful! Credentials saved." });
            setIsLogin(true);
            setFormData(prev => ({ ...prev, password: '' })); // Clear password
          } else {
            throw new Error("Failed to save credentials locally.");
          }
        } else {
          throw new Error(res.error || "Registration Failed");
        }
      }

    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      if (role !== 'admin') setLoading(false); // Admin loading is handled inside FileReader
    }
  };

  return (
    <div className="auth-page-container fade-in">
      <div className="card auth-card">
        <h1 className="auth-title">IITGnCred</h1>

        {/* ROLE SELECTOR */}
        <div className="form-group">
          <label>Select Role</label>
          <select className="form-input" value={role} onChange={handleRoleChange}>
            <option value="">-- Choose Role --</option>
            <option value="admin">Admin</option>
            <option value="issuer">Issuer</option>
            <option value="holder">Holder</option>
            <option value="verifier">Verifier</option>
          </select>
        </div>

        {/* DYNAMIC FORM */}
        {role && (
          <form onSubmit={handleSubmit}>
            
            {message.text && (
              <div className={`message message-${message.type}`}>{message.text}</div>
            )}

            {/* VERIFIER */}
            {role === 'verifier' && (
              <div className="info-box">
                <button className="btn btn-primary full-width" type="submit">
                  Enter Verification Portal
                </button>
              </div>
            )}

            {/* ADMIN (File + Password) */}
            {role === 'admin' && (
              <div className="fade-in">
                <div className="form-group">
                  <label>Encrypted Admin Keyfile</label>
                  <input type="file" accept=".json,.pem,.txt" onChange={handleFileChange} required />
                </div>
                <div className="form-group">
                  <label>Decryption Password</label>
                  <input 
                    type="password" 
                    name="password" 
                    className="form-input" 
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Enter file password"
                    required 
                  />
                </div>
                <button className="btn btn-primary full-width" disabled={loading}>
                  {loading ? "Decrypting..." : "Login as Admin"}
                </button>
              </div>
            )}

            {/* ISSUER / HOLDER */}
            {(role === 'issuer' || role === 'holder') && (
              <div className="fade-in">
                
                {/* Name Input (Register Only) */}
                {!isLogin && (
                  <div className="form-group">
                    <label>Name</label>
                    <input 
                      type="text" 
                      name="name" 
                      className="form-input" 
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder={role === 'issuer' ? "Issuer" : "Holder"}
                      required 
                    />
                  </div>
                )}

                <div className="form-group">
                  <label>Username</label>
                  <input 
                    type="text" 
                    name="username" 
                    className="form-input" 
                    value={formData.username}
                    onChange={handleInputChange}
                    required 
                  />
                </div>

                <div className="form-group">
                  <label>Password</label>
                  <input 
                    type="password" 
                    name="password" 
                    className="form-input" 
                    value={formData.password}
                    onChange={handleInputChange}
                    required 
                  />
                </div>

                <button className="btn btn-primary full-width" disabled={loading}>
                  {loading ? "Processing..." : (isLogin ? "Login" : "Register")}
                </button>

                <div className="auth-toggle">
                  <span onClick={() => { setIsLogin(!isLogin); setMessage({type:'', text:''}); }}>
                    {isLogin ? "Create an Account" : "Back to Login"}
                  </span>
                </div>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
};

export default AuthPage;
