import React, { useState, useCallback, useEffect } from "react";
import { db } from "../../firebase/firebase";
import { getDoc, doc, updateDoc, deleteDoc, runTransaction } from "firebase/firestore";
import { toast } from "react-toastify";
import { Dialog } from "@headlessui/react";
import { XCircleIcon } from "@heroicons/react/24/solid";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Download, Eye, Filter, CheckCircle } from "lucide-react";
import jsPDF from 'jspdf';
import { format } from 'date-fns';
// import { sendPaymentApprovalNotification, sendPaymentRejectionNotification, sendNotificationToUser } from '../../utils/sendNotification';

const PaymentProofsTable = ({ paymentProofs, setPaymentProofs, plans }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [filter, setFilter] = useState("pending");
  const [selectedProofs, setSelectedProofs] = useState([]);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [selectedProofForRejection, setSelectedProofForRejection] = useState(null);
  const [showExpiredOnly, setShowExpiredOnly] = useState(false);

  // --- HANDLE APPROVE WITH ADDITIVE QUOTA LOGIC AND DEBUG LOGS ---
 const handleApprove = useCallback(
  async (proofId, userId, planName, quantity, price) => {
    console.log(`Approving proof ${proofId} for user ${userId}, plan: ${planName}`);
    try {
      const userRef = doc(db, "users", userId);
      const proofRef = doc(db, "paymentProofs", proofId);

      await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        const proofDoc = await transaction.get(proofRef);

        if (!userDoc.exists()) {
          throw new Error("User document not found.");
        }

        if (!proofDoc.exists()) {
          throw new Error("Payment proof not found.");
        }

        const userData = userDoc.data();
        console.log("Current user data:", userData);

        const approvedAt = new Date().toISOString(); // Get current timestamp

        if (planName === "Quota") {
          const currentQuota = Number(userData.quota) || 0;
          const addQuota = Number(quantity) || 0;
          console.log(`Current quota: ${currentQuota}, Adding: ${addQuota}`);

          if (isNaN(addQuota) || addQuota <= 0) {
            throw new Error("Invalid quota quantity.");
          }

          const newQuota = currentQuota + addQuota;
          console.log(`New quota: ${newQuota}`);

          transaction.update(userRef, {
            quota: newQuota,
            updatedAt: new Date().toISOString()
          });
          transaction.update(proofRef, {
            status: "approved",
            approvedAt: new Date().toISOString()
          });
        } else {
          const plan = plans.find((p) => p.name === planName);
          if (!plan) {
            throw new Error(`Plan "${planName}" not found in plans array.`);
          }

          //START
          if (planName === "Basic") {
            plan.quota = 300;
          }
          if (planName === "Standard") {
            plan.quota = 900;
          }
          if (planName === "Premium") {
            plan.quota = 1500;
          }
          //END

          const expiryDate = new Date();
          expiryDate.setDate(expiryDate.getDate() + 30);

          const currentQuota = Number(userData.quota) || 0;
          const planQuota = Number(plan.quota) || 0;
          console.log(`Current quota: ${currentQuota}, Plan quota: ${planQuota}`);

          if (isNaN(planQuota)) {
            throw new Error(`Invalid plan quota for plan "${planName}". Quota is NaN.`);
          }

          if (planQuota <= 0) {
            throw new Error(`Invalid plan quota for plan "${planName}". Quota must be greater than 0.`);
          }

          const newQuota = currentQuota + planQuota;
          console.log(`New quota: ${newQuota}`);

          transaction.update(userRef, {
            subscriptionPlan: planName,
            subscriptionExpiry: expiryDate.toISOString(),
            quota: newQuota,
            updatedAt: new Date().toISOString(),
            planPurchasedDate: approvedAt // Store the approval date
          });
          transaction.update(proofRef, {
            status: "approved",
            approvedAt: new Date().toISOString()
          });
        }
      });

      setPaymentProofs((prev) =>
        prev.map((p) => (p.id === proofId ? { ...p, status: "approved" } : p))
      );

      if (planName === "Quota") {
        toast.success(`Approved Quota Purchase of ${quantity}!`);
      } else {
        toast.success("Approved & Plan Activated!");
      }
    } catch (error) {
      console.error("Approval error:", error);
      toast.error(error.message || "Failed to approve payment.");
    }
  },
  [plans, setPaymentProofs]
  );

  const openRejectModal = (proofId) => {
    setSelectedProofForRejection(proofId);
    setIsRejectModalOpen(true);
  };

  const closeRejectModal = () => {
    setIsRejectModalOpen(false);
    setRejectionReason("");
    setSelectedProofForRejection(null);
  };

  const handleReject = useCallback(async () => {
    if (!selectedProofForRejection) return;
    try {
      const proofRef = doc(db, "paymentProofs", selectedProofForRejection);
      const proofDoc = await getDoc(proofRef);
      if (!proofDoc.exists()) {
        toast.error("Payment proof not found.");
        return;
      }
      await updateDoc(proofRef, { status: "rejected" });
      setPaymentProofs(prev => prev.map(p => (p.id === selectedProofForRejection ? { ...p, status: 'rejected' } : p)));
      toast.success("Payment rejected.");
      // Optionally: sendPaymentRejectionNotification(proofDoc.data().userEmail, rejectionReason);
    } catch (error) {
      console.error(error);
      toast.error("Failed to reject payment.");
    } finally {
      closeRejectModal();
    }
  }, [setPaymentProofs, selectedProofForRejection]);

  const handleDelete = useCallback(async (proofId) => {
    try {
      await deleteDoc(doc(db, "paymentProofs", proofId));
      setPaymentProofs(prev => prev.filter(p => p.id !== proofId));
      toast.success("Payment proof deleted.");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete payment proof.");
    }
  }, [setPaymentProofs]);

  const handleBulkDelete = useCallback(async () => {
    try {
      for (const proofId of selectedProofs) {
        await deleteDoc(doc(db, "paymentProofs", proofId));
      }
      setPaymentProofs(prev => prev.filter(p => !selectedProofs.includes(p.id)));
      setSelectedProofs([]);
      setIsBulkDeleteModalOpen(false);
      toast.success("Selected payment proofs deleted.");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete selected payment proofs.");
    }
  }, [selectedProofs, setPaymentProofs]);

  const filteredProofs = () => {
    if (filter === "all") return paymentProofs;
    let filtered = paymentProofs.filter((proof) => {
      if (filter === "expired") {
        return proof.status === "pending" && isProofExpired(proof.createdAt?.toDate());
      }
      return proof.status === filter;
    });

    if (showExpiredOnly) {
      filtered = filtered.filter(proof => isProofExpired(proof.createdAt?.toDate()));
    }

    return filtered;
  };

  const toggleSelectProof = (proofId) => {
    setSelectedProofs(prev => {
      if (prev.includes(proofId)) {
        return prev.filter(id => id !== proofId);
      } else {
        return [...prev, proofId];
      }
    });
  };

  const isAllSelected = filteredProofs().length > 0 && selectedProofs.length === filteredProofs().length;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedProofs([]);
    } else {
      setSelectedProofs(filteredProofs().map(proof => proof.id));
    }
  };

  const handleOpenBulkDeleteModal = () => {
    if (selectedProofs.length > 0) {
      setIsBulkDeleteModalOpen(true);
    } else {
      toast.warn("No payment proofs selected for deletion.");
    }
  };

  const handleCloseBulkDeleteModal = () => {
    setIsBulkDeleteModalOpen(false);
  };

  const downloadProofData = () => {
    const pdf = new jsPDF();

    // Header
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Payment Proofs Report', 20, 20);

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Generated on: ${format(new Date(), 'PPP')}`, 20, 30);
    pdf.text(`Filter: ${filter}`, 20, 40);
    pdf.text(`Total Records: ${filteredProofs().length}`, 20, 50);

    // Table headers
    let yPosition = 70;
    pdf.setFont('helvetica', 'bold');
    pdf.text('Date', 20, yPosition);
    pdf.text('Email', 60, yPosition);
    pdf.text('Plan', 120, yPosition);
    pdf.text('Amount', 150, yPosition);
    pdf.text('Status', 180, yPosition);

    yPosition += 10;
    pdf.setFont('helvetica', 'normal');

    // Records
    filteredProofs().forEach(proof => {
      if (yPosition > 270) {
        pdf.addPage();
        yPosition = 20;
      }

      const date = proof.createdAt?.toDate();
      pdf.text(date ? format(date, 'dd/MM/yyyy') : 'N/A', 20, yPosition);
      pdf.text(proof.userEmail?.substring(0, 15) || 'N/A', 60, yPosition);
      pdf.text(proof.planName === 'Quota' ? `Quota(${proof.quantity})` : proof.planName, 120, yPosition);
      pdf.text(`₹${proof.price}`, 150, yPosition);
      pdf.text(proof.status, 180, yPosition);

      yPosition += 8;
    });

    pdf.save(`Payment_Proofs_${filter}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    toast.success('Report downloaded successfully!');
  };
  const BulkDeleteModal = ({ isOpen, onClose, onConfirm, selectedCount, isBulkDelete }) => {
    const modalVariants = {
      hidden: { opacity: 0, scale: 0.9 },
      visible: { opacity: 1, scale: 1, transition: { duration: 0.2, ease: "easeInOut" } },
      exit: { opacity: 0, scale: 0.9, transition: { duration: 0.15, ease: "easeInOut" } }
    };

    useEffect(() => {
      if (isOpen) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = 'auto';
      }
      return () => {
        document.body.style.overflow = 'auto';
      };
    }, [isOpen]);

    return (
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={modalVariants}
            onClick={onClose}
          >
            <motion.div
              className="relative bg-white rounded-2xl shadow-lg max-w-md w-full mx-4 p-6"
              onClick={(e) => e.stopPropagation()}
              variants={modalVariants}
            >
              <button
                onClick={onClose}
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 focus:outline-none"
                aria-label="Close"
              >
                <XCircleIcon className="h-5 w-5" />
              </button>

              <div className="text-center">
                <div className="flex items-center justify-center rounded-full bg-red-100 p-3 mx-auto mb-4">
                  <Trash2 className="h-8 w-8 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  {isBulkDelete ? `Delete ${selectedCount} Payment Proof(s)?` : `Delete Payment Proof?`}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Are you sure you want to delete {isBulkDelete ? "these payment proofs" : "this payment proof"}? This action cannot be undone.
                </p>
              </div>

              <div className="flex justify-center space-x-4">
                <button
                  onClick={onClose}
                  className="py-2 px-5 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1 transition-colors duration-200 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  className="py-2 px-5 bg-red-600 text-white rounded-xl shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 transition-colors duration-200 text-sm"
                >
                  Confirm Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  };

  const isProofExpired = (submittedAt) => {
    if (!submittedAt) return false;
    const now = new Date();
    const timeDiff = now - submittedAt;
    return timeDiff > 24 * 60 * 60 * 1000;
  };

  const autoExpireProofs = useCallback(async () => {
    const expiredProofs = filteredProofs().filter(proof =>
      proof.status === 'pending' && isProofExpired(proof.createdAt?.toDate())
    );

    for (const proof of expiredProofs) {
      try {
        await updateDoc(doc(db, "paymentProofs", proof.id), {
          status: "expired",
        });

        setPaymentProofs((prev) =>
          prev.map((p) =>
            p.id === proof.id ? { ...p, status: "expired" } : p
          )
        );
      } catch (error) {
        console.error("Error auto-expiring proof:", error);
      }
    }
  }, [filteredProofs, setPaymentProofs]);

  useEffect(() => {
    autoExpireProofs();
    const interval = setInterval(autoExpireProofs, 60000);
    return () => clearInterval(interval);
  }, [autoExpireProofs]);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-800">
          Payment Proofs
        </h3>
        <div className="flex items-center space-x-4">
          <select
            className="block rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
            onChange={(e) => setFilter(e.target.value)}
            value={filter}
          >
            <option value="pending">Pending Proofs</option>
            <option value="approved">Approved Proofs</option>
            <option value="rejected">Rejected Proofs</option>
            <option value="expired">Expired Proofs</option>
            <option value="all">All Proofs</option>
          </select>
          <button
            onClick={downloadProofData}
            className="inline-flex items-center px-4 py-2 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </button>
          <button
            onClick={handleOpenBulkDeleteModal}
            className="inline-flex items-center px-4 py-2 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Bulk Delete
          </button>
        </div>
      </div>

      {filteredProofs().length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500">
            No payment proofs to review for the selected filter.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Request Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Transaction ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Proof Image
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Submitted
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProofs().map((proof) => {
                const submittedAt = proof.createdAt?.toDate();
                const isExpired = isProofExpired(submittedAt);
                const actualStatus = isExpired && proof.status === 'pending' ? 'expired' : proof.status;

                return (
                  <tr key={proof.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedProofs.includes(proof.id)}
                        onChange={() => toggleSelectProof(proof.id)}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {proof.userEmail || "N/A"}
                      </div>
                      <div className="text-xs text-gray-500 truncate max-w-xs">
                        {proof.userId}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {proof.planName === "Quota" ? "Quota Request" : proof.planName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {proof.transactionId || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {proof.proofImageBase64 && (
                        <button
                          onClick={() => setSelectedImage(proof.proofImageBase64)}
                          className="hover:opacity-80 transition-opacity"
                        >
                          <img
                            src={proof.proofImageBase64}
                            alt="Payment Proof"
                            className="h-12 w-12 rounded-md object-cover border border-gray-200"
                          />
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {proof.planName === "Quota" ? (
                        <>
                          <span className="font-medium">{proof.quantity} QR codes</span>
                          <br />
                          ₹{proof.price}
                        </>
                      ) : (
                        <>
                          <span className="font-medium">{proof.planName} Plan</span>
                          <br />
                          {plans.find(p => p.name === proof.planName)?.price && `₹${plans.find(p => p.name === proof.planName)?.price}`}
                        </>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          actualStatus === 'expired'
                            ? "bg-red-100 text-red-800"
                            : actualStatus === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : actualStatus === "approved"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                        }`}
                      >
                        {actualStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {submittedAt ? submittedAt.toLocaleString() : "N/A"}
                      {isExpired && proof.status === 'pending' && (
                        <div className="text-xs text-red-600 mt-1">
                          Expired (24h+)
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      {actualStatus === 'pending' && (
                        <>
                          <button
                            onClick={() =>
                              handleApprove(proof.id, proof.userId, proof.planName, proof.quantity, proof.price)
                            }
                            className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => openRejectModal(proof.id)}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {(actualStatus === 'expired' || actualStatus === 'rejected') && (
                        <button
                          onClick={() => handleDelete(proof.id)}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          Delete
                        </button>
                      )}
                      {actualStatus === 'approved' && (
                        <span className="inline-flex items-center px-3 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-md">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Activated
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Image Modal */}
      <AnimatePresence>
        {selectedImage && (
          <Dialog
            open={selectedImage !== null}
            onClose={() => setSelectedImage(null)}
            className="relative z-50"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm"
              aria-hidden="true"
            />
            <div className="fixed inset-0 flex items-center justify-center p-4">
              <Dialog.Panel className="bg-white rounded-xl shadow-2xl max-w-4xl w-full p-4">
                <div className="flex justify-between items-center mb-4">
                  <Dialog.Title className="text-lg font-semibold">
                    Payment Proof (Watermarked for Verification)
                  </Dialog.Title>
                  <button
                    onClick={() => setSelectedImage(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <XCircleIcon className="h-6 w-6" />
                  </button>
                </div>
                <div className="overflow-auto max-h-[80vh] relative">
                  <img
                    src={selectedImage}
                    alt="Payment Proof"
                    className="w-full rounded-lg border border-gray-200"
                  />
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                      FlashQR Internal Verification
                    </div>
                    <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                      Confidential - Admin Use Only
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </div>
          </Dialog>
        )}
      </AnimatePresence>

      {/* Bulk Delete Modal */}
      <BulkDeleteModal
        isOpen={isBulkDeleteModalOpen}
        onClose={handleCloseBulkDeleteModal}
        onConfirm={handleBulkDelete}
        selectedCount={selectedProofs.length}
        isBulkDelete={true}
      />

      {/* Rejection Modal */}
      <AnimatePresence>
        {isRejectModalOpen && (
          <Dialog
            open={isRejectModalOpen}
            onClose={closeRejectModal}
            className="relative z-50"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm"
              aria-hidden="true"
            />
            <div className="fixed inset-0 flex items-center justify-center p-4">
              <Dialog.Panel className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
                <Dialog.Title className="text-lg font-semibold">
                  Reject Payment Proof
                </Dialog.Title>
                <div className="mt-4">
                  <label htmlFor="rejectionReason" className="block text-sm font-medium text-gray-700">
                    Rejection Reason:
                  </label>
                  <textarea
                    id="rejectionReason"
                    rows={3}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 mt-1 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="Enter reason for rejection"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                  />
                </div>
                <div className="mt-6 flex justify-end space-x-4">
                  <button
                    type="button"
                    className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    onClick={closeRejectModal}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    onClick={handleReject}
                  >
                    Reject Payment
                  </button>
                </div>
              </Dialog.Panel>
            </div>
          </Dialog>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PaymentProofsTable;
