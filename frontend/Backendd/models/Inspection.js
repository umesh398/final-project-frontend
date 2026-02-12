const mongoose = require("mongoose");
const inspectionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    shipName: String,
    portName: String,
    dateText: String,
    poweredBy: String,
    shipImage: [{ type: String }],
    logo: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Inspection", inspectionSchema);
