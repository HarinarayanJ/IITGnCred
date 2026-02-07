// import CryptoJS from "crypto-js";
// import jwt from "jsonwebtoken";

const CryptoJS = require("crypto-js");

const secretKey = "vOVH6sdmpNWjRRIqCc7rdxs01lwHzfr3"; // TODO: Change secret Key

const encryptWrapper = (data) => {
  const jsonString = JSON.stringify(data);
  return JSON.stringify(encrypt(jsonString));
};

const encrypt = (text) => {
  return { content: CryptoJS.AES.encrypt(text, secretKey).toString() };
};

const decrypt = (ciphertext) => {
  const bytes = CryptoJS.AES.decrypt(ciphertext.content, secretKey);
  const originalText = bytes.toString(CryptoJS.enc.Utf8);
  return JSON.parse(originalText);
};

const decryptMiddleWare = (req, res, next) => {
  try {
    if (req.body.content) {
      req.body = decrypt(req.body);
    }
    next();
  } catch (error) {
    res.status(400).send({ message: "Invalid encrypted data" });
  }
};


module.exports = {
  encryptWrapper,
  encrypt,
  decrypt,
  decryptMiddleWare,
};
