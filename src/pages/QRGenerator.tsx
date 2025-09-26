import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { 
  CircleAlert as AlertCircle, 
  CircleCheck as CheckCircle2, 
  Zap, 
  Target, 
  Layers,
  Sparkles,
  ArrowRight,
  Play,
  Wrench,
  Shield,
  BarChart3
} from 'lucide-react';
import QRGenerator from '../components/QRGenerator';
import { getQuotaForPlan } from '../utils/planConfig';

const QRGeneratorPage: React.FC = () => {
  const { user, loading } = useAuth();
  const [userQuota, setUserQuota] = useState(30);
  const [subscriptionPlan, setSubscriptionPlan] = useState('Free');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) {
        setUserQuota(getQuotaForPlan('Free'));
        setSubscriptionPlan('Free');
        setIsLoading(false);
        return;
      }

      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const data = userSnap.data();
          setUserQuota(data.quota || getQuotaForPlan('Free'));
          setSubscriptionPlan(data.subscriptionPlan || 'Free');
        } else {
          setError('User profile not found');
        }
      } catch (err: any) {
        setError(`Failed to load user data: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    if (!loading) {
      fetchUserData();
    }
  }, [user, loading]);

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center min-h-[60vh]"
          >
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-6"></div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Initializing QR Generator</h3>
              <p className="text-gray-600">Setting up your professional workspace...</p>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border-2 border-red-200 rounded-2xl p-8 text-center max-w-2xl mx-auto"
          >
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-red-900 mb-2">Generator Initialization Failed</h3>
            <p className="text-red-700 mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium"
            >
              Try Again
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      

        {/* Generator Component */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <QRGenerator
            onClose={() => window.history.back()}
            userQuota={userQuota}
            onQuotaUpdate={setUserQuota}
          />
        </div>
      </div>

      {/* Footer Info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Static QR Codes</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Direct encoding with permanent links. Perfect for printed materials and simple use cases.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Target className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Dynamic QR Codes</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Advanced features with tracking, password protection, scheduling, and custom branding.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Professional Analytics</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Track scans, analyze performance, and optimize your QR code campaigns with detailed insights.
              </p>
            </div>
          </div>
        </div>
      </div>

  );
};

export default QRGeneratorPage;