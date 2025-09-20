import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { PulseLoader } from "react-spinners";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  addDoc,
  serverTimestamp,
  orderBy,
} from "firebase/firestore";
import { CheckCircleIcon, XCircleIcon, ClockIcon, ExclamationTriangleIcon } from "@heroicons/react/24/solid";
import { Link, useNavigate } from "react-router-dom";
import { Dialog } from "@headlessui/react";
import { motion, AnimatePresence } from "framer-motion";
import * as PhosphorIcons from "@phosphor-icons/react";
// import { sendNotificationToUser } from '../utils/sendNotification'; // REMOVE THIS LINE
const Plan = {
  Free: "Free",
  Standard: "Standard",
  Premium: "Premium",
  Basic: "Basic",
};
const MyPlan = () => {
  const [planStatus, setPlanStatus] = useState("Pending");
  const [currentPlan, setCurrentPlan] = useState(null);
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [subscriptionExpiry, setSubscriptionExpiry] = useState(null);
  const [quota, setQuota] = useState(0);
  const [isExpired, setIsExpired] = useState(false);
  const [showBuyQuota, setShowBuyQuota] = useState(false);
  const [quotaToBuy, setQuotaToBuy] = useState("");
  const [totalPrice, setTotalPrice] = useState(0);
  const [paymentProofQuota, setPaymentProofQuota] = useState(null);
  const [transactionIdQuota, setTransactionIdQuota] = useState("");
  const [activePlans, setActivePlans] = useState([]);
  const navigate = useNavigate();
  const [isQuotaRequestPending, setIsQuotaRequestPending] = useState(false);
  // New state for payment requests tracking
  const [paymentRequests, setPaymentRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  // Validation state and error message
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsError, setTermsError] = useState("");
  // Disable background scroll when modal is open
  useEffect(() => {
    if (showBuyQuota) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showBuyQuota]);
  const subscriptionPlan = currentPlan;
  const totalQuotaValue = quota;

  // ADD THIS LINE:
  const [planPurchasedDate, setPlanPurchasedDate] = useState(null);

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          const expiry = userData.subscriptionExpiry || null;
          const planFromDb = userData.subscriptionPlan || null;
          //ADD THIS LINE
          const purchasedDate = userData.planPurchasedDate || null;

          setSubscriptionExpiry(expiry);
          setQuota(userData.quota || 0);
          setCurrentPlan(planFromDb);
          //ADD THIS LINE
          setPlanPurchasedDate(purchasedDate);

          if (expiry) {
            const expiryDate = new Date(expiry);
            const now = new Date();
            setIsExpired(expiryDate < now);
          } else {
            setIsExpired(false);
          }
          if (planFromDb) {
            setPlanStatus("Active");
          } else {
            setPlanStatus("NoPlan");
          }
        } else {
          setPlanStatus("NoPlan");
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching plan:", error);
        toast.error("Failed to fetch plan details.");
        setLoading(false);
      }
    };
    fetchPlan();
  }, [user]);
  // Fetch payment requests for the user (Quota only)
  const fetchPaymentRequests = useCallback(async () => {
    if (!user) return;
    setLoadingRequests(true);
    try {
      const q = query(
        collection(db, "paymentProofs"),
        where("userId", "==", user.uid),
        where("planName", "==", "Quota"), // Only fetch quota requests
        orderBy("createdAt", "desc")
      );
      const snapshot = await getDocs(q);
      const requests = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
      }));
      setPaymentRequests(requests);
    } catch (error) {
      console.error("Error fetching payment requests:", error);
      toast.error("Failed to fetch payment requests.");
    } finally {
      setLoadingRequests(false);
    }
  }, [user]);
  useEffect(() => {
    const fetchActivePlans = async () => {
      try {
        const q = query(
          collection(db, "paymentProofs"),
          where("status", "==", "approved"),
          where("userId", "==", user?.uid)
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const plans = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setActivePlans(plans);
        } else {
          setActivePlans([]);
        }
      } catch (error) {
        console.error("Error fetching active plans:", error);
        toast.error("Failed to fetch active plans.");
      }
    };
    const checkPendingQuota = async () => {
      const pending = await isQuotaPending();
      setIsQuotaRequestPending(pending);
    };
    if (user) {
      fetchActivePlans();
      checkPendingQuota();
      fetchPaymentRequests();
    }
  }, [user, fetchPaymentRequests]);
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  const handleBuyMoreQuota = () => {
    setShowBuyQuota(true);
  };
  const handleQuotaChange = (e) => {
    const value = e.target.value;
    setQuotaToBuy(value);
    setTotalPrice(value * 1);
  };
  const handlePaymentProofChangeQuota = (e) => {
    const file = e.target.files[0];
    if (file && file.size > 700 * 1024) {
      toast.error("File size should be less than 700KB.");
      setPaymentProofQuota(null);
      e.target.value = null;
      return;
    }
    setPaymentProofQuota(file);
  };
  const handleSubmitQuota = async () => {
    // Reset error message
    setTermsError("");
    if (!termsAccepted) {
      setTermsError("Please accept the terms and conditions, and privacy policy.");
      return;
    }
    if (!paymentProofQuota) {
      toast.error("Please upload payment proof screenshot.");
      return;
    }
    if (!user) {
      toast.error("You must be logged in to submit payment proof.");
      return;
    }
    setIsSubmitting(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(paymentProofQuota);
      reader.onload = async () => {
        const base64String = reader.result;
        await addDoc(collection(db, "paymentProofs"), {
          userId: user.uid,
          userEmail: user.email,
          planName: "Quota",
          quantity: quotaToBuy,
          price: totalPrice,
          transactionId: transactionIdQuota || null,
          proofImageBase64: base64String,
          status: "pending",
          createdAt: serverTimestamp(),
        });
        toast.success(
          "Payment proof submitted successfully!"
        );
        setShowBuyQuota(false);
        setQuotaToBuy("");
        setPaymentProofQuota(null);
        setTransactionIdQuota("");
        setIsQuotaRequestPending(true);
        fetchPaymentRequests(); // Refresh requests
        setTermsAccepted(false); // Reset the checkbox
      };
      reader.onerror = (error) => {
        console.error("Error reading file:", error);
        toast.error("Failed to read the image file.");
      };
    } catch (error) {
      console.error("Error submitting payment proof:", error);
      toast.error("Failed to submit payment proof. Please try again.");
    }
    setIsSubmitting(false);
  };
  const handleCloseModal = () => {
    setShowBuyQuota(false);
    setQuotaToBuy("");
    setTotalPrice(0);
    setPaymentProofQuota(null);
    setTransactionIdQuota("");
    setTermsAccepted(false);
    setTermsError("");
  };
  const isQuotaPending = async () => {
    if (!user) return false;
    const q = query(
      collection(db, "paymentProofs"),
      where("userId", "==", user.uid),
      where("planName", "==", "Quota"),
      where("status", "==", "pending")
    );
    try {
      const snapshot = await getDocs(q);
      return !snapshot.empty;
    } catch (error) {
      console.error("Error checking for pending quota request: ", error);
      return false;
    }
  };
  // Function to check if request has expired (24 hours)
  const isRequestExpired = (submittedAt) => {
    if (!submittedAt) return false;
    const now = new Date();
    const timeDiff = now - submittedAt;
    return timeDiff > 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  };
  // Function to get status icon and color
  const getStatusDisplay = (status, submittedAt) => {
    const isExpired = isRequestExpired(submittedAt);

    if (status === 'pending' && isExpired) {
      return {
        icon: <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />,
        text: 'Expired',
        color: 'text-red-600 bg-red-50 border-red-200'
      };
    }

    switch (status) {
      case 'pending':
        return {
          icon: <ClockIcon className="h-5 w-5 text-yellow-500" />,
          text: 'Pending',
          color: 'text-yellow-600 bg-yellow-50 border-yellow-200'
        };
      case 'approved':
        return {
          icon: <CheckCircleIcon className="h-5 w-5 text-green-500" />,
          text: 'Approved',
          color: 'text-green-600 bg-green-50 border-green-200'
        };
      case 'rejected':
        return {
          icon: <XCircleIcon className="h-5 w-5 text-red-500" />,
          text: 'Rejected',
          color: 'text-red-600 bg-red-50 border-red-200'
        };
      default:
        return {
          icon: <ClockIcon className="h-5 w-5 text-gray-500" />,
          text: status,
          color: 'text-gray-600 bg-gray-50 border-gray-200'
        };
    }
  };
  // Function to handle resubmit for expired/rejected requests
  const handleResubmit = (request) => {
    if (request.planName === "Quota") {
      setQuotaToBuy(request.quantity.toString());
      setTotalPrice(request.price);
      setShowBuyQuota(true);
    } else {
      // Navigate to plans page for plan resubmission
      navigate('/plans-and-pricing');
    }
  };
  const getDaysRemaining = (expiryDate) => {
    if (!expiryDate) return null;
    const expiry = new Date(expiryDate);
    const now = new Date();
    const diff = expiry.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 3600 * 24));
    return days > 0 ? days : 0;
  };
  const renderRequestQuotaSection = () => {
    return (
      <div className="mb-3">
        <button
          onClick={handleBuyMoreQuota}
          className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-medium rounded-lg transition-all shadow-md hover:shadow-lg"
          disabled={isQuotaRequestPending}
        >
          {isQuotaRequestPending ? "Quota Request Pending" : "Buy More Quota"}
        </button>
      </div>
    );
  };
  const formatDateForDisplay = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };
  const formattedExpiryDate = subscriptionExpiry ? formatDate(subscriptionExpiry) : null;
  const formattedPurchasedDate = planPurchasedDate ? formatDateForDisplay(planPurchasedDate) : null;
  const isSubscriptionExpired = isExpired;
  const daysRemaining = formattedExpiryDate ? getDaysRemaining(subscriptionExpiry) : 0;
  const renewsString = daysRemaining ? `(${daysRemaining} days remaining)` : '';

   const getBadgeStyle = (plan) => {
    let badgeClass = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium";
    const isFreeUser = user?.uid;

    if (plan === "Free") {
        badgeClass += isFreeUser ? " bg-white/90 text-black-800" : " bg-gray-200 text-gray-800";
    } else {
        switch (plan) {
            case "Basic":
            case "Standard":
                badgeClass += " bg-gray-200 text-gray-800";
                break;
            case "Premium":
                badgeClass += " bg-amber-100 text-gray-800";
                break;
            default:
                badgeClass += " bg-gray-100 text-gray-700";
                break;
        }
    }
    return badgeClass;
};

  return (
    <div className="px-3 sm:px-4 lg:px-6">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm overflow-hidden mb-6 p-3"
        >
          {loading ? (
            <div className="text-center py-4">
              <PulseLoader color="#3B82F6" size={8} />
              <p className="mt-2 text-gray-600">Loading...</p>
            </div>
          ) : planStatus === "NoPlan" ? (
            <div className="text-center py-4">
              <XCircleIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <h3 className="text-lg font-semibold text-gray-800 mb-1">No Active Plan</h3>
              <p className="text-gray-600 text-sm">Subscribe to unlock premium features.</p>
            </div>
          ) : isExpired ? (
            <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-md">
              <div className="flex items-center mb-1">
                <XCircleIcon className="h-4 w-4 mr-2" />
                <span className="font-semibold">Expired Subscription</span>
              </div>
              {currentPlan !== "Free" && (
                <p className="text-xs">
                  Plan Purchased: {formattedPurchasedDate}
                  <br />
                  Expired on: {formattedExpiryDate}
                  <br />
                  ⚠️ Your plan has expired. Renew below.
                </p>
              )}
            </div>
          ) : planStatus === "Pending" ? (
            <div className="text-center py-4">
              <PulseLoader color="#3B82F6" size={6} className="mx-auto mb-2" />
              <h3 className="text-lg font-semibold text-gray-800 mb-1">Waiting for Approval</h3>
              <p className="text-gray-600 text-sm">Your {currentPlan} plan is pending.  Typically less than 24 hours.</p>
            </div>
          ) : (
            <div>
              <div className="mb-3 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  {/* Left: Subscription Info */}
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="font-semibold text-sm text-gray-800">
                        Active Subscription
                      </h3>
                      {currentPlan && (
                        <span
                          className={`${getBadgeStyle(
                            currentPlan
                          )} text-[11px] px-2 py-0.5 rounded-full border`}
                        >
                          {currentPlan}
                        </span>
                      )}
                    </div>
                    <p className="text-[12px] text-gray-600 leading-relaxed">
                      {currentPlan !== "Free" && (
                        <>
                          Purchased on{" "}
                          <span className="font-medium text-gray-800">
                            {formattedPurchasedDate}
                          </span>
                          <br />
                          {renewsString}
                        </>
                      )}
                    </p>
                  </div>

                  {/* Right: Quota Box */}
                  <div className="sm:text-left">
                    <div className="relative bg-white/90 px-5 py-4 rounded-xl border border-blue-200 shadow-md">
                      {/* Left pole */}
                      <div className="absolute top-2 bottom-2 left-0 w-1 bg-blue-400 rounded-full"></div>
                      {/* Right pole */}
                      <div className="absolute top-2 bottom-2 right-0 w-1 bg-blue-400 rounded-full"></div>

                      <p className="text-xs font-medium text-gray-600 tracking-wide uppercase text-center">
                        Remaining Quota
                      </p>
                      <p className="text-2xl font-semibold text-gray-900 mt-1 text-center">
                        {totalQuotaValue}
                      </p>
                    </div>
                  </div>


                </div>
              </div>

              {renderRequestQuotaSection()}

              {/* Usage & Payment Card */}
<div className="rounded-xl border border-blue-200 bg-white shadow-sm p-3 mb-4 hover:shadow-md transition-all duration-200">
  <div className="flex flex-row items-center justify-between gap-2">
    {/* Left */}
    <div className="flex flex-col">
      <span className="text-xs font-semibold text-blue-700 tracking-wide">
        Usage & Payment
      </span>
      <span className="text-[11px] text-gray-500">
        Track usage, view payments & download receipts
      </span>
    </div>

    {/* Right */}
    <Link
      to="/usage-and-payment"
      className="inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-medium 
         text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 
         rounded-lg transition-colors duration-200"
    >
      Open <PhosphorIcons.ArrowRight size={14} />
    </Link>
  </div>
</div>

            </div>
          )}
        </motion.div>

        <AnimatePresence>
          {showBuyQuota && (
            <Dialog
              open={showBuyQuota}
              onClose={() => setShowBuyQuota(false)}
              className="relative z-50"
            >
              <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />
              <div className="fixed inset-0 flex items-center justify-center p-4">
                <Dialog.Panel
                  as={motion.div}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden flex flex-col"
                  style={{ maxHeight: "80vh" }}
                >
                  <div className="p-4 overflow-y-auto flex-grow">
                    <div className="flex justify-between items-center mb-3">
                      <Dialog.Title className="text-lg font-bold text-gray-900">
                        Buy Quota
                      </Dialog.Title>
                      <button
                        onClick={handleCloseModal}
                        className="text-gray-400 hover:text-gray-500 rounded-full focus:outline-none focus:ring-2 focus:ring-gray-200"
                      >
                        <XCircleIcon className="h-5 w-5" />
                      </button>
                    </div>
                    <div className="space-y-3">
                      <div className="bg-gray-50 p-3 rounded-lg border border-gray-300">

                        <div className="grid grid-cols-1 gap-y-1">

                          <div className="text-xs font-medium text-gray-600">UPI ID</div>
                          <div className="flex items-center">
                            <span className="text-xs mr-1">flashqr.app@oksbi</span>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText("flashqr.app@oksbi");
                                toast.success("UPI ID copied!");
                              }}
                              className="text-blue-600 hover:text-blue-800 focus:outline-none"
                            >
                              <svg
                                className="w-3 h-3"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                                />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-0.5">
                          Number of QR codes (₹1 each)
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={quotaToBuy}
                          onChange={handleQuotaChange}
                          className="w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
                          placeholder="Quantity"
                        />
                      </div>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-medium text-gray-700">Total:</span>
                          <span className="text-lg font-bold text-blue-700">₹{totalPrice}</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-0.5">
                          Transaction ID <span className="text-gray-500">(Optional)</span>
                        </label>
                        <input
                          type="text"
                          value={transactionIdQuota}
                          onChange={(e) => setTransactionIdQuota(e.target.value)}
                          className="w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
                          placeholder="Transaction ID"
                        />
                      </div>
                      <div>
                        <div className="flex items-center mb-0.5">
                          <label className="block text-xs font-medium text-gray-700">
                            Payment Screenshot <span className="text-red-500">*</span>
                          </label>
                        </div>
                        <div
                          className={`mt-1 flex justify-center px-3 pt-2 pb-3 border-2 ${!paymentProofQuota ? 'border-gray-300' : 'border-gray-300'} border-dashed rounded-md`}
                        >
                          <div className="space-y-1 text-center">
                            {paymentProofQuota ? (
                              <div className="flex flex-col items-center">
                                <img
                                  src={URL.createObjectURL(paymentProofQuota)}
                                  alt="Payment proof"
                                  className="h-24 object-contain mb-1 rounded-md"
                                />
                                <button
                                  onClick={() => setPaymentProofQuota(null)}
                                  className="text-xs text-red-600 hover:text-red-800 focus:outline-none"
                                >
                                  Remove
                                </button>
                              </div>
                            ) : (
                              <>
                                <div className="flex text-xs text-gray-600">
                                  <label
                                    htmlFor="paymentProofQuota"
                                    className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none"
                                  >
                                    <span>Upload file</span>
                                    <input
                                      id="paymentProofQuota"
                                      name="paymentProofQuota"
                                      type="file"
                                      accept="image/*"
                                      className="sr-only"
                                      onChange={handlePaymentProofChangeQuota}
                                    />
                                  </label>
                                </div>
                                <p className="text-xs text-gray-500">PNG, JPG up to 700KB</p>
                              </>
                            )}
                          </div>
                        </div>
                        {!paymentProofQuota && (
                          <p className="mt-1 text-xs text-red-500 text-center">Required</p>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center">
                          <input
                            id="termsAccepted"
                            name="termsAccepted"
                            type="checkbox"
                            className={`h-3 w-3 text-blue-600 rounded border-gray-300 focus:ring-blue-500 ${termsError ? 'ring-red-500 border-red-500' : ''}`}
                            checked={termsAccepted}
                            onChange={(e) => setTermsAccepted(e.target.checked)}
                          />
                          <label htmlFor="termsAccepted" className="ml-1 block text-xs text-gray-900">
                            I agree to the <Link to="/terms" className="text-blue-600 hover:text-blue-800">terms</Link> and <Link to="/privacy" className="text-blue-600 hover:text-blue-800">privacy policy</Link>.
                          </label>
                        </div>
                        {termsError && <p className="mt-0.5 text-xs text-red-500">{termsError}</p>}
                      </div>
                    </div>
                  </div>
                  <div className="px-4 py-2 border-t border-gray-200 flex justify-end space-x-2">
                    <button
                      type="button"
                      className="px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-7000 hover:bg-gray-50 focus:outline-none"
                      onClick={handleCloseModal}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="px-3 py-1.5 bg-blue-600 rounded-md text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={handleSubmitQuota}
                      disabled={isSubmitting || !paymentProofQuota || !quotaToBuy || !termsAccepted}
                    >
                      {isSubmitting ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Submitting...
                        </span>
                      ) : "Submit"}
                    </button>
                  </div>
                </Dialog.Panel>
              </div>
            </Dialog>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
export default MyPlan;
