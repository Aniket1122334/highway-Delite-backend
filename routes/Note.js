const express = require("express");
const router = express.Router();
const {
  createNote,
  getNotes,
  getNoteById,
  deleteNote,
} = require("../controllers/NoteController");
const authenticate = require("../middlewares/authenticate");

// Create a new note
router.post("/createnote", authenticate, createNote);

// Get all notes of logged-in user
router.get("/shownote", authenticate, getNotes);

// Get single note by id
router.get("/shownote/:id", authenticate, getNoteById);

// Delete a note
router.delete("/deletenote/:id", authenticate, deleteNote);

module.exports = router;
