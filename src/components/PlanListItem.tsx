import React from "react";
import { CheckCircle, Star } from "lucide-react";
import { Plan } from "../utils/planConfig";
import { getPlanButtonConfig, getButtonStyles } from "../utils/planButtonLogic";

interface PlanListItemProps {
  plan: Plan;
  isActive?: boolean;
  currentPlan: string;
  onChoosePlan: (planName: string) => void;
  onUpgradePlan: (planName: string) => void;
  showStatus?: boolean;
  statusMessage?: string;
}

const PlanListItem: React.FC<PlanListItemProps> = ({
  plan,
  isActive = false,
  currentPlan,
  onChoosePlan,
  onUpgradePlan,
  showStatus,
  statusMessage,
}) => {
  const buttonConfig = getPlanButtonConfig(
    plan.name,
    currentPlan,
    onChoosePlan,
    onUpgradePlan
  );

  if (buttonConfig.action === "hidden") return null;

  const features: string[] = [];
  if (plan.name === "Free") {
    features.push(`${plan.features.qrCodes} QR codes on sign up only`);
  } else {
    features.push(`${plan.features.qrCodes} QR codes`);
  }
  features.push(`QR History (${plan.features.historyStorage} stored)`);
  features.push("Download PNG & JPG, Export PDF");
  features.push(
    plan.features.collections === 1
      ? "1 Collection"
      : `${plan.features.collections} Collections`
  );
  if (plan.features.bulkGeneration) features.push("Bulk QR Generation");
  if (plan.features.advancedExport) features.push("Advanced Export");
  features.push(
    plan.features.prioritySupport ? "Priority + Email Support" : "Email Support"
  );

  return (
    <div
      className={`flex flex-col md:flex-row md:items-center md:justify-between gap-6 p-6 rounded-xl border ${
        isActive
          ? "border-green-500 bg-green-50"
          : plan.popular
          ? "border-blue-500 bg-blue-50"
          : "border-gray-200 bg-white"
      }`}
    >
      {/* Left: Plan Info */}
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2">
          <h3 className="text-xl font-semibold">{plan.name}</h3>
          {plan.popular && (
            <span className="flex items-center gap-1 text-blue-600 text-xs font-medium bg-blue-100 px-2 py-0.5 rounded-full">
              <Star className="w-3 h-3" /> Most Popular
            </span>
          )}
          {isActive && (
            <span className="flex items-center gap-1 text-green-600 text-xs font-medium bg-green-100 px-2 py-0.5 rounded-full">
              Active
            </span>
          )}
        </div>
        <p className="text-gray-600 text-sm mb-3">{plan.description}</p>
        <div className="text-lg font-bold text-gray-900">
          {plan.price === 0 ? "Free" : `₹${plan.price}/${plan.period}`}
        </div>

        {showStatus && statusMessage && (
          <p className="mt-2 text-sm text-blue-700 bg-blue-50 px-3 py-2 rounded-lg">
            {statusMessage}
          </p>
        )}

        {/* Features as compact inline list */}
        <ul className="mt-4 space-y-2">
          {features.map((f, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
              {f}
            </li>
          ))}
        </ul>
      </div>

      {/* Right: Action */}
      <div className="flex-shrink-0">
        <button
          onClick={buttonConfig.onClick}
          disabled={buttonConfig.disabled}
          className={getButtonStyles(buttonConfig, plan.popular)}
        >
          {buttonConfig.text}
        </button>
      </div>
    </div>
  );
};

export default PlanListItem;
