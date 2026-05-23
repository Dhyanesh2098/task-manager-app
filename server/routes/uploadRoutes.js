const express = require("express");
const multer = require("multer");
const path = require("path");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Storage Config
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, "uploads/");
  },

  filename(req, file, cb) {
    cb(
      null,
      `${Date.now()}-${file.originalname}`
    );
  },
});

const upload = multer({ storage });

// Upload Route
router.post(
  "/",
  protect,
  upload.single("file"),
  (req, res) => {
    res.json({
      filePath: `/uploads/${req.file.filename}`,
      fileName: req.file.filename,
    });
  }
);

module.exports = router;