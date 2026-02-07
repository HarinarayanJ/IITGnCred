
const CryptoJS = require("crypto-js");
const fs = require("fs");

const PASS="a"

const encryptData = (data,  password) => {
  const key = password;
  const encrypted = CryptoJS.AES.encrypt(JSON.stringify(data), key).toString();
  return encrypted;
};

const data = fs.readFileSync("Gov.pem", "utf-8");
const encryptedData = encryptData(data, PASS);
fs.writeFileSync("Gov-Encrypt.pem", encryptedData);
  