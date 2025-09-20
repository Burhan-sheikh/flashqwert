import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/solid";
import { Dialog } from "@headlessui/react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { db } from "../firebase/firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { FiMail } from "react-icons/fi";
import { ChevronDown, ChevronUp } from "lucide-react";
import MyPlan from "../components/MyPlan";
import SignUpModal from "../components/SignUpModal";
import * as PhosphorIcons from "@phosphor-icons/react";
import { PLANS, getPlanByName } from "../utils/planConfig";
import PlanListItem from "../components/PlanListItem";
import { useConfirmation } from '../hooks/useConfirmation';
import ConfirmationAlert from '../components/ConfirmationAlert';

const PlansAndPricing = () => {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paymentProof, setPaymentProof] = useState(null);
  const [transactionId, setTransactionId] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeSubscriptionPlan, setActiveSubscriptionPlan] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedPlan, setExpandedPlan] = useState(null);
  const modalRef = useRef(null);
  const [activeFAQ, setActiveFAQ] = useState(null);
  const transactionIdInputRef = useRef(null);
  const paymentProofInputRef = useRef(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsError, setTermsError] = useState("");
  const [proofStatuses, setProofStatuses] = useState({});
  const [showFailureMessage, setShowFailureMessage] = useState({});
  const [formErrors, setFormErrors] = useState({
    paymentProof: false,
  });
  const [showResubmitForm, setShowResubmitForm] = useState({});
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);
  const [postSignupAction, setPostSignupAction] = useState(null);
  const [showUpgradeConfirmation, setShowUpgradeConfirmation] = useState(false);
  const [pendingUpgradePlan, setPendingUpgradePlan] = useState(null);

    // Custom Hook for Confirmation Dialog
    const { confirm } = useConfirmation(); // Destructure the confirm function from the hook


  // Payment QR codes for each plan
  const paymentQRCodes = {
    Basic: "https://res.cloudinary.com/dlesei0kn/image/upload/v1750747123/GooglePay_QRbasic_yl0ahx.png",
    Standard: "https://res.cloudinary.com/dlesei0kn/image/upload/v1750747124/GooglePay_QR_1_standard_t7zcyb.png",
    Premium: "https://res.cloudinary.com/dlesei0kn/image/upload/v1750747124/GooglePay_QR_2_premium_vkbnrk.png",
  };

  const faqs = [
    {
      question: "How do I pay for a subscription?",
      answer:
        "You can pay via UPI to our official account: flashqr.app@oksbi. After making the payment, submit a clear, unedited screenshot of the transaction. Our team will manually verify it within 24 hours before activating your subscription.",
    },
    {
      question: "What happens after I submit my payment proof?",
      answer:
        "Here's how it works:\n\n1. You pay via UPI\n2. You upload a clear screenshot\n3. Our team verifies it within 24 hours\n4. Your subscription is activated once verified",
    },
    {
      question: "How often can I generate QR codes on a paid plan?",
      answer:
        "You can generate up to your plan's quota of QR codes each month (300 for Basic, 900 for Standard, and 1500 for Premium).",
    },
    {
      question:
        "What happens to my QR code history and collections after my subscription ends?",
      answer:
        "After your subscription ends, your account reverts to the Free plan. You'll retain access to the QR codes you generated during your subscription. However, the ability to re-download previously generated QR codes from your profile is a Standard feature and managing collections is a Premium feature. If you downgrade from Standard or Premium, these features will no longer be available until you resubscribe to a qualifying plan.",
    },
  ];

  // Fetch subscription plan
  useEffect(() => {
    const fetchSubscriptionPlan = async () => {
      if (!user) {
        setActiveSubscriptionPlan("");
        return;
      }
      try {
        const docSnap = await getDoc(doc(db, "users", user.uid));
        if (docSnap.exists()) {
          setActiveSubscriptionPlan(docSnap.data().subscriptionPlan || "");
        } else {
          setActiveSubscriptionPlan("");
        }
      } catch {
        setActiveSubscriptionPlan("");
      }
    };
    if (user && !authLoading) fetchSubscriptionPlan();
    else setActiveSubscriptionPlan("");
  }, [user, authLoading]);

  // Fetch payment proofs
  useEffect(() => {
    if (!user) return;
    const checkProofStatuses = async () => {
      try {
        const q = query(
          collection(db, "paymentProofs"),
          where("userId", "==", user.uid)
        );
        const snapshot = await getDocs(q);
        const statuses = {};
        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          const planName = data.planName;
          const status = data.status;
          const submittedAt = data.createdAt?.toDate();
          if (
            !statuses[planName] ||
            (submittedAt && submittedAt > statuses[planName]?.submittedAt)
          ) {
            statuses[planName] = {
              status,
              submittedAt,
              docId: doc.id,
            };
          }
        });
        setProofStatuses(statuses);
      } catch {}
    };
    checkProofStatuses();
  }, [user]);

  const isProofExpired = (submittedAt) => {
    if (!submittedAt) return false;
    const now = new Date();
    return now - submittedAt > 24 * 60 * 60 * 1000;
  };

  const getPlanStatus = (planName) => {
    const proofStatus = proofStatuses[planName];
    if (!proofStatus) return "none";
    const { status, submittedAt } = proofStatus;
    if (status === "approved") return "approved";
    if (status === "rejected") return "rejected";
    if (status === "pending") {
      if (isProofExpired(submittedAt)) return "expired";
      return "submitted";
    }
    return "none";
  };

  useEffect(() => {
    const checkFailureMessages = () => {
      const newFailure = {};
      Object.keys(proofStatuses).forEach((planName) => {
        const status = getPlanStatus(planName);
        if (status === "expired" || status === "rejected") {
          newFailure[planName] = true;
        }
      });
      setShowFailureMessage(newFailure);
    };
    checkFailureMessages();
  }, [proofStatuses]);

  // Dismiss action: resets message & allow resubmit
  const handleDismissFailure = async (planName) => {
    const proofStatus = proofStatuses[planName];
    if (proofStatus && proofStatus.docId) {
      try {
        await deleteDoc(doc(db, "paymentProofs", proofStatus.docId));
        toast.success("Message dismissed.");
        const updatedProofStatuses = { ...proofStatuses };
        delete updatedProofStatuses[planName];
        setProofStatuses(updatedProofStatuses);
        setShowFailureMessage((prev) => ({ ...prev, [planName]: false }));
        setShowResubmitForm((prev) => ({ ...prev, [planName]: false }));
      } catch {
        toast.error("Failed. Please try again.");
      }
    }
  };

  // Show resubmit proof modal (but keep failure message until submitted or dismissed)
  const handleResubmit = (planName) => {
    setShowResubmitForm((prev) => ({ ...prev, [planName]: true }));
    // Open payment proof modal for this plan
    setSelectedPlan(planName);
    setIsModalOpen(true);
  };

    // Confirmation Alert
    const handleUpgradePlan = (planName) => {
      setPendingUpgradePlan(planName);
      setShowUpgradeConfirmation(true);
    };

    const confirmUpgrade = () => {
      setShowUpgradeConfirmation(false);
      if (pendingUpgradePlan) {
        setSelectedPlan(pendingUpgradePlan);
        setIsModalOpen(true);
        setPendingUpgradePlan(null);
      }
    };

    const cancelUpgrade = () => {
      setShowUpgradeConfirmation(false);
      setPendingUpgradePlan(null);
    };

  // Same 'choose plan' for new submission
  const handleChoosePlan = (planName) => {
    if (!user) {
      setPostSignupAction(() => () => openPlanModal(planName));
      setIsSignUpModalOpen(true);
      return;
    }
    if (isPlanDisabled(planName)) return;
    openPlanModal(planName);
  };
  const openPlanModal = (planName) => {
    setSelectedPlan(planName);
    setIsModalOpen(true);
  };

  // Payment proof file change
  const handlePaymentProofChange = (e) => {
    const file = e.target.files[0];
    if (file && file.size > 700 * 1024) {
      toast.error("File size should be less than 700KB.");
      setPaymentProof(null);
      e.target.value = null;
      setFormErrors((prev) => ({ ...prev, paymentProof: true }));
      return;
    }
    setPaymentProof(file);
    setFormErrors((prev) => ({ ...prev, paymentProof: false }));
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors = { paymentProof: false, termsAccepted: false };
    if (!paymentProof) {
      newErrors.paymentProof = true;
      isValid = false;
      paymentProofInputRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    if (!termsAccepted) {
      setTermsError("You must accept the terms and conditions and privacy policy.");
      isValid = false;
    } else {
      setTermsError("");
    }
    setFormErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error("Please correct the errors.");
      return;
    }
    if (!user) {
      toast.error("You must be logged in to submit payment proof.");
      navigate("/login");
      return;
    }
    setIsSubmitting(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(paymentProof);
      reader.onload = async () => {
        const base64String = reader.result;
        try {
          await addDoc(collection(db, "paymentProofs"), {
            userId: user.uid,
            userEmail: user.email,
            planName: selectedPlan,
            price: getPlanByName(selectedPlan)?.price || 0,
            transactionId: transactionId || null,
            proofImageBase64: base64String,
            status: "pending",
            createdAt: serverTimestamp(),
          });
          toast.success(
            "Payment proof submitted! Your plan will be activated within 24 hours.",
          );
          setIsModalOpen(false);
          setSelectedPlan(null);
          setPaymentProof(null);
          setTransactionId("");
          setFormErrors({ paymentProof: false });
          setTermsAccepted(false);
          setTermsError("");
          setShowResubmitForm((prev) => ({ ...prev, [selectedPlan]: false }));

          // Refresh statuses
          const q = query(
            collection(db, "paymentProofs"),
            where("userId", "==", user.uid)
          );
          const snapshot = await getDocs(q);
          const statuses = {};
          snapshot.docs.forEach((doc) => {
            const data = doc.data();
            const planName = data.planName;
            const status = data.status;
            const submittedAt = data.createdAt?.toDate();
            if (
              !statuses[planName] ||
              (submittedAt && submittedAt > statuses[planName]?.submittedAt)
            ) {
              statuses[planName] = {
                status,
                submittedAt,
                docId: doc.id,
              };
            }
          });
          setProofStatuses(statuses);
        } catch {
          toast.error(
            "Failed to submit payment proof. Please try again or contact support."
          );
        }
      };
      reader.onerror = () =>
        toast.error("Failed to process image file. Please try another file.");
    } catch {
      toast.error("An unexpected error occurred. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePlan = (planName) => {
    setExpandedPlan(expandedPlan === planName ? null : planName);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPlan(null);
    setFormErrors({ paymentProof: false });
    setTransactionId("");
    setPaymentProof(null);
    setTermsAccepted(false);
    setTermsError("");
  };

  const handleSignUpSuccess = () => {
    setIsSignUpModalOpen(false);
    if (postSignupAction) {
      postSignupAction();
      setPostSignupAction(null);
    }
  };

  // Open modal if plan param is in URL
  useEffect(() => {
    if (!user || authLoading) return;
    const queryParams = new URLSearchParams(window.location.search);
    const planParam = queryParams.get("plan");
    if (planParam && ["Basic", "Standard", "Premium"].includes(planParam)) {
      openPlanModal(planParam);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [user, authLoading]);

  // --- Custom Status message component ---
  const renderStatusMessage = (planName) => {
    const planStatus = getPlanStatus(planName);

    // Show Thank You (submitted)
    if (planStatus === "submitted") {
      return (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg text-sm mb-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-600 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="font-medium">Thank you!</p>
              <p className="mt-1">
                Your payment proof has been submitted and is being reviewed. Please allow up to 24 hours for verification.
              </p>
            </div>
          </div>
        </div>
      );
    }

    // Show "Payment Issue" (expired/rejected): has both "Resubmit" and "Dismiss"
    if ((planStatus === "rejected" || planStatus === "expired") && showFailureMessage[planName]) {
      return (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm mb-4">
          <div className="flex justify-between items-start">
            <div className="flex items-start">
              <div className="ml-3">
                <p className="font-medium">Payment Issue</p>
                <p className="mt-1">
                  {planStatus === "rejected"
                    ? "Your payment proof was rejected. Please review and resubmit or contact support."
                    : "Payment verification timed out. Please resubmit or contact support."}
                </p>
                <div className="mt-2">
                  <p className="flex items-center">
                    📧 Contact:
                    <a
                      href="mailto:contact.flashqr@gmail.com"
                      className="ml-1 text-red-700 hover:text-red-900 underline"
                    >
                      contact.flashqr@gmail.com
                    </a>
                  </p>
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => handleResubmit(planName)}
                      className="bg-blue-600 text-white px-4 rounded focus:outline-none hover:bg-blue-700"
                    >
                      Resubmit
                    </button>
                    <button
                      onClick={() => handleDismissFailure(planName)}
                      className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 rounded focus:outline-none"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Helper function for Free plan features
  const formatFeatureList = (plan) => {
    const features = [];

    if (plan.name === 'Free') {
      features.push(`${plan.features.qrCodes} QR codes on sign up only`);
    } else {
      features.push(`${plan.features.qrCodes} QR codes`);
    }

    features.push(`Access to QR Code History (${plan.features.historyStorage} codes storage)`);
    features.push('Download in PNG & JPG formats');
    features.push('PDF export with metadata');

    if (plan.features.collections === 1) {
      features.push('Create 1 Collection');
    } else {
      features.push(`Create up to ${plan.features.collections} Collections`);
    }

    if (plan.features.bulkGeneration) {
      features.push('Bulk QR Code Generation');
    }

    if (plan.features.advancedExport) {
      features.push('Advanced Collection Export');
    }

    if (plan.features.prioritySupport) {
      features.push('Email support + Priority support');
    } else {
      features.push('Email support');
    }

    return features;
  };

  // --- MAIN RENDER ---
  return (
    <div className="min-h-screen font-sans relative">
      <ToastContainer
        position="bottom-center"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        toastClassName="!bg-white !text-gray-800 !shadow-lg !border !border-gray-200"
        bodyClassName="!text-gray-800"
        progressClassName="!bg-green-500"
        style={{
          zIndex: 99999,
          bottom: "20px",
        }}
      />

      {user && !authLoading && <MyPlan />}

      <div className="mt-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4 bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600"
          >
            Available Plans
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mt-3 text-base text-gray-500 sm:mt-5"
          >
            Choose a plan that fits your needs. Upgrade via UPI and upload payment proof for manual activation.
          </motion.p>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-12">
  <div className="space-y-6 divide-y divide-gray-200">
    {PLANS.filter(plan => plan.name !== 'Free').map((plan) => (
      <div key={plan.name} className="pt-6 first:pt-0">
        {renderStatusMessage(plan.name)}
        <PlanListItem
          plan={plan}
          isActive={plan.name === activeSubscriptionPlan}
          currentPlan={activeSubscriptionPlan}
          onChoosePlan={handleChoosePlan}
          onUpgradePlan={handleUpgradePlan}
          showStatus={true}
        />
      </div>
    ))}
  </div>
</div>


      {/* Upgrade Confirmation Alert */}
      <ConfirmationAlert
isOpen={showUpgradeConfirmation}
onClose={cancelUpgrade}
onConfirm={confirmUpgrade}
title="Confirm Upgrade"
message={`Upgrading to the ${pendingUpgradePlan} plan will start a new 30-day cycle. Any remaining days on your current plan will not carry over, but your unused quotas will be added to your new plan. Do you want to continue?`}
confirmText="Upgrade Now"
cancelText="Cancel"
type="info"
/>

      <AnimatePresence>
        {isModalOpen && (
          <Dialog
            open={isModalOpen}
            onClose={handleCloseModal}
            className="relative z-50"
            initialFocus={paymentProofInputRef}
          >
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-sm"
              aria-hidden="true"
            />
            <div className="fixed inset-0 flex items-center justify-center p-4">
              <Dialog.Panel
                as={motion.div}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="bg-white rounded-2xl shadow-xl max-w-sm w-full overflow-hidden flex flex-col"
                style={{ maxHeight: "80vh" }}
                ref={modalRef}
              >
                <div className="p-5 overflow-y-auto flex-grow">
                  <div className="flex justify-between items-center mb-3">
                    <Dialog.Title className="text-lg font-bold text-gray-900">
                      Payment for {selectedPlan} Plan
                    </Dialog.Title>
                    <button
                      onClick={handleCloseModal}
                      className="text-gray-400 hover:text-gray-500 rounded-full focus:outline-none focus:ring-2 focus:ring-gray-200"
                    >
                      <XCircleIcon className="h-6 w-6" />
                    </button>
                  </div>

                  <div className="mb-4">
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-300">
                      <div className="text-sm font-medium text-gray-700">
                        Pay ₹{getPlanByName(selectedPlan)?.price} via UPI
                      </div>
                      <div className="mb-1 text-xs text-gray-500">
                        UPI: <span className="font-semibold">flashqr.app@oksbi</span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(
                              "flashqr.app@oksbi"
                            );
                            toast.success("UPI ID copied!");
                          }}
                          className="ml-2 text-blue-600 hover:text-blue-800 focus:outline-none"
                        >
                          <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                            />
                          </svg>
                        </button>
                      </div>
                      <img
                        src={
                          paymentQRCodes[selectedPlan]
                        }
                        alt={`${selectedPlan} Plan QR Code`}
                        className="w-28 h-28 rounded-md mx-auto mt-2"
                      />
                      <div className="mt-2 text-xs text-gray-600">
                        After paying, upload screenshot below.
                      </div>
                    </div>
                  </div>

                  {/* Transaction ID */}
                  <input
                    type="text"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    className="w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 mb-2"
                    placeholder="UPI transaction ID (optional)"
                    ref={transactionIdInputRef}
                  />

                  {/* Proof upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Screenshot <span className="text-red-500">*</span>
                    </label>
                    <div
                      className={`flex flex-col items-center justify-center px-4 pt-3 pb-4 border-2 ${
                        formErrors.paymentProof
                          ? "border-red-500"
                          : "border-gray-300"
                      } border-dashed rounded-md`}
                      ref={paymentProofInputRef}
                      style={{
                        borderStyle: "dashed", // to force dashed border in case style is getting overridden elsewhere
                      }}
                    >
                      {paymentProof ? (
                        <div className="flex flex-col items-center">
                          <img
                            src={URL.createObjectURL(paymentProof)}
                            alt="Payment proof preview"
                            className="h-24 object-contain mb-1 rounded-md"
                          />
                          <button
                            onClick={() => setPaymentProof(null)}
                            className="text-xs text-red-600 hover:text-red-800 focus:outline-none"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <>
                          <label
                            htmlFor="paymentProof"
                            className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none text-sm"
                          >
                            <span>Upload file</span>
                            <input
                              id="paymentProof"
                              name="paymentProof"
                              type="file"
                              accept="image/*"
                              className="sr-only"
                              onChange={handlePaymentProofChange}
                            />
                          </label>
                          <p className="text-xs text-gray-400 mt-1">
                            PNG/JPG up to 700KB
                          </p>
                        </>
                      )}
                    </div>
                    {formErrors.paymentProof && (
                      <p className="mt-1 text-sm text-red-500 text-center">
                        Screenshot required
                      </p>
                    )}
                  </div>

                  {/* Terms */}
                  <div className="mt-2">
                    <div className="flex items-center">
                      <input
                        id="termsAccepted"
                        name="termsAccepted"
                        type="checkbox"
                        className={`h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 ${
                          termsError ? "ring-red-500 border-red-500" : ""
                        }`}
                        checked={termsAccepted}
                        onChange={(e) => setTermsAccepted(e.target.checked)}
                      />
                      <label
                        htmlFor="termsAccepted"
                        className="ml-2 block text-xs text-gray-900"
                      >
                        I agree to the{" "}
                        <Link to="/terms" className="text-blue-600 hover:text-blue-800">
                          terms
                        </Link>
                        {" & "}
                        <Link to="/privacy" className="text-blue-600 hover:text-blue-800">
                          privacy policy
                        </Link>
                        .
                      </label>
                    </div>
                    {termsError && (
                      <p className="mt-1 text-xs text-red-500">{termsError}</p>
                    )}
                  </div>
                </div>
                <div className="px-5 py-3 border-t border-gray-200 flex justify-end gap-3">
                  <button
                    type="button"
                    className="px-4 py-2 border border-gray-300 rounded-md text-xs font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
                    onClick={handleCloseModal}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2 bg-blue-600 rounded-md text-xs font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleSubmit}
                    disabled={isSubmitting || formErrors.paymentProof || !termsAccepted}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center">
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Submitting...
                      </span>
                    ) : (
                      "Submit Proof"
                    )}
                  </button>
                </div>
              </Dialog.Panel>
            </div>
          </Dialog>
        )}
      </AnimatePresence>

      {/* Sign Up Modal */}
      <SignUpModal
        isOpen={isSignUpModalOpen}
        onClose={() => setIsSignUpModalOpen(false)}
        onSuccess={handleSignUpSuccess}
      />



      {/* FAQ Section */}
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Frequently Asked Questions
          </h2>
          <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
            Find answers to common questions about our plans and services
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          {faqs.map((faq, index) => (
            <div key={index} className="border-b border-gray-200 last:border-b-0">
              <button
                                onClick={() => setActiveFAQ(                activeFAQ === index ? null : index)}
                className="flex justify-between items-center py-4 w-full text-left focus:outline-none"
              >
                <h3 className="text-lg font-medium text-gray-900">
                  {faq.question}
                </h3>
                {activeFAQ === index ? (
                  <ChevronUp className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-500" />
                )}
              </button>
              <AnimatePresence>
                {activeFAQ === index && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="pb-6">
                      <p className="text-gray-600">{faq.answer}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>

      {/* Help Section */}
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Need Help Deciding?
            </h2>
            <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
              Our team is here to help you choose the right plan
            </p>
          </div>
          <div className="mt-10 grid gap-8 md:grid-cols-1">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-md bg-blue-100 text-blue-600 mb-4">
                <FiMail className="h-6 w-6" />
              </div>
              <h3 className="text-base font-medium text-gray-900 mb-2">
                Email Support
              </h3>
              <p className="text-gray-500 text-sm">Get answers within 24 hours</p>
              <a
                href="mailto:contact.flashqr@gmail.com"
                className="text-blue-600 hover:text-blue-800 font-medium text-sm"
              >
                contact.flashqr@gmail.com
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlansAndPricing;
