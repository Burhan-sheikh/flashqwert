// Plan configuration and utilities
export interface PlanFeatures {
  qrCodes: number;
  historyStorage: number;
  collections: number;
  bulkGeneration: boolean;
  advancedExport: boolean;
  prioritySupport: boolean;
  downloadFormats: string[];
  pdfExport: boolean;
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  period: string;
  description: string;
  features: PlanFeatures;
  popular?: boolean;
}

export const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    period: 'forever',
    description: 'Perfect for individuals exploring QR codes.',
    features: {
      qrCodes: 30,
      historyStorage: 30,
      collections: 1,
      bulkGeneration: true, // Now available to Free users
      advancedExport: true, // Now available to Free users
      prioritySupport: false,
      downloadFormats: ['PNG', 'JPG'],
      pdfExport: true,
    },
  },
  {
    id: 'basic',
    name: 'Basic',
    price: 599,
    period: 'month',
    description: 'Ideal for small businesses and regular users.',
    features: {
      qrCodes: 300,
      historyStorage: 900,
      collections: 10,
      bulkGeneration: true,
      advancedExport: true,
      prioritySupport: false,
      downloadFormats: ['PNG', 'JPG'],
      pdfExport: true,
    },
  },
  {
    id: 'standard',
    name: 'Standard',
    price: 1299,
    period: 'month',
    description: 'Designed for growing teams and advanced needs.',
    features: {
      qrCodes: 900,
      historyStorage: 2700,
      collections: 30,
      bulkGeneration: true,
      advancedExport: true,
      prioritySupport: false,
      downloadFormats: ['PNG', 'JPG'],
      pdfExport: true,
    },
    popular: true,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 2499,
    period: 'month',
    description: 'Best for professionals and businesses needing scale.',
    features: {
      qrCodes: 1500,
      historyStorage: 4500,
      collections: 50,
      bulkGeneration: true,
      advancedExport: true,
      prioritySupport: true,
      downloadFormats: ['PNG', 'JPG'],
      pdfExport: true,
    },
  },
];

export const getPlanById = (planId: string): Plan | null => {
  return PLANS.find(plan => plan.id === planId) || null;
};

export const getPlanByName = (planName: string): Plan | null => {
  return PLANS.find(plan => plan.name.toLowerCase() === planName.toLowerCase()) || null;
};

export const getQuotaForPlan = (planName: string): number => {
  const plan = getPlanByName(planName);
  return plan?.features.qrCodes || 30; // Default to Free plan quota
};

export const getHistoryStorageForPlan = (planName: string): number => {
  const plan = getPlanByName(planName);
  return plan?.features.historyStorage || 30; // Default to Free plan storage
};

export const getCollectionLimitForPlan = (planName: string): number => {
  const plan = getPlanByName(planName);
  return plan?.features.collections || 1; // Default to Free plan collections
};

export const canAccessBulkGeneration = (planName: string): boolean => {
  // Now available to all users
  return true;
};

export const canAccessAdvancedExport = (planName: string): boolean => {
  // Now available to all users
  return true;
};

export const canAccessCollections = (planName: string): boolean => {
  const plan = getPlanByName(planName);
  return (plan?.features.collections || 0) > 0;
};

export const canAccessHistory = (planName: string): boolean => {
  const plan = getPlanByName(planName);
  return (plan?.features.historyStorage || 0) > 0;
};

export const hasPrioritySupport = (planName: string): boolean => {
  const plan = getPlanByName(planName);
  return plan?.features.prioritySupport || false;
};

// Plan upgrade/downgrade logic
export const getUpgradePath = (currentPlan: string): Plan[] => {
  const currentPlanIndex = PLANS.findIndex(plan => plan.name.toLowerCase() === currentPlan.toLowerCase());
  if (currentPlanIndex === -1) return PLANS;
  return PLANS.slice(currentPlanIndex + 1);
};

export const getDowngradePath = (currentPlan: string): Plan[] => {
  const currentPlanIndex = PLANS.findIndex(plan => plan.name.toLowerCase() === currentPlan.toLowerCase());
  if (currentPlanIndex === -1) return [];
  return PLANS.slice(0, currentPlanIndex);
};

// Feature comparison utilities
export const compareFeatures = (planA: string, planB: string): { [key: string]: 'upgrade' | 'downgrade' | 'same' } => {
  const planAData = getPlanByName(planA);
  const planBData = getPlanByName(planB);
  
  if (!planAData || !planBData) return {};

  return {
    qrCodes: planBData.features.qrCodes > planAData.features.qrCodes ? 'upgrade' : 
             planBData.features.qrCodes < planAData.features.qrCodes ? 'downgrade' : 'same',
    historyStorage: planBData.features.historyStorage > planAData.features.historyStorage ? 'upgrade' : 
                   planBData.features.historyStorage < planAData.features.historyStorage ? 'downgrade' : 'same',
    collections: planBData.features.collections > planAData.features.collections ? 'upgrade' : 
                planBData.features.collections < planAData.features.collections ? 'downgrade' : 'same',
    bulkGeneration: planBData.features.bulkGeneration && !planAData.features.bulkGeneration ? 'upgrade' :
                   !planBData.features.bulkGeneration && planAData.features.bulkGeneration ? 'downgrade' : 'same',
    advancedExport: planBData.features.advancedExport && !planAData.features.advancedExport ? 'upgrade' :
                   !planBData.features.advancedExport && planAData.features.advancedExport ? 'downgrade' : 'same',
  };
};
