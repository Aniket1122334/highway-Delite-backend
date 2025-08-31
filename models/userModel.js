const mongoose = require("mongoose");
const Joi = require("joi");

// ======= Mongoose Schema ==================
const profileSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    dob: {
      type: Date,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/,
    },

    otp: { type: String }, // hashed OTP
    otpExpiry: { type: Date }, // expiry timestamp

    keepLoggedIn: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// ================== Joi Validation =========
function validateProfile(data) {
  const schema = Joi.object({
    name: Joi.string().min(2).max(100).required(),
    dob: Joi.date().required(),
    email: Joi.string().email().required(),
  });

  return schema.validate(data);
}

const userModel = mongoose.model("user", profileSchema);

module.exports = { userModel, validateProfile };
