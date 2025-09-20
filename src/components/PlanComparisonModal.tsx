import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, XCircle, Crown, Star } from 'lucide-react';
import { PLANS, Plan } from '../utils/planConfig';

interface PlanComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan?: string;
  onSelectPlan: (planName: string) => void;
}

const PlanComparisonModal: React.FC<PlanComparisonModalProps> = ({
  isOpen,
  onClose,
  currentPlan = 'Free',
  onSelectPlan
}) => {
  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.2 } },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.15 } }
  };

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  const getFeatureValue = (plan: Plan, feature: string): string | boolean => {
    switch (feature) {
      case 'qrCodes':
        return `${plan.features.qrCodes} QR codes`;
      case 'historyStorage':
        return `${plan.features.historyStorage} codes storage`;
      case 'collections':
        return plan.features.collections === 1 ? '1 Collection' : `Up to ${plan.features.collections} Collections`;
      case 'downloadFormats':
        return 'PNG, JPG, PDF';
      case 'bulkGeneration':
        return plan.features.bulkGeneration;
      case 'advancedExport':
        return plan.features.advancedExport;
      case 'prioritySupport':
        return plan.features.prioritySupport ? 'Priority + Email' : 'Email only';
      default:
        return false;
    }
  };

  const features = [
    { key: 'qrCodes', label: 'QR Codes per month' },
    { key: 'historyStorage', label: 'QR Code History Storage' },
    { key: 'collections', label: 'Collections' },
    { key: 'downloadFormats', label: 'Download Formats' },
    { key: 'bulkGeneration', label: 'Bulk Generation' },
    { key: 'advancedExport', label: 'Advanced Export' },
    { key: 'prioritySupport', label: 'Support' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={modalVariants}
          onClick={onClose}
        >
          <motion.div
            className="bg-white rounded-2xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            variants={modalVariants}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Compare Plans</h2>
                  <p className="text-blue-100 mt-1">Choose the perfect plan for your needs</p>
                </div>
                <button
                  onClick={onClose}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Comparison Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-4 font-semibold text-gray-900">Features</th>
                    {PLANS.map((plan) => (
                      <th key={plan.id} className="text-center p-4 min-w-[200px]">
                        <div className="space-y-2">
                          <div className="flex items-center justify-center gap-2">
                            <span className="font-bold text-lg">{plan.name}</span>
                            {plan.popular && <Star className="w-4 h-4 text-yellow-500" />}
                            {plan.name.toLowerCase() === currentPlan.toLowerCase() && (
                              <Crown className="w-4 h-4 text-green-500" />
                            )}
                          </div>
                          <div className="text-2xl font-bold text-gray-900">
                            {plan.price === 0 ? 'Free' : `₹${plan.price}`}
                            {plan.price > 0 && <span className="text-sm text-gray-500 font-normal">/month</span>}
                          </div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {features.map((feature, index) => (
                    <tr key={feature.key} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="p-4 font-medium text-gray-900">{feature.label}</td>
                      {PLANS.map((plan) => {
                        const value = getFeatureValue(plan, feature.key);
                        const isBoolean = typeof value === 'boolean';
                        
                        return (
                          <td key={plan.id} className="p-4 text-center">
                            {isBoolean ? (
                              value ? (
                                <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                              ) : (
                                <XCircle className="w-5 h-5 text-gray-300 mx-auto" />
                              )
                            ) : (
                              <span className="text-gray-700">{value}</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Action Buttons */}
            <div className="bg-gray-50 p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {PLANS.map((plan) => (
                  <button
                    key={plan.id}
                    onClick={() => {
                      onSelectPlan(plan.name);
                      onClose();
                    }}
                    disabled={plan.name.toLowerCase() === currentPlan.toLowerCase()}
                    className={`py-3 px-4 rounded-lg font-medium transition-all ${
                      plan.name.toLowerCase() === currentPlan.toLowerCase()
                        ? 'bg-green-100 text-green-700 cursor-not-allowed'
                        : plan.popular
                        ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {plan.name.toLowerCase() === currentPlan.toLowerCase() ? (
                      <span className="flex items-center justify-center gap-2">
                        <Crown className="w-4 h-4" />
                        Current Plan
                      </span>
                    ) : plan.price === 0 ? (
                      'Downgrade to Free'
                    ) : (
                      `Select ${plan.name}`
                    )}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PlanComparisonModal;