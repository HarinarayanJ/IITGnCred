const { decrypt } = require("../Utils/Security");
const {GOV, API_URL_} = require("./CONSTANT");

const API_URL = `${API_URL_}/api/register`;

describe("POST /api/register (Live Integration)", () => {
  test("should register a Student successfully", async () => {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "Student" }),
    });

    const result = decrypt(await response.json()); // Decrypting the response if it's encrypted


    // Console logs replaced with Assertions
    expect(response.status).toBe(200);
    expect(result.status).toBe(true);
    expect(result).toHaveProperty("account"); // Ensures account data exists
  });

  test("should register a University successfully", async () => {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "University", universityName: "MIT1" + Date.now() }), // Unique name to avoid conflicts
    });

    const result = decrypt(await response.json()); // Decrypting the response if it's encrypted
    console.log("University Registration Result:", result); // Debug log for the response
    expect(response.status).toBe(200);
    expect(result.status).toBe(true);
    expect(result).toHaveProperty("account");
  });

  test("should fail gracefully for an Invalid Role", async () => {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "Admin" }),
    });

    const result = decrypt(await response.json()); // Decrypting the response if it's encrypted
    expect(response.status).toBe(500);
    expect(result.status).toBe(false);
  });
});
