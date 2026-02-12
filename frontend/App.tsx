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
const NAVY = "#0A2540";
const NAVY_SOFT = "#123A63";
const WHITE = "#FFFFFF";
const SOFT_GRAY = "#F2F4F7";
const GRAY_BORDER = "#E5E7EB";
const TEXT_DARK = "#0F172A";
const TEXT_MUTED = "#6B7280";
const GREEN = "#10B981";
const RED = "#EF4444";
const BLUE = "#3B82F6";
const AMBER = "#F59E0B";

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

type Screen = "login" | "details" | "upload" | "preview" | "review";

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

export default function App() {
  const [screen, setScreen] = useState<Screen>("login");
  const [inspectionId, setInspectionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  
  const [profiles, setProfiles] = useState<Profile[]>([
    {
      id: "1",
      profilePicture: "",
      name: "Captain John Smith",
      company: "Fathom Marine Services",
      position: "Senior Marine Surveyor",
      phone: "+1 (555) 123-4567",
      email: "john.smith@fathommarine.com",
      signature: "",
      experience: "15 years",
      certifications: ["IMO Inspector", "Class Surveyor", "ISM Auditor"],
      shipTypes: ["Tanker (Oil/Chemical/Gas)", "Bulk Carrier", "Container Ship"],
      licenseNumber: "MSI-2023-0456",
      issuingAuthority: "International Maritime Organization",
      expiryDate: "2025-12-31",
      address: "123 Maritime Blvd, Port City, PC 10001",
      emergencyContact: "+1 (555) 987-6543 (Sarah Smith)",
      notes: "Specialized in tanker inspections and safety audits",
    }
  ]);
  
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);

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

  const [email, setEmail] = useState("test@example.com");
  const [password, setPassword] = useState("password123");

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

  /* ================= PROFILE FUNCTIONS ================= */
  const openProfileModal = () => {
    setIsEditing(false);
    setEditingProfileId(null);
    setNewProfile({
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
      // Update existing profile
      updatedProfiles = profiles.map(p => 
        p.id === editingProfileId ? newProfile : p
      );
      if (selectedProfile?.id === editingProfileId) {
        setSelectedProfile(newProfile);
      }
    } else {
      // Add new profile
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

      // Add selected profile info if available (OPTIONAL)
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

  /* ================= LOGIN ================= */
  if (screen === "login") {
    return (
      <SafeAreaView style={styles.center}>
        <StatusBar barStyle="dark-content" />
        <Image source={logo} style={styles.logo} />
        <Text style={styles.brand}>Fathom Marine</Text>
        <Text style={styles.subtitle}>Ship Inspection System</Text>

        <TextInput 
          style={styles.input} 
          placeholder="Email" 
          value={email} 
          onChangeText={setEmail} 
        />
        <TextInput 
          style={styles.input} 
          placeholder="Password" 
          secureTextEntry 
          value={password} 
          onChangeText={setPassword} 
        />

        <TouchableOpacity style={styles.btn} onPress={() => setScreen("details")} activeOpacity={0.85}>
          <Text style={styles.btnText}>LOGIN</Text>
        </TouchableOpacity>

        <Text style={styles.profileHint}>
          You can create and manage inspection profiles after login
        </Text>
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
          
          {/* Inspector Field - Profile is OPTIONAL */}
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
                    "Select Inspector Profile (Optional)",
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
                          setDetails({...details, inspector: ""});
                        },
                        style: "default"
                      }
                    ]
                  );
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

        {/* Selected Profile Card - OPTIONAL */}
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
                <Text style={styles.profileOptionalLabel}>(Optional Profile)</Text>
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

        {/* Create Profile Button at Bottom - Always visible */}
        <TouchableOpacity 
          style={styles.createProfileBtn} 
          onPress={openProfileModal}
          activeOpacity={0.85}
        >
          <View style={styles.createProfileContent}>
            <Text style={styles.createProfileIcon}>👨‍✈️</Text>
            <View style={styles.createProfileTexts}>
              <Text style={styles.createProfileTitle}>Create / Manage Inspector Profiles</Text>
              <Text style={styles.createProfileSubtitle}>
                {profiles.length} saved profile(s) - Optional but recommended
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
                <Text style={styles.modalNote}>
                  💡 Profiles are optional but save time. You can always enter inspector details manually.
                </Text>

                {/* Profile Picture */}
                <TouchableOpacity style={styles.profilePictureSelect} onPress={pickProfilePicture}>
                  {newProfile.profilePicture ? (
                    <Image source={{ uri: newProfile.profilePicture }} style={styles.profilePictureLarge} />
                  ) : (
                    <View style={styles.profilePicturePlaceholderLarge}>
                      <Text style={styles.profilePictureIcon}>👨‍✈️</Text>
                      <Text style={styles.profilePictureHint}>Tap to add photo (Optional)</Text>
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
                  placeholder="Years of Experience (Optional)"
                  value={newProfile.experience}
                  onChangeText={(t) => setNewProfile({...newProfile, experience: t})}
                />

                {/* Contact Information */}
                <Text style={styles.sectionTitle}>Contact Information (Optional)</Text>
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
                <Text style={styles.sectionTitle}>Professional Details (Optional)</Text>
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
                <Text style={styles.sectionTitle}>Certifications (Optional)</Text>
                <Text style={styles.sectionSubtitle}>Select applicable certifications:</Text>
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
                <Text style={styles.sectionTitle}>Ship Type Specializations (Optional)</Text>
                <Text style={styles.sectionSubtitle}>Select ship types you inspect:</Text>
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
                <Text style={styles.sectionTitle}>Signature (Optional)</Text>
                <TouchableOpacity style={styles.signatureBtn} onPress={pickSignature}>
                  <Text style={styles.signatureBtnText}>
                    {newProfile.signature ? "Change Signature Image" : "Upload Signature Image"}
                  </Text>
                </TouchableOpacity>
                {newProfile.signature && (
                  <Image source={{ uri: newProfile.signature }} style={styles.signaturePreview} />
                )}

                {/* Notes */}
                <Text style={styles.sectionTitle}>Additional Notes (Optional)</Text>
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
                          company: "",
                          position: "Marine Inspector",
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
                <Text style={styles.existingProfilesTitle}>Existing Profiles ({profiles.length})</Text>
                {profiles.length === 0 ? (
                  <Text style={styles.noProfilesText}>
                    No profiles saved yet. Create your first profile to save time!
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
                          <Text style={styles.currentlySelectedText}>✓ Currently Selected</Text>
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
                <Text style={styles.previewOptionalLabel}>(Using saved profile)</Text>
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
            <Text style={styles.previewNote}>
              ℹ️ No profile selected. Inspector details will be basic.
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
      <Text style={styles.pageTitle}>Inspection Saved 🎉</Text>

      {selectedProfile ? (
        <View style={styles.reviewProfile}>
          <Text style={styles.reviewText}>
            Inspection completed by <Text style={styles.reviewHighlight}>{selectedProfile.name}</Text>
          </Text>
          <Text style={styles.reviewDetail}>
            {selectedProfile.position} at {selectedProfile.company}
          </Text>
          <Text style={styles.reviewDetail}>
            License: {selectedProfile.licenseNumber}
          </Text>
        </View>
      ) : (
        <View style={styles.reviewProfile}>
          <Text style={styles.reviewText}>
            Inspection completed by <Text style={styles.reviewHighlight}>{details.inspector}</Text>
          </Text>
          <Text style={styles.reviewNote}>
            ℹ️ No profile was used for this inspection.
          </Text>
        </View>
      )}

      <TouchableOpacity style={styles.btn} onPress={() => Linking.openURL(`${API_URL}/export/${inspectionId}`)}>
        <Text style={styles.btnText}>Export PDF</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.btnOutline} onPress={() => Linking.openURL(`${API_URL}/export-word/${inspectionId}`)}>
        <Text style={styles.btnOutlineText}>Export Word</Text>
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
    backgroundColor: SOFT_GRAY 
  },
  page: { 
    padding: 24, 
    paddingTop: 80, 
    backgroundColor: SOFT_GRAY,
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
  },
  backText: { 
    fontSize: 22, 
    fontWeight: "800", 
    color: NAVY 
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
    color: NAVY 
  },
  subtitle: { 
    textAlign: "center", 
    marginBottom: 32, 
    color: TEXT_MUTED 
  },
  profileHint: {
    textAlign: "center",
    marginTop: 20,
    color: TEXT_MUTED,
    fontSize: 12,
    fontStyle: "italic",
  },

  pageTitle: { 
    fontSize: 22, 
    fontWeight: "800", 
    marginBottom: 22, 
    color: TEXT_DARK 
  },
  label: { 
    fontWeight: "700", 
    marginBottom: 8, 
    color: NAVY 
  },

  input: {
    backgroundColor: WHITE,
    padding: 16,
    borderRadius: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: GRAY_BORDER,
  },

  btn: {
    backgroundColor: NAVY,
    paddingVertical: 18,
    borderRadius: 22,
    alignItems: "center",
    marginTop: 18,
    elevation: 5,
  },
  btnSmall: {
    backgroundColor: NAVY,
    paddingVertical: 16,
    borderRadius: 20,
    flex: 1,
    marginHorizontal: 6,
    alignItems: "center",
    elevation: 4,
  },
  btnText: { 
    color: WHITE, 
    fontWeight: "800", 
    letterSpacing: 0.6 
  },

  btnOutline: {
    borderWidth: 2,
    borderColor: NAVY,
    paddingVertical: 16,
    borderRadius: 22,
    alignItems: "center",
    marginTop: 16,
    backgroundColor: WHITE,
  },
  btnOutlineText: { 
    color: NAVY, 
    fontWeight: "800" 
  },

  card: {
    backgroundColor: WHITE,
    borderRadius: 22,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
  },

  row: { 
    flexDirection: "row", 
    marginBottom: 22 
  },

  gridImg: { 
    width: "100%", 
    height: 135, 
    borderRadius: 18, 
    marginBottom: 8 
  },
  desc: {
    backgroundColor: SOFT_GRAY,
    padding: 12,
    borderRadius: 16,
    marginBottom: 14,
  },

  /* Profile Button at Bottom */
  createProfileBtn: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: WHITE,
    borderRadius: 20,
    padding: 16,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  createProfileContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  createProfileIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  createProfileTexts: {
    flex: 1,
  },
  createProfileTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: NAVY,
    marginBottom: 4,
  },
  createProfileSubtitle: {
    fontSize: 12,
    color: TEXT_MUTED,
  },
  createProfileArrow: {
    fontSize: 24,
    color: NAVY,
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
    backgroundColor: NAVY_SOFT,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  profileSelectText: {
    color: WHITE,
    fontSize: 12,
    fontWeight: "600",
  },

  /* Profile Card */
  profileCard: {
    backgroundColor: WHITE,
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: BLUE,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
    borderColor: NAVY_SOFT,
  },
  profilePicturePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: NAVY_SOFT,
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
    color: NAVY,
    marginBottom: 2,
  },
  profilePosition: {
    fontSize: 14,
    color: TEXT_DARK,
    marginBottom: 2,
    fontWeight: "600",
  },
  profileCompany: {
    fontSize: 13,
    color: TEXT_MUTED,
  },
  profileOptionalLabel: {
    fontSize: 11,
    color: TEXT_MUTED,
    fontStyle: "italic",
    marginTop: 2,
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
    color: TEXT_MUTED,
    fontWeight: "600",
    width: 100,
  },
  detailValue: {
    fontSize: 13,
    color: TEXT_DARK,
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
    backgroundColor: SOFT_GRAY,
    borderRadius: 12,
  },
  clearProfileText: {
    color: TEXT_MUTED,
    fontSize: 12,
    fontWeight: "600",
  },
  editSelectedBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: AMBER,
    borderRadius: 12,
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
    borderRadius: 18,
    alignItems: "center",
    backgroundColor: SOFT_GRAY,
    borderWidth: 1,
    borderColor: GRAY_BORDER,
    marginHorizontal: 5,
  },
  imageButtonText: {
    color: NAVY,
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
    color: TEXT_MUTED,
    marginBottom: 6,
    fontWeight: "500",
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: GRAY_BORDER,
  },

  /* Modal Styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: WHITE,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: GRAY_BORDER,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: NAVY,
  },
  modalClose: {
    fontSize: 24,
    color: TEXT_MUTED,
    fontWeight: "300",
  },
  modalBody: {
    padding: 20,
  },
  modalSpacer: {
    height: 30,
  },
  
  /* Modal Note */
  modalNote: {
    backgroundColor: SOFT_GRAY,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    fontSize: 13,
    color: TEXT_DARK,
    borderLeftWidth: 3,
    borderLeftColor: AMBER,
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
    borderColor: NAVY,
  },
  profilePicturePlaceholderLarge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: SOFT_GRAY,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: GRAY_BORDER,
    borderStyle: "dashed",
  },
  profilePictureIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  profilePictureHint: {
    fontSize: 12,
    color: TEXT_MUTED,
  },

  /* Modal Inputs */
  modalInput: {
    backgroundColor: SOFT_GRAY,
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: GRAY_BORDER,
    fontSize: 14,
  },

  /* Sections */
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: NAVY,
    marginTop: 16,
    marginBottom: 10,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: GRAY_BORDER,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: TEXT_MUTED,
    marginBottom: 10,
  },

  /* Chips for selections */
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 15,
  },
  chip: {
    backgroundColor: SOFT_GRAY,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: GRAY_BORDER,
  },
  chipSelected: {
    backgroundColor: BLUE,
    borderColor: BLUE,
  },
  chipText: {
    fontSize: 12,
    color: TEXT_DARK,
  },
  chipTextSelected: {
    color: WHITE,
    fontWeight: "600",
  },

  /* Signature */
  signatureBtn: {
    backgroundColor: NAVY_SOFT,
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
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
    borderRadius: 12,
    borderWidth: 1,
    borderColor: GRAY_BORDER,
  },

  /* Save Button */
  saveProfileBtn: {
    backgroundColor: GREEN,
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    marginVertical: 20,
    elevation: 3,
  },
  saveProfileText: {
    color: WHITE,
    fontWeight: "700",
    fontSize: 16,
    letterSpacing: 0.5,
  },

  /* Use Current Profile Button */
  useCurrentProfileBtn: {
    backgroundColor: SOFT_GRAY,
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: GRAY_BORDER,
  },
  useCurrentProfileText: {
    color: NAVY,
    fontWeight: "600",
    fontSize: 14,
  },

  /* Existing Profiles */
  existingProfilesTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: NAVY,
    marginBottom: 12,
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: GRAY_BORDER,
  },
  noProfilesText: {
    textAlign: "center",
    padding: 20,
    color: TEXT_MUTED,
    fontStyle: "italic",
  },
  existingProfileCard: {
    backgroundColor: SOFT_GRAY,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: GRAY_BORDER,
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
  },
  existingProfilePicturePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: NAVY_SOFT,
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
    color: NAVY,
    marginBottom: 2,
  },
  existingProfileCompany: {
    fontSize: 12,
    color: TEXT_MUTED,
  },
  
  /* Profile Actions */
  profileActions: {
    flexDirection: "row",
    gap: 6,
  },
  profileActionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: SOFT_GRAY,
    borderWidth: 1,
    borderColor: GRAY_BORDER,
  },
  profileActionText: {
    fontSize: 11,
    fontWeight: "600",
    color: TEXT_DARK,
  },
  editBtn: {
    backgroundColor: AMBER,
    borderColor: AMBER,
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
  },
  existingProfileDetail: {
    fontSize: 12,
    color: TEXT_DARK,
    marginBottom: 4,
  },
  detailLabelSmall: {
    color: TEXT_MUTED,
    fontWeight: "600",
  },

  /* Profile Use Buttons */
  profileUseButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  useProfileBtn: {
    backgroundColor: NAVY,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: "center",
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
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    elevation: 3,
    width: "100%",
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
    borderColor: NAVY_SOFT,
  },
  previewProfilePicturePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: NAVY_SOFT,
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
    color: NAVY,
    marginBottom: 2,
  },
  previewProfileCompany: {
    fontSize: 14,
    color: TEXT_MUTED,
  },
  previewOptionalLabel: {
    fontSize: 11,
    color: TEXT_MUTED,
    fontStyle: "italic",
  },
  previewProfileDetail: {
    fontSize: 14,
    color: TEXT_DARK,
    marginBottom: 8,
  },
  previewManualText: {
    fontSize: 16,
    color: TEXT_DARK,
    marginBottom: 8,
  },
  previewManualValue: {
    fontWeight: "700",
    color: NAVY,
  },
  previewNote: {
    fontSize: 13,
    color: TEXT_MUTED,
    fontStyle: "italic",
    marginTop: 8,
  },

  /* Review Screen Styles */
  reviewProfile: {
    backgroundColor: WHITE,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    elevation: 3,
    width: "100%",
    alignItems: "center",
  },
  reviewText: {
    fontSize: 16,
    color: TEXT_DARK,
    marginBottom: 8,
    textAlign: "center",
  },
  reviewHighlight: {
    fontWeight: "700",
    color: NAVY,
  },
  reviewDetail: {
    fontSize: 14,
    color: TEXT_MUTED,
    marginBottom: 4,
    textAlign: "center",
  },
  reviewNote: {
    fontSize: 13,
    color: TEXT_MUTED,
    fontStyle: "italic",
    marginTop: 8,
    textAlign: "center",
  },
});