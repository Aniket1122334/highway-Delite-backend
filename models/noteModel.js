const mongoose = require("mongoose");
const Joi = require("joi");

const NoteSchema = new mongoose.Schema({
  heading: {
    type: String,
    required: true,
    trim: true,
  },
  noteMessage: {
    // ✅ camelCase consistent
    type: String,
    required: true,
    trim: true,
  },
  userInfo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "userModel",
    required: true,
  },
});

// Joi validation function
function validateNote(note) {
  const schema = Joi.object({
    heading: Joi.string().trim().min(3).max(100).required(),
    noteMessage: Joi.string().trim().min(5).required(), // ✅ camelCase
    // ⚠️ userInfo ko ab validate nahi karenge frontend se, kyunki wo JWT se aayega
  });

  return schema.validate(note);
}

const noteModel = mongoose.model("noteModel", NoteSchema);

module.exports = { noteModel, validateNote };
