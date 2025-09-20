import { PLANS, Plan } from './planConfig';

export type ButtonAction = 'choose' | 'upgrade' | 'active' | 'hidden';

export interface PlanButtonConfig {
  action: ButtonAction;
  text: string;
  disabled: boolean;
  onClick?: () => void;
}

export const getPlanButtonConfig = (
  planName: string,
  currentPlan: string,
  onChoosePlan: (planName: string) => void,
  onUpgradePlan: (planName: string) => void
): PlanButtonConfig => {
  const normalizedCurrent = currentPlan.toLowerCase();
  const normalizedPlan = planName.toLowerCase();

  // Same plan - always active
  if (normalizedCurrent === normalizedPlan) {
    return {
      action: 'active',
      text: 'Active Plan',
      disabled: true
    };
  }

  // Get plan hierarchy
  const currentPlanIndex = PLANS.findIndex(p => p.name.toLowerCase() === normalizedCurrent);
  const targetPlanIndex = PLANS.findIndex(p => p.name.toLowerCase() === normalizedPlan);

  // Free plan user
  if (normalizedCurrent === 'free') {
    if (normalizedPlan !== 'free') {
      return {
        action: 'choose',
        text: 'Choose Plan',
        disabled: false,
        onClick: () => onChoosePlan(planName)
      };
    }
  }

  // Paid plan users
  if (currentPlanIndex > 0 && targetPlanIndex > 0) {
    // Downgrade not allowed (hide button)
    if (targetPlanIndex < currentPlanIndex) {
      return {
        action: 'hidden',
        text: '',
        disabled: true
      };
    }

    // Upgrade available
    if (targetPlanIndex > currentPlanIndex) {
      return {
        action: 'upgrade',
        text: 'Upgrade Plan',
        disabled: false,
        onClick: () => onUpgradePlan(planName)
      };
    }
  }

  // Default fallback
  return {
    action: 'choose',
    text: 'Choose Plan',
    disabled: false,
    onClick: () => onChoosePlan(planName)
  };
};

export const getButtonStyles = (config: PlanButtonConfig, isPopular: boolean = false): string => {
  const baseStyles = "w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2";
  
  if (config.disabled) {
    if (config.action === 'active') {
      return `${baseStyles} bg-green-100 text-green-700 cursor-not-allowed border border-green-200`;
    }
    return `${baseStyles} bg-gray-300 text-gray-500 cursor-not-allowed`;
  }

  if (isPopular) {
    return `${baseStyles} bg-blue-600 text-white hover:bg-blue-700 shadow-lg focus:ring-blue-500`;
  }

  return `${baseStyles} bg-gray-900 text-white hover:bg-gray-800 focus:ring-gray-500`;
};
