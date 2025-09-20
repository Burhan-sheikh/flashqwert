import React, { useState, useEffect, useCallback } from 'react';
import { AlertCircle, CheckCircle2, Zap, Target } from 'lucide-react';
import Generator from '../components/Generator';
import { QRCodeData } from '../types/qrcode';
import { db } from '../firebase/firebase';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { getQuotaForPlan } from '../utils/planConfig';

const QRGenerator: React.FC = () => {
    const [error, setError] = useState<string | null>(null);
    const [qrCodesGenerated, setQrCodesGenerated] = useState(0);
    const [subscriptionPlan, setSubscriptionPlan] = useState('Free');
    const [subscriptionExpiry, setSubscriptionExpiry] = useState<string | null>(null);
    const [userQuotaValue, setUserQuotaValue] = useState(30);
    const [totalQuotaValue, setTotalQuotaValue] = useState(30);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const { user, loading, isAuthenticated } = useAuth();

    const resetForm = useCallback(() => {
        setHasUnsavedChanges(false);
    }, []);

    const fetchUserData = useCallback(async () => {
        resetForm();
        setError(null);
        setIsLoading(true);

        if (!user) {
            setSubscriptionPlan('Free');
            setQrCodesGenerated(0);
            setUserQuotaValue(getQuotaForPlan('Free'));
            setTotalQuotaValue(getQuotaForPlan('Free'));
            setSubscriptionExpiry(null);
            setIsLoading(false);
            return;
        }

        try {
            const userRef = doc(db, 'users', user.uid);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                const data = userSnap.data();
                let plan = data.subscriptionPlan || 'Free';
                let quota = data.quota ?? getQuotaForPlan(plan);
                let expiry = data.subscriptionExpiry || null;
                const generated = data.qrCodesGenerated || 0;

                if (expiry) {
                    const expiryDate = new Date(expiry);
                    if (new Date() > expiryDate) {
                        await updateDoc(userRef, {
                            subscriptionPlan: 'Free',
                            qrCodesGenerated: 0,
                            quota: getQuotaForPlan('Free'),
                            subscriptionExpiry: null,
                        });
                        plan = 'Free';
                        quota = getQuotaForPlan('Free');
                        expiry = null;
                    }
                }

                setSubscriptionPlan(plan);
                setQrCodesGenerated(generated);
                setUserQuotaValue(quota);
                setTotalQuotaValue(quota);
                setSubscriptionExpiry(expiry);
            } else {
                const now = new Date().toISOString();
                await setDoc(userRef, {
                    username: user.email?.split("@")[0] || `user${Date.now()}`,
                    email: user.email,
                    subscriptionPlan: "Free",
                    quota: getQuotaForPlan('Free'),
                    qrCodesGenerated: 0,
                    createdAt: now,
                    updatedAt: now,
                    subscriptionExpiry: null,
                });
                const newUserSnap = await getDoc(userRef);
                if (newUserSnap.exists()) {
                    const data = newUserSnap.data();
                    setSubscriptionPlan(data.subscriptionPlan || 'Free');
                    setQrCodesGenerated(data.qrCodesGenerated || 0);
                    setUserQuotaValue(data.quota || getQuotaForPlan('Free'));
                    setTotalQuotaValue(data.quota || getQuotaForPlan('Free'));
                    setSubscriptionExpiry(data.subscriptionExpiry || null);
                } else {
                    setError("Failed to load profile. Refresh or contact support.");
                }
            }
        } catch (err: any) {
            console.error("Error fetching user data:", err);
            setError(`Failed to fetch user data: ${err.message}.`);
        } finally {
            setIsLoading(false);
        }
    }, [user, resetForm]);

    useEffect(() => {
        if (!loading && isAuthenticated) {
            fetchUserData();
        } else if (!loading) {
            setIsLoading(false);
        }
    }, [fetchUserData, loading, isAuthenticated]);

    const hasUnsavedChangesFunction = useCallback(() => {
        return hasUnsavedChanges;
    }, [hasUnsavedChanges]);

    const handleUnsavedChanges = (hasChanges: boolean) => {
        setHasUnsavedChanges(hasChanges);
    };

    if (loading || isLoading) {
        return (
            <div className="max-w-6xl mx-auto">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center justify-center min-h-[400px]"
                >
                    <div className="text-center">
                        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">Loading QR Generator</h3>
                        <p className="text-gray-500">Preparing your workspace...</p>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto">
            {/* Hero Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="mb-8 text-center"
            >
                <div className="mb-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl mb-4">
                        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                            <div className="grid grid-cols-3 gap-0.5">
                                {[...Array(9)].map((_, i) => (
                                    <div key={i} className="w-1 h-1 bg-gray-800 rounded-sm"></div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4">
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                        QR Code Generator
                    </span>
                </h1>
                
                <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-6">
                    Create professional QR codes with advanced features - all available to every user
                </p>

                <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
                    <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full">
                        <Zap className="w-5 h-5 text-blue-600" />
                        <span className="text-sm font-medium text-blue-700">Static QR Codes</span>
                    </div>
                    <div className="flex items-center gap-2 bg-purple-50 px-4 py-2 rounded-full">
                        <Target className="w-5 h-5 text-purple-600" />
                        <span className="text-sm font-medium text-purple-700">Dynamic QR Codes</span>
                    </div>
                    <div className="flex items-center gap-2 bg-green-50 px-4 py-2 rounded-full">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        <span className="text-sm font-medium text-green-700">Bulk Generation</span>
                    </div>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-2xl p-6 max-w-2xl mx-auto">
                    <div className="flex items-center justify-center gap-3 mb-3">
                        <CheckCircle2 className="w-6 h-6 text-green-600" />
                        <h3 className="text-lg font-semibold text-gray-800">All Features Available</h3>
                    </div>
                    <p className="text-gray-600 leading-relaxed">
                        Generate unlimited static and dynamic QR codes with advanced features like scheduling, 
                        password protection, scan limits, and custom redirect pages - all free for every user.
                    </p>
                </div>
            </motion.div>

            {/* Error Display */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start"
                    >
                        <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                        <div>
                            <h4 className="text-red-800 font-medium">Error Loading Generator</h4>
                            <p className="text-red-700 text-sm mt-1">{error}</p>
                            <button 
                                onClick={fetchUserData}
                                className="mt-2 px-3 py-1 bg-red-100 hover:bg-red-200 text-red-800 rounded text-sm transition-colors"
                            >
                                Retry
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Content */}
            {!error && (
                <Generator
                    onClose={() => window.history.back()}
                    userQuota={userQuotaValue}
                    subscriptionPlan={subscriptionPlan}
                    userId={user?.uid || ''}
                    onQuotaUpdate={(newQuota) => setUserQuotaValue(newQuota)}
                    hasUnsavedChanges={hasUnsavedChangesFunction}
                    resetForm={resetForm}
                    onUnsavedChanges={handleUnsavedChanges}
                    canAccessBulk={true} // Bulk generation now available to all users
                />
            )}

            {/* Feature Showcase */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="mt-12 mb-8"
            >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                            <Zap className="w-6 h-6 text-blue-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Static QR Codes</h3>
                        <p className="text-gray-600 text-sm">
                            Create permanent QR codes that directly link to your URLs. Perfect for print materials and long-term campaigns.
                        </p>
                    </div>

                    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                            <Target className="w-6 h-6 text-purple-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Dynamic QR Codes</h3>
                        <p className="text-gray-600 text-sm">
                            Advanced QR codes with analytics, scheduling, password protection, and the ability to change destinations anytime.
                        </p>
                    </div>

                    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                            <CheckCircle2 className="w-6 h-6 text-green-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Bulk Generation</h3>
                        <p className="text-gray-600 text-sm">
                            Generate multiple QR codes at once using CSV import or manual entry. Perfect for large campaigns and events.
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default QRGenerator;
