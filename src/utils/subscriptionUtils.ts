// home/project/src/utils/subscriptionUtils.ts
import {
  getQuotaForPlan,
  getHistoryStorageForPlan,
  getCollectionLimitForPlan,
  canAccessBulkGeneration,
  canAccessAdvancedExport,
  canAccessHistory,
  canAccessCollections,
  hasPrioritySupport,
  getPlanByName,
  PLANS,
} from './planConfig';

// ---------- Types ----------
export interface SubscriptionStatus {
  isActive: boolean;
  isExpired: boolean;
  daysRemaining: number; // 0 when no expiry or already expired
  planName: string;      // falls back to "Free" when expired
  features: {
    qrCodes: number;
    historyStorage: number;
    collections: number;
    bulkGeneration: boolean;
    advancedExport: boolean;
    prioritySupport: boolean;
    canAccessHistory: boolean;
    canAccessCollections: boolean;
  };
}

type RequiredFeature = 'history' | 'collections' | 'bulk' | 'advanced';

export interface UsageSnapshot {
  qrCodes?: number;        // generated in current cycle
  historyUsed?: number;    // count stored in history
  collectionsUsed?: number;
  needsBulk?: boolean;
  needsAdvanced?: boolean;
}

// ---------- Helpers ----------
const normalize = (s: string) => s.trim().toLowerCase();

const msPerDay = 1000 * 60 * 60 * 24;

const addMonths = (date: Date, months: number) => {
  const d = new Date(date);
  const day = d.getDate();
  d.setMonth(d.getMonth() + months);

  // Handle month rollover (e.g., Jan 31 -> Feb 28)
  if (d.getDate() < day) d.setDate(0);
  return d;
};

const getPlanIndex = (planName: string) =>
  PLANS.findIndex(p => normalize(p.name) === normalize(planName));

const getEffectivePlanName = (planName: string, isExpired: boolean) =>
  isExpired ? 'Free' : planName;

const getFeatureLabel = (f: RequiredFeature) => {
  switch (f) {
    case 'history': return 'QR Code History';
    case 'collections': return 'Collections';
    case 'bulk': return 'Bulk Generation';
    case 'advanced': return 'Advanced Export features';
  }
};

const getNumericFeatureKey = (f: RequiredFeature): 'historyStorage' | 'collections' | null => {
  if (f === 'history') return 'historyStorage';
  if (f === 'collections') return 'collections';
  return null;
};

const getBooleanFeatureKey = (f: RequiredFeature): 'bulkGeneration' | 'advancedExport' | null => {
  if (f === 'bulk') return 'bulkGeneration';
  if (f === 'advanced') return 'advancedExport';
  return null;
};

const findNextPlanWithHigherNumericFeature = (
  currentPlanName: string,
  featureKey: 'historyStorage' | 'collections'
) => {
  const idx = getPlanIndex(currentPlanName);
  if (idx === -1) return null;

  const current = PLANS[idx];
  for (let i = idx + 1; i < PLANS.length; i++) {
    const p = PLANS[i];
    if ((p.features as any)[featureKey] > (current.features as any)[featureKey]) {
      return p;
    }
  }
  return null;
};

const findFirstPlanWithBooleanFeature = (
  featureKey: 'bulkGeneration' | 'advancedExport'
) => {
  return PLANS.find(p => (p.features as any)[featureKey]) || null;
};

// ---------- Core: Subscription status ----------
export const getSubscriptionStatus = (
  planName: string,
  subscriptionExpiry: string | null
): SubscriptionStatus => {
  const now = new Date();
  const expiryDate = subscriptionExpiry ? new Date(subscriptionExpiry) : null;
  const isExpired = expiryDate ? now > expiryDate : false;

  // Free plan is always active; paid is active unless expired
  const isActive = normalize(planName) === 'free' ? true : !isExpired;

  // Days remaining: never negative, 0 when no expiry or expired
  const daysRemaining = expiryDate
    ? Math.max(0, Math.ceil((expiryDate.getTime() - now.getTime()) / msPerDay))
    : 0;

  const effectivePlan = getEffectivePlanName(planName, isExpired);

  return {
    isActive,
    isExpired,
    daysRemaining,
    planName: effectivePlan,
    features: {
      qrCodes: getQuotaForPlan(effectivePlan),
      historyStorage: getHistoryStorageForPlan(effectivePlan),
      collections: getCollectionLimitForPlan(effectivePlan),
      bulkGeneration: canAccessBulkGeneration(effectivePlan),
      advancedExport: canAccessAdvancedExport(effectivePlan),
      prioritySupport: hasPrioritySupport(effectivePlan),
      canAccessHistory: canAccessHistory(effectivePlan),
      canAccessCollections: canAccessCollections(effectivePlan),
    },
  };
};

// ---------- Upgrade prompts ----------
/**
 * Original simple gate check (kept for backward compatibility).
 * Use `shouldShowUpgradePromptWithUsage` to be usage-aware.
 */
export const shouldShowUpgradePrompt = (
  currentPlan: string,
  requiredFeature: RequiredFeature
): boolean => {
  switch (requiredFeature) {
    case 'history':
      return !canAccessHistory(currentPlan);
    case 'collections':
      return !canAccessCollections(currentPlan);
    case 'bulk':
      return !canAccessBulkGeneration(currentPlan);
    case 'advanced':
      return !canAccessAdvancedExport(currentPlan);
    default:
      return false;
  }
};

/**
 * Usage-aware prompt: asks for upgrade when the user
 * is at/over their plan limit or needs a locked feature.
 */
export const shouldShowUpgradePromptWithUsage = (
  currentPlan: string,
  usage: UsageSnapshot
): { show: boolean; reason?: string } => {
  const plan = getPlanByName(currentPlan);
  if (!plan) return { show: false };

  if (usage.needsBulk && !plan.features.bulkGeneration) {
    return { show: true, reason: 'Bulk generation is locked on your plan.' };
  }
  if (usage.needsAdvanced && !plan.features.advancedExport) {
    return { show: true, reason: 'Advanced export is locked on your plan.' };
  }

  if (typeof usage.historyUsed === 'number' && usage.historyUsed >= plan.features.historyStorage) {
    return { show: true, reason: `History storage limit reached (${plan.features.historyStorage}).` };
  }

  if (typeof usage.collectionsUsed === 'number' && usage.collectionsUsed >= plan.features.collections) {
    return { show: true, reason: `Collections limit reached (${plan.features.collections}).` };
  }

  return { show: false };
};

/**
 * Dynamic, context-aware upgrade message.
 * For numeric features (history/collections) it shows current limit and the next plan's limit.
 * For locked features (bulk/advanced) it shows the first plan that unlocks it.
 */
export const getUpgradeMessage = (
  currentPlan: string,
  requiredFeature: RequiredFeature
): string => {
  const plan = getPlanByName(currentPlan);
  if (!plan) return 'Unknown plan';

  const numericKey = getNumericFeatureKey(requiredFeature);
  if (numericKey) {
    const currentValue = (plan.features as any)[numericKey] as number;

    if (currentValue > 0) {
      const nextPlan = findNextPlanWithHigherNumericFeature(plan.name, numericKey);
      if (nextPlan) {
        const nextValue = (nextPlan.features as any)[numericKey] as number;
        return `${getFeatureLabel(requiredFeature)} limit reached. Upgrade to ${nextPlan.name} to manage up to ${nextValue}.`;
      }
      return `${getFeatureLabel(requiredFeature)} limit reached. Free up space or contact support.`;
    }

    const firstPlan = PLANS.find(p => (p.features as any)[numericKey] > 0);
    return firstPlan
      ? `${getFeatureLabel(requiredFeature)} is available on the ${firstPlan.name} plan.`
      : `${getFeatureLabel(requiredFeature)} is not available on any plan.`;
  }

  const booleanKey = getBooleanFeatureKey(requiredFeature);
  if (booleanKey) {
    if ((plan.features as any)[booleanKey]) {
      return `You already have ${getFeatureLabel(requiredFeature)}.`;
    }
    const first = findFirstPlanWithBooleanFeature(booleanKey);
    return first
      ? `${getFeatureLabel(requiredFeature)} is available on the ${first.name} plan.`
      : `${getFeatureLabel(requiredFeature)} is not available on any plan.`;
  }

  return 'Upgrade your plan to unlock this feature.';
};



// ---------- Quota usage ----------
export const calculateQuotaUsage = (
  usedCount: number,
  totalQuota: number
): {
  used: number;
  remaining: number;
  percentage: number;
  isLow: boolean;
  isCritical: boolean;
} => {
  const used = Math.max(0, usedCount);
  const remaining = Math.max(0, totalQuota - used);
  const percentage = totalQuota > 0 ? (used / totalQuota) * 100 : 0;

  return {
    used,
    remaining,
    percentage,
    isLow: percentage >= 80,
    isCritical: percentage >= 95,
  };
};

// ---------- Plan recommendation ----------
export const getRecommendedPlan = (currentUsage: {
  qrCodes: number;
  collections: number;
  needsBulk: boolean;
  needsAdvanced: boolean;
}): string => {
  if (currentUsage.needsBulk || currentUsage.needsAdvanced) return 'Premium';

  // Match your planConfig thresholds exactly (inclusive upper bounds)
  if (currentUsage.qrCodes >= 901 || currentUsage.collections >= 31) return 'Premium';
  if (currentUsage.qrCodes >= 301 || currentUsage.collections >= 11) return 'Standard';
  if (currentUsage.qrCodes >= 31 || currentUsage.collections >= 2) return 'Basic';
  return 'Free';
};

// ---------- Billing cycle helpers ----------
/**
 * Given a subscription start date (ISO string) and optional "now",
 * returns the current cycle start and the next reset date (monthly period).
 * Free plan can pass its account creation date here if you also want "monthly" counters.
 */
export const getBillingCycleDates = (
  subscriptionStartISO: string,
  now: Date = new Date()
): { currentCycleStart: Date; nextReset: Date } => {
  const start = new Date(subscriptionStartISO);
  if (Number.isNaN(start.getTime())) throw new Error('Invalid subscriptionStart date');

  // months between start and now
  const monthsDiff = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  const cycleStart = addMonths(start, Math.max(0, monthsDiff));
  // If "now" is before the computed cycleStart (edge cases), step back a month
  const currentCycleStart = now >= cycleStart ? cycleStart : addMonths(cycleStart, -1);
  const nextReset = addMonths(currentCycleStart, 1);
  return { currentCycleStart, nextReset };
};

/** Days until cycle reset (ceil). Returns 0 if reset is today or past. */
export const getDaysUntilReset = (subscriptionStartISO: string, now: Date = new Date()): number => {
  const { nextReset } = getBillingCycleDates(subscriptionStartISO, now);
  return Math.max(0, Math.ceil((nextReset.getTime() - now.getTime()) / msPerDay));
};

/** Has the stored usage been reset since the current cycle started? */
export const shouldResetUsage = (
  lastUsageResetISO: string | null,
  subscriptionStartISO: string,
  now: Date = new Date()
): boolean => {
  const { currentCycleStart } = getBillingCycleDates(subscriptionStartISO, now);
  if (!lastUsageResetISO) return true; // never reset => reset now
  const last = new Date(lastUsageResetISO);
  return last < currentCycleStart;
};

// ---------- Validation helpers ----------
/** Quick check against current plan limits to block actions with clear reasons. */
export const validateUsageAgainstPlan = (
  planName: string,
  usage: UsageSnapshot
): { ok: boolean; reason?: string } => {
  const plan = getPlanByName(planName);
  if (!plan) return { ok: false, reason: 'Unknown plan' };

  if (usage.needsBulk && !plan.features.bulkGeneration) {
    return { ok: false, reason: 'Bulk generation is not available on your plan.' };
  }
  if (usage.needsAdvanced && !plan.features.advancedExport) {
    return { ok: false, reason: 'Advanced export is not available on your plan.' };
  }
  if (typeof usage.collectionsUsed === 'number' && usage.collectionsUsed >= plan.features.collections) {
    return { ok: false, reason: `You can create up to ${plan.features.collections} collection(s) on ${plan.name}.` };
  }
  // Note: historyUsed is a storage limit, not an action block unless you enforce it.
  if (typeof usage.historyUsed === 'number' && usage.historyUsed >= plan.features.historyStorage) {
    return { ok: false, reason: `Your history storage is full (${plan.features.historyStorage}).` };
  }

  return { ok: true };
};
