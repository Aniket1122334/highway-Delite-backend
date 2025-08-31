const jwt = require("jsonwebtoken");

const SECRET_KEY = process.env.JWT_SECRET;

// Generate token
function generateToken(payload, expiresIn = "1d") {
  return jwt.sign(payload, SECRET_KEY, { expiresIn });
}

// Verify token
function verifyToken(token) {
  try {
    return jwt.verify(token, SECRET_KEY);
  } catch (err) {
    return null;
  }
}

module.exports = { generateToken, verifyToken };
