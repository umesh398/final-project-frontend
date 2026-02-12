// const express = require("express");
// const router = express.Router();
// const multer = require("multer");

// const { createReport } = require("./reportController");
// const authMiddleware = require("../middleware/authMiddleware");

// // 📦 Multer config
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, "uploads/");
//   },
//   filename: (req, file, cb) => {
//     cb(null, Date.now() + "-" + file.originalname);
//   },
// });

// const upload = multer({ storage });

// // ✅ CREATE REPORT API
// router.post(
//   "/create",
//   authMiddleware,        // JWT verify
//   upload.single("image"), // image field name
//   createReport
// );

// module.exports = router;
