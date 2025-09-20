import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { DynamicQRCodeData } from '../types/qrcode';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  Lock, 
  AlertTriangle, 
  Eye, 
  EyeOff, 
  Clock, 
  Calendar, 
  Target, 
  ExternalLink, 
  ArrowRight, 
  Timer,
  Users,
  CheckCircle,
  Info,
  Sparkles
} from 'lucide-react';
import ReCAPTCHA from 'react-google-recaptcha';

interface AttemptData {
  count: number;
  lastAttempt: number;
  lockUntil?: number;
  captchaRequired?: boolean;
}

const RedirectQr: React.FC = () => {
  const { shortId } = useParams<{ shortId: string }>();
  const [qrData, setQrData] = useState<DynamicQRCodeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [lockMessage, setLockMessage] = useState('');
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [attempts, setAttempts] = useState<AttemptData>({ count: 0, lastAttempt: 0 });
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every second for live schedule display
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getDeviceFingerprint = (): string => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx?.fillText('fingerprint', 2, 2);
    const fingerprint = canvas.toDataURL();
    
    return btoa(
      navigator.userAgent +
      navigator.language +
      screen.width + 'x' + screen.height +
      new Date().getTimezoneOffset() +
      fingerprint.slice(-50)
    ).slice(0, 32);
  };

  const getAttemptKey = (): string => {
    return `qr_attempts_${shortId}_${getDeviceFingerprint()}`;
  };

  const getStoredAttempts = (): AttemptData => {
    try {
      const stored = localStorage.getItem(getAttemptKey());
      if (stored) {
        const data = JSON.parse(stored);
        if (Date.now() - data.lastAttempt > 24 * 60 * 60 * 1000) {
          localStorage.removeItem(getAttemptKey());
          return { count: 0, lastAttempt: 0 };
        }
        return data;
      }
    } catch (e) {
      console.error('Error reading attempts:', e);
    }
    return { count: 0, lastAttempt: 0 };
  };

  const updateAttempts = (newAttempts: AttemptData) => {
    try {
      localStorage.setItem(getAttemptKey(), JSON.stringify(newAttempts));
      setAttempts(newAttempts);
    } catch (e) {
      console.error('Error storing attempts:', e);
    }
  };

  const checkLockStatus = (attemptData: AttemptData): { locked: boolean; message: string; showCaptcha: boolean } => {
    const now = Date.now();
    
    if (attemptData.lockUntil && now < attemptData.lockUntil) {
      const remainingTime = Math.ceil((attemptData.lockUntil - now) / (60 * 1000));
      return {
        locked: true,
        message: `Access temporarily restricted. Please try again in ${remainingTime} minutes.`,
        showCaptcha: false
      };
    }

    if (attemptData.count >= 20) {
      return {
        locked: true,
        message: 'This QR code has been temporarily disabled due to security concerns. Please contact the owner for assistance.',
        showCaptcha: false
      };
    }

    if (attemptData.count >= 3) {
      return {
        locked: false,
        message: '',
        showCaptcha: true
      };
    }

    return { locked: false, message: '', showCaptcha: false };
  };

  const getScheduleStatus = (qrData: DynamicQRCodeData) => {
    if (!qrData.scheduleEnabled) return { isActive: true, message: '' };

    const now = new Date();
    
    // Check date range
    if (qrData.scheduleStart && qrData.scheduleEnd) {
      const startDate = new Date(qrData.scheduleStart);
      const endDate = new Date(qrData.scheduleEnd);
      if (now < startDate) {
        return { 
          isActive: false, 
          message: 'This QR code will become active on ' + startDate.toLocaleDateString(),
          startDate 
        };
      }
      if (now > endDate) {
        return { 
          isActive: false, 
          message: 'This QR code expired on ' + endDate.toLocaleDateString(),
          endDate 
        };
      }
    }

    // Check daily time range
    if (qrData.dailyStartTime && qrData.dailyEndTime) {
      const currentTime = now.toTimeString().slice(0, 5);
      if (currentTime < qrData.dailyStartTime || currentTime > qrData.dailyEndTime) {
        return { 
          isActive: false, 
          message: `This QR code is active daily from ${qrData.dailyStartTime} to ${qrData.dailyEndTime}`,
          dailySchedule: { start: qrData.dailyStartTime, end: qrData.dailyEndTime }
        };
      }
    }

    return { isActive: true, message: 'Currently active' };
  };

  useEffect(() => {
    const fetchQRData = async () => {
      if (!shortId) {
        setError('Invalid QR code identifier');
        setLoading(false);
        return;
      }

      try {
        const storedAttempts = getStoredAttempts();
        setAttempts(storedAttempts);

        const lockStatus = checkLockStatus(storedAttempts);
        if (lockStatus.locked) {
          setIsLocked(true);
          setLockMessage(lockStatus.message);
          setLoading(false);
          return;
        }

        setShowCaptcha(lockStatus.showCaptcha);

        const qrRef = doc(db, 'qrcodes', shortId);
        const qrSnap = await getDoc(qrRef);

        if (!qrSnap.exists()) {
          setError('QR code not found or has been removed');
          setLoading(false);
          return;
        }

        const data = qrSnap.data() as DynamicQRCodeData;
        setQrData(data);

        // Check schedule
        const scheduleStatus = getScheduleStatus(data);
        if (!scheduleStatus.isActive) {
          setError(scheduleStatus.message);
          setLoading(false);
          return;
        }

        // Check scan limits
        if (data.scanLimitEnabled && data.maxScans && data.visits >= data.maxScans) {
          setError('This QR code has reached its maximum scan limit and is no longer available');
          setLoading(false);
          return;
        }

        // If no restrictions, redirect immediately
        if (!data.passwordEnabled && !data.redirectPageEnabled) {
          await updateDoc(qrRef, {
            visits: increment(1),
            lastVisitedAt: new Date().toISOString()
          });
          window.location.href = data.targetUrl;
          return;
        }

        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching QR data:', err);
        setError('Failed to load QR code. Please try again later.');
        setLoading(false);
      }
    };

    fetchQRData();
  }, [shortId]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!qrData || !password.trim()) {
      setPasswordError('Please enter a password');
      return;
    }

    if (showCaptcha && !captchaToken) {
      setPasswordError('Please complete the security verification');
      return;
    }

    // Verify captcha if required - use production endpoint
    if (showCaptcha && captchaToken) {
      try {
        // For production, you'll need to implement your own captcha verification endpoint
        // This is just a placeholder - replace with your actual verification logic
        const isValidCaptcha = true; // Replace with actual verification
        
        if (!isValidCaptcha) {
          setPasswordError('Security verification failed. Please try again.');
          setCaptchaToken(null);
          return;
        }
      } catch (error) {
        setPasswordError('Security verification failed. Please try again.');
        setCaptchaToken(null);
        return;
      }
    }

    if (password === qrData.password) {
      // Correct password - clear attempts and redirect
      localStorage.removeItem(getAttemptKey());
      
      try {
        const qrRef = doc(db, 'qrcodes', shortId!);
        await updateDoc(qrRef, {
          visits: increment(1),
          lastVisitedAt: new Date().toISOString()
        });
      } catch (error) {
        console.error('Error updating visit count:', error);
      }

      window.location.href = qrData.targetUrl;
    } else {
      // Incorrect password - implement progressive security
      const newAttemptCount = attempts.count + 1;
      const now = Date.now();
      
      let newAttempts: AttemptData = {
        count: newAttemptCount,
        lastAttempt: now
      };

      // Progressive security measures
      if (newAttemptCount >= 10) {
        newAttempts.lockUntil = now + (60 * 60 * 1000); // 1 hour lockout
        setIsLocked(true);
        setLockMessage('Too many failed attempts. Access locked for 1 hour.');
      } else if (newAttemptCount >= 5) {
        newAttempts.lockUntil = now + (15 * 60 * 1000); // 15 minute lockout
        setIsLocked(true);
        setLockMessage('Multiple failed attempts. Access locked for 15 minutes.');
      } else if (newAttemptCount >= 3) {
        setShowCaptcha(true);
        newAttempts.captchaRequired = true;
      }

      updateAttempts(newAttempts);
      
      const remaining = 3 - (newAttemptCount % 3);
      setPasswordError(`Incorrect password. ${remaining > 0 ? `${remaining} attempts remaining.` : 'Please complete security verification.'}`);
      setPassword('');
      setCaptchaToken(null);
    }
  };

  const handleContinue = async () => {
    if (!qrData) return;

    try {
      const qrRef = doc(db, 'qrcodes', shortId!);
      await updateDoc(qrRef, {
        visits: increment(1),
        lastVisitedAt: new Date().toISOString()
      });
      window.location.href = qrData.targetUrl;
    } catch (error) {
      console.error('Error updating visit count:', error);
      window.location.href = qrData.targetUrl;
    }
  };

  const formatTimeRemaining = (targetTime: string) => {
    const target = new Date();
    const [hours, minutes] = targetTime.split(':');
    target.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    if (target < currentTime) {
      target.setDate(target.getDate() + 1);
    }
    
    const diff = target.getTime() - currentTime.getTime();
    const hoursLeft = Math.floor(diff / (1000 * 60 * 60));
    const minutesLeft = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hoursLeft}h ${minutesLeft}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 max-w-md w-full text-center border border-white/20"
        >
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-6"></div>
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 w-20 h-20 border-4 border-purple-200 border-t-purple-600 rounded-full mx-auto opacity-50"
            />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Verifying QR Code</h3>
          <p className="text-gray-600">Please wait while we verify your request...</p>
        </motion.div>
      </div>
    );
  }

  if (error || isLocked) {
    const isScheduleError = error?.includes('active') || error?.includes('expired');
    const isLimitError = error?.includes('scan limit') || error?.includes('maximum scan');

    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-pink-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 max-w-lg w-full text-center border border-white/20"
        >
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-20 h-20 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
          >
            {isScheduleError ? (
              <Clock className="w-10 h-10 text-orange-600" />
            ) : isLimitError ? (
              <Target className="w-10 h-10 text-purple-600" />
            ) : (
              <AlertTriangle className="w-10 h-10 text-red-600" />
            )}
          </motion.div>
          
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            {isScheduleError ? 'Scheduled Access' : 
             isLimitError ? 'Limit Reached' : 
             'Access Restricted'}
          </h3>
          
          <p className="text-gray-700 mb-6 leading-relaxed text-lg">
            {error || lockMessage}
          </p>

          {/* Enhanced Schedule Info */}
          {isScheduleError && qrData && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-200 rounded-2xl p-6 mb-6"
            >
              <div className="flex items-center justify-center gap-3 text-orange-800 mb-4">
                <Calendar className="w-6 h-6" />
                <span className="font-bold text-lg">Schedule Information</span>
              </div>
              
              {qrData.scheduleStart && qrData.scheduleEnd && (
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center p-3 bg-white/60 rounded-xl">
                    <span className="font-medium text-gray-700">Active Period:</span>
                    <span className="text-orange-700 font-semibold">
                      {new Date(qrData.scheduleStart).toLocaleDateString()} - {new Date(qrData.scheduleEnd).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              )}
              
              {qrData.dailyStartTime && qrData.dailyEndTime && (
                <div className="mt-3">
                  <div className="flex justify-between items-center p-3 bg-white/60 rounded-xl">
                    <span className="font-medium text-gray-700">Daily Hours:</span>
                    <span className="text-orange-700 font-semibold">
                      {qrData.dailyStartTime} - {qrData.dailyEndTime}
                    </span>
                  </div>
                  
                  {/* Live countdown to next availability */}
                  {qrData.dailyStartTime && currentTime.toTimeString().slice(0, 5) < qrData.dailyStartTime && (
                    <motion.div
                      animate={{ opacity: [0.8, 1, 0.8] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-xl"
                    >
                      <div className="flex items-center justify-center gap-2 text-blue-800">
                        <Timer className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          Available in: {formatTimeRemaining(qrData.dailyStartTime)}
                        </span>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {isLimitError && qrData && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-2xl p-6 mb-6"
            >
              <div className="flex items-center justify-center gap-3 text-purple-800 mb-4">
                <Target className="w-6 h-6" />
                <span className="font-bold text-lg">Scan Limit Information</span>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center p-3 bg-white/60 rounded-xl">
                  <span className="font-medium text-gray-700">Total Scans:</span>
                  <span className="text-purple-700 font-semibold">{qrData.visits || 0}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white/60 rounded-xl">
                  <span className="font-medium text-gray-700">Maximum Allowed:</span>
                  <span className="text-purple-700 font-semibold">{qrData.maxScans || 0}</span>
                </div>
              </div>
            </motion.div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.history.back()}
              className="px-6 py-3 bg-gray-600 text-white rounded-2xl hover:bg-gray-700 transition-colors font-medium shadow-lg"
            >
              Go Back
            </motion.button>
            
            {(isScheduleError || isLimitError) && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-colors font-medium shadow-lg"
              >
                Check Again
              </motion.button>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  if (!qrData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center"
        >
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">QR Code Not Found</h3>
          <p className="text-gray-600 mb-6">The requested QR code could not be found or has been removed.</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.history.back()}
            className="px-6 py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-colors font-medium shadow-lg"
          >
            Go Back
          </motion.button>
        </motion.div>
      </div>
    );
  }

  // Enhanced Password Protection UI
  if (qrData.passwordEnabled) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 max-w-md w-full border border-white/20"
        >
          <div className="text-center mb-8">
            <motion.div
              animate={{ 
                boxShadow: [
                  '0 0 20px rgba(59, 130, 246, 0.3)',
                  '0 0 40px rgba(59, 130, 246, 0.5)',
                  '0 0 20px rgba(59, 130, 246, 0.3)'
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <Shield className="w-10 h-10 text-blue-600" />
            </motion.div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Protected Content</h2>
            <p className="text-gray-600">This content requires authentication to access</p>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-3">
                Access Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setPasswordError(null);
                  }}
                  className={`w-full px-4 py-4 pr-12 border-2 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-lg ${
                    passwordError ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  placeholder="Enter password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
                </button>
              </div>
              
              {passwordError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 p-4 bg-red-50 border-2 border-red-200 rounded-2xl"
                >
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-800">{passwordError}</p>
                      {attempts.count >= 3 && (
                        <p className="text-xs text-red-600 mt-1">
                          Security verification required after multiple attempts
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {showCaptcha && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center space-y-4"
              >
                <div className="p-4 bg-yellow-50 border-2 border-yellow-200 rounded-2xl w-full">
                  <div className="flex items-center gap-3 text-yellow-800 mb-3">
                    <Shield className="w-5 h-5" />
                    <span className="font-medium text-sm">Security Verification Required</span>
                  </div>
                  <p className="text-xs text-yellow-700">
                    Please complete the verification below to continue
                  </p>
                </div>
                
                <div className="flex justify-center">
                  <ReCAPTCHA
                    sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY || "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"}
                    onChange={(token) => {
                      setCaptchaToken(token);
                      setPasswordError(null);
                    }}
                    theme="light"
                    size="normal"
                  />
                </div>
              </motion.div>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={showCaptcha && !captchaToken}
              className={`w-full py-4 px-6 rounded-2xl font-semibold transition-all duration-200 flex items-center justify-center gap-3 shadow-lg ${
                showCaptcha && !captchaToken
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-blue-500/25 hover:shadow-xl'
              }`}
            >
              <Lock className="w-5 h-5" />
              Access Content
            </motion.button>
          </form>

          {qrData.description && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-6 p-4 bg-gray-50 rounded-2xl border border-gray-200"
            >
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-700">{qrData.description}</p>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    );
  }

  // Enhanced Professional Redirect Page
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 max-w-2xl w-full border border-white/20"
      >
        {/* Featured Image with Enhanced Display */}
        {qrData.featuredImageUrl && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="relative overflow-hidden rounded-2xl shadow-xl">
              <img
                src={qrData.featuredImageUrl}
                alt="Featured content"
                className="w-full h-64 object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>
          </motion.div>
        )}

        {/* Enhanced Content Header */}
        <div className="text-center mb-8">
          <motion.div
            animate={{ 
              boxShadow: [
                '0 0 30px rgba(34, 197, 94, 0.3)',
                '0 0 50px rgba(34, 197, 94, 0.5)',
                '0 0 30px rgba(34, 197, 94, 0.3)'
              ]
            }}
            transition={{ duration: 3, repeat: Infinity }}
            className="w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
          >
            <ExternalLink className="w-10 h-10 text-green-600" />
          </motion.div>
          
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold text-gray-900 mb-4"
          >
            {qrData.name}
          </motion.h2>
          
          {qrData.description && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-lg text-gray-700 leading-relaxed mb-6 bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-2xl"
            >
              {qrData.description}
            </motion.p>
          )}

          {/* Enhanced QR Stats */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-center gap-6 mb-8"
          >
            {qrData.visits !== undefined && (
              <div className="flex items-center gap-2 bg-blue-100 px-4 py-2 rounded-full">
                <Eye className="w-5 h-5 text-blue-600" />
                <span className="font-semibold text-blue-800">{qrData.visits} visits</span>
              </div>
            )}
            
            {qrData.scanLimitEnabled && qrData.maxScans && (
              <div className="flex items-center gap-2 bg-purple-100 px-4 py-2 rounded-full">
                <Target className="w-5 h-5 text-purple-600" />
                <span className="font-semibold text-purple-800">{qrData.maxScans - qrData.visits} remaining</span>
              </div>
            )}

            {qrData.scheduleEnabled && (
              <div className="flex items-center gap-2 bg-orange-100 px-4 py-2 rounded-full">
                <Clock className="w-5 h-5 text-orange-600" />
                <span className="font-semibold text-orange-800">Scheduled</span>
              </div>
            )}
          </motion.div>
        </div>

        {/* Enhanced Schedule Display */}
        {qrData.scheduleEnabled && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-200 rounded-2xl p-6 mb-8"
          >
            <div className="flex items-center gap-3 text-orange-800 mb-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              >
                <Clock className="w-6 h-6" />
              </motion.div>
              <span className="font-bold text-lg">Live Schedule Status</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {qrData.scheduleStart && qrData.scheduleEnd && (
                <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <Calendar className="w-4 h-4" />
                    <span className="font-medium">Active Period</span>
                  </div>
                  <p className="font-semibold text-orange-800">
                    {new Date(qrData.scheduleStart).toLocaleDateString()} - {new Date(qrData.scheduleEnd).toLocaleDateString()}
                  </p>
                </div>
              )}
              
              {qrData.dailyStartTime && qrData.dailyEndTime && (
                <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <Timer className="w-4 h-4" />
                    <span className="font-medium">Daily Hours</span>
                  </div>
                  <p className="font-semibold text-orange-800">
                    {qrData.dailyStartTime} - {qrData.dailyEndTime}
                  </p>
                </div>
              )}
            </div>
            
            <motion.div
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="mt-4 p-3 bg-green-100 border-2 border-green-300 rounded-xl text-center"
            >
              <div className="flex items-center justify-center gap-2 text-green-800">
                <CheckCircle className="w-5 h-5" />
                <span className="font-bold">Currently Active & Available</span>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Enhanced Action Section */}
        <div className="space-y-6">
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleContinue}
            className="w-full py-5 px-8 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 hover:from-green-700 hover:via-emerald-700 hover:to-teal-700 text-white rounded-2xl transition-all duration-300 font-bold text-lg shadow-2xl hover:shadow-green-500/25 flex items-center justify-center gap-4"
          >
            <Sparkles className="w-6 h-6" />
            <span>Continue to Destination</span>
            <ArrowRight className="w-6 h-6" />
          </motion.button>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center space-y-3"
          >
            <p className="text-sm text-gray-600 font-medium">You will be redirected to:</p>
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 px-4 py-3 rounded-2xl">
              <p className="text-blue-700 font-mono text-sm break-all font-semibold">
                {qrData.targetUrl}
              </p>
            </div>
          </motion.div>
        </div>

        {/* Enhanced Tags Section */}
        {qrData.tags && qrData.tags.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-8 pt-6 border-t-2 border-gray-100"
          >
            <div className="text-center mb-4">
              <h4 className="text-sm font-semibold text-gray-600 flex items-center justify-center gap-2">
                <Tag className="w-4 h-4" />
                Categories
              </h4>
            </div>
            <div className="flex flex-wrap gap-3 justify-center">
              {qrData.tags.map((tag, index) => (
                <motion.span
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  className="px-4 py-2 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 text-sm rounded-full font-semibold border-2 border-blue-200 shadow-sm"
                >
                  #{tag}
                </motion.span>
              ))}
            </div>
          </motion.div>
        )}

        {/* Enhanced Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-8 pt-6 border-t-2 border-gray-100 text-center"
        >
          <div className="flex items-center justify-center gap-2 text-gray-400 text-sm">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="w-4 h-4" />
            </motion.div>
            <span>Powered by FlashQR • Secure & Reliable QR Codes</span>
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="w-4 h-4" />
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default RedirectQr;
