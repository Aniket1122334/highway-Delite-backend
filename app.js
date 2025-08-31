// app.js
const express = require("express");
require("dotenv").config();
const connectDB = require("./config/mongoose");

const signupRoutes = require("./routes/signup");
const noteRoutes = require("./routes/Note");
const cors = require("cors");
const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("All users route working!");
});

// Routes
app.use("/api", signupRoutes); // signup, verify OTP
app.use("/api/notes", noteRoutes); // note CRUD

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
