const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  // === AUTHENTICATION FIELDS ===
  email: { 
    type: String, 
    required: true, 
    unique: true 
  },
  password: { 
    type: String, 
    required: true 
  },
  
  // === PROFILE FIELDS (FROM YOUR APP) ===
  
  // Personal Info
  fullName: { 
    type: String, 
    default: '' 
  },
  
  // Professional Info
  title: { 
    type: String, 
    default: 'Senior Marine Surveyor' 
  },
  employeeId: { 
    type: String, 
    default: '' 
  },
  
  // Credentials
  licenseNumber: { 
    type: String, 
    default: '' 
  },
  certifications: { 
    type: String, 
    default: '' 
  },
  experience: { 
    type: String, 
    default: '' 
  },
  
  // Contact & Company
  company: { 
    type: String, 
    default: 'Fathom Marine Services' 
  },
  phone: { 
    type: String, 
    default: '' 
  },
  
  // Vessel Info (current inspection)
  currentVessel: {
    name: { type: String, default: '' },
    imo: { type: String, default: '' },
    type: { type: String, default: '' }
  }
  
}, {
  timestamps: true // Adds createdAt and updatedAt automatically
});

module.exports = mongoose.model("User", userSchema);