// login.test.js
const { encryptWrapper, decrypt } = require("../Utils/Security");
const {GOV, API_URL_} = require("./CONSTANT");

// Configuration
const API_URL = `${API_URL_}/api/login`;

// Test Data matches your script
const VALID_PAYLOAD = {
    walletAddress: GOV,
    // Note: If your server requires a signature, add it here:
    // signature: "0x..." 
};

describe("POST /api/login Integration Tests", () => {

    test("should return 200 and a token when valid encrypted data is sent", async () => {
        // 1. Prepare Request
        // We encrypt the payload just like the client does
        const encryptedBody = encryptWrapper(VALID_PAYLOAD);

        // 2. Send Request
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: encryptedBody
        });

        // 3. Assert Response Status
        // Helpful error message if it fails
        expect(response.status).toBe(200);

        // 4. Assert Response Body
        const result = await response.json();
        const decryptedResult = decrypt(result); // Assuming the server sends encrypted response
        
        // Check that we got a token back

        expect(decryptedResult).toHaveProperty("token");
        
        // Optional: Check role if your API returns it
        // expect(result.role).toMatch(/Gov|Uni|Stu/); 
    });

    test("should return 400/500 if the payload is empty or invalid", async () => {
        // Sending raw JSON without encryption (or empty) should fail
        // if the server expects encrypted data
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}) 
        });

        expect(response.status).not.toBe(200);
    });
});