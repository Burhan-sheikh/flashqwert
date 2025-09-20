// src/components/CollectionComponent.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { db } from '../firebase/firebase';
import { collection, query, where, getDocs, addDoc, doc, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';
import { QRCodeData } from '../types/qrcode';
import { motion, AnimatePresence } from 'framer-motion';
import { XCircle, CheckCircle, Plus, Search, FolderPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getCollectionLimitForPlan } from '../utils/planConfig';
import { getSubscriptionStatus, getUpgradeMessage, calculateQuotaUsage } from '../utils/subscriptionUtils';
import { toast } from 'react-toastify';

interface CollectionComponentProps {
    userId: string;
    qrCodeIds: string[];
    onClose: () => void;
    onCollectionCreated: () => void;
    onQrCodesUpdated: () => void;
    qrCodeData: QRCodeData[];
}

interface CollectionData {
    id: string;
    name: string;
    qrCodeIds: string[];
    createdAt: string;
    userId: string;
}

const COLLECTION_LIMIT = 30; // Setting the collection limit.

const CollectionComponent: React.FC<CollectionComponentProps> = ({
    userId,
    qrCodeIds,
    onClose,
    onCollectionCreated,
    onQrCodesUpdated,
    qrCodeData
}) => {
    const [collections, setCollections] = useState<CollectionData[]>([]);
    const [newCollectionName, setNewCollectionName] = useState('');
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [isCreatingCollection, setIsCreatingCollection] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'existing' | 'new'>('existing');
    const [collectionFullMessage, setCollectionFullMessage] = useState<string | null>(null);
    const { user } = useAuth();
    const [subscriptionPlan, setSubscriptionPlan] = useState<string>('Free');
    const [subscriptionExpiry, setSubscriptionExpiry] = useState<string | null>(null);
    const [userCollectionCount, setUserCollectionCount] = useState(0);

    // Function to lock the body scroll
    const lockBodyScroll = useCallback(() => {
        document.body.style.overflow = 'hidden';
        document.body.style.paddingRight = 'var(--scrollbar-width)'; // prevent content from shifting
    }, []);

    // Function to unlock the body scroll
    const unlockBodyScroll = useCallback(() => {
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
    }, []);

    const showToast = (message: string, type: 'success' | 'error' | 'info') => {
        const toastOptions = {
            position: 'bottom-center' as const,
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: 'light' as const,
        };
        switch (type) {
            case 'success':
                toast.success(message, toastOptions);
                break;
            case 'error':
                toast.error(message, toastOptions);
                break;
            default:
                toast.info(message, toastOptions);
                break;
        }
    };

    const fetchCollections = useCallback(async () => {
        setLoading(true);
        try {
            if (!userId) {
                console.warn("User ID is missing. Cannot fetch collections.");
                return;
            }
            // Fetch user profile to get subscription plan
            if (user) {
                const userRef = doc(db, 'users', user.uid);
                const snap = await getDoc(userRef);
                if (snap.exists()) {
                    const userData = snap.data() as any;
                    setSubscriptionPlan(userData.subscriptionPlan || 'Free');
                    setSubscriptionExpiry(userData.subscriptionExpiry || null);
                } else {
                    setSubscriptionPlan('Free');
                    setSubscriptionExpiry(null);
                }
            }
            const q = query(collection(db, 'userCollections'), where('userId', '==', userId));
            const querySnapshot = await getDocs(q);
            const collectionList = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as CollectionData[];
            setCollections(collectionList);
            setUserCollectionCount(collectionList.length);
        } catch (err: any) {
            console.error(err);
            showToast('Failed to load collections.', 'error');
            setErrorMessage('Failed to load collections.');
        } finally {
            setLoading(false);
        }
    }, [userId, user]);

    useEffect(() => {
        fetchCollections();
    }, [fetchCollections]);

    const subscriptionStatus = useMemo(() => {
        return getSubscriptionStatus(subscriptionPlan, subscriptionExpiry);
    }, [subscriptionPlan, subscriptionExpiry]);

    // Lock scroll when the component mounts (modal opens)
    useEffect(() => {
        lockBodyScroll();

        // Unlock scroll when the component unmounts (modal closes)
        return () => {
            unlockBodyScroll();
        };
    }, [lockBodyScroll, unlockBodyScroll]); // The empty dependency array ensures this runs only on mount/unmount.  Crucially, include lockBodyScroll and unlockBodyScroll

    const filteredCollections = useMemo(() => {
        return collections.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [collections, searchTerm]);

    const handleCreateCollection = async () => {
        if (!newCollectionName.trim()) {
            showToast('Collection name cannot be empty.', 'error');
            setErrorMessage('Collection name cannot be empty.');
            return;
        }

        setIsCreatingCollection(true);
        setErrorMessage(null);
        setSuccessMessage(null);

        // Limit check for QR codes count
        if (qrCodeIds.length > COLLECTION_LIMIT) {
            showToast(`You can add up to ${COLLECTION_LIMIT} QR codes to a collection for the best performance.`, 'error');
            setErrorMessage(`You can add up to ${COLLECTION_LIMIT} QR codes to a collection for the best performance.`);
            setIsCreatingCollection(false);
            return;
        }

        // Plan limit check for collection count
        const collectionLimit = getCollectionLimitForPlan(subscriptionPlan);
        if (userCollectionCount >= collectionLimit) {
            showToast(getUpgradeMessage(subscriptionPlan, 'collections'), 'info');
            setErrorMessage(getUpgradeMessage(subscriptionPlan, 'collections'));
            setIsCreatingCollection(false);
            return;
        }

        try {
            if (!userId) {
                console.warn("User ID is missing. Cannot create collection.");
                showToast('We couldn’t create the collection. User ID is missing.', 'error');
                setErrorMessage('We couldn’t create the collection. User ID is missing.');
                return;
            }

            console.log("Creating collection with userId:", userId, "and qrCodeIds:", qrCodeIds);
            await addDoc(collection(db, 'userCollections'), {
                name: newCollectionName,
                qrCodeIds: qrCodeIds || [], // Ensure qrCodeIds is an array
                createdAt: new Date().toISOString(),
                userId: userId // Ensure the userId is correctly passed
            });
            setNewCollectionName('');
            showToast('Your collection has been created successfully.', 'success');
            setSuccessMessage('Your collection has been created successfully.');
            setActiveTab('existing');
            onCollectionCreated();
            onQrCodesUpdated();
            fetchCollections(); // Refresh collections immediately
        } catch (err: any) {
            console.error(err);
            showToast('We couldn’t create the collection. Please try again later.', 'error');
            setErrorMessage('We couldn’t create the collection. Please try again later.');
        } finally {
            setIsCreatingCollection(false);
        }
    };

    const handleAddToExistingCollection = async () => {
        if (!selectedCollectionId) {
            showToast('Please select a collection first.', 'error');
            setErrorMessage('Please select a collection first.');
            return;
        }

        try {
            const ref = doc(db, 'userCollections', selectedCollectionId);
            const snap = await getDoc(ref);
            if (!snap.exists()) {
                showToast('The selected collection could not be found.', 'error');
                setErrorMessage('The selected collection could not be found.');
                return;
            }

            const data = snap.data() as CollectionData;

            if (data.qrCodeIds.length >= COLLECTION_LIMIT) {
                showToast(`This collection has reached the maximum limit of ${COLLECTION_LIMIT} QR codes.`, 'info');
                setCollectionFullMessage(`This collection has reached the maximum limit of ${COLLECTION_LIMIT} QR codes.`);
                return;
            } else {
                setCollectionFullMessage(null); // Clear the message if it was previously set
            }

            // Limit check for QR codes count
            if (qrCodeIds.length > COLLECTION_LIMIT) {
                showToast(`You can add up to ${COLLECTION_LIMIT} QR codes at once.`, 'error');
                setErrorMessage(`You can add up to ${COLLECTION_LIMIT} QR codes at once.`);
                return;
            }

            const newIds = qrCodeIds.filter(id => !data.qrCodeIds.includes(id));

            if (newIds.length > 0) {
                if (data.qrCodeIds.length + newIds.length > COLLECTION_LIMIT) {
                    showToast(`Adding these QR codes would exceed the limit of ${COLLECTION_LIMIT}. Please select fewer QR codes.`, 'error');
                    setErrorMessage(`Adding these QR codes would exceed the limit of ${COLLECTION_LIMIT}. Please select fewer QR codes.`);
                    return;
                }
                await updateDoc(ref, { qrCodeIds: arrayUnion(...newIds) });
                showToast('Your selected QR codes have been added to the collection.', 'success');
                setSuccessMessage('Your selected QR codes have been added to the collection.');
                onQrCodesUpdated();
                fetchCollections();
            } else {
                showToast('All selected QR codes are already part of this collection.', 'info');
                setSuccessMessage('All selected QR codes are already part of this collection.');
            }
            setSelectedCollectionId(null);
        } catch (err: any) {
            console.error(err);
            showToast('We couldn’t update the collection. Please try again later.', 'error');
            setErrorMessage('We couldn’t update the collection. Please try again later.');
        }
    };

    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const getCollectionUsage = (collectionId: string): number => {
        const collection = collections.find(col => col.id === collectionId);
        return collection ? collection.qrCodeIds.length : 0;
    };

    const CollectionLimitBar = ({ collectionId }: { collectionId: string }) => {
        const usage = getCollectionUsage(collectionId);
        const { percentage } = useMemo(() => {
            return calculateQuotaUsage(usage, COLLECTION_LIMIT);
        }, [usage]);

        if (!selectedCollectionId || selectedCollectionId !== collectionId) return null;

        return (
            <div className="relative pt-1 mt-2">
                <div className="overflow-hidden h-2 mb-1 text-xs flex rounded bg-gray-200">
                    <div
                        style={{ width: `${percentage}%` }}
                        className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500 transition-width duration-500"
                    />
                </div>
                <div className="text-right text-xs text-gray-500">{usage} / {COLLECTION_LIMIT}</div>
            </div>
        );
    };

    if (!userId) return <div>User ID is required</div>;

    return (
        <motion.div
            onClick={handleBackdropClick}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-x-hidden overflow-y-auto"
        >
            <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white w-full max-w-3xl rounded-xl shadow-lg overflow-hidden max-h-[90vh] flex flex-col"
            >
                <header className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-4 flex justify-between items-center">
                    <h2 className="text-lg font-semibold">Save to Collection</h2>
                    <button onClick={onClose}>
                        <XCircle className="w-6 h-6" />
                    </button>
                </header>

                {/* Tabs */}
                <div className="flex space-x-4 px-4 py-2 bg-white border-b">
                    <button
                        className={`flex items-center text-sm font-medium px-3 py-1.5 rounded ${activeTab === 'existing' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-blue-600'}`}
                        onClick={() => setActiveTab('existing')}
                    >
                        <FolderPlus className="h-4 w-4 mr-1" />
                        Existing
                    </button>
                    <button
                        className={`flex items-center text-sm font-medium px-3 py-1.5 rounded ${activeTab === 'new' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-blue-600'}`}
                        onClick={() => setActiveTab('new')}
                    >
                        <Plus className="h-4 w-4 mr-1" />
                        New
                    </button>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                    {activeTab === 'existing' && (
                        <aside className="w-full md:w-1/3 p-4 border-r bg-gray-50 overflow-y-auto">
                            <div className="relative mb-3">
                                <Search className="absolute top-2.5 left-3 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-3 py-2 rounded border shadow-sm focus:ring-2 focus:ring-blue-500 text-sm"
                                />
                            </div>
                            <ul className="space-y-2">
                                {filteredCollections.map(col => (
                                    <li key={col.id}>
                                        <button
                                            onClick={() => setSelectedCollectionId(col.id)}
                                            className={`w-full text-left px-3 py-2 rounded flex justify-between items-center transition ${selectedCollectionId === col.id ? 'bg-blue-100 text-blue-700 font-medium' : 'hover:bg-gray-100'}`}
                                        >
                                            <span className="truncate">{col.name}</span>
                                            {selectedCollectionId === col.id && <CheckCircle className="h-4 w-4" />}
                                        </button>
                                        <CollectionLimitBar collectionId={col.id} />
                                    </li>
                                ))}
                                {!filteredCollections.length && (
                                    <li className="text-gray-400 text-sm text-center py-4">No collections found.</li>
                                )}
                            </ul>
                        </aside>
                    )}

                    <section className="flex-1 p-4 overflow-y-auto">
                        <AnimatePresence>
                            {successMessage && (
                                <motion.div className="text-green-700 bg-green-50 border border-green-200 p-3 rounded mb-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                    {successMessage}
                                </motion.div>
                            )}
                            {errorMessage && (
                                <motion.div className="text-red-700 bg-red-50 border border-red-200 p-3 rounded mb-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                    {errorMessage}
                                </motion.div>
                            )}
                            {collectionFullMessage && (
                                <motion.div className="text-yellow-700 bg-yellow-50 border border-yellow-200 p-3 rounded mb-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                    {collectionFullMessage}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {activeTab === 'existing' ? (
                            <>
                                {qrCodeIds.length > 1 && (
                                    <p className="text-sm text-gray-700 mb-4">
                                        {qrCodeIds.length} QR code{qrCodeIds.length > 1 ? 's' : ''} selected.
                                    </p>
                                )}
                                <button
                                    onClick={handleAddToExistingCollection}
                                    disabled={!selectedCollectionId}
                                    className={`w-full py-3 text-white rounded-lg transition ${selectedCollectionId ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-300 cursor-not-allowed'}`}
                                >
                                    Save to Collection
                                </button>
                            </>
                        ) : (
                            <>
                                <label htmlFor="new-collection" className="block text-sm font-medium text-gray-700 mb-2">
                                    Collection Name
                                </label>
                                <input
                                    id="new-collection"
                                    value={newCollectionName}
                                    onChange={(e) => setNewCollectionName(e.target.value)}
                                    className="w-full mb-4 px-4 py-2 rounded border focus:ring-2 focus:ring-blue-500 text-sm"
                                    placeholder="Enter collection name"
                                />
                                <div className="flex space-x-3">
                                    <button
                                        onClick={() => setActiveTab('existing')}
                                        className="flex-1 py-2 border rounded-lg text-sm hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleCreateCollection}
                                        disabled={isCreatingCollection || !newCollectionName.trim()}
                                        className={`flex-1 py-2 text-white rounded-lg ${isCreatingCollection || !newCollectionName.trim()
                                            ? 'bg-blue-300 cursor-not-allowed'
                                            : 'bg-blue-600 hover:bg-blue-700'
                                            }`}
                                    >
                                        {isCreatingCollection ? 'Creating...' : 'Create'}
                                    </button>
                                </div>
                            </>
                        )}
                    </section>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default CollectionComponent;
