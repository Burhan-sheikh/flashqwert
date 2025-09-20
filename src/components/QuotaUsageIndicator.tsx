import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, TrendingUp, CheckCircle } from 'lucide-react';
import { calculateQuotaUsage } from '../utils/subscriptionUtils';

interface QuotaUsageIndicatorProps {
  used: number;
  total: number;
  planName: string;
  className?: string;
  showDetails?: boolean;
}

const QuotaUsageIndicator: React.FC<QuotaUsageIndicatorProps> = ({
  used,
  total,
  planName,
  className = "",
  showDetails = true
}) => {
  const usage = calculateQuotaUsage(used, total);

  const getStatusColor = () => {
    if (usage.isCritical) return 'text-red-600 bg-red-50 border-red-200';
    if (usage.isLow) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-green-600 bg-green-50 border-green-200';
  };

  const getStatusIcon = () => {
    if (usage.isCritical) return <AlertTriangle className="w-4 h-4" />;
    if (usage.isLow) return <TrendingUp className="w-4 h-4" />;
    return <CheckCircle className="w-4 h-4" />;
  };

  const getProgressColor = () => {
    if (usage.isCritical) return 'bg-red-500';
    if (usage.isLow) return 'bg-amber-500';
    return 'bg-green-500';
  };

  return (
    <div className={`rounded-xl border p-4 ${getStatusColor()} ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className="font-semibold text-sm">Quota Usage</span>
        </div>
        <span className="text-lg font-bold">
          {usage.remaining} / {total}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
        <motion.div
          className={`h-2 rounded-full ${getProgressColor()}`}
          initial={{ width: 0 }}
          animate={{ width: `${usage.percentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>

      {showDetails && (
        <div className="text-xs space-y-1">
          <div className="flex justify-between">
            <span>Used:</span>
            <span className="font-medium">{usage.used} QR codes</span>
          </div>
          <div className="flex justify-between">
            <span>Remaining:</span>
            <span className="font-medium">{usage.remaining} QR codes</span>
          </div>
          {usage.isCritical && (
            <div className="mt-2 text-red-700 font-medium">
              ⚠️ Quota almost exhausted! Consider upgrading.
            </div>
          )}
          {usage.isLow && !usage.isCritical && (
            <div className="mt-2 text-amber-700 font-medium">
              📊 Running low on quota. Plan ahead!
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default QuotaUsageIndicator;