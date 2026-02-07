import axios from "axios";
import { decrypt, encryptWrapper } from "./Security";

// Update Base URL to match the Express server port
const API = axios.create({
  baseURL: "http://10.7.28.28:3000/api",
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("jwt");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.headers["Content-Type"] = "application/json";
  return config;
});

export const recoverAccount = async (mnemonic) => {
  const res = await API.post("/recover", encryptWrapper({ mnemonic }));
  const data = decrypt(res.data);
  console.log("Recovery response data:", data);
  
};

/* ---------------- REGISTER ---------------- */
export const registerUser = async (name, walletAddress, password, role) => {
  const payload =
    role === "Student"
      ? { role, studentName: name }
      : { role, universityName: name };

  const encrypted = encryptWrapper(payload);

  const res = await API.post("/register", encrypted);
  const data = decrypt(res.data);
  console.log(data.mnemonic);

  return {
    mnemonic: data.mnemonic, // Server may return mnemonic for wallet recovery
    success: data.status,
    account: data.account,
    message:
      role === "University"
        ? "Registration successful! Awaiting government approval."
        : "Registration successful!",
  };
};

/* ---------------- LOGIN ---------------- */
export const loginUser = async (walletAddress) => {
  console.log("Attempting login for wallet:", walletAddress);
  // Encrypt wallet address as expected by decryptMiddleWare
  const encrypted = encryptWrapper({ walletAddress: walletAddress });

  const res = await API.post("/login", encrypted);
  // Server returns { token, role, status } inside encryptWrapper
  const data = decrypt(res.data);
  console.log("Login response data:", data);
  localStorage.setItem("jwt", data.token);
  localStorage.setItem("role", data.role);
  localStorage.setItem("wallet", walletAddress);

  return {
    success: data.status,
    role: data.role,
    token: data.token,
    error: data.error,
  };
};

/* ---------------- ADMIN LOGIN (Gov) ---------------- */
export const adminLogin = async (walletAddress, password) => {
  return loginUser(walletAddress, password, "Gov");
};

export const issuerLogin = async (walletAddress, username, password) => {
  return loginUser(walletAddress.address, password, "University");
};

export const holderLogin = async (walletAddress, username, password) => {
  return loginUser(walletAddress.address, password, "Student");
};

/* ---------------- PENDING ISSUERS ---------------- */
export const getPendingIssuers = async () => {
  const res = await API.get("/requests");
  const data = decrypt(res.data);

  if (!data.requests) return [];

  // Filter for status '0' (Pending)
  return data.requests.filter((req) => req.status === "1");
};

export const getApprovedIssuers = async () => {
  const res = await API.get("/requests");
  const data = decrypt(res.data);

  if (!data.requests) return [];

  // Filter for status '2' (Approved) - Server converts BigInt to string
  const approved = data.requests.filter((req) => req.status === "2");

  return approved;
};

/* ---------------- APPROVE ISSUER ---------------- */
export const approveIssuer = async (universityName) => {
  const encrypted = encryptWrapper({ universityName });

  const res = await API.post("/approve", encrypted);
  const data = decrypt(res.data);

  return { success: data.status, error: data.error };
};

/* ---------------- REJECT ISSUER ---------------- */
export const rejectIssuer = async (universityName) => {
  const encrypted = encryptWrapper({ universityName });

  const res = await API.post("/reject", encrypted);
  const data = decrypt(res.data);

  return { success: data.status, error: data.error };
};

/* ---------------- ISSUE CREDENTIAL ---------------- */
export const issueCredential = async (studentUsername, file) => {
  console.log("Issuing credential for student:", studentUsername);
  console.log("File received for issuing credential:", file);
  // 1. Calculate Hash
  const encoder = new TextEncoder();
  const credentialHashBuffer = await crypto.subtle.digest(
    "SHA-256",
    encoder.encode(file.data), // Use file data for hash
  );
  const credentialHash = Array.from(new Uint8Array(credentialHashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // 2. Convert File to Base64 (Server expects data for IPFS upload)
  const fileBase64 = file.data;

  // NOTE: Server defines this as app.get(), but expects a body.
  // Axios requires `data` property for body in GET requests.
  const res = await API.post(
    "/issueCredenctials",
    encryptWrapper({
      student: studentUsername,
      credentialHash: credentialHash, // Hex string
      credentialFile: fileBase64, // Actual file data
    }),
  );

  const data = decrypt(res.data);

  return {
    success: data.status,
    message: data.status ? "Credential issued successfully" : data.error,
  };
};

/* ---------------- HOLDER CREDENTIALS ---------------- */
export const getHolderCredentials = async () => {
  // Matches server endpoint: /api/getAllCrentials (Typos preserved)
  const res = await API.get("/getAllCrentials");
  const data = decrypt(res.data);

  if (!data.status) {
    throw new Error(data.error || "Failed to fetch credentials");
  }

  return data.credentials;
};

/* ---------------- VERIFY CREDENTIAL ---------------- */
export const verifyCredential = async (file) => {
  // The server does not expose a public /verify endpoint.
  // Verification is done on-chain or via the revoke endpoint internally.
  // We can calculate the hash here for the UI to show.
  console.log("Calculating hash for verification...");
  console.log("File read into buffer, calculating hash...");
  const encoder = new TextEncoder();
  const data = encoder.encode(file);
  const credentialHashBuffer = await crypto.subtle.digest("SHA-256", data);
  console.log("Hash calculated, converting to hex...");
  const hash = Array.from(new Uint8Array(credentialHashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  console.log("Calculated Credential Hash:", hash);
  const isValid = await API.post(
    "/verifyCredentials",
    encryptWrapper({ credentialHash: hash }),
  );

  console.log("Verification Result from Server:", isValid);

  return {
    success: true,
    message: "Local hash calculated. Use Blockchain explorer to verify.",
    hash: hash,
    isValid: isValid,
  };
};

/* ---------------- REVOKE CREDENTIAL ---------------- */
export const revokeCredential = async (credentialHash) => {
  const encoder = new TextEncoder();
  const data1 = encoder.encode(credentialHash);
  const credentialHashBuffer = await crypto.subtle.digest("SHA-256", data1);
  const hash = Array.from(new Uint8Array(credentialHashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  console.log("Calculated Credential Hash for Revocation:", hash);
  const encrypted = encryptWrapper({ credentialHash: hash });

  const res = await API.post("/revokeCredential", encrypted);
  const data = decrypt(res.data);

  return {
    success: data.status,
    message: data.message || data.error,
  };
};
