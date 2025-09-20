import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { auth, db, googleProvider } from "../firebase/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { QrCode, Eye, EyeOff, AlertTriangle, CheckCircle } from "lucide-react";
import { getQuotaForPlan } from "../utils/planConfig";

// Props
interface AuthFormProps {
  isLogin: boolean;
}

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

export const AuthForm: React.FC<AuthFormProps> = ({ isLogin }) => {
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
            quota: getQuotaForPlan('Free'),
            qrCodesGenerated: 0,
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
            subscriptionExpiry: null,
          });
        }

        navigate("/");
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

  // Validate form
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

  // Handle submit
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
        navigate("/");
      } else {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        const now = new Date();

        if (userCredential.user) {
          await setDoc(doc(db, "users", userCredential.user.uid), {
            username,
            email,
            subscriptionPlan: "Free",
            quota: getQuotaForPlan('Free'),
            qrCodesGenerated: 0,
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
            subscriptionExpiry: null,
          });
          navigate("/");
        } else {
          setFirebaseError("Failed to create user. Please try again.");
        }
      }
    } catch (error: any) {
      let errorMessage = "An error occurred. Please try again.";
      if (error.code === "auth/email-already-in-use") {
        errorMessage = "This email is already registered. Try logging in?";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Please enter a valid email address.";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "The password is too weak. Please choose a stronger one.";
      } else if (
        error.code === "auth/user-not-found" ||
        error.code === "auth/wrong-password"
      ) {
        errorMessage = "Invalid email or password.";
      }
      setFirebaseError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Toggle password visibility
  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-2">
      <div className="max-w-md w-full bg-white/90 backdrop-blur-lg shadow-xl rounded-2xl p-8 space-y-8 border border-gray-100">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center">
            <div className="bg-indigo-100 p-4 rounded-full shadow-md">
              <QrCode className="h-9 w-9 text-indigo-600" />
            </div>
          </div>
          <h2 className="mt-4 text-3xl font-bold text-gray-900">
            {isLogin ? "Welcome Back" : "Create Account"}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {isLogin ? (
              <>
                New to FlashQR?{" "}
                <button
                  onClick={() => navigate("/signup")}
                  className="font-medium text-indigo-600 hover:text-indigo-500"
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  onClick={() => navigate("/login")}
                  className="font-medium text-indigo-600 hover:text-indigo-500"
                >
                  Log in
                </button>
              </>
            )}
          </p>
        </div>

        {/* Firebase Errors */}
        {firebaseError && (
          <div className="bg-red-50 text-red-700 border border-red-200 px-4 py-3 rounded-lg text-sm shadow-sm">
            {firebaseError}
          </div>
        )}

        {/* Google Sign in */}
        <div>
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center py-3 px-4 rounded-lg shadow-md bg-white border border-gray-300 hover:bg-gray-50 transition disabled:opacity-70"
          >
            <img
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              alt="Google"
              className="w-5 h-5 mr-2"
            />
            <span className="text-gray-700 font-medium">
              Continue with Google
            </span>
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center">
          <div className="flex-grow h-px bg-gray-200"></div>
          <span className="px-3 text-gray-400 text-sm">or</span>
          <div className="flex-grow h-px bg-gray-200"></div>
        </div>

        {/* Form */}
        <form className="space-y-5" onSubmit={handleSubmit}>
          {/* Username */}
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={`mt-1 block w-full px-3 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none transition ${
                  errors.username
                    ? "border-red-500"
                    : "border-gray-300 focus:border-indigo-500"
                }`}
                required
              />
              {errors.username && (
                <p className="text-red-500 text-sm mt-1">{errors.username}</p>
              )}
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`mt-1 block w-full px-3 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none transition ${
                errors.email
                  ? "border-red-500"
                  : "border-gray-300 focus:border-indigo-500"
              }`}
              required
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <div className="relative mt-1">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                className={`block w-full px-3 py-2 border rounded-lg shadow-sm pr-10 focus:ring-2 focus:ring-indigo-500 outline-none transition ${
                  !isLogin
                    ? !isPasswordValid
                      ? "border-red-500"
                      : "border-green-500"
                    : "border-gray-300 focus:border-indigo-500"
                }`}
                required
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute inset-y-0 right-0 px-3 flex items-center"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>

            {/* Password rules */}
            {!isLogin && (
              <div className="text-gray-600 text-sm mt-2 space-y-1">
                <p className="flex items-center">
                  {meetsMinLength ? (
                    <CheckCircle className="w-4 h-4 mr-1 text-green-500" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 mr-1 text-red-500" />
                  )}
                  At least 6 characters
                </p>
                <p className="flex items-center">
                  {hasUppercase ? (
                    <CheckCircle className="w-4 h-4 mr-1 text-green-500" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 mr-1 text-red-500" />
                  )}
                  One uppercase letter
                </p>
                <p className="flex items-center">
                  {hasLowercase ? (
                    <CheckCircle className="w-4 h-4 mr-1 text-green-500" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 mr-1 text-red-500" />
                  )}
                  One lowercase letter
                </p>
                <p className="flex items-center">
                  {hasSpecialChar ? (
                    <CheckCircle className="w-4 h-4 mr-1 text-green-500" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 mr-1 text-red-500" />
                  )}
                  One special character
                </p>
                {!meetsMaxLength && (
                  <p className="flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-1 text-red-500" />
                    No more than 16 characters
                  </p>
                )}
              </div>
            )}
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password}</p>
            )}
          </div>

          {/* Forgot password */}
          {isLogin && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => navigate("/reset-password")}
                className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
              >
                Forgot password?
              </button>
            </div>
          )}

          {/* Terms */}
          {!isLogin && (
            <div className="flex items-start mt-2">
              <input
                id="terms"
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className={`h-4 w-4 text-indigo-600 border ${
                  errors.terms ? "border-red-500" : "border-gray-300"
                } rounded`}
              />
              <label htmlFor="terms" className="ml-3 text-sm text-gray-700">
                I agree to the{" "}
                <Link
                  to="/terms"
                  className="text-indigo-600 hover:text-indigo-500"
                >
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link
                  to="/privacy"
                  className="text-indigo-600 hover:text-indigo-500"
                >
                  Privacy Policy
                </Link>
                .
              </label>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || (!isLogin && !isPasswordValid)}
            className={`w-full py-3 px-4 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md transition disabled:opacity-70`}
          >
            {loading ? "Please wait..." : isLogin ? "Sign in" : "Create account"}
          </button>
        </form>
      </div>
    </div>
  );
};