import React from 'react';
import { motion } from 'framer-motion';
import { Lock, Crown, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { shouldShowUpgradePrompt, getUpgradeMessage } from '../utils/subscriptionUtils';

interface FeatureGateProps {
  currentPlan: string;
  requiredFeature: 'history' | 'collections' | 'bulk' | 'advanced';
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showUpgradePrompt?: boolean;
}

const FeatureGate: React.FC<FeatureGateProps> = ({
  currentPlan,
  requiredFeature,
  children,
  fallback,
  showUpgradePrompt = true
}) => {
  const shouldUpgrade = shouldShowUpgradePrompt(currentPlan, requiredFeature);

  if (!shouldUpgrade) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (!showUpgradePrompt) {
    return null;
  }

  const upgradeMessage = getUpgradeMessage(currentPlan, requiredFeature);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 text-center"
    >
      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Lock className="w-8 h-8 text-blue-600" />
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Feature Locked
      </h3>
      
      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        {upgradeMessage}
      </p>

      <Link
        to="/plans-and-quota"
        className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
      >
        <Crown className="w-5 h-5" />
        Upgrade Plan
        <ArrowRight className="w-5 h-5" />
      </Link>
    </motion.div>
  );
};

export default FeatureGate;