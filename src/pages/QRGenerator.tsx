import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Zap, Target, Layers } from 'lucide-react';
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
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center min-h-[400px]"
        >
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Loading QR Generator</h3>
            <p className="text-gray-500">Preparing your workspace...</p>
          </div>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center"
        >
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Generator</h3>
          <p className="text-red-700">{error}</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-8 text-center"
      >
        <div className="mb-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl mb-4">
            <Layers className="w-8 h-8 text-white" />
          </div>
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
            QR Code Generator
          </span>
        </h1>
        
        <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-6">
          Create professional QR codes with multiple content types and advanced features
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
          <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full">
            <Zap className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-700">9 Content Types</span>
          </div>
          <div className="flex items-center gap-2 bg-purple-50 px-4 py-2 rounded-full">
            <Target className="w-5 h-5 text-purple-600" />
            <span className="text-sm font-medium text-purple-700">Dynamic Features</span>
          </div>
          <div className="flex items-center gap-2 bg-green-50 px-4 py-2 rounded-full">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-green-700">Advanced Security</span>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-2xl p-6 max-w-2xl mx-auto">
          <div className="flex items-center justify-center gap-3 mb-3">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-800">Enhanced Features Available</h3>
          </div>
          <p className="text-gray-600 leading-relaxed">
            Generate QR codes for websites, events, contacts, Wi-Fi, text, email, phone, SMS, and locations. 
            Add password protection, scheduling, countdown timers, and custom branding.
          </p>
        </div>
      </motion.div>

      {/* Generator Component */}
      <QRGenerator
        onClose={() => window.history.back()}
        userQuota={userQuota}
        onQuotaUpdate={setUserQuota}
      />
    </div>
  );
};

export default QRGeneratorPage;