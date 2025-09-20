// SignUpModal.tsx
import React, { useState } from "react";
import { Dialog } from "@headlessui/react";
import { XCircleIcon } from "@heroicons/react/24/solid";
import { useNavigate, Link } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { auth, db, googleProvider } from "../firebase/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { QrCode, Eye, EyeOff, AlertTriangle, CheckCircle } from "lucide-react"; // Import Eye and EyeOff icons
import { toast } from "react-toastify";
import { getQuotaForPlan } from "../utils/planConfig";

// Password rules
const passwordRequirements = {
  minLength: 6,
  maxLength: 16,
  requireUppercase: true,
  requireLowercase: true,
  requireSpecialCharacter: true,
};

// Hook for signup password validation
const usePasswordValidation = () => {
  const [password, setPassword] = useState("");
  const [meetsMinLength, setMeetsMinLength] = useState(false);
  const [meetsMaxLength, setMeetsMaxLength] = useState(true);
  const [hasUppercase, setHasUppercase] = useState(false);
  const [hasLowercase, setHasLowercase] = useState(false);
  const [hasSpecialChar, setHasSpecialChar] = useState(false);

  const validatePassword = (password: string) => {
    setMeetsMinLength(password.length >= passwordRequirements.minLength);
    setMeetsMaxLength(password.length <= passwordRequirements.maxLength);
    setHasUppercase(/[A-Z]/.test(password));
    setHasLowercase(/[a-z]/.test(password));
    setHasSpecialChar(/[^a-zA-Z0-9]/.test(password));
  };

  const handlePasswordChange = (newPassword: string) => {
    setPassword(newPassword);
    validatePassword(newPassword);
  };

  const isValid =
    meetsMinLength &&
    meetsMaxLength &&
    hasUppercase &&
    hasLowercase &&
    hasSpecialChar;

  return {
    password,
    isValid,
    meetsMinLength,
    meetsMaxLength,
    hasUppercase,
    hasLowercase,
    hasSpecialChar,
    handlePasswordChange,
  };
};

interface SignUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void; // Callback for successful sign-up
}

const SignUpModal: React.FC<SignUpModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [isLogin, setIsLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [firebaseError, setFirebaseError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const navigate = useNavigate();

  const {
    password,
    isValid: isPasswordValid,
    meetsMinLength,
    meetsMaxLength,
    hasUppercase,
    hasLowercase,
    hasSpecialChar,
    handlePasswordChange,
  } = usePasswordValidation();

  // Google sign-in
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setFirebaseError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(userDocRef);

        if (!docSnap.exists()) {
          const now = new Date();
          const generatedUsername =
            user.email?.split("@")[0] || `user${Date.now()}`;

          await setDoc(userDocRef, {
            username: generatedUsername,
            email: user.email,
            subscriptionPlan: "Free",
            quota: getQuotaForPlan("Free"),
            qrCodesGenerated: 0,
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
            subscriptionExpiry: null,
          });
        }

        onSuccess();
        toast.success(`${isLogin ? "Login" : "Sign up"} successful!`);
        onClose();
      } else {
        setFirebaseError("Failed to retrieve user information from Google.");
      }
    } catch (error: any) {
      setFirebaseError(
        error.code === "auth/popup-closed-by-user"
          ? "Sign-in process was cancelled."
          : "Failed to sign in with Google. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    let isValid = true;
    const newErrors: { [key: string]: string } = {};

    if (!isLogin) {
      if (!username) {
        newErrors.username = "Please enter a username.";
        isValid = false;
      } else if (username.length < 3) {
        newErrors.username = "Username must be at least 3 characters.";
        isValid = false;
      } else if (username.length > 20) {
        newErrors.username = "Username cannot exceed 20 characters.";
        isValid = false;
      } else if (!/^[a-zA-Z0-9]+$/.test(username)) {
        newErrors.username =
          "Username can only contain letters and numbers.";
        isValid = false;
      }
      if (!termsAccepted) {
        newErrors.terms = "Please agree to the Terms and Privacy Policy.";
        isValid = false;
      }
    }

    if (!email) {
      newErrors.email = "Please enter your email address.";
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Please enter a valid email address.";
      isValid = false;
    }

    if (!password) {
      newErrors.password = "Please enter a password.";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid && (isLogin || isPasswordValid);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFirebaseError(null);

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        onSuccess();
        toast.success("Login successful!");
        onClose();
      } else {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        const now = new Date();

        await setDoc(doc(db, "users", userCredential.user.uid), {
          username,
          email,
          subscriptionPlan: "Free",
          quota: getQuotaForPlan("Free"),
          qrCodesGenerated: 0,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
          subscriptionExpiry: null,
        });

        onSuccess();
        toast.success("Sign up successful!");
        onClose();
      }
    } catch (error: any) {
      let errorMessage = "An error occurred. Please try again."; // General fallback
      if (error.code === "auth/email-already-in-use") {
        errorMessage = "This email is already registered. Try logging in?";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Please enter a valid email address.";
      } else if (error.code === "auth/weak-password") {
        errorMessage =
          "The password is too weak. Please choose a stronger password (at least 6 characters).";
      } else if (
        error.code === "auth/user-not-found" ||
        error.code === "auth/wrong-password"
      ) {
        errorMessage =
          "Invalid email or password. Please double-check your credentials.";
      }

      setFirebaseError(errorMessage); // set the firebase error
    } finally {
      setLoading(false);
    }
  };

  // Toggle password visibility
  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        aria-hidden="true"
      />

      <div className="fixed inset-0 flex items-center justify-center p-2">
        <Dialog.Panel className="w-full max-w-sm bg-white rounded-xl shadow-lg p-4 
      max-h-90 overflow-y-auto flex flex-col justify-center">
          {/* Header */}
          <div className="flex justify-between items-center mb-2">
            <Dialog.Title className="text-base font-semibold text-gray-900">
              {isLogin ? "Welcome Back – Please Sign In" : "Create Your Account"}
            </Dialog.Title>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 rounded-full focus:outline-none"
            >
              <XCircleIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 mb-4">
            <button
              onClick={() => setIsLogin(false)}
              className={`${
                !isLogin
                  ? "border-indigo-500 text-indigo-600"
                  : "text-gray-400 hover:text-gray-600"
              } py-2 px-4 text-xs font-medium focus:outline-none border-b-2`}
            >
              Sign Up
            </button>
            <button
              onClick={() => setIsLogin(true)}
              className={`${
                isLogin
                  ? "border-indigo-500 text-indigo-600"
                  : "text-gray-400 hover:text-gray-600"
              } py-2 px-4 text-xs font-medium focus:outline-none border-b-2`}
            >
              Login
            </button>
          </div>

          {/* Error */}
          {firebaseError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-2 py-1 rounded-md text-xs mb-2">
              {firebaseError}
            </div>
          )}

          {/* Google Sign in */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center py-2 px-3 rounded-md border 
        border-gray-300 bg-white hover:bg-gray-50 text-xs font-medium transition disabled:opacity-70 mb-2"
          >
            <img
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              alt="Google"
              className="w-4 h-4 mr-1"
            />
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center my-1">
            <div className="flex-grow h-px bg-gray-200"></div>
            <span className="px-2 text-gray-400 text-xs">or</span>
            <div className="flex-grow h-px bg-gray-200"></div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-2">
            {!isLogin && (
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                className={`w-full px-2 py-1 border ${
                  errors.username ? "border-red-500" : "border-gray-300"
                } rounded-md text-xs focus:ring-1 focus:ring-indigo-500`}
                required
              />
            )}

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className={`w-full px-2 py-1 border ${
                errors.email ? "border-red-500" : "border-gray-300"
              } rounded-md text-xs focus:ring-1 focus:ring-indigo-500`}
              required
            />

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                placeholder="Password"
                className={`w-full px-2 py-1 pr-8 border rounded-md text-xs focus:ring-1 focus:ring-indigo-500 ${
                  !isLogin && !isPasswordValid ? "border-red-500" : "border-gray-300"
                }`}
                required
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute inset-y-0 right-1 flex items-center text-gray-400"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>

            {/* Password rules */}
            {!isLogin && (
              <div className="text-gray-600 text-xs mt-1 space-y-1">
                <p className="flex items-center">
                  {meetsMinLength ? (
                    <CheckCircle className="w-3 h-3 mr-1 text-green-500" />
                  ) : (
                    <AlertTriangle className="w-3 h-3 mr-1 text-red-500" />
                  )}
                  At least 6 characters
                </p>
                <p className="flex items-center">
                  {hasUppercase ? (
                    <CheckCircle className="w-3 h-3 mr-1 text-green-500" />
                  ) : (
                    <AlertTriangle className="w-3 h-3 mr-1 text-red-500" />
                  )}
                  One uppercase letter
                </p>
                <p className="flex items-center">
                  {hasLowercase ? (
                    <CheckCircle className="w-3 h-3 mr-1 text-green-500" />
                  ) : (
                    <AlertTriangle className="w-3 h-3 mr-1 text-red-500" />
                  )}
                  One lowercase letter
                </p>
                <p className="flex items-center">
                  {hasSpecialChar ? (
                    <CheckCircle className="w-3 h-3 mr-1 text-green-500" />
                  ) : (
                    <AlertTriangle className="w-3 h-3 mr-1 text-red-500" />
                  )}
                  One special character
                </p>
                {!meetsMaxLength && (
                  <p className="flex items-center">
                    <AlertTriangle className="w-3 h-3 mr-1 text-red-500" />
                    No more than 16 characters
                  </p>
                )}
              </div>
            )}

            {/* Forgot password */}
            {isLogin && (
              <div className="flex justify-end">
                <Link
                  to="/reset-password"
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-500"
                >
                  Forgot password?
                </Link>
              </div>
            )}

            {/* Terms */}
            {!isLogin && (
              <label className="flex items-center text-xs text-gray-600">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className={`h-3 w-3 mr-1 ${
                    errors.terms ? "border-red-500" : "border-gray-300"
                  }`}
                  required
                />
                I agree to{" "}
                <Link to="/terms" className="text-indigo-600 ml-1">
                  Terms
                </Link>{" "}
                &{" "}
                <Link to="/privacy" className="text-indigo-600">
                  Privacy
                </Link>
              </label>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || (!isLogin && !isPasswordValid)}
              className="w-full py-2 text-xs font-medium rounded-md bg-indigo-600 text-white 
          hover:bg-indigo-700 disabled:opacity-50 transition"
            >
              {loading ? "Please wait..." : isLogin ? "Login" : "Create account"}
            </button>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default SignUpModal;
