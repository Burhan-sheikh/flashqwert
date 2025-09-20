// Added a new 'storage' tab with the Storage UI moved from Dashboard
import React, { useState, useEffect, useRef } from "react";
import {
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import {
  updateProfile,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase/firebase";
import { format } from "date-fns";
import imageCompression from "browser-image-compression";
import { motion, AnimatePresence } from "framer-motion";
import {
  User as UserIcon,
  Link as LinkIcon,
  Lock,
  Eye,
  EyeOff,
  Save,
  Database,
  Calendar,
  Mail,
  Loader2,
  Camera,
  Upload,
  X,
  Trash2,
} from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { getSubscriptionStatus } from '../utils/subscriptionUtils';
import { getQuotaForPlan, getCollectionLimitForPlan } from '../utils/planConfig';
import { collection, query, where, getCountFromServer } from "firebase/firestore";

// Animation variants (unchanged)
const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut",
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" }
  }
};

const tabVariants = {
  hidden: { opacity: 0, x: 20 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.3, ease: "easeOut" }
  },
  exit: { 
    opacity: 0, 
    x: -20,
    transition: { duration: 0.2, ease: "easeIn" }
  }
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 0.3, ease: "easeOut" }
  },
  exit: { 
    opacity: 0, 
    scale: 0.8,
    transition: { duration: 0.2, ease: "easeIn" }
  }
};

// Styles (unchanged)
const card = "bg-white rounded-2xl shadow-lg border border-gray-100 transition-all duration-300 hover:shadow-xl hover:border-gray-200";
const inputField = "w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm bg-white hover:border-gray-300";
const button = "px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95";
const primaryButton = `${button} bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl hover:scale-105`;
const secondaryButton = `${button} bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 shadow-md hover:shadow-lg hover:scale-105`;
const tabButton = "flex items-center gap-3 px-6 py-3 rounded-xl font-medium transition-all duration-200 transform active:scale-95";
const activeTab = `${tabButton} bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg`;
const inactiveTab = `${tabButton} bg-white text-gray-600 hover:bg-gray-50 border border-gray-200 hover:border-gray-300 shadow-md hover:shadow-lg hover:scale-105`;

type TabType = 'storage' | 'profile' | 'security';

const Profile: React.FC = () => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('storage');

  // Profile states
  const [displayName, setDisplayName] = useState("");
  const [photoURL, setPhotoURL] = useState<string>("");
  const [createdAt, setCreatedAt] = useState("");
  const [email, setEmail] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);

  // Picture modal
  const [showPicOptions, setShowPicOptions] = useState(false);
  const [liveLink, setLiveLink] = useState("");
  const [imagePreview, setImagePreview] = useState<string>("");

  // Password states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Storage states (added)
  const [subscriptionPlan, setSubscriptionPlan] = useState<string>('Free');
  const [subscriptionExpiry, setSubscriptionExpiry] = useState<string | null>(null);
  const [totalQrCodesCount, setTotalQrCodesCount] = useState<number>(0);
  const [totalCollectionsCount, setTotalCollectionsCount] = useState<number>(0);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const d = userDoc.data();
          setDisplayName(d.username || user.displayName || "");
          const ts = d.createdAt || user.metadata.creationTime;
          setCreatedAt(format(new Date(ts), "MMM dd, yyyy"));
          setPhotoURL(d.photoURL || user.photoURL || "");
          setEmail(user.email || "");
          setSubscriptionPlan(d.subscriptionPlan || 'Free');
          setSubscriptionExpiry(d.subscriptionExpiry || null);

          // Fetch counts for storage (simplified; assume you have functions to get these)
          const qrCountQuery = query(collection(db, 'qrcodes'), where('userId', '==', user.uid));
          const qrCountSnap = await getCountFromServer(qrCountQuery);
          setTotalQrCodesCount(qrCountSnap.data().count);

          const collectionsCountQuery = query(collection(db, 'userCollections'), where('userId', '==', user.uid));
          const collectionsCountSnap = await getCountFromServer(collectionsCountQuery);
          setTotalCollectionsCount(collectionsCountSnap.data().count);
        }
      } catch {
        toast.error("Failed to fetch profile");
      }
    })();
  }, [user]);

  // Handle file upload + compression (<=700KB) (unchanged)
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    try {
      const compressedFile = await imageCompression(file, {
        maxSizeMB: 0.7, // max 700KB
        maxWidthOrHeight: 600,
        useWebWorker: true,
      });

      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setImagePreview(result);
        toast.success("Image ready!");
      };
      reader.readAsDataURL(compressedFile);
    } catch {
      toast.error("Image processing failed");
    }
  };

  // Apply image preview (unchanged)
  const applyImagePreview = () => {
    if (imagePreview) {
      setPhotoURL(imagePreview);
      setShowPicOptions(false);
      setImagePreview("");
      toast.success("Profile picture updated!");
    }
  };

  // Apply URL image (unchanged)
  const applyUrlImage = () => {
    if (liveLink && liveLink.trim()) {
      setPhotoURL(liveLink.trim());
      setLiveLink("");
      setShowPicOptions(false);
      toast.success("Image link applied!");
    } else {
      toast.error("Enter a valid URL");
    }
  };

  // Remove profile picture (unchanged)
  const removeProfilePicture = () => {
    setPhotoURL("");
    setImagePreview("");
    setLiveLink("");
    setShowPicOptions(false);
    toast.success("Profile picture removed!");
  };

  // Save profile changes (unchanged)
  const saveProfile = async () => {
    if (!user) return;
    if (!displayName.trim()) {
      toast.error("Display name required");
      return;
    }
    setProfileLoading(true);
    try {
      await updateProfile(user, { displayName: displayName.trim(), photoURL });
      await updateDoc(doc(db, "users", user.uid), {
        username: displayName.trim(),
        photoURL,
        updatedAt: new Date().toISOString(),
      });
      toast.success("Profile updated successfully!");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setProfileLoading(false);
    }
  };

  // Password change (unchanged)
  const changePassword = async () => {
    if (!user) return;
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Fill all fields");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setPasswordLoading(true);
    try {
      const cred = EmailAuthProvider.credential(
        user.email || "",
        currentPassword
      );
      await reauthenticateWithCredential(user, cred);
      await updatePassword(user, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password changed successfully!");
    } catch (err: any) {
      if (err.code === 'auth/wrong-password') {
        toast.error("Current password is incorrect");
      } else {
        toast.error("Failed to change password");
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  const closeModal = () => {
    setShowPicOptions(false);
    setImagePreview("");
    setLiveLink("");
  };

  // Fetch subscription status (added for storage)
  const subscriptionStatus = getSubscriptionStatus(subscriptionPlan, subscriptionExpiry);

  return (
    <div className="min-h-screen py-4 sm:py-8 px-4">
      <ToastContainer 
        position="bottom-center" 
        theme="colored" 
        autoClose={3000}
        className="mb-4"
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      
      <motion.div 
        className="max-w-4xl mx-auto"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.nav
         className="w-full mb-4 p-2 bg-white rounded-2xl shadow-md border border-gray-100 flex justify-center md:justify-between"

          variants={itemVariants}
        >
          

          {/* Storage Tab (added) */}
          <motion.button
            onClick={() => setActiveTab("storage")}
            className={`inline-flex text-xs items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all duration-300 w-full md:w-[120px] justify-center ${
              activeTab === "storage"
                ? "bg-indigo-600 text-white shadow-md"
                : "bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-indigo-600"
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <Database className="w-4 h-4" />

          </motion.button>

          {/* Profile Tab */}
          <motion.button
            onClick={() => setActiveTab("profile")}
            className={`inline-flex text-xs items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all duration-300 w-full md:w-[120px] justify-center ${
              activeTab === "profile"
                ? "bg-indigo-600 text-white shadow-md"
                : "bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-indigo-600"
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <UserIcon className="w-4 h-4" />
            
          </motion.button>

 {/* Security Tab */}
          <motion.button
            onClick={() => setActiveTab("security")}
            className={`inline-flex text-xs items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all duration-300 w-full md:w-[120px] justify-center ${
              activeTab === "security"
                ? "bg-indigo-600 text-white shadow-md"
                : "bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-indigo-600"
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <Lock className="w-4 h-4" />
           
          </motion.button>
          
        </motion.nav>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'profile' && (
            <motion.section
              key="profile"
              variants={tabVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {/* Profile content (unchanged) */}
              <div className={`${card} p-6 sm:p-8`}>
                <div className="flex flex-col lg:flex-row gap-8">
                  {/* Profile Picture Section (unchanged) */}
                  <motion.div 
                    className="flex-shrink-0 text-center"
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    <div className="relative inline-block">
                      <motion.div
                        className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-xl cursor-pointer mx-auto group"
                        onClick={() => setShowPicOptions(true)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 400, damping: 17 }}
                      >
                        {photoURL ? (
                          <img
                            src={photoURL}
                            alt="Profile"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <UserIcon className="w-16 h-16 sm:w-20 sm:h-20 text-white" />
                        )}
                        
                        {/* Hover overlay */}
                        <motion.div
                          className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center"
                          initial={{ opacity: 0 }}
                          whileHover={{ opacity: 1 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="text-white text-center">
                            <Camera className="w-8 h-8 mx-auto mb-1" />
                            <span className="text-sm font-medium">Edit</span>
                          </div>
                        </motion.div>
                      </motion.div>
                    </div>
                    <p className="text-sm text-gray-500 mt-4">Click to change your profile picture</p>
                  </motion.div>
                  {/* Form Section (unchanged) */}
                  <div className="flex-grow space-y-6">
                    <motion.div
                      variants={itemVariants}
                    >
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Username
                      </label>
                      <motion.input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className={inputField}
                        placeholder="Enter your display name"
                        whileFocus={{ scale: 1.01 }}
                        transition={{ type: "spring", stiffness: 400, damping: 17 }}
                      />
                    </motion.div>

                    <div className="grid sm:grid-cols-2 gap-6">
                      <motion.div variants={itemVariants}>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          <Mail className="inline w-4 h-4 mr-1" />
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={email}
                          disabled
                          className={`${inputField} bg-gray-50 text-gray-500 cursor-not-allowed`}
                        />
                      </motion.div>

                      <motion.div variants={itemVariants}>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          <Calendar className="inline w-4 h-4 mr-1" />
                          Member Since
                        </label>
                        <input
                          type="text"
                          value={createdAt}
                          disabled
                          className={`${inputField} bg-gray-50 text-gray-500 cursor-not-allowed`}
                        />
                      </motion.div>
                    </div>

                    <motion.button
                      onClick={saveProfile}
                      disabled={profileLoading || !displayName.trim()}
                      className={primaryButton}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                      {profileLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Save className="w-5 h-5" />
                      )}
                      {profileLoading ? "Saving Changes..." : "Save Changes"}
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.section>
          )}
          {activeTab === 'security' && (
            <motion.section
              key="security"
              variants={tabVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {/* Security content (unchanged) */}
              <div className={`${card} p-6 sm:p-8`}>
                <div className="space-y-6 max-w-2xl">
                  {/* Current Password */}
                  <motion.div variants={itemVariants}>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Current Password
                    </label>
                    <div className="relative">
                      <motion.input
                        type={showCurrentPassword ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className={`${inputField} pr-12`}
                        placeholder="Enter your current password"
                        whileFocus={{ scale: 1.01 }}
                        transition={{ type: "spring", stiffness: 400, damping: 17 }}
                      />
                      <motion.button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-700 transition-colors"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </motion.button>
                    </div>
                  </motion.div>

                  {/* New Password Fields */}
                  <div className="grid sm:grid-cols-2 gap-6">
                    <motion.div variants={itemVariants}>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        New Password
                      </label>
                      <div className="relative">
                        <motion.input
                          type={showNewPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className={`${inputField} pr-12`}
                          placeholder="Enter new password"
                          whileFocus={{ scale: 1.01 }}
                          transition={{ type: "spring", stiffness: 400, damping: 17 }}
                        />
                        <motion.button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-700 transition-colors"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </motion.button>
                      </div>
                    </motion.div>

                    <motion.div variants={itemVariants}>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <motion.input
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className={`${inputField} pr-12`}
                          placeholder="Confirm new password"
                          whileFocus={{ scale: 1.01 }}
                          transition={{ type: "spring", stiffness: 400, damping: 17 }}
                        />
                        <motion.button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-700 transition-colors"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </motion.button>
                      </div>
                    </motion.div>
                  </div>

                  <motion.button
                    onClick={changePassword}
                    disabled={
                      passwordLoading ||
                      !currentPassword ||
                      !newPassword ||
                      !confirmPassword ||
                      newPassword !== confirmPassword
                    }
                    className={primaryButton}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    {passwordLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Lock className="w-5 h-5" />
                    )}
                    {passwordLoading ? "Changing Password..." : "Change Password"}
                  </motion.button>
                </div>
              </div>
            </motion.section>
          )}
          {activeTab === 'storage' && (
            <motion.section
              key="storage"
              variants={tabVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {/* Storage UI (moved from Dashboard) */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="px-4 sm:px-6 mb-12"
              >
                <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_10%_-10%,rgba(59,130,246,0.12),transparent_60%),radial-gradient(40%_35%_at_80%_-10%,rgba(147,51,234,0.10),transparent_60%)]" />

                  <div className="relative p-5 sm:p-6">
                    {/* Top row: title + plan chip + upgrade hint */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      

                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs text-gray-700">
                          Plan: <strong className="font-medium">{subscriptionPlan}</strong>
                        </span>
                        {subscriptionExpiry && (
                          <span className="hidden sm:inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
                            Expires {new Date(subscriptionExpiry).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>

                    {(() => {
                      const qrLimit = Math.max(1, getQuotaForPlan(subscriptionPlan) || 0);
                      const colLimit = Math.max(1, getCollectionLimitForPlan(subscriptionPlan) || 0);

                      const qrPct = Math.min(100, Math.round((totalQrCodesCount / qrLimit) * 100));
                      const colPct = Math.min(100, Math.round((totalCollectionsCount / colLimit) * 100));

                      const band = (pct: number) =>
                        pct < 70 ? "safe" : pct < 90 ? "warn" : "crit";

                      const fillClass = (pct: number) =>
                        band(pct) === "safe"
                          ? "bg-emerald-500"
                          : band(pct) === "warn"
                          ? "bg-amber-500"
                          : "bg-rose-600";

                      const strokeClass = (pct: number) =>
                        band(pct) === "safe"
                          ? "text-emerald-500"
                          : band(pct) === "warn"
                          ? "text-amber-500"
                          : "text-rose-600";

                      const ringRadius = 40;
                      const circumference = 2 * Math.PI * ringRadius;
                      const qrOffset = circumference - (qrPct / 100) * circumference;

                      return (
                        <div className="mt-6 grid grid-cols-1 lg:grid-cols-[auto,1fr,auto] gap-6">
                          {/* Progress Circle (QR) */}
                          <div className="flex items-center justify-center">
                            <div className="relative">
                              <svg className="w-28 h-28 sm:w-32 sm:h-32" viewBox="0 0 96 96" role="img" aria-label={`QR usage ${qrPct}%`}>
                                <circle
                                  className="text-gray-200"
                                  strokeWidth="10"
                                  stroke="currentColor"
                                  fill="transparent"
                                  r={ringRadius}
                                  cx="48"
                                  cy="48"
                                />
                                <circle
                                  className={`${strokeClass(qrPct)} transition-all duration-700 ease-in-out`}
                                  strokeWidth="10"
                                  strokeLinecap="round"
                                  stroke="currentColor"
                                  fill="transparent"
                                  r={ringRadius}
                                  cx="48"
                                  cy="48"
                                  strokeDasharray={circumference}
                                  strokeDashoffset={qrOffset}
                                  style={{ transform: "rotate(-90deg)", transformOrigin: "center" }}
                                />
                              </svg>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-center">
                                  <div className="text-lg font-semibold text-gray-900">{qrPct}%</div>
                                  <div className="text-[11px] text-gray-500 -mt-0.5">QR Used</div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Bars + stats */}
                          <div className="space-y-5">
                            {/* QR Codes */}
                            <div>
                              <div className="flex items-end justify-between gap-3 mb-1.5">
                                <p className="text-sm text-gray-700">
                                  <span className="font-medium">QR Codes</span>{" "}
                                  <span className="text-gray-500">({totalQrCodesCount} / {qrLimit})</span>
                                </p>
                                <p className="text-xs text-gray-500">
                                  Left: <span className="font-medium">{Math.max(0, qrLimit - totalQrCodesCount)}</span>
                                </p>
                              </div>
                              <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                                <div
                                  className={`h-3 ${fillClass(qrPct)} transition-all duration-700 ease-in-out`}
                                  style={{ width: `${qrPct}%` }}
                                  aria-valuenow={qrPct}
                                  aria-valuemin={0}
                                  aria-valuemax={100}
                                  role="progressbar"
                                />
                              </div>
                              <div className="mt-1 flex justify-between text-[9px]">
                                {/* Left - Normal */}
                                <div className="flex flex-col items-center">
                                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                                  <span className="mt-1">Normal</span>
                                </div>

                                {/* Center - Approaching Limit */}
                                <div className="flex flex-col items-center">
                                  <span className="inline-block h-2 w-2 rounded-full bg-amber-500" />
                                  <span className="mt-1">Approaching Limit</span>
                                </div>

                                {/* Right - Limit Reached */}
                                <div className="flex flex-col items-center">
                                  <span className="inline-block h-2 w-2 rounded-full bg-rose-600" />
                                  <span className="mt-1">Limit Reached</span>
                                </div>
                              </div>
                            </div>

                            {/* Collections */}
                            <div>
                              <div className="flex items-end justify-between gap-3 mb-1.5">
                                <p className="text-sm text-gray-700">
                                  <span className="font-medium">Collections</span>{" "}
                                  <span className="text-gray-500">({totalCollectionsCount} / {colLimit})</span>
                                </p>
                                <p className="text-xs text-gray-500">
                                  Left: <span className="font-medium">{Math.max(0, colLimit - totalCollectionsCount)}</span>
                                </p>
                              </div>
                              <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                                <div
                                  className={`h-3 ${fillClass(colPct)} transition-all duration-700 ease-in-out`}
                                  style={{ width: `${colPct}%` }}
                                                                    aria-valuenow={colPct}
                                  aria-valuemin={0}
                                  aria-valuemax={100}
                                  role="progressbar"
                                />
                              </div>
                            </div>

                            {/* Mini KPI chips */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
                              <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-center">
                                <div className="text-[10px] text-gray-500">QR Used</div>
                                <div className="text-sm font-semibold text-gray-900">{totalQrCodesCount}</div>
                              </div>
                              <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-center">
                                <div className="text-[10px] text-gray-500">QR Limit</div>
                                <div className="text-sm font-semibold text-gray-900">{qrLimit}</div>
                              </div>
                              <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-center">
                                <div className="text-[10px] text-gray-500">Collections</div>
                                <div className="text-sm font-semibold text-gray-900">{totalCollectionsCount}</div>
                              </div>
                              <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-center">
                                <div className="text-[10px] text-gray-500">Collections Limit</div>
                                <div className="text-sm font-semibold text-gray-900">{colLimit}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </motion.div>
            </motion.section>
          )}
        </AnimatePresence>
      </motion.div>
      {/* Profile Picture Modal (unchanged) */}
      <AnimatePresence>
        {showPicOptions && (
          <motion.div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={closeModal}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <motion.div
              className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
              variants={modalVariants}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Update Profile Picture</h3>
                <motion.button
                  onClick={closeModal}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="w-5 h-5 text-gray-500" />
                </motion.button>
              </div>

              {/* Image Preview */}
              {imagePreview && (
                <motion.div 
                  className="mb-6 text-center"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="w-32 h-32 rounded-xl overflow-hidden mx-auto mb-4 shadow-lg">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                  <motion.button
                    onClick={applyImagePreview}
                    className={primaryButton}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Save className="w-4 h-4" />
                    Apply Image
                  </motion.button>
                </motion.div>
              )}

              <div className="space-y-4">
                {/* Upload Button */}
                <motion.button
                  onClick={() => fileInputRef.current?.click()}
                  className={`${secondaryButton} w-full justify-start text-left`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Upload className="w-5 h-5 text-blue-600" />
                  <div className="text-left">
                    <div className="font-medium text-gray-900">Upload from Device</div>
                    <div className="text-sm text-gray-500">Choose an image file (max 5MB)</div>
                  </div>
                </motion.button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {/* URL Input */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Or enter image URL
                  </label>
                  <motion.input
                    type="url"
                    value={liveLink}
                    onChange={(e) => setLiveLink(e.target.value)}
                    placeholder="https://example.com/avatar.jpg"
                    className={inputField}
                    whileFocus={{ scale: 1.01 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  />
                  <motion.button
                    onClick={applyUrlImage}
                    disabled={!liveLink.trim()}
                    className={primaryButton}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <LinkIcon className="w-4 h-4" />
                    Apply URL
                  </motion.button>
                </div>

                {/* Remove Button */}
                {photoURL && (
                  <motion.button
                    onClick={removeProfilePicture}
                    className={`${button} bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 w-full`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Trash2 className="w-4 h-4" />
                    Remove Profile Picture
                  </motion.button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Profile;
