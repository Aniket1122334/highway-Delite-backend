const { noteModel, validateNote } = require("../models/noteModel");

// Create Note
module.exports.createNote = async (req, res) => {
  try {
    const { error } = validateNote(req.body);
    if (error)
      return res.status(400).json({ message: error.details[0].message });

    const { heading, noteMessage } = req.body;
    const userId = req.user.userId;

    const newNote = await noteModel.create({
      heading,
      noteMessage,
      userInfo: userId,
    });

    res.status(201).json({
      message: "Note created successfully",
      note: newNote,
    });
  } catch (err) {
    console.error("Note Creation Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Get all notes
module.exports.getNotes = async (req, res) => {
  try {
    const userId = req.user.userId;
    const notes = await noteModel.find({ userInfo: userId });

    res.status(200).json({
      message: "User notes fetched successfully",
      notes,
    });
  } catch (err) {
    console.error("Fetch Notes Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Get single note by id
module.exports.getNoteById = async (req, res) => {
  try {
    const note = await noteModel.findOne({
      _id: req.params.id,
      userInfo: req.user.userId,
    });

    if (!note) return res.status(404).json({ message: "Note not found" });

    res.json({ note });
  } catch (error) {
    console.error("Get Note Error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Delete note
module.exports.deleteNote = async (req, res) => {
  try {
    const noteId = req.params.id;
    const userId = req.user.userId;

    const note = await noteModel.findById(noteId);
    if (!note) return res.status(404).json({ message: "Note not found" });

    if (note.userInfo.toString() !== userId) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this note" });
    }

    await noteModel.findByIdAndDelete(noteId);

    res.status(200).json({ message: "Note deleted successfully" });
  } catch (err) {
    console.error("Delete Note Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
