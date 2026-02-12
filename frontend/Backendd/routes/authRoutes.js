const express = require("express");
const bcrypt = require("bcryptjs");
const router = express.Router();
const User = require("../models/User");

// ============================================
// AUTH MIDDLEWARE - Verify user by ID from header
// ============================================
const protect = async (req, res, next) => {
  // Get userId from header (sent from your React Native app)
  const userId = req.headers['user-id'];
  
  if (!userId) {
    return res.status(401).json({ 
      success: false, 
      message: "Not authorized - No user ID provided" 
    });
  }
  
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: "Not authorized - User not found" 
      });
    }
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ 
      success: false, 
      message: "Not authorized - Invalid user ID" 
    });
  }
};

// ============================================
// ✅ SIGNUP - Register new user
// ============================================
router.post("/signup", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ 
      success: false,
      message: "Email and password required" 
    });
  }

  try {
    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ 
        success: false,
        message: "User already exists" 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with default values
    const user = await User.create({
      email,
      password: hashedPassword,
      fullName: email.split('@')[0], // Default from email
      company: 'Fathom Marine Services',
      title: 'Marine Surveyor'
    });

    res.status(201).json({
      success: true,
      message: "Signup successful",
      userId: user._id,
      email: user.email,
      fullName: user.fullName
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ 
      success: false,
      message: "Server error" 
    });
  }
});

// ============================================
// ✅ LOGIN - Authenticate user
// ============================================
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ 
      success: false,
      message: "Email and password required" 
    });
  }

  try {
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: "User not found" 
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false,
        message: "Invalid credentials" 
      });
    }

    // Return user data (excluding password)
    res.json({
      success: true,
      message: "Login success",
      userId: user._id,
      email: user.email,
      fullName: user.fullName,
      title: user.title,
      company: user.company
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ 
      success: false,
      message: "Server error" 
    });
  }
});

// ============================================
// ✅ GET PROFILE - Fetch all user data
// ============================================
router.get("/profile", protect, async (req, res) => {
  try {
    const user = req.user;
    
    res.json({
      success: true,
      user: {
        // Auth
        id: user._id,
        email: user.email,
        
        // Personal
        fullName: user.fullName || '',
        
        // Professional
        title: user.title || 'Senior Marine Surveyor',
        employeeId: user.employeeId || '',
        
        // Credentials
        licenseNumber: user.licenseNumber || '',
        certifications: user.certifications || '',
        experience: user.experience || '',
        
        // Contact
        company: user.company || 'Fathom Marine Services',
        phone: user.phone || '',
        
        // Vessel
        currentVessel: user.currentVessel || { 
          name: '', 
          imo: '', 
          type: '' 
        },
        
        // Metadata
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
});

// ============================================
// ✅ UPDATE PROFILE - Save ALL profile data
// ============================================
router.put("/profile", protect, async (req, res) => {
  try {
    const {
      fullName,
      title,
      employeeId,
      licenseNumber,
      certifications,
      experience,
      company,
      phone,
      email,
      currentVessel
    } = req.body;

    // Build update object - only include fields that were sent
    const updateFields = {};
    
    // Personal
    if (fullName !== undefined) updateFields.fullName = fullName;
    
    // Professional
    if (title !== undefined) updateFields.title = title;
    if (employeeId !== undefined) updateFields.employeeId = employeeId;
    
    // Credentials
    if (licenseNumber !== undefined) updateFields.licenseNumber = licenseNumber;
    if (certifications !== undefined) updateFields.certifications = certifications;
    if (experience !== undefined) updateFields.experience = experience;
    
    // Contact
    if (company !== undefined) updateFields.company = company;
    if (phone !== undefined) updateFields.phone = phone;
    if (email !== undefined) updateFields.email = email;
    
    // Vessel Info - nested object
    if (currentVessel) {
      if (currentVessel.name !== undefined) updateFields['currentVessel.name'] = currentVessel.name;
      if (currentVessel.imo !== undefined) updateFields['currentVessel.imo'] = currentVessel.imo;
      if (currentVessel.type !== undefined) updateFields['currentVessel.type'] = currentVessel.type;
    }

    // Update the user
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: updatedUser._id,
        email: updatedUser.email,
        fullName: updatedUser.fullName,
        title: updatedUser.title,
        employeeId: updatedUser.employeeId,
        licenseNumber: updatedUser.licenseNumber,
        certifications: updatedUser.certifications,
        experience: updatedUser.experience,
        company: updatedUser.company,
        phone: updatedUser.phone,
        currentVessel: updatedUser.currentVessel
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
});

// ============================================
// ✅ DELETE PROFILE - Remove user account
// ============================================
router.delete("/profile", protect, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user._id);
    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
});

module.exports = router;