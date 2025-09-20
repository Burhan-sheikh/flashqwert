import React, { useState, useCallback } from "react";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/solid";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "../../firebase/firebase";
import { doc, updateDoc, deleteDoc, getDoc } from "firebase/firestore";
import { toast } from "react-toastify";
import { Dialog } from '@headlessui/react'
import { ExclamationTriangleIcon, XCircleIcon } from "@heroicons/react/24/solid";

const UserManagementTable = ({ allUsers, setAllUsers, formatDate }) => {
    const [expandedUser, setExpandedUser] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [isResetQuotaModalOpen, setIsResetQuotaModalOpen] = useState(false);
    const [isManualUpgradeModalOpen, setIsManualUpgradeModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [newQuota, setNewQuota] = useState("");
    const [newPlan, setNewPlan] = useState("");
    const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);
    const [isBanModalOpen, setIsBanModalOpen] = useState(false);

    const filteredUsers = () => {
        if (!searchQuery) return allUsers;
        return allUsers.filter(user =>
            user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.subscriptionPlan?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    };

    const toggleUserExpand = (userId) => {
        setExpandedUser(expandedUser === userId ? null : userId);
    };

    const handleOpenResetQuotaModal = (user) => {
        setSelectedUser(user);
        setNewQuota(""); // Clear previous value
        setIsResetQuotaModalOpen(true);
    };

    const handleCloseResetQuotaModal = () => {
        setIsResetQuotaModalOpen(false);
    };

    const handleResetQuota = async () => {
        if (!selectedUser) return;

        try {
            const userRef = doc(db, "users", selectedUser.id);
            await updateDoc(userRef, {
                quota: parseInt(newQuota, 10) || 0,
            });

            // Update local state
            setAllUsers(prevUsers =>
                prevUsers.map(user =>
                    user.id === selectedUser.id ? { ...user, quota: parseInt(newQuota, 10) || 0 } : user
                )
            );

            toast.success("User quota reset successfully!");
        } catch (error) {
            console.error("Error resetting user quota:", error);
            toast.error("Failed to reset user quota.");
        } finally {
            handleCloseResetQuotaModal();
        }
    };

    const handleOpenManualUpgradeModal = (user) => {
        setSelectedUser(user);
        setNewPlan(""); // Clear previous value
        setIsManualUpgradeModalOpen(true);
    };

    const handleCloseManualUpgradeModal = () => {
        setIsManualUpgradeModalOpen(false);
    };

    const handleManualUpgrade = async () => {
        if (!selectedUser || !newPlan) return;

        try {
            const userRef = doc(db, "users", selectedUser.id);
            await updateDoc(userRef, {
                subscriptionPlan: newPlan,
            });

            // Update local state
            setAllUsers(prevUsers =>
                prevUsers.map(user =>
                    user.id === selectedUser.id ? { ...user, subscriptionPlan: newPlan } : user
                )
            );

            toast.success("User plan upgraded successfully!");
        } catch (error) {
            console.error("Error upgrading user plan:", error);
            toast.error("Failed to upgrade user plan.");
        } finally {
            handleCloseManualUpgradeModal();
        }
    };

    const handleOpenDeactivateModal = (user) => {
        setSelectedUser(user);
        setIsDeactivateModalOpen(true);
    };

    const handleCloseDeactivateModal = () => {
        setIsDeactivateModalOpen(false);
    };

    const handleDeactivateAccount = async () => {
        if (!selectedUser) return;

        try {
            const userRef = doc(db, "users", selectedUser.id);
            await updateDoc(userRef, {
                isActive: false, // Or however you track account status
            });

            // Update local state
            setAllUsers(prevUsers =>
                prevUsers.map(user =>
                    user.id === selectedUser.id ? { ...user, isActive: false } : user
                )
            );

            toast.success("Account deactivated successfully!");
        } catch (error) {
            console.error("Error deactivating account:", error);
            toast.error("Failed to deactivate account.");
        } finally {
            handleCloseDeactivateModal();
        }
    };

    const handleOpenBanModal = (user) => {
        setSelectedUser(user);
        setIsBanModalOpen(true);
    };

    const handleCloseBanModal = () => {
        setIsBanModalOpen(false);
    };

    const handleBanUser = async () => {
        if (!selectedUser) return;

        try {
            const userRef = doc(db, "users", selectedUser.id);
            await updateDoc(userRef, {
                isBanned: true, // Or however you track ban status
            });

            // Update local state
            setAllUsers(prevUsers =>
                prevUsers.map(user =>
                    user.id === selectedUser.id ? { ...user, isBanned: true } : user
                )
            );

            toast.success("User banned successfully!");
        } catch (error) {
            console.error("Error banning user:", error);
            toast.error("Failed to ban user.");
        } finally {
            handleCloseBanModal();
        }
    };

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-800">
                    All Users
                </h3>
                <div className="mt-2 md:mt-0 w-full md:w-auto">
                    <input
                        type="text"
                        placeholder="Search users..."
                        className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {filteredUsers().length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">No users found.</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {filteredUsers().map((user) => (
                        <div key={user.id} className="border border-gray-200 rounded-lg overflow-hidden">
                            <div
                                className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50"
                                onClick={() => toggleUserExpand(user.id)}
                            >
                                <div>
                                    <div className="font-medium text-gray-900">{user.email || "N/A"}</div>
                                    <div className="text-sm text-gray-500">{user.subscriptionPlan || "No plan"}</div>
                                </div>
                                <div>
                                    {expandedUser === user.id ? (
                                        <ChevronUpIcon className="h-5 w-5 text-gray-400" />
                                    ) : (
                                        <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                                    )}
                                </div>
                            </div>
                            <AnimatePresence>
                                {expandedUser === user.id && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="px-4 pb-4"
                                    >
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <div className="text-gray-500">User ID</div>
                                                <div className="text-gray-900 break-all">{user.id}</div>
                                            </div>
                                            <div>
                                                <div className="text-gray-500">Subscription</div>
                                                <div className="text-gray-900">{user.subscriptionPlan || "N/A"}</div>
                                            </div>
                                            <div>
                                                <div className="text-gray-500">Expiry Date</div>
                                                <div className="text-gray-900">{user.subscriptionExpiry ? formatDate(user.subscriptionExpiry) : "N/A"}</div>
                                            </div>
                                            <div>
                                                <div className="text-gray-500">Remaining Quota</div>
                                                <div className="text-gray-900">{user.quota || "0"}</div>
                                            </div>
                                        </div>

                                        {/* Admin Actions */}
                                        <div className="mt-4 flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2">
                                            <button
                                                onClick={() => handleOpenResetQuotaModal(user)}
                                                className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-1 transition-colors duration-200 text-sm"
                                            >
                                                Reset Quota
                                            </button>
                                            <button
                                                onClick={() => handleOpenManualUpgradeModal(user)}
                                                className="px-4 py-2 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-green-300 focus:ring-offset-1 transition-colors duration-200 text-sm"
                                            >
                                                Manually Upgrade Plan
                                            </button>
                                            <button
                                                onClick={() => handleOpenDeactivateModal(user)}
                                                className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-yellow-300 focus:ring-offset-1 transition-colors duration-200 text-sm"
                                            >
                                                Deactivate Account
                                            </button>
                                            <button
                                                onClick={() => handleOpenBanModal(user)}
                                                className="px-4 py-2 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-offset-1 transition-colors duration-200 text-sm"
                                            >
                                                Ban / Suspend User
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>
            )}

            {/* Reset Quota Modal */}
            <Dialog open={isResetQuotaModalOpen} onClose={handleCloseResetQuotaModal} className="relative z-50">
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <Dialog.Panel className="mx-auto max-w-md bg-white rounded-lg shadow-xl overflow-hidden">
                        <div className="px-6 py-4">
                            <Dialog.Title className="text-lg font-medium leading-6 text-gray-900">Reset User Quota</Dialog.Title>
                            <div className="mt-2">
                                <label htmlFor="newQuota" className="block text-sm font-medium text-gray-700">
                                    New Quota:
                                </label>
                                <input
                                    type="number"
                                    id="newQuota"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                    value={newQuota}
                                    onChange={(e) => setNewQuota(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end bg-gray-50 px-6 py-4 space-x-2">
                            <button
                                type="button"
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
                                onClick={handleCloseResetQuotaModal}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                onClick={handleResetQuota}
                            >
                                Reset Quota
                            </button>
                        </div>
                    </Dialog.Panel>
                </div>
            </Dialog>

            {/* Manual Upgrade Modal */}
            <Dialog open={isManualUpgradeModalOpen} onClose={handleCloseManualUpgradeModal} className="relative z-50">
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <Dialog.Panel className="mx-auto max-w-md bg-white rounded-lg shadow-xl overflow-hidden">
                        <div className="px-6 py-4">
                            <Dialog.Title className="text-lg font-medium leading-6 text-gray-900">Manually Upgrade Plan</Dialog.Title>
                            <div className="mt-2">
                                <label htmlFor="newPlan" className="block text-sm font-medium text-gray-700">
                                    New Plan:
                                </label>
                                <input
                                    type="text"
                                    id="newPlan"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                    value={newPlan}
                                    onChange={(e) => setNewPlan(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end bg-gray-50 px-6 py-4 space-x-2">
                            <button
                                type="button"
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
                                onClick={handleCloseManualUpgradeModal}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                                onClick={handleManualUpgrade}
                            >
                                Upgrade Plan
                            </button>
                        </div>
                    </Dialog.Panel>
                </div>
            </Dialog>

            {/* Deactivate Account Modal */}
            <Dialog open={isDeactivateModalOpen} onClose={handleCloseDeactivateModal} className="relative z-50">
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <Dialog.Panel className="mx-auto max-w-md bg-white rounded-lg shadow-xl overflow-hidden">
                        <div className="px-6 py-4">
                            <Dialog.Title className="text-lg font-medium leading-6 text-gray-900">Deactivate Account</Dialog.Title>
                            <div className="mt-2">
                                <p className="text-sm text-gray-700">
                                    Are you sure you want to deactivate this account? This action cannot be undone.
                                </p>
                            </div>
                        </div>
                        <div className="flex justify-end bg-gray-50 px-6 py-4 space-x-2">
                            <button
                                type="button"
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
                                onClick={handleCloseDeactivateModal}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="px-4 py-2 text-sm font-medium text-white bg-yellow-600 rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                onClick={handleDeactivateAccount}
                            >
                                Deactivate
                            </button>
                        </div>
                    </Dialog.Panel>
                </div>
            </Dialog>

            {/* Ban User Modal */}
            <Dialog open={isBanModalOpen} onClose={handleCloseBanModal} className="relative z-50">
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <Dialog.Panel className="mx-auto max-w-md bg-white rounded-lg shadow-xl overflow-hidden">
                        <div className="px-6 py-4">
                            <Dialog.Title className="text-lg font-medium leading-6 text-gray-900">Ban / Suspend User</Dialog.Title>
                            <div className="mt-2">
                                <p className="text-sm text-gray-700">
                                    Are you sure you want to ban this user? This will prevent them from accessing the platform.
                                </p>
                            </div>
                        </div>
                        <div className="flex justify-end bg-gray-50 px-6 py-4 space-x-2">
                            <button
                                type="button"
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
                                onClick={handleCloseBanModal}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                                onClick={handleBanUser}
                            >
                                Ban User
                            </button>
                        </div>
                    </Dialog.Panel>
                </div>
            </Dialog>
        </div>
    );
};

export default UserManagementTable;