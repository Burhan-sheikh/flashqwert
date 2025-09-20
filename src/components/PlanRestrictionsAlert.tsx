import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Crown, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface PlanRestrictionsAlertProps {
  currentPlan: string;
  requiredFeature: string;
  upgradeMessage: string;
  actionText?: string;
  actionLink?: string;
  className?: string;
}

const PlanRestrictionsAlert: React.FC<PlanRestrictionsAlertProps> = ({
  currentPlan,
  requiredFeature,
  upgradeMessage,
  actionText = "Upgrade Plan",
  actionLink = "/plans-and-quota",
  className = ""
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-amber-50 border border-amber-200 rounded-xl p-4 ${className}`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-amber-800 mb-1">
            {requiredFeature} Not Available
          </h4>
          <p className="text-sm text-amber-700 mb-3">
            {upgradeMessage}
          </p>
          <Link
            to={actionLink}
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition-colors"
          >
            <Crown className="w-4 h-4" />
            {actionText}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default PlanRestrictionsAlert;