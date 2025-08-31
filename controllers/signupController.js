const { userModel, validateProfile } = require("../models/userModel");
const sendMail = require("../utils/nodemailler");

// POST /signup → Send OTP
const jwt = require("jsonwebtoken");

const SECRET = process.env.SECRET; // ise .env me rakho
const SALT1 = process.env.SALT1;
const SALT2 = process.env.SALT2;

// helper to generate 4-digit OTP
function generateOTP() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

const encodeOTP = (otp) => Buffer.from(SALT2 + otp + SALT1).toString("base64");

// 📌 Verify OTP Controller
module.exports.sendOTP = async (req, res) => {
  try {
    const { name, dob, email } = req.body;
    if (!name) {
      return res.status(400).json({ message: "Name is required required" });
    } else if (!dob) {
      return res.status(400).json({ message: "DOB is required required" });
    } else if (!email) {
      return res.status(400).json({ message: "Email is required required" });
    }

    // Check if user already exists (optional: for signup flow)
    const existing = await userModel.findOne({ email });
    if (existing) {
      return res
        .status(400)
        .json({ message: "User already exists. Please login." });
    }

    // generate OTP
    const otp = generateOTP();

    // encode (salt + otp + salt) -> base64
    const encodedOTP = Buffer.from(SALT2 + otp + SALT1).toString("base64");

    // create JWT token that contains user payload AND encodedOTP
    const token = jwt.sign(
      {
        email,
        name,
        dob,
        encodedOTP,
      },
      SECRET,
      { expiresIn: "10m" } // OTP valid time
    );

    // send OTP to user's email
    await sendMail({
      to: email,
      subject: "Your OTP (valid 10 minutes)",
      html: `<h3>Hello ${name}</h3><p>Your OTP is <b>${otp}</b>. It's valid for 10 minutes.</p>`,
    });

    // send token back to frontend (frontend stores it temporarily)
    return res.status(200).json({ message: "OTP sent to email", token });
  } catch (err) {
    console.error("sendOTP error:", err);
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
};

module.exports.verifyOTP = async (req, res) => {
  try {
    const { otp, token } = req.body;

    if (!otp || !token) {
      return res.status(400).json({ message: "OTP and token are required" });
    }

    // decode token
    let decoded;
    try {
      decoded = jwt.verify(token, SECRET);
    } catch (err) {
      return res.status(400).json({ message: "OTP expired or invalid token" });
    }

    const { email, name, dob, encodedOTP } = decoded;

    // re-encode user-submitted OTP same as sendOTP
    const encodedInputOTP = Buffer.from(SALT2 + otp + SALT1).toString("base64");

    if (encodedInputOTP !== encodedOTP) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // create user permanently
    const newUser = await userModel.create({ name, dob, email });

    // send welcome mail (optional)
    await sendMail({
      to: email,
      subject: "Welcome!",
      html: `<h1>Welcome ${newUser.name}</h1><p>Your account is ready.</p>`,
    });

    // issue final auth token (session token)
    const finalToken = jwt.sign(
      { userId: newUser._id, email: newUser.email },
      SECRET,
      { expiresIn: "7d" }
    );

    return res.status(201).json({
      message: "User created successfully",
      user: { id: newUser._id, name: newUser.name, email: newUser.email },
      token: finalToken,
    });
  } catch (err) {
    console.error("verifyOTP error:", err);
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
};

// // POST /signin → send OTP
module.exports.signin = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    // 1️⃣ Check if user exists in MongoDB
    const user = await userModel.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    // 2️⃣ Generate OTP
    const otp = generateOTP();

    // 3️⃣ Encode OTP with salts
    const encodedOTP = Buffer.from(SALT2 + otp + SALT1).toString("base64");

    // 4️⃣ Create JWT token with user info + encodedOTP (valid for 10 min)
    const token = jwt.sign(
      { email: user.email, name: user.name, encodedOTP },
      SECRET,
      { expiresIn: "10m" }
    );

    // 5️⃣ Send OTP via email
    await sendMail({
      to: email,
      subject: "Your Sign In OTP",
      html: `<h1>Hello ${user.name}!</h1>
             <h4>Your OTP is <b>${otp}</b>. It is valid for 10 minutes.</h4>`,
    });

    // 6️⃣ Send token back to frontend
    res.status(200).json({
      message: "OTP sent to email",
      token, // frontend ko ye token store karke verify-signin me bhejna hai
    });
  } catch (err) {
    console.error("Signin Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// POST /verify-signin → verify OTP
module.exports.verifySigninOTP = async (req, res) => {
  try {
    const { email, otp, token, keepLoggedIn } = req.body;

    // ✅ Check required fields
    if (!email || !otp || !token)
      return res
        .status(400)
        .json({ message: "Email, OTP, and token are required" });

    // ✅ Decode JWT token sent during /signin
    let decoded;
    try {
      decoded = jwt.verify(token, SECRET);
    } catch (err) {
      return res.status(400).json({ message: "OTP expired or invalid token" });
    }

    // ✅ Verify email matches
    if (decoded.email !== email) {
      return res.status(400).json({ message: "Email mismatch" });
    }

    // ✅ Verify OTP matches
    if (decoded.encodedOTP !== encodeOTP(otp)) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // ✅ OTP valid → get user from DB
    const user = await userModel.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    // ✅ Generate final JWT token for session
    const expiresIn = keepLoggedIn ? "365d" : "1d";
    const finalToken = jwt.sign(
      { userId: user._id, email: user.email },
      SECRET,
      { expiresIn }
    );

    // ✅ Update keepLoggedIn in DB
    user.keepLoggedIn = !!keepLoggedIn;
    await user.save();

    // ✅ Send response
    res.status(200).json({
      message: "Sign in successful",
      user: { name: user.name, email: user.email },
      token: finalToken,
    });
  } catch (err) {
    console.error("OTP Verification Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// POST /resend-otp → Resend OTP for signup or signin

module.exports.resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) return res.status(400).json({ message: "Email is required" });

    // Fetch user
    const user = await userModel.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Generate OTP
    const otp = generateOTP();
    const encodedOTP = encodeOTP(otp);

    // Create JWT with OTP
    const otpToken = jwt.sign({ email, encodedOTP }, SECRET, {
      expiresIn: "10m",
    });

    // Send OTP email
    await sendMail({
      to: email,
      subject: "Your OTP (Resend)",
      html: `<h1>Hello ${user.name}!</h1>
             <h4>Your new OTP is <b>${otp}</b>. It is valid for 10 minutes.</h4>`,
    });

    // Send token back
    res.status(200).json({ message: "OTP resent to email", token: otpToken });
  } catch (err) {
    console.error("Resend OTP Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// GET /api/user → Fetch user details
module.exports.user = async (req, res) => {
  try {
    const user = await userModel.findById(req.user.userId).select("name email");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ name: user.name, email: user.email });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// POST /signout → Sign out user
module.exports.signout = async (req, res) => {
  try {
    // ✅ authenticate middleware से req.user आता है
    const userId = req.user.userId;

    // 1️⃣ User find करो
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 2️⃣ keepLoggedIn false कर दो
    user.keepLoggedIn = false;
    await user.save();

    // 3️⃣ Client side को बोलो कि token delete करे
    // (अगर token cookie में है तो clear कर दो)
    res.clearCookie("token");

    // 4️⃣ Response भेजो
    res.status(200).json({
      success: true,
      message: "Sign out successful. You can always come back any time.",
    });
  } catch (err) {
    console.error("Signout Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
