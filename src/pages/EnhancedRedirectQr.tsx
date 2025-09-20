import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { EnhancedQRCodeData, generateQRValue } from '../types/qrContentTypes';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  Lock, 
  AlertTriangle, 
  Eye, 
  EyeOff, 
  Clock, 
  Calendar, 
  ExternalLink,
  Sparkles
} from 'lucide-react';
import RedirectPage from '../components/RedirectPages';
import CountdownTimer from '../components/CountdownTimer';

const EnhancedRedirectQr: React.FC = () => {
  const { shortId } = useParams<{ shortId: string }>();
  const [qrData, setQrData] = useState<EnhancedQRCodeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [showCountdown, setShowCountdown] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every second for live schedule display
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getScheduleStatus = (qrData: EnhancedQRCodeData) => {
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
        const qrRef = doc(db, 'enhancedQRCodes', shortId);
        const qrSnap = await getDoc(qrRef);

        if (!qrSnap.exists()) {
          setError('QR code not found or has been removed');
          setLoading(false);
          return;
        }

        const data = qrSnap.data() as EnhancedQRCodeData;
        setQrData(data);

        // For static QR codes, redirect immediately
        if (data.qrType === 'static') {
          const qrValue = generateQRValue(data.content);
          window.location.href = qrValue;
          return;
        }

        // Check schedule for dynamic QR codes
        const scheduleStatus = getScheduleStatus(data);
        if (!scheduleStatus.isActive) {
          setError(scheduleStatus.message);
          setLoading(false);
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

    if (password === qrData.password) {
      // Correct password - proceed to next step
      setPasswordError(null);
      proceedToContent();
    } else {
      setPasswordError('Incorrect password. Please try again.');
      setPassword('');
    }
  };

  const proceedToContent = async () => {
    if (!qrData) return;

    try {
      // Update visit count
      const qrRef = doc(db, 'enhancedQRCodes', shortId!);
      await updateDoc(qrRef, {
        visits: increment(1),
        lastVisitedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating visit count:', error);
    }

    // Show countdown if enabled, otherwise proceed directly
    if (qrData.countdownEnabled) {
      setShowCountdown(true);
    } else {
      handleFinalRedirect();
    }
  };

  const handleFinalRedirect = () => {
    if (!qrData) return;

    // Handle different content types
    const qrValue = generateQRValue(qrData.content);
    
    // For direct action types (email, phone, sms, geolocation), redirect immediately
    if (['email', 'phone', 'sms', 'geolocation'].includes(qrData.contentType)) {
      window.location.href = qrValue;
    } else {
      // For other types, show the redirect page first
      // This will be handled by the RedirectPage component
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 max-w-md w-full text-center border border-white/20"
        >
          <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-6"></div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Loading QR Code</h3>
          <p className="text-gray-600">Please wait while we verify your request...</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-pink-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 max-w-lg w-full text-center border border-white/20"
        >
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-10 h-10 text-red-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">Access Restricted</h3>
          <p className="text-gray-700 mb-6 leading-relaxed text-lg">{error}</p>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-3 bg-gray-600 text-white rounded-2xl hover:bg-gray-700 transition-colors font-medium"
          >
            Go Back
          </button>
        </motion.div>
      </div>
    );
  }

  if (!qrData) return null;

  // Password protection screen
  if (qrData.passwordEnabled && !showCountdown) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 max-w-md w-full border border-white/20"
        >
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Shield className="w-10 h-10 text-blue-600" />
            </div>
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
                    <p className="text-sm font-medium text-red-800">{passwordError}</p>
                  </div>
                </motion.div>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-4 px-6 rounded-2xl font-semibold transition-all duration-200 flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg"
            >
              <Lock className="w-5 h-5" />
              Access Content
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  // Countdown screen
  if (showCountdown && qrData.countdownEnabled) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 max-w-md w-full border border-white/20"
        >
          <CountdownTimer
            duration={qrData.countdownDuration || 5}
            onComplete={handleFinalRedirect}
            onSkip={handleFinalRedirect}
            title={qrData.name}
            description="Preparing your content..."
          />
        </motion.div>
      </div>
    );
  }

  // Content display screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 max-w-2xl w-full border border-white/20"
      >
        <RedirectPage
          contentType={qrData.contentType}
          content={qrData.content}
          qrData={qrData}
          onContinue={handleFinalRedirect}
        />

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
          <div className="flex items-center justify-center gap-2 text-gray-400 text-sm">
            <Sparkles className="w-4 h-4" />
            <span>Powered by FlashQR • Enhanced QR Experience</span>
            <Sparkles className="w-4 h-4" />
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default EnhancedRedirectQr;