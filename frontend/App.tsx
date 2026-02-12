import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
  Linking,
  SafeAreaView,
  StatusBar,
  Modal,
} from "react-native";

import * as ImagePicker from "expo-image-picker";
import { Picker } from "@react-native-picker/picker";

const logo = require("./assets/logo.png");
const API_URL = "http://192.168.1.47:8000";

/* ================= COLORS ================= */
const BLUE_PRIMARY = "#1E40AF";       // Primary blue
const BLUE_SECONDARY = "#3B82F6";     // Secondary blue
const BLUE_LIGHT = "#60A5FA";         // Light blue
const BLUE_SOFT = "#EFF6FF";          // Very light blue for backgrounds
const WHITE = "#FFFFFF";              // Pure white
const GRAY_DARK = "#374151";          // Dark gray for text
const GRAY_MEDIUM = "#6B7280";        // Medium gray
const GRAY_LIGHT = "#D1D5DB";         // Light gray for borders
const GRAY_SOFT = "#F3F4F6";          // Very light gray for backgrounds
const GREEN = "#10B981";              // Success green
const RED = "#EF4444";                // Error red
const AMBER = "#F59E0B";              // Warning amber

/* ================= CONSTANTS ================= */
const EVEN_IMAGE_OPTIONS = Array.from({ length: 10 }, (_, i) => (i + 1) * 2);
const CERTIFICATIONS = [
  "IMO Inspector",
  "Class Surveyor",
  "Port State Control",
  "Flag State Inspector",
  "ISM Auditor",
  "ISPS Auditor",
  "MLC Inspector",
  "Vetting Inspector",
  "Condition Surveyor",
  "Bunker Surveyor"
];
const SHIP_TYPES = [
  "Tanker (Oil/Chemical/Gas)",
  "Bulk Carrier",
  "Container Ship",
  "General Cargo",
  "Ro-Ro",
  "Passenger Ship",
  "Offshore Vessel",
  "Tug/Barge",
  "Fishing Vessel",
  "Navy/Military"
];
const COMPANY_TYPES = [
  "Shipping Company",
  "Classification Society",
  "Port Authority",
  "Flag State",
  "Port State",
  "Independent Surveyor",
  "Consultant",
  "Shipyard",
  "Other"
];

type Screen = "login" | "register" | "details" | "upload" | "preview" | "review";

type Img = {
  uri: string;
  description: string;
  name: string;
  type: string;
};

type Profile = {
  id: string;
  profilePicture: string;
  name: string;
  company: string;
  position: string;
  phone: string;
  email: string;
  signature: string;
  experience: string;
  certifications: string[];
  shipTypes: string[];
  licenseNumber: string;
  issuingAuthority: string;
  expiryDate: string;
  address: string;
  emergencyContact: string;
  notes: string;
};

type User = {
  id: string;
  fullName: string;
  email: string;
  password: string;
  companyName: string;
  companyType: string;
  position: string;
  phone: string;
  country: string;
  city: string;
  address: string;
  companyLogo: string | null;
  registrationDate: string;
  isActive: boolean;
};

export default function App() {
  const [screen, setScreen] = useState<Screen>("login");
  const [inspectionId, setInspectionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  
  // User state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);

  // Registration form state
  const [registerForm, setRegisterForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    companyName: "",
    companyType: "",
    position: "",
    phone: "",
    country: "",
    city: "",
    address: "",
  });
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registrationErrors, setRegistrationErrors] = useState<{[key: string]: string}>({});

  const [newProfile, setNewProfile] = useState<Profile>({
    id: Date.now().toString(),
    profilePicture: "",
    name: "",
    company: "",
    position: "",
    phone: "",
    email: "",
    signature: "",
    experience: "",
    certifications: [],
    shipTypes: [],
    licenseNumber: "",
    issuingAuthority: "",
    expiryDate: "",
    address: "",
    emergencyContact: "",
    notes: "",
  });

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [details, setDetails] = useState({
    date: "",
    shipName: "",
    shipType: "",
    port: "",
    inspector: "",
  });

  const [images, setImages] = useState<Img[]>([]);
  const [imagesPerPage, setImagesPerPage] = useState<number>(2);
  const [logoImage, setLogoImage] = useState<Img | null>(null);
  const [shipImage, setShipImage] = useState<Img | null>(null);

  /* ================= BACK ================= */
  const goBack = () => {
    if (screen === "details") setScreen("login");
    else if (screen === "upload") setScreen("details");
    else if (screen === "preview") setScreen("upload");
    else if (screen === "review") setScreen("preview");
    else if (screen === "register") setScreen("login");
  };

  const BackButton = () =>
    screen === "login" ? null : (
      <TouchableOpacity onPress={goBack} style={styles.backBtn} activeOpacity={0.7}>
        <Text style={styles.backText}>←</Text>
      </TouchableOpacity>
    );

  /* ================= IMAGE PICKERS ================= */
  const pickGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      const imgs = result.assets.map((a, i) => ({
        uri: a.uri,
        description: "",
        name: a.fileName || `photo_${Date.now()}_${i}.jpg`,
        type: "image/jpeg",
      }));
      setImages((prev) => [...prev, ...imgs]);
    }
  };

  const pickCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") return;

    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled) {
      setImages((prev) => [
        ...prev,
        {
          uri: result.assets[0].uri,
          description: "",
          name: `camera_${Date.now()}.jpg`,
          type: "image/jpeg",
        },
      ]);
    }
  };

  const pickLogo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;

    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.8 });
    if (!result.canceled) {
      setLogoImage({
        uri: result.assets[0].uri,
        description: "",
        name: "logo.jpg",
        type: "image/jpeg",
      });
    }
  };

  const pickShipImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;

    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.8 });
    if (!result.canceled) {
      setShipImage({
        uri: result.assets[0].uri,
        description: "",
        name: "ship_image.jpg",
        type: "image/jpeg",
      });
    }
  };

  const pickProfilePicture = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "Please grant permission to access photos");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({ 
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    });
    
    if (!result.canceled) {
      setNewProfile({
        ...newProfile,
        profilePicture: result.assets[0].uri,
      });
    }
  };

  const pickSignature = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;

    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.8 });
    if (!result.canceled) {
      setNewProfile({
        ...newProfile,
        signature: result.assets[0].uri,
      });
    }
  };

  const pickCompanyLogo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "Please grant permission to access photos");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({ 
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    });
    
    if (!result.canceled) {
      setCompanyLogo(result.assets[0].uri);
    }
  };

  /* ================= REGISTRATION FUNCTIONS ================= */
  const validateRegistration = () => {
    const errors: {[key: string]: string} = {};
    
    // Full Name validation
    if (!registerForm.fullName.trim()) {
      errors.fullName = "Full name is required";
    } else if (registerForm.fullName.length < 2) {
      errors.fullName = "Name must be at least 2 characters";
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!registerForm.email.trim()) {
      errors.email = "Email is required";
    } else if (!emailRegex.test(registerForm.email)) {
      errors.email = "Please enter a valid email address";
    } else {
      // Check if email already exists
      const existingUser = users.find(u => u.email === registerForm.email);
      if (existingUser) {
        errors.email = "This email is already registered";
      }
    }
    
    // Password validation
    if (!registerForm.password) {
      errors.password = "Password is required";
    } else if (registerForm.password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    } else if (!/[A-Z]/.test(registerForm.password)) {
      errors.password = "Password must contain at least one uppercase letter";
    } else if (!/[0-9]/.test(registerForm.password)) {
      errors.password = "Password must contain at least one number";
    }
    
    // Confirm Password validation
    if (!registerForm.confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (registerForm.password !== registerForm.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }
    
    // Company validation
    if (!registerForm.companyName.trim()) {
      errors.companyName = "Company name is required";
    }
    
    if (!registerForm.companyType) {
      errors.companyType = "Company type is required";
    }
    
    if (!registerForm.position.trim()) {
      errors.position = "Position is required";
    }
    
    // Phone validation
    const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,4}[-\s.]?[0-9]{1,9}$/;
    if (!registerForm.phone.trim()) {
      errors.phone = "Phone number is required";
    } else if (!phoneRegex.test(registerForm.phone)) {
      errors.phone = "Please enter a valid phone number";
    }
    
    // Terms validation
    if (!acceptTerms) {
      errors.terms = "You must accept the terms and conditions";
    }
    
    setRegistrationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateRegistration()) {
      Alert.alert("Validation Error", "Please fix the errors in the form");
      return;
    }
    
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      const newUser: User = {
        id: Date.now().toString(),
        fullName: registerForm.fullName,
        email: registerForm.email,
        password: registerForm.password, // In production, this should be hashed
        companyName: registerForm.companyName,
        companyType: registerForm.companyType,
        position: registerForm.position,
        phone: registerForm.phone,
        country: registerForm.country,
        city: registerForm.city,
        address: registerForm.address,
        companyLogo: companyLogo,
        registrationDate: new Date().toISOString(),
        isActive: true,
      };
      
      setUsers([...users, newUser]);
      
      // Auto-login after registration
      setCurrentUser(newUser);
      setEmail(registerForm.email);
      setPassword(registerForm.password);
      
      Alert.alert(
        "Registration Successful", 
        `Welcome, ${registerForm.fullName}! Your account has been created successfully.`,
        [
          { 
            text: "Continue to Login", 
            onPress: () => {
              setScreen("login");
              // Clear registration form
              setRegisterForm({
                fullName: "",
                email: "",
                password: "",
                confirmPassword: "",
                companyName: "",
                companyType: "",
                position: "",
                phone: "",
                country: "",
                city: "",
                address: "",
              });
              setCompanyLogo(null);
              setAcceptTerms(false);
              setRegistrationErrors({});
            }
          }
        ]
      );
      
      setLoading(false);
    }, 1500);
  };

  const handleLogin = () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter email and password");
      return;
    }
    
    // Find user by email
    const user = users.find(u => u.email === email);
    
    if (user && user.password === password) {
      setCurrentUser(user);
      setScreen("details");
    } else {
      Alert.alert("Login Failed", "Invalid email or password");
    }
  };

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Logout", 
          style: "destructive",
          onPress: () => {
            setCurrentUser(null);
            setEmail("");
            setPassword("");
            setSelectedProfile(null);
            setDetails({
              date: "",
              shipName: "",
              shipType: "",
              port: "",
              inspector: "",
            });
            setImages([]);
            setLogoImage(null);
            setShipImage(null);
            setScreen("login");
          }
        }
      ]
    );
  };

  /* ================= PROFILE FUNCTIONS ================= */
  const openProfileModal = () => {
    setIsEditing(false);
    setEditingProfileId(null);
    setNewProfile({
      id: Date.now().toString(),
      profilePicture: "",
      name: "",
      company: currentUser?.companyName || "",
      position: currentUser?.position || "",
      phone: currentUser?.phone || "",
      email: currentUser?.email || "",
      signature: "",
      experience: "",
      certifications: [],
      shipTypes: [],
      licenseNumber: "",
      issuingAuthority: "",
      expiryDate: "",
      address: "",
      emergencyContact: "",
      notes: "",
    });
    setShowProfileModal(true);
  };

  const openEditProfileModal = (profile: Profile) => {
    setIsEditing(true);
    setEditingProfileId(profile.id);
    setNewProfile(profile);
    setShowProfileModal(true);
  };

  const closeProfileModal = () => {
    setShowProfileModal(false);
    setIsEditing(false);
    setEditingProfileId(null);
  };

  const toggleCertification = (cert: string) => {
    setNewProfile(prev => ({
      ...prev,
      certifications: prev.certifications.includes(cert)
        ? prev.certifications.filter(c => c !== cert)
        : [...prev.certifications, cert]
    }));
  };

  const toggleShipType = (type: string) => {
    setNewProfile(prev => ({
      ...prev,
      shipTypes: prev.shipTypes.includes(type)
        ? prev.shipTypes.filter(t => t !== type)
        : [...prev.shipTypes, type]
    }));
  };

  const saveProfile = () => {
    if (!newProfile.name || !newProfile.company || !newProfile.position) {
      Alert.alert("Missing Information", "Please fill in name, company, and position");
      return;
    }

    let updatedProfiles;
    if (isEditing && editingProfileId) {
      updatedProfiles = profiles.map(p => 
        p.id === editingProfileId ? newProfile : p
      );
      if (selectedProfile?.id === editingProfileId) {
        setSelectedProfile(newProfile);
      }
    } else {
      updatedProfiles = [...profiles, newProfile];
    }
    
    setProfiles(updatedProfiles);
    
    Alert.alert("Success", `Profile ${isEditing ? 'updated' : 'saved'} successfully!`);
    closeProfileModal();
  };

  const selectProfile = (profile: Profile) => {
    setSelectedProfile(profile);
    if (screen === "details") {
      setDetails({
        ...details,
        inspector: profile.name,
      });
    }
  };

  const deleteProfile = (profileId: string) => {
    const profileToDelete = profiles.find(p => p.id === profileId);
    
    Alert.alert(
      "Delete Profile",
      `Are you sure you want to delete ${profileToDelete?.name}'s profile?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            const updatedProfiles = profiles.filter(p => p.id !== profileId);
            setProfiles(updatedProfiles);
            
            if (selectedProfile?.id === profileId) {
              setSelectedProfile(null);
            }
            
            Alert.alert("Success", "Profile deleted successfully!");
          },
        },
      ]
    );
  };

  const duplicateProfile = (profile: Profile) => {
    const duplicatedProfile = {
      ...profile,
      id: Date.now().toString(),
      name: `${profile.name} (Copy)`,
    };
    
    setProfiles([...profiles, duplicatedProfile]);
    Alert.alert("Success", "Profile duplicated successfully!");
  };

  /* ================= SUBMIT ================= */
  const uploadInspection = async () => {
    if (
      !details.date ||
      !details.shipName ||
      !details.shipType ||
      !details.port ||
      !details.inspector ||
      images.length === 0
    ) {
      Alert.alert("Missing Data", "Fill all details and add images");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("email", email);
      formData.append("date", details.date);
      formData.append("ship_name", details.shipName);
      formData.append("ship_type", details.shipType);
      formData.append("port", details.port);
      formData.append("inspector", details.inspector);
      formData.append("images_per_page", imagesPerPage.toString());

      if (logoImage) formData.append("logo", logoImage as any);
      if (shipImage) formData.append("ship_image", shipImage as any);

      if (selectedProfile) {
        formData.append("inspector_company", selectedProfile.company);
        formData.append("inspector_position", selectedProfile.position);
        formData.append("inspector_phone", selectedProfile.phone);
        formData.append("inspector_email", selectedProfile.email);
        formData.append("inspector_experience", selectedProfile.experience);
        formData.append("inspector_certifications", selectedProfile.certifications.join(", "));
        formData.append("inspector_license", selectedProfile.licenseNumber);
        
        if (selectedProfile.profilePicture) {
          formData.append("inspector_photo", selectedProfile.profilePicture as any);
        }
        if (selectedProfile.signature) {
          formData.append("inspector_signature", selectedProfile.signature as any);
        }
      }

      images.forEach((img) => {
        formData.append("images", img as any);
        formData.append("descriptions", img.description || "");
      });

      const res = await fetch(`${API_URL}/inspection`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setInspectionId(data.inspection_id);
        setScreen("review");
      } else {
        Alert.alert("Upload Failed", JSON.stringify(data));
      }
    } catch (e: any) {
      Alert.alert("Network Error", e.message);
    }
    setLoading(false);
  };

  /* ================= LOGIN SCREEN ================= */
  if (screen === "login") {
    return (
      <SafeAreaView style={styles.center}>
        <StatusBar barStyle="dark-content" />
        <Image source={logo} style={styles.logo} />
        <Text style={styles.brand}>Fathom Marine</Text>
        <Text style={styles.subtitle}>Ship Inspection System</Text>
        
        {currentUser && (
          <View style={styles.loggedInMessage}>
            <Text style={styles.loggedInText}>Welcome back, {currentUser.fullName}!</Text>
          </View>
        )}

        <TextInput 
          style={styles.input} 
          placeholder="Email" 
          value={email} 
          onChangeText={setEmail} 
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput 
          style={styles.input} 
          placeholder="Password" 
          secureTextEntry 
          value={password} 
          onChangeText={setPassword} 
        />

        <TouchableOpacity style={styles.btn} onPress={handleLogin} activeOpacity={0.85}>
          <Text style={styles.btnText}>LOGIN</Text>
        </TouchableOpacity>
        
        <View style={styles.loginFooter}>
          <Text style={styles.loginFooterText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => setScreen("register")}>
            <Text style={styles.loginFooterLink}>Create Account</Text>
          </TouchableOpacity>
        </View>
        
        {users.length === 0 && (
          <View style={styles.demoHint}>
            <Text style={styles.demoHintText}>📝 No users yet. Create an account to get started!</Text>
          </View>
        )}
      </SafeAreaView>
    );
  }

  /* ================= REGISTER SCREEN ================= */
  if (screen === "register") {
    return (
      <SafeAreaView style={styles.registerContainer}>
        <StatusBar barStyle="dark-content" />
        <BackButton />
        
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.registerScroll}
        >
          <View style={styles.registerHeader}>
            <Image source={logo} style={styles.registerLogo} />
            <Text style={styles.registerTitle}>Create Account</Text>
            <Text style={styles.registerSubtitle}>Join Fathom Marine Inspection System</Text>
          </View>

          <View style={styles.registerCard}>
            {/* Personal Information Section */}
            <Text style={styles.registerSectionTitle}>Personal Information</Text>
            
            <View style={styles.registerField}>
              <Text style={styles.registerLabel}>Full Name <Text style={styles.requiredStar}>*</Text></Text>
              <TextInput
                style={[styles.registerInput, registrationErrors.fullName && styles.inputError]}
                placeholder="Enter your full name"
                value={registerForm.fullName}
                onChangeText={(text) => {
                  setRegisterForm({...registerForm, fullName: text});
                  if (registrationErrors.fullName) {
                    setRegistrationErrors({...registrationErrors, fullName: ""});
                  }
                }}
              />
              {registrationErrors.fullName && (
                <Text style={styles.errorText}>{registrationErrors.fullName}</Text>
              )}
            </View>

            <View style={styles.registerField}>
              <Text style={styles.registerLabel}>Email Address <Text style={styles.requiredStar}>*</Text></Text>
              <TextInput
                style={[styles.registerInput, registrationErrors.email && styles.inputError]}
                placeholder="your.email@company.com"
                value={registerForm.email}
                onChangeText={(text) => {
                  setRegisterForm({...registerForm, email: text.toLowerCase()});
                  if (registrationErrors.email) {
                    setRegistrationErrors({...registrationErrors, email: ""});
                  }
                }}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {registrationErrors.email && (
                <Text style={styles.errorText}>{registrationErrors.email}</Text>
              )}
            </View>

            <View style={styles.registerRow}>
              <View style={[styles.registerField, styles.halfWidth]}>
                <Text style={styles.registerLabel}>Password <Text style={styles.requiredStar}>*</Text></Text>
                <View style={styles.passwordField}>
                  <TextInput
                    style={[styles.registerInput, registrationErrors.password && styles.inputError, {flex: 1}]}
                    placeholder="Create password"
                    value={registerForm.password}
                    onChangeText={(text) => {
                      setRegisterForm({...registerForm, password: text});
                      if (registrationErrors.password) {
                        setRegistrationErrors({...registrationErrors, password: ""});
                      }
                    }}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity 
                    style={styles.passwordToggle}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Text style={styles.passwordToggleText}>
                      {showPassword ? "👁️" : "👁️‍🗨️"}
                    </Text>
                  </TouchableOpacity>
                </View>
                {registrationErrors.password && (
                  <Text style={styles.errorText}>{registrationErrors.password}</Text>
                )}
              </View>

              <View style={[styles.registerField, styles.halfWidth]}>
                <Text style={styles.registerLabel}>Confirm <Text style={styles.requiredStar}>*</Text></Text>
                <View style={styles.passwordField}>
                  <TextInput
                    style={[styles.registerInput, registrationErrors.confirmPassword && styles.inputError, {flex: 1}]}
                    placeholder="Confirm password"
                    value={registerForm.confirmPassword}
                    onChangeText={(text) => {
                      setRegisterForm({...registerForm, confirmPassword: text});
                      if (registrationErrors.confirmPassword) {
                        setRegistrationErrors({...registrationErrors, confirmPassword: ""});
                      }
                    }}
                    secureTextEntry={!showConfirmPassword}
                  />
                  <TouchableOpacity 
                    style={styles.passwordToggle}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <Text style={styles.passwordToggleText}>
                      {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
                    </Text>
                  </TouchableOpacity>
                </View>
                {registrationErrors.confirmPassword && (
                  <Text style={styles.errorText}>{registrationErrors.confirmPassword}</Text>
                )}
              </View>
            </View>

            <View style={styles.passwordRequirements}>
              <Text style={styles.passwordRequirementsTitle}>Password requirements:</Text>
              <View style={styles.passwordRequirementItem}>
                <Text style={[
                  styles.passwordRequirementIcon,
                  registerForm.password.length >= 8 ? styles.requirementMet : {}
                ]}>
                  {registerForm.password.length >= 8 ? "✓" : "•"}
                </Text>
                <Text style={styles.passwordRequirementText}>At least 8 characters</Text>
              </View>
              <View style={styles.passwordRequirementItem}>
                <Text style={[
                  styles.passwordRequirementIcon,
                  /[A-Z]/.test(registerForm.password) ? styles.requirementMet : {}
                ]}>
                  {/[A-Z]/.test(registerForm.password) ? "✓" : "•"}
                </Text>
                <Text style={styles.passwordRequirementText}>At least one uppercase letter</Text>
              </View>
              <View style={styles.passwordRequirementItem}>
                <Text style={[
                  styles.passwordRequirementIcon,
                  /[0-9]/.test(registerForm.password) ? styles.requirementMet : {}
                ]}>
                  {/[0-9]/.test(registerForm.password) ? "✓" : "•"}
                </Text>
                <Text style={styles.passwordRequirementText}>At least one number</Text>
              </View>
            </View>

            {/* Company Information Section */}
            <Text style={[styles.registerSectionTitle, styles.sectionSpacer]}>Company Information</Text>

            <View style={styles.companyLogoContainer}>
              <TouchableOpacity style={styles.companyLogoPicker} onPress={pickCompanyLogo}>
                {companyLogo ? (
                  <Image source={{ uri: companyLogo }} style={styles.companyLogoPreview} />
                ) : (
                  <View style={styles.companyLogoPlaceholder}>
                    <Text style={styles.companyLogoIcon}>🏢</Text>
                    <Text style={styles.companyLogoText}>Upload Company Logo</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.registerField}>
              <Text style={styles.registerLabel}>Company Name <Text style={styles.requiredStar}>*</Text></Text>
              <TextInput
                style={[styles.registerInput, registrationErrors.companyName && styles.inputError]}
                placeholder="Enter company name"
                value={registerForm.companyName}
                onChangeText={(text) => {
                  setRegisterForm({...registerForm, companyName: text});
                  if (registrationErrors.companyName) {
                    setRegistrationErrors({...registrationErrors, companyName: ""});
                  }
                }}
              />
              {registrationErrors.companyName && (
                <Text style={styles.errorText}>{registrationErrors.companyName}</Text>
              )}
            </View>

            <View style={styles.registerField}>
              <Text style={styles.registerLabel}>Company Type <Text style={styles.requiredStar}>*</Text></Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={registerForm.companyType}
                  onValueChange={(value) => {
                    setRegisterForm({...registerForm, companyType: value});
                    if (registrationErrors.companyType) {
                      setRegistrationErrors({...registrationErrors, companyType: ""});
                    }
                  }}
                  style={styles.picker}
                >
                  <Picker.Item label="Select company type" value="" />
                  {COMPANY_TYPES.map((type) => (
                    <Picker.Item key={type} label={type} value={type} />
                  ))}
                </Picker>
              </View>
              {registrationErrors.companyType && (
                <Text style={styles.errorText}>{registrationErrors.companyType}</Text>
              )}
            </View>

            <View style={styles.registerRow}>
              <View style={[styles.registerField, styles.halfWidth]}>
                <Text style={styles.registerLabel}>Position/Role <Text style={styles.requiredStar}>*</Text></Text>
                <TextInput
                  style={[styles.registerInput, registrationErrors.position && styles.inputError]}
                  placeholder="e.g., Marine Inspector"
                  value={registerForm.position}
                  onChangeText={(text) => {
                    setRegisterForm({...registerForm, position: text});
                    if (registrationErrors.position) {
                      setRegistrationErrors({...registrationErrors, position: ""});
                    }
                  }}
                />
                {registrationErrors.position && (
                  <Text style={styles.errorText}>{registrationErrors.position}</Text>
                )}
              </View>

              <View style={[styles.registerField, styles.halfWidth]}>
                <Text style={styles.registerLabel}>Phone Number <Text style={styles.requiredStar}>*</Text></Text>
                <TextInput
                  style={[styles.registerInput, registrationErrors.phone && styles.inputError]}
                  placeholder="+1234567890"
                  value={registerForm.phone}
                  onChangeText={(text) => {
                    setRegisterForm({...registerForm, phone: text});
                    if (registrationErrors.phone) {
                      setRegistrationErrors({...registrationErrors, phone: ""});
                    }
                  }}
                  keyboardType="phone-pad"
                />
                {registrationErrors.phone && (
                  <Text style={styles.errorText}>{registrationErrors.phone}</Text>
                )}
              </View>
            </View>

            <View style={styles.registerRow}>
              <View style={[styles.registerField, styles.halfWidth]}>
                <Text style={styles.registerLabel}>Country</Text>
                <TextInput
                  style={styles.registerInput}
                  placeholder="Your country"
                  value={registerForm.country}
                  onChangeText={(text) => setRegisterForm({...registerForm, country: text})}
                />
              </View>

              <View style={[styles.registerField, styles.halfWidth]}>
                <Text style={styles.registerLabel}>City</Text>
                <TextInput
                  style={styles.registerInput}
                  placeholder="Your city"
                  value={registerForm.city}
                  onChangeText={(text) => setRegisterForm({...registerForm, city: text})}
                />
              </View>
            </View>

            <View style={styles.registerField}>
              <Text style={styles.registerLabel}>Address</Text>
              <TextInput
                style={[styles.registerInput, { height: 80 }]}
                placeholder="Street address, building, etc."
                value={registerForm.address}
                onChangeText={(text) => setRegisterForm({...registerForm, address: text})}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Terms and Conditions */}
            <View style={styles.termsContainer}>
              <TouchableOpacity
                style={styles.checkbox}
                onPress={() => setAcceptTerms(!acceptTerms)}
              >
                <Text style={styles.checkboxIcon}>{acceptTerms ? "✓" : ""}</Text>
              </TouchableOpacity>
              <Text style={styles.termsText}>
                I agree to the{" "}
                <Text style={styles.termsLink}>Terms of Service</Text> and{" "}
                <Text style={styles.termsLink}>Privacy Policy</Text>
                <Text style={styles.requiredStar}>*</Text>
              </Text>
            </View>
            {registrationErrors.terms && (
              <Text style={[styles.errorText, { marginLeft: 30, marginBottom: 16 }]}>
                {registrationErrors.terms}
              </Text>
            )}

            {/* Register Button */}
            <TouchableOpacity 
              style={styles.registerButton} 
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.registerButtonText}>CREATE ACCOUNT</Text>
              )}
            </TouchableOpacity>

            {/* Login Link */}
            <View style={styles.registerFooter}>
              <Text style={styles.registerFooterText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => setScreen("login")}>
                <Text style={styles.registerFooterLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  /* ================= DETAILS ================= */
  if (screen === "details") {
    return (
      <ScrollView 
        contentContainerStyle={[styles.page, { paddingBottom: 120 }]}
        keyboardShouldPersistTaps="always"
        showsVerticalScrollIndicator={false}
      >
        <BackButton />
        
        {/* User Info Header */}
        {currentUser && (
          <View style={styles.userHeader}>
            <View style={styles.userHeaderInfo}>
              {currentUser.companyLogo ? (
                <Image source={{ uri: currentUser.companyLogo }} style={styles.userAvatar} />
              ) : (
                <View style={styles.userAvatarPlaceholder}>
                  <Text style={styles.userAvatarText}>{currentUser.fullName.charAt(0)}</Text>
                </View>
              )}
              <View style={styles.userHeaderText}>
                <Text style={styles.userName}>{currentUser.fullName}</Text>
                <Text style={styles.userCompany}>{currentUser.companyName}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Text style={styles.logoutButtonText}>Logout</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.pageTitle}>Inspection Details</Text>

        <View style={styles.card}>
          <TextInput
            style={styles.input}
            placeholder="Date (e.g., 2023-10-25)"
            value={details.date}
            onChangeText={(t) => setDetails({ ...details, date: t })}
          />
          <TextInput
            style={styles.input}
            placeholder="Ship Name"
            value={details.shipName}
            onChangeText={(t) => setDetails({ ...details, shipName: t })}
          />
          <TextInput
            style={styles.input}
            placeholder="Ship Type"
            value={details.shipType}
            onChangeText={(t) => setDetails({ ...details, shipType: t })}
          />
          <TextInput
            style={styles.input}
            placeholder="Port"
            value={details.port}
            onChangeText={(t) => setDetails({ ...details, port: t })}
          />
          
          {/* Inspector Field */}
          <View style={styles.inspectorSection}>
            <TextInput
              style={styles.input}
              placeholder="Inspector Name"
              value={details.inspector}
              onChangeText={(t) => setDetails({ ...details, inspector: t })}
            />
            <TouchableOpacity 
              style={styles.profileSelectBtn}
              onPress={() => {
                if (profiles.length > 0) {
                  Alert.alert(
                    "Select Profile",
                    "Choose an inspector profile:",
                    [
                      ...profiles.map((profile) => ({
                        text: `${profile.name} - ${profile.position}`,
                        onPress: () => selectProfile(profile),
                      })),
                      {
                        text: "Enter Manually",
                        onPress: () => {
                          setSelectedProfile(null);
                        },
                        style: "default"
                      }
                    ]
                  );
                } else {
                  Alert.alert("No Profiles", "Create a profile first to use this feature.");
                }
              }}
            >
              <Text style={styles.profileSelectText}>Select Profile</Text>
            </TouchableOpacity>
          </View>

          {/* Logo and Ship Image Buttons */}
          <View style={styles.imageButtonsRow}>
            <TouchableOpacity style={styles.imageButton} onPress={pickLogo}>
              <Text style={styles.imageButtonText}>Upload Company Logo</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.imageButton} onPress={pickShipImage}>
              <Text style={styles.imageButtonText}>Add Ship Image</Text>
            </TouchableOpacity>
          </View>

          {/* Preview Images */}
          <View style={styles.previewRow}>
            {logoImage && (
              <View style={styles.previewContainer}>
                <Text style={styles.previewLabel}>Company Logo</Text>
                <Image source={{ uri: logoImage.uri }} style={styles.previewImage} />
              </View>
            )}
            
            {shipImage && (
              <View style={styles.previewContainer}>
                <Text style={styles.previewLabel}>Ship Image</Text>
                <Image source={{ uri: shipImage.uri }} style={styles.previewImage} />
              </View>
            )}
          </View>
        </View>

        {/* Selected Profile Card */}
        {selectedProfile && (
          <View style={styles.profileCard}>
            <View style={styles.profileCardHeader}>
              <View style={styles.profilePictureContainer}>
                {selectedProfile.profilePicture ? (
                  <Image source={{ uri: selectedProfile.profilePicture }} style={styles.profilePicture} />
                ) : (
                  <View style={styles.profilePicturePlaceholder}>
                    <Text style={styles.profilePictureText}>
                      {selectedProfile.name.charAt(0)}
                    </Text>
                  </View>
                )}
              </View>
              <View style={styles.profileHeaderInfo}>
                <Text style={styles.profileName}>{selectedProfile.name}</Text>
                <Text style={styles.profilePosition}>{selectedProfile.position}</Text>
                <Text style={styles.profileCompany}>{selectedProfile.company}</Text>
              </View>
            </View>
            
            <View style={styles.profileDetails}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Experience:</Text>
                <Text style={styles.detailValue}>{selectedProfile.experience}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>License:</Text>
                <Text style={styles.detailValue}>{selectedProfile.licenseNumber}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Certifications:</Text>
                <Text style={styles.detailValue} numberOfLines={1}>
                  {selectedProfile.certifications.slice(0, 2).join(", ")}
                  {selectedProfile.certifications.length > 2 && "..."}
                </Text>
              </View>
            </View>
            
            <View style={styles.profileActionRow}>
              <TouchableOpacity 
                style={styles.clearProfileBtn}
                onPress={() => {
                  setSelectedProfile(null);
                }}
              >
                <Text style={styles.clearProfileText}>Remove Profile</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.editSelectedBtn}
                onPress={() => openEditProfileModal(selectedProfile)}
              >
                <Text style={styles.editSelectedText}>Edit Profile</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <TouchableOpacity style={styles.btn} onPress={() => setScreen("upload")}>
          <Text style={styles.btnText}>NEXT → UPLOAD IMAGES</Text>
        </TouchableOpacity>

        {/* Create Profile Button at Bottom */}
        <TouchableOpacity 
          style={styles.createProfileBtn} 
          onPress={openProfileModal}
          activeOpacity={0.85}
        >
          <View style={styles.createProfileContent}>
            <Text style={styles.createProfileIcon}>👨‍✈️</Text>
            <View style={styles.createProfileTexts}>
              <Text style={styles.createProfileTitle}>Manage Inspector Profiles</Text>
              <Text style={styles.createProfileSubtitle}>
                {profiles.length} saved profile{profiles.length !== 1 ? 's' : ''}
              </Text>
            </View>
            <Text style={styles.createProfileArrow}>›</Text>
          </View>
        </TouchableOpacity>

        {/* Profile Modal */}
        <Modal
          visible={showProfileModal}
          animationType="slide"
          transparent={true}
          onRequestClose={closeProfileModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {isEditing ? 'Edit Profile' : 'Create New Profile'}
                </Text>
                <TouchableOpacity onPress={closeProfileModal}>
                  <Text style={styles.modalClose}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                {/* Profile Picture */}
                <TouchableOpacity style={styles.profilePictureSelect} onPress={pickProfilePicture}>
                  {newProfile.profilePicture ? (
                    <Image source={{ uri: newProfile.profilePicture }} style={styles.profilePictureLarge} />
                  ) : (
                    <View style={styles.profilePicturePlaceholderLarge}>
                      <Text style={styles.profilePictureIcon}>👨‍✈️</Text>
                      <Text style={styles.profilePictureHint}>Add photo</Text>
                    </View>
                  )}
                </TouchableOpacity>

                {/* Basic Information */}
                <Text style={styles.sectionTitle}>Basic Information</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Full Name *"
                  value={newProfile.name}
                  onChangeText={(t) => setNewProfile({...newProfile, name: t})}
                />
                <TextInput
                  style={styles.modalInput}
                  placeholder="Company *"
                  value={newProfile.company}
                  onChangeText={(t) => setNewProfile({...newProfile, company: t})}
                />
                <TextInput
                  style={styles.modalInput}
                  placeholder="Position/Role *"
                  value={newProfile.position}
                  onChangeText={(t) => setNewProfile({...newProfile, position: t})}
                />
                <TextInput
                  style={styles.modalInput}
                  placeholder="Years of Experience"
                  value={newProfile.experience}
                  onChangeText={(t) => setNewProfile({...newProfile, experience: t})}
                />

                {/* Contact Information */}
                <Text style={styles.sectionTitle}>Contact Information</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Phone Number"
                  value={newProfile.phone}
                  onChangeText={(t) => setNewProfile({...newProfile, phone: t})}
                  keyboardType="phone-pad"
                />
                <TextInput
                  style={styles.modalInput}
                  placeholder="Email Address"
                  value={newProfile.email}
                  onChangeText={(t) => setNewProfile({...newProfile, email: t})}
                  keyboardType="email-address"
                />
                <TextInput
                  style={styles.modalInput}
                  placeholder="Address"
                  value={newProfile.address}
                  onChangeText={(t) => setNewProfile({...newProfile, address: t})}
                  multiline
                />
                <TextInput
                  style={styles.modalInput}
                  placeholder="Emergency Contact"
                  value={newProfile.emergencyContact}
                  onChangeText={(t) => setNewProfile({...newProfile, emergencyContact: t})}
                />

                {/* Professional Details */}
                <Text style={styles.sectionTitle}>Professional Details</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="License/Certificate Number"
                  value={newProfile.licenseNumber}
                  onChangeText={(t) => setNewProfile({...newProfile, licenseNumber: t})}
                />
                <TextInput
                  style={styles.modalInput}
                  placeholder="Issuing Authority"
                  value={newProfile.issuingAuthority}
                  onChangeText={(t) => setNewProfile({...newProfile, issuingAuthority: t})}
                />
                <TextInput
                  style={styles.modalInput}
                  placeholder="Expiry Date (YYYY-MM-DD)"
                  value={newProfile.expiryDate}
                  onChangeText={(t) => setNewProfile({...newProfile, expiryDate: t})}
                />

                {/* Certifications */}
                <Text style={styles.sectionTitle}>Certifications</Text>
                <View style={styles.chipContainer}>
                  {CERTIFICATIONS.map((cert) => (
                    <TouchableOpacity
                      key={cert}
                      style={[
                        styles.chip,
                        newProfile.certifications.includes(cert) && styles.chipSelected
                      ]}
                      onPress={() => toggleCertification(cert)}
                    >
                      <Text style={[
                        styles.chipText,
                        newProfile.certifications.includes(cert) && styles.chipTextSelected
                      ]}>
                        {cert}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Ship Types */}
                <Text style={styles.sectionTitle}>Ship Type Specializations</Text>
                <View style={styles.chipContainer}>
                  {SHIP_TYPES.map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.chip,
                        newProfile.shipTypes.includes(type) && styles.chipSelected
                      ]}
                      onPress={() => toggleShipType(type)}
                    >
                      <Text style={[
                        styles.chipText,
                        newProfile.shipTypes.includes(type) && styles.chipTextSelected
                      ]}>
                        {type}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Signature */}
                <Text style={styles.sectionTitle}>Signature</Text>
                <TouchableOpacity style={styles.signatureBtn} onPress={pickSignature}>
                  <Text style={styles.signatureBtnText}>
                    {newProfile.signature ? "Change Signature Image" : "Upload Signature Image"}
                  </Text>
                </TouchableOpacity>
                {newProfile.signature && (
                  <Image source={{ uri: newProfile.signature }} style={styles.signaturePreview} />
                )}

                {/* Notes */}
                <Text style={styles.sectionTitle}>Additional Notes</Text>
                <TextInput
                  style={[styles.modalInput, { height: 80 }]}
                  placeholder="Any additional information..."
                  value={newProfile.notes}
                  onChangeText={(t) => setNewProfile({...newProfile, notes: t})}
                  multiline
                />

                {/* Save Button */}
                <TouchableOpacity style={styles.saveProfileBtn} onPress={saveProfile}>
                  <Text style={styles.saveProfileText}>
                    {isEditing ? 'UPDATE PROFILE' : 'SAVE PROFILE'}
                  </Text>
                </TouchableOpacity>

                {/* Use Current Profile Button */}
                {!isEditing && (
                  <TouchableOpacity 
                    style={styles.useCurrentProfileBtn}
                    onPress={() => {
                      if (details.inspector.trim()) {
                        setNewProfile({
                          ...newProfile,
                          name: details.inspector,
                        });
                        Alert.alert("Info", "Current inspector name filled. Complete other details.");
                      } else {
                        Alert.alert("No Name", "Enter inspector name first to pre-fill.");
                      }
                    }}
                  >
                    <Text style={styles.useCurrentProfileText}>Use Current Inspector Name</Text>
                  </TouchableOpacity>
                )}

                {/* Existing Profiles Section */}
                <Text style={styles.existingProfilesTitle}>Saved Profiles ({profiles.length})</Text>
                {profiles.length === 0 ? (
                  <Text style={styles.noProfilesText}>
                    No profiles saved yet
                  </Text>
                ) : (
                  profiles.map((profile) => (
                    <View key={profile.id} style={styles.existingProfileCard}>
                      <View style={styles.existingProfileHeader}>
                        <View style={styles.existingProfileInfo}>
                          {profile.profilePicture ? (
                            <Image source={{ uri: profile.profilePicture }} style={styles.existingProfilePicture} />
                          ) : (
                            <View style={styles.existingProfilePicturePlaceholder}>
                              <Text style={styles.existingProfilePictureText}>
                                {profile.name.charAt(0)}
                              </Text>
                            </View>
                          )}
                          <View>
                            <Text style={styles.existingProfileName}>{profile.name}</Text>
                            <Text style={styles.existingProfileCompany}>{profile.company}</Text>
                          </View>
                        </View>
                        
                        <View style={styles.profileActions}>
                          <TouchableOpacity 
                            style={styles.profileActionBtn}
                            onPress={() => duplicateProfile(profile)}
                          >
                            <Text style={styles.profileActionText}>Duplicate</Text>
                          </TouchableOpacity>
                          
                          <TouchableOpacity 
                            style={[styles.profileActionBtn, styles.editBtn]}
                            onPress={() => openEditProfileModal(profile)}
                          >
                            <Text style={[styles.profileActionText, styles.editBtnText]}>Edit</Text>
                          </TouchableOpacity>
                          
                          <TouchableOpacity 
                            style={[styles.profileActionBtn, styles.deleteBtn]}
                            onPress={() => deleteProfile(profile.id)}
                          >
                            <Text style={[styles.profileActionText, styles.deleteBtnText]}>Delete</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                      
                      <View style={styles.existingProfileDetails}>
                        <Text style={styles.existingProfileDetail}>
                          <Text style={styles.detailLabelSmall}>Position: </Text>
                          {profile.position}
                        </Text>
                        <Text style={styles.existingProfileDetail}>
                          <Text style={styles.detailLabelSmall}>Experience: </Text>
                          {profile.experience}
                        </Text>
                        <Text style={styles.existingProfileDetail}>
                          <Text style={styles.detailLabelSmall}>License: </Text>
                          {profile.licenseNumber}
                        </Text>
                      </View>
                      
                      <View style={styles.profileUseButtons}>
                        <TouchableOpacity 
                          style={styles.useProfileBtn}
                          onPress={() => {
                            selectProfile(profile);
                            closeProfileModal();
                          }}
                        >
                          <Text style={styles.useProfileText}>Use This Profile</Text>
                        </TouchableOpacity>
                        
                        {selectedProfile?.id === profile.id && (
                          <Text style={styles.currentlySelectedText}>✓ Selected</Text>
                        )}
                      </View>
                    </View>
                  ))
                )}
                
                <View style={styles.modalSpacer} />
              </ScrollView>
            </View>
          </View>
        </Modal>
      </ScrollView>
    );
  }

  /* ================= UPLOAD ================= */
  const imagesPerColumn = imagesPerPage / 2;
  const pages: Img[][] = [];
  for (let i = 0; i < images.length; i += imagesPerPage) {
    pages.push(images.slice(i, i + imagesPerPage));
  }

  if (screen === "upload") {
    return (
      <ScrollView contentContainerStyle={styles.page}>
        <BackButton />
        
        {/* User Info Header */}
        {currentUser && (
          <View style={styles.userHeader}>
            <View style={styles.userHeaderInfo}>
              {currentUser.companyLogo ? (
                <Image source={{ uri: currentUser.companyLogo }} style={styles.userAvatar} />
              ) : (
                <View style={styles.userAvatarPlaceholder}>
                  <Text style={styles.userAvatarText}>{currentUser.fullName.charAt(0)}</Text>
                </View>
              )}
              <View style={styles.userHeaderText}>
                <Text style={styles.userName}>{currentUser.fullName}</Text>
                <Text style={styles.userCompany}>{currentUser.companyName}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Text style={styles.logoutButtonText}>Logout</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.pageTitle}>Upload Images</Text>

        <Text style={styles.label}>Images per page</Text>
        <Picker selectedValue={imagesPerPage} onValueChange={setImagesPerPage}>
          {EVEN_IMAGE_OPTIONS.map((num) => (
            <Picker.Item key={num} label={`${num} images`} value={num} />
          ))}
        </Picker>

        <View style={styles.row}>
          <TouchableOpacity style={styles.btnSmall} onPress={pickCamera}>
            <Text style={styles.btnText}>Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnSmall} onPress={pickGallery}>
            <Text style={styles.btnText}>Gallery</Text>
          </TouchableOpacity>
        </View>

        {pages.map((page, p) => (
          <View key={p} style={styles.row}>
            {[0, 1].map((col) => (
              <View key={col} style={{ flex: 1, marginHorizontal: 6 }}>
                {page
                  .slice(col * imagesPerColumn, (col + 1) * imagesPerColumn)
                  .map((img) => (
                    <View key={img.uri}>
                      <Image source={{ uri: img.uri }} style={styles.gridImg} />
                      <TextInput
                        style={styles.desc}
                        placeholder="Image description"
                        value={img.description}
                        onChangeText={(t) => {
                          const copy = [...images];
                          const idx = copy.findIndex((i) => i.uri === img.uri);
                          if (idx !== -1) {
                            copy[idx].description = t;
                            setImages(copy);
                          }
                        }}
                      />
                    </View>
                  ))}
              </View>
            ))}
          </View>
        ))}

        <TouchableOpacity style={styles.btn} onPress={() => setScreen("preview")}>
          <Text style={styles.btnText}>PREVIEW & SUBMIT</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  /* ================= PREVIEW ================= */
  if (screen === "preview") {
    return (
      <SafeAreaView style={styles.center}>
        <BackButton />
        
        {/* User Info Header */}
        {currentUser && (
          <View style={[styles.userHeader, { position: 'relative', top: 0, marginBottom: 20 }]}>
            <View style={styles.userHeaderInfo}>
              {currentUser.companyLogo ? (
                <Image source={{ uri: currentUser.companyLogo }} style={styles.userAvatar} />
              ) : (
                <View style={styles.userAvatarPlaceholder}>
                  <Text style={styles.userAvatarText}>{currentUser.fullName.charAt(0)}</Text>
                </View>
              )}
              <View style={styles.userHeaderText}>
                <Text style={styles.userName}>{currentUser.fullName}</Text>
                <Text style={styles.userCompany}>{currentUser.companyName}</Text>
              </View>
            </View>
          </View>
        )}

        <Text style={styles.pageTitle}>Submit Inspection?</Text>

        {selectedProfile ? (
          <View style={styles.previewProfile}>
            <View style={styles.previewProfileHeader}>
              {selectedProfile.profilePicture ? (
                <Image source={{ uri: selectedProfile.profilePicture }} style={styles.previewProfilePicture} />
              ) : (
                <View style={styles.previewProfilePicturePlaceholder}>
                  <Text style={styles.previewProfilePictureText}>
                    {selectedProfile.name.charAt(0)}
                  </Text>
                </View>
              )}
              <View>
                <Text style={styles.previewProfileName}>{selectedProfile.name}</Text>
                <Text style={styles.previewProfileCompany}>{selectedProfile.company}</Text>
              </View>
            </View>
            <Text style={styles.previewProfileDetail}>
              <Text style={styles.detailLabel}>Experience: </Text>
              {selectedProfile.experience}
            </Text>
            <Text style={styles.previewProfileDetail}>
              <Text style={styles.detailLabel}>License: </Text>
              {selectedProfile.licenseNumber}
            </Text>
          </View>
        ) : (
          <View style={styles.previewProfile}>
            <Text style={styles.previewManualText}>
              Inspector: <Text style={styles.previewManualValue}>{details.inspector}</Text>
            </Text>
          </View>
        )}

        <TouchableOpacity style={styles.btn} onPress={uploadInspection}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>SUBMIT INSPECTION</Text>}
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  /* ================= REVIEW ================= */
  return (
    <SafeAreaView style={styles.center}>
      <BackButton />
      
      {/* User Info Header */}
      {currentUser && (
        <View style={[styles.userHeader, { position: 'relative', top: 0, marginBottom: 20 }]}>
          <View style={styles.userHeaderInfo}>
            {currentUser.companyLogo ? (
              <Image source={{ uri: currentUser.companyLogo }} style={styles.userAvatar} />
            ) : (
              <View style={styles.userAvatarPlaceholder}>
                <Text style={styles.userAvatarText}>{currentUser.fullName.charAt(0)}</Text>
              </View>
            )}
            <View style={styles.userHeaderText}>
              <Text style={styles.userName}>{currentUser.fullName}</Text>
              <Text style={styles.userCompany}>{currentUser.companyName}</Text>
            </View>
          </View>
        </View>
      )}

      <Text style={styles.pageTitle}>Inspection Saved 🎉</Text>

      {selectedProfile ? (
        <View style={styles.reviewProfile}>
          <Text style={styles.reviewText}>
            Inspection completed by <Text style={styles.reviewHighlight}>{selectedProfile.name}</Text>
          </Text>
          <Text style={styles.reviewDetail}>
            {selectedProfile.position} at {selectedProfile.company}
          </Text>
        </View>
      ) : (
        <View style={styles.reviewProfile}>
          <Text style={styles.reviewText}>
            Inspection completed by <Text style={styles.reviewHighlight}>{details.inspector}</Text>
          </Text>
        </View>
      )}

      <TouchableOpacity style={styles.btn} onPress={() => Linking.openURL(`${API_URL}/export/${inspectionId}`)}>
        <Text style={styles.btnText}>Export PDF</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.btnOutline} onPress={() => Linking.openURL(`${API_URL}/export-word/${inspectionId}`)}>
        <Text style={styles.btnOutlineText}>Export Word</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.newInspectionBtn} 
        onPress={() => {
          setDetails({
            date: "",
            shipName: "",
            shipType: "",
            port: "",
            inspector: "",
          });
          setImages([]);
          setLogoImage(null);
          setShipImage(null);
          setSelectedProfile(null);
          setScreen("details");
        }}
      >
        <Text style={styles.newInspectionText}>Start New Inspection</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  center: { 
    flex: 1, 
    justifyContent: "center", 
    padding: 24, 
    backgroundColor: GRAY_SOFT 
  },
  page: { 
    padding: 24, 
    paddingTop: 80, 
    backgroundColor: GRAY_SOFT,
    minHeight: "100%",
  },

  backBtn: {
    position: "absolute",
    top: 18,
    left: 18,
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: WHITE,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    zIndex: 1000,
    borderWidth: 1,
    borderColor: GRAY_LIGHT,
  },
  backText: { 
    fontSize: 22, 
    fontWeight: "800", 
    color: BLUE_PRIMARY 
  },

  logo: { 
    width: 120, 
    height: 120, 
    alignSelf: "center", 
    marginBottom: 12 
  },
  brand: { 
    fontSize: 26, 
    fontWeight: "800", 
    textAlign: "center", 
    color: BLUE_PRIMARY 
  },
  subtitle: { 
    textAlign: "center", 
    marginBottom: 32, 
    color: GRAY_MEDIUM 
  },

  pageTitle: { 
    fontSize: 22, 
    fontWeight: "800", 
    marginBottom: 22, 
    color: GRAY_DARK 
  },
  label: { 
    fontWeight: "700", 
    marginBottom: 8, 
    color: BLUE_PRIMARY 
  },

  input: {
    backgroundColor: WHITE,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: GRAY_LIGHT,
    fontSize: 14,
    color: GRAY_DARK,
  },

  btn: {
    backgroundColor: BLUE_PRIMARY,
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 18,
    elevation: 5,
    shadowColor: BLUE_PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  btnSmall: {
    backgroundColor: BLUE_PRIMARY,
    paddingVertical: 14,
    borderRadius: 10,
    flex: 1,
    marginHorizontal: 6,
    alignItems: "center",
    elevation: 4,
  },
  btnText: { 
    color: WHITE, 
    fontWeight: "700", 
    fontSize: 15,
    letterSpacing: 0.5 
  },

  btnOutline: {
    borderWidth: 2,
    borderColor: BLUE_PRIMARY,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 16,
    backgroundColor: WHITE,
  },
  btnOutlineText: { 
    color: BLUE_PRIMARY, 
    fontWeight: "700",
    fontSize: 15,
  },

  card: {
    backgroundColor: WHITE,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    borderWidth: 1,
    borderColor: GRAY_LIGHT,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },

  row: { 
    flexDirection: "row", 
    marginBottom: 22 
  },

  gridImg: { 
    width: "100%", 
    height: 135, 
    borderRadius: 10, 
    marginBottom: 8,
    borderWidth: 1,
    borderColor: GRAY_LIGHT,
  },
  desc: {
    backgroundColor: BLUE_SOFT,
    padding: 12,
    borderRadius: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: GRAY_LIGHT,
    fontSize: 13,
    color: GRAY_DARK,
  },

  /* Profile Button at Bottom */
  createProfileBtn: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: WHITE,
    borderRadius: 14,
    padding: 16,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: GRAY_LIGHT,
  },
  createProfileContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  createProfileIcon: {
    fontSize: 28,
    marginRight: 12,
    color: BLUE_SECONDARY,
  },
  createProfileTexts: {
    flex: 1,
  },
  createProfileTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: BLUE_PRIMARY,
    marginBottom: 4,
  },
  createProfileSubtitle: {
    fontSize: 12,
    color: GRAY_MEDIUM,
  },
  createProfileArrow: {
    fontSize: 24,
    color: BLUE_PRIMARY,
    fontWeight: "bold",
  },

  /* Inspector Section */
  inspectorSection: {
    position: "relative",
  },
  profileSelectBtn: {
    position: "absolute",
    right: 10,
    top: 10,
    backgroundColor: BLUE_SECONDARY,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BLUE_PRIMARY,
  },
  profileSelectText: {
    color: WHITE,
    fontSize: 12,
    fontWeight: "600",
  },

  /* Profile Card */
  profileCard: {
    backgroundColor: WHITE,
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: BLUE_SECONDARY,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: GRAY_LIGHT,
  },
  profileCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  profilePictureContainer: {
    marginRight: 12,
  },
  profilePicture: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: BLUE_SECONDARY,
  },
  profilePicturePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: BLUE_SECONDARY,
    alignItems: "center",
    justifyContent: "center",
  },
  profilePictureText: {
    color: WHITE,
    fontSize: 24,
    fontWeight: "bold",
  },
  profileHeaderInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "700",
    color: BLUE_PRIMARY,
    marginBottom: 2,
  },
  profilePosition: {
    fontSize: 14,
    color: GRAY_DARK,
    marginBottom: 2,
    fontWeight: "600",
  },
  profileCompany: {
    fontSize: 13,
    color: GRAY_MEDIUM,
  },
  profileDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    marginBottom: 6,
  },
  detailLabel: {
    fontSize: 13,
    color: GRAY_MEDIUM,
    fontWeight: "600",
    width: 100,
  },
  detailValue: {
    fontSize: 13,
    color: GRAY_DARK,
    flex: 1,
  },
  profileActionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  clearProfileBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: GRAY_SOFT,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: GRAY_LIGHT,
  },
  clearProfileText: {
    color: GRAY_MEDIUM,
    fontSize: 12,
    fontWeight: "600",
  },
  editSelectedBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: AMBER,
    borderRadius: 8,
  },
  editSelectedText: {
    color: WHITE,
    fontSize: 12,
    fontWeight: "600",
  },

  /* Image Buttons */
  imageButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  imageButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: BLUE_SOFT,
    borderWidth: 1,
    borderColor: GRAY_LIGHT,
    marginHorizontal: 5,
  },
  imageButtonText: {
    color: BLUE_PRIMARY,
    fontWeight: "600",
    fontSize: 13,
  },

  /* Preview Images */
  previewRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 20,
    flexWrap: "wrap",
  },
  previewContainer: {
    alignItems: "center",
    marginBottom: 15,
  },
  previewLabel: {
    fontSize: 12,
    color: GRAY_MEDIUM,
    marginBottom: 6,
    fontWeight: "500",
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: GRAY_LIGHT,
  },

  /* Modal Styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: WHITE,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
    borderWidth: 1,
    borderColor: GRAY_LIGHT,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: GRAY_LIGHT,
    backgroundColor: BLUE_SOFT,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: BLUE_PRIMARY,
  },
  modalClose: {
    fontSize: 24,
    color: GRAY_MEDIUM,
    fontWeight: "300",
  },
  modalBody: {
    padding: 20,
    backgroundColor: GRAY_SOFT,
  },
  modalSpacer: {
    height: 30,
  },
  
  /* Profile Picture in Modal */
  profilePictureSelect: {
    alignItems: "center",
    marginBottom: 20,
  },
  profilePictureLarge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: BLUE_PRIMARY,
  },
  profilePicturePlaceholderLarge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: BLUE_SOFT,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: GRAY_LIGHT,
  },
  profilePictureIcon: {
    fontSize: 40,
    marginBottom: 8,
    color: BLUE_SECONDARY,
  },
  profilePictureHint: {
    fontSize: 12,
    color: GRAY_MEDIUM,
  },

  /* Modal Inputs */
  modalInput: {
    backgroundColor: WHITE,
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: GRAY_LIGHT,
    fontSize: 14,
    color: GRAY_DARK,
  },

  /* Sections */
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: BLUE_PRIMARY,
    marginTop: 16,
    marginBottom: 10,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: GRAY_LIGHT,
  },

  /* Chips for selections */
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 15,
  },
  chip: {
    backgroundColor: WHITE,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: GRAY_LIGHT,
  },
  chipSelected: {
    backgroundColor: BLUE_SECONDARY,
    borderColor: BLUE_PRIMARY,
  },
  chipText: {
    fontSize: 12,
    color: GRAY_DARK,
  },
  chipTextSelected: {
    color: WHITE,
    fontWeight: "600",
  },

  /* Signature */
  signatureBtn: {
    backgroundColor: BLUE_SECONDARY,
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: BLUE_PRIMARY,
  },
  signatureBtnText: {
    color: WHITE,
    fontWeight: "600",
    fontSize: 14,
  },
  signaturePreview: {
    width: 200,
    height: 80,
    alignSelf: "center",
    marginBottom: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: GRAY_LIGHT,
    backgroundColor: WHITE,
  },

  /* Save Button */
  saveProfileBtn: {
    backgroundColor: BLUE_PRIMARY,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginVertical: 20,
    elevation: 3,
    shadowColor: BLUE_PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  saveProfileText: {
    color: WHITE,
    fontWeight: "700",
    fontSize: 16,
    letterSpacing: 0.5,
  },

  /* Use Current Profile Button */
  useCurrentProfileBtn: {
    backgroundColor: WHITE,
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: GRAY_LIGHT,
  },
  useCurrentProfileText: {
    color: BLUE_PRIMARY,
    fontWeight: "600",
    fontSize: 14,
  },

  /* Existing Profiles */
  existingProfilesTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: BLUE_PRIMARY,
    marginBottom: 12,
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: GRAY_LIGHT,
  },
  noProfilesText: {
    textAlign: "center",
    padding: 20,
    color: GRAY_MEDIUM,
    fontStyle: "italic",
    backgroundColor: WHITE,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: GRAY_LIGHT,
  },
  existingProfileCard: {
    backgroundColor: WHITE,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: GRAY_LIGHT,
    elevation: 1,
  },
  existingProfileHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  existingProfileInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  existingProfilePicture: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: GRAY_LIGHT,
  },
  existingProfilePicturePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: BLUE_SECONDARY,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  existingProfilePictureText: {
    color: WHITE,
    fontSize: 16,
    fontWeight: "bold",
  },
  existingProfileName: {
    fontSize: 15,
    fontWeight: "700",
    color: BLUE_PRIMARY,
    marginBottom: 2,
  },
  existingProfileCompany: {
    fontSize: 12,
    color: GRAY_MEDIUM,
  },
  
  /* Profile Actions */
  profileActions: {
    flexDirection: "row",
    gap: 6,
  },
  profileActionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: GRAY_LIGHT,
  },
  profileActionText: {
    fontSize: 11,
    fontWeight: "600",
    color: GRAY_DARK,
  },
  editBtn: {
    backgroundColor: BLUE_LIGHT,
    borderColor: BLUE_SECONDARY,
  },
  editBtnText: {
    color: WHITE,
  },
  deleteBtn: {
    backgroundColor: RED,
    borderColor: RED,
  },
  deleteBtnText: {
    color: WHITE,
  },

  /* Existing Profile Details */
  existingProfileDetails: {
    marginBottom: 10,
    backgroundColor: BLUE_SOFT,
    padding: 10,
    borderRadius: 8,
  },
  existingProfileDetail: {
    fontSize: 12,
    color: GRAY_DARK,
    marginBottom: 4,
  },
  detailLabelSmall: {
    color: GRAY_MEDIUM,
    fontWeight: "600",
  },

  /* Profile Use Buttons */
  profileUseButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  useProfileBtn: {
    backgroundColor: BLUE_PRIMARY,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: BLUE_PRIMARY,
  },
  useProfileText: {
    color: WHITE,
    fontWeight: "600",
    fontSize: 12,
  },
  currentlySelectedText: {
    fontSize: 11,
    color: GREEN,
    fontWeight: "600",
    fontStyle: "italic",
  },

  /* Preview Screen Styles */
  previewProfile: {
    backgroundColor: WHITE,
    borderRadius: 14,
    padding: 20,
    marginBottom: 24,
    elevation: 3,
    width: "100%",
    borderWidth: 1,
    borderColor: GRAY_LIGHT,
  },
  previewProfileHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  previewProfilePicture: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    borderWidth: 2,
    borderColor: BLUE_SECONDARY,
  },
  previewProfilePicturePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: BLUE_SECONDARY,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  previewProfilePictureText: {
    color: WHITE,
    fontSize: 20,
    fontWeight: "bold",
  },
  previewProfileName: {
    fontSize: 17,
    fontWeight: "700",
    color: BLUE_PRIMARY,
    marginBottom: 2,
  },
  previewProfileCompany: {
    fontSize: 14,
    color: GRAY_MEDIUM,
  },
  previewProfileDetail: {
    fontSize: 14,
    color: GRAY_DARK,
    marginBottom: 8,
  },
  previewManualText: {
    fontSize: 16,
    color: GRAY_DARK,
    marginBottom: 8,
  },
  previewManualValue: {
    fontWeight: "700",
    color: BLUE_PRIMARY,
  },

  /* Review Screen Styles */
  reviewProfile: {
    backgroundColor: WHITE,
    borderRadius: 14,
    padding: 20,
    marginBottom: 24,
    elevation: 3,
    width: "100%",
    alignItems: "center",
    borderWidth: 1,
    borderColor: GRAY_LIGHT,
  },
  reviewText: {
    fontSize: 16,
    color: GRAY_DARK,
    marginBottom: 8,
    textAlign: "center",
  },
  reviewHighlight: {
    fontWeight: "700",
    color: BLUE_PRIMARY,
  },
  reviewDetail: {
    fontSize: 14,
    color: GRAY_MEDIUM,
    marginBottom: 4,
    textAlign: "center",
  },
  
  /* Login Footer */
  loginFooter: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  loginFooterText: {
    color: GRAY_MEDIUM,
    fontSize: 14,
  },
  loginFooterLink: {
    color: BLUE_PRIMARY,
    fontSize: 14,
    fontWeight: "600",
  },
  loggedInMessage: {
    backgroundColor: GREEN,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  loggedInText: {
    color: WHITE,
    fontWeight: "600",
    textAlign: "center",
  },
  demoHint: {
    backgroundColor: BLUE_SOFT,
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  demoHintText: {
    color: BLUE_PRIMARY,
    fontSize: 12,
    textAlign: "center",
  },

  /* User Header */
  userHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: WHITE,
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: GRAY_LIGHT,
    elevation: 2,
  },
  userHeaderInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1,
    borderColor: GRAY_LIGHT,
  },
  userAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: BLUE_PRIMARY,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  userAvatarText: {
    color: WHITE,
    fontSize: 16,
    fontWeight: "bold",
  },
  userHeaderText: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: "700",
    color: GRAY_DARK,
  },
  userCompany: {
    fontSize: 12,
    color: GRAY_MEDIUM,
  },
  logoutButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: GRAY_SOFT,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: GRAY_LIGHT,
  },
  logoutButtonText: {
    fontSize: 12,
    color: GRAY_MEDIUM,
    fontWeight: "600",
  },
  newInspectionBtn: {
    backgroundColor: WHITE,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 16,
    borderWidth: 2,
    borderColor: BLUE_PRIMARY,
  },
  newInspectionText: {
    color: BLUE_PRIMARY,
    fontWeight: "700",
    fontSize: 15,
  },

  /* ================= REGISTER SCREEN STYLES ================= */
  registerContainer: {
    flex: 1,
    backgroundColor: GRAY_SOFT,
  },
  registerScroll: {
    paddingHorizontal: 20,
    paddingTop: 80,
    paddingBottom: 40,
  },
  registerHeader: {
    alignItems: "center",
    marginBottom: 24,
  },
  registerLogo: {
    width: 80,
    height: 80,
    marginBottom: 12,
  },
  registerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: BLUE_PRIMARY,
    marginBottom: 8,
  },
  registerSubtitle: {
    fontSize: 14,
    color: GRAY_MEDIUM,
    marginBottom: 8,
  },
  registerCard: {
    backgroundColor: WHITE,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: GRAY_LIGHT,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  registerSectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: BLUE_PRIMARY,
    marginBottom: 16,
  },
  sectionSpacer: {
    marginTop: 24,
  },
  registerField: {
    marginBottom: 16,
  },
  registerLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: GRAY_DARK,
    marginBottom: 6,
  },
  registerInput: {
    backgroundColor: GRAY_SOFT,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: GRAY_LIGHT,
    fontSize: 14,
    color: GRAY_DARK,
  },
  registerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  halfWidth: {
    width: "48%",
  },
  requiredStar: {
    color: RED,
    fontWeight: "bold",
  },
  inputError: {
    borderColor: RED,
    borderWidth: 1.5,
  },
  errorText: {
    color: RED,
    fontSize: 12,
    marginTop: 4,
  },
  passwordField: {
    flexDirection: "row",
    alignItems: "center",
  },
  passwordToggle: {
    position: "absolute",
    right: 16,
    height: "100%",
    justifyContent: "center",
  },
  passwordToggleText: {
    fontSize: 20,
  },
  passwordRequirements: {
    backgroundColor: BLUE_SOFT,
    padding: 16,
    borderRadius: 10,
    marginBottom: 16,
  },
  passwordRequirementsTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: GRAY_DARK,
    marginBottom: 8,
  },
  passwordRequirementItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  passwordRequirementIcon: {
    fontSize: 14,
    marginRight: 8,
    color: GRAY_MEDIUM,
  },
  requirementMet: {
    color: GREEN,
  },
  passwordRequirementText: {
    fontSize: 12,
    color: GRAY_MEDIUM,
  },
  companyLogoContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  companyLogoPicker: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: GRAY_SOFT,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: GRAY_LIGHT,
    borderStyle: "dashed",
  },
  companyLogoPreview: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  companyLogoPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  companyLogoIcon: {
    fontSize: 40,
    color: GRAY_MEDIUM,
    marginBottom: 8,
  },
  companyLogoText: {
    fontSize: 12,
    color: GRAY_MEDIUM,
    textAlign: "center",
  },
  pickerContainer: {
    backgroundColor: GRAY_SOFT,
    borderWidth: 1,
    borderColor: GRAY_LIGHT,
    borderRadius: 10,
    overflow: "hidden",
  },
  picker: {
    height: 50,
  },
  termsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    marginTop: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: BLUE_PRIMARY,
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxIcon: {
    fontSize: 16,
    color: BLUE_PRIMARY,
    fontWeight: "bold",
  },
  termsText: {
    fontSize: 14,
    color: GRAY_DARK,
    flex: 1,
  },
  termsLink: {
    color: BLUE_PRIMARY,
    fontWeight: "600",
  },
  registerButton: {
    backgroundColor: BLUE_PRIMARY,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
    elevation: 5,
    shadowColor: BLUE_PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  registerButtonText: {
    color: WHITE,
    fontWeight: "700",
    fontSize: 16,
    letterSpacing: 0.5,
  },
  registerFooter: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },
  registerFooterText: {
    color: GRAY_MEDIUM,
    fontSize: 14,
  },
  registerFooterLink: {
    color: BLUE_PRIMARY,
    fontSize: 14,
    fontWeight: "600",
  },
});