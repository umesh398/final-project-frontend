const express = require("express");
const router = express.Router();
const Inspection = require("../models/Inspection");
const upload = require("../middleware/upload");

/* ===============================
   1️⃣ CREATE INSPECTION (MULTIPLE IMAGES)
================================ */
router.post(
  "/create",
  upload.fields([
    { name: "shipImage", maxCount: 100 }, // ✅ Allow up to 10 images
    { name: "logo", maxCount: 1 },       // Keep logo as 1
  ]),
  async (req, res) => {
    try {
      const { userId, shipName, portName, dateText, poweredBy } = req.body;

      // ✅ 1. Handle Multiple Ship Images
      let shipImagePaths = [];
      if (req.files?.shipImage) {
        // Map over the array of files to get their paths
        shipImagePaths = req.files.shipImage.map((file) => file.path);
      }

      // ✅ 2. Handle Single Logo
      const logoPath = req.files?.logo?.[0]?.path || "";

      const inspection = await Inspection.create({
        userId,
        shipName,
        portName,
        dateText,
        poweredBy,
        shipImage: shipImagePaths, // Save the Array of paths
        logo: logoPath,
      });

      res.status(201).json({
        success: true,
        inspectionId: inspection._id,
        imageCount: shipImagePaths.length, // Useful for debugging
      });
    } catch (err) {
      console.error("Error creating inspection:", err);
      res.status(500).json({
        success: false,
        error: err.message,
      });
    }
  }
);

/* ===============================
   3️⃣ GET INSPECTION (LAST!)
================================ */
router.get("/:inspectionId", async (req, res) => {
  const { inspectionId } = req.params;

  // ✅ Prevent "Invalid ID" forever
  if (!mongoose.Types.ObjectId.isValid(inspectionId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid inspection ID format",
    });
  }

  try {
    const inspection = await Inspection.findById(inspectionId);

    if (!inspection) {
      return res.status(404).json({
        success: false,
        message: "Inspection not found",
      });
    }

    res.json({ success: true, inspection });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

module.exports = router;
