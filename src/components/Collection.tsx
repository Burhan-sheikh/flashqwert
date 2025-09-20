import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  deleteDoc,
  doc,
  updateDoc,
  getDoc,
} from 'firebase/firestore';
import { 
  Eye, MoreVertical, ArrowLeft, ChevronLeft, ChevronRight, 
  ChevronsLeft, ChevronsRight, FolderOpen 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import QRCodeViewModal from '../components/QRCodeViewModal';
import CollectionPDFDownloader from '../components/CollectionPDFDownloader';
import CollectionDeleteModal from '../components/CollectionDeleteModal';
import { QRCodeData } from '../types/qrcode';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { getSubscriptionStatus, shouldShowUpgradePromptWithUsage, getUpgradeMessage, calculateQuotaUsage } from '../utils/subscriptionUtils';
import { getCollectionLimitForPlan } from '../utils/planConfig';

interface CollectionData {
  id: string;
  name: string;
  qrCodeIds?: string[];
  createdAt: string;
  userId: string;
  qrCodeCount?: number;
}

interface CollectionProps {
  limit?: number;
  mode?: 'grid';
  showMoreLink?: boolean;
  isDashboard?: boolean;
}

// Pagination utility function
const generatePaginationPages = (currentPage: number, totalPages: number, isMobile = false) => {
  if (totalPages <= 1) return [];
  if (isMobile) {
    return { currentPage, totalPages };
  }
  const maxVisible = 7;
  const pages: (number | string)[] = [];
  if (totalPages <= maxVisible) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }
  pages.push(1);
  const halfVisible = Math.floor((maxVisible - 2) / 2);
  let start = Math.max(2, currentPage - halfVisible);
  let end = Math.min(totalPages - 1, currentPage + halfVisible);
  if (currentPage <= halfVisible + 1) {
    end = Math.min(maxVisible - 1, totalPages - 1);
  }
  if (currentPage >= totalPages - halfVisible) {
    start = Math.max(2, totalPages - maxVisible + 2);
  }
  if (start > 2) {
    pages.push('...');
  }
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  if (end < totalPages - 1) {
    pages.push('...');
  }
  if (totalPages > 1) {
    pages.push(totalPages);
  }
  return pages.filter((page, index, arr) => {
    return index === 0 || page !== arr[index - 1];
  });
};

const Collection: React.FC<CollectionProps> = ({ 
  limit, 
  mode = 'grid', 
  showMoreLink = false, 
  isDashboard = false 
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Core state
  const [collections, setCollections] = useState<CollectionData[]>([]);
  const [qrCodes, setQrCodes] = useState<QRCodeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscriptionPlan, setSubscriptionPlan] = useState<string>('Free');
  const [collectionLimit, setCollectionLimit] = useState<number>(1);
  const [subscriptionStatus, setSubscriptionStatus] = useState<any>(null);
  
  // UI state
  const [isCollectionMenuOpen, setIsCollectionMenuOpen] = useState<string | null>(null);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [collectionToRename, setCollectionToRename] = useState<CollectionData | null>(null);
  const [isCollectionDeleteModalOpen, setIsCollectionDeleteModalOpen] = useState(false);
  const [collectionToDelete, setCollectionToDelete] = useState<CollectionData | null>(null);
  
  // QR Code view modal
  const [selectedQrCode, setSelectedQrCode] = useState<QRCodeData | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const collectionsPerPage = isDashboard ? (limit || 5) : 10;
  
  // Responsive
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);
  useEffect(() => {
    const handleResize = () => setScreenWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const isMobile = screenWidth <= 700;
  
  const collectionMenuRef = useRef<HTMLDivElement>(null);
  
  // Fetch user profile and data
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      setLoading(true);
      try {
        // Fetch user profile
        const userRef = doc(db, 'users', user.uid);
        const snap = await getDoc(userRef);
        let userData: any | undefined;
        if (snap.exists()) {
          userData = snap.data() as any;
          const status = getSubscriptionStatus(userData.subscriptionPlan || 'Free', userData.subscriptionExpiry || null);
          setSubscriptionStatus(status);
          setSubscriptionPlan(status.planName);
          setCollectionLimit(status.features.collections);
        }
        await Promise.all([fetchCollections(), fetchQRCodes()]);
      } catch (err: any) {
        setError(`Failed to fetch data: ${err.message}`);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);
  
  // Fetch collections
  const fetchCollections = async () => {
    if (!user) return;
    try {
      const collectionsQuery = query(
        collection(db, 'userCollections'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const collectionsSnapshot = await getDocs(collectionsQuery);
      const collectionsList: CollectionData[] = collectionsSnapshot.docs.map(d => ({
        id: d.id,
        ...(d.data() as Omit<CollectionData, 'id'>),
        qrCodeCount: 0,
      }));
      
      setCollections(collectionsList);
    } catch (err: any) {
      setError(`Failed to fetch collections: ${err.message}`);
      console.error(err);
    }
  };
  
  // Fetch QR codes
  const fetchQRCodes = async () => {
    if (!user) return;
    try {
      const qrcodesQuery = query(
        collection(db, 'qrcodes'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const qrCodeSnapshot = await getDocs(qrcodesQuery);
      const qrCodeList = qrCodeSnapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      })) as QRCodeData[];
      
      setQrCodes(qrCodeList);
      
      // Update collection counts
      setCollections(prev => prev.map(col => ({
        ...col,
        qrCodeCount: qrCodeList.filter(qr => col.qrCodeIds?.includes(qr.id)).length
      })));
    } catch (err: any) {
      setError(`Failed to fetch QR codes: ${err.message}`);
      console.error(err);
    }
  };
  
  // Pagination
  const paginatedCollections = useMemo(() => {
    if (isDashboard) return collections.slice(0, limit || 5);
    const startIdx = (currentPage - 1) * collectionsPerPage;
    return collections.slice(startIdx, startIdx + collectionsPerPage);
  }, [collections, currentPage, collectionsPerPage, isDashboard, limit]);
  
  const totalPages = isDashboard ? 1 : Math.max(1, Math.ceil(collections.length / collectionsPerPage));
  const showPagination = !isDashboard && collections.length > collectionsPerPage;
  
  const usage = calculateQuotaUsage(collections.length, collectionLimit);
  const prompt = shouldShowUpgradePromptWithUsage(subscriptionPlan, { collectionsUsed: collections.length });
  const upgradeMessage = getUpgradeMessage(subscriptionPlan, 'collections');
  
  // Handlers
  const handleCollectionSelect = (collection: CollectionData) => {
    navigate(`/collections/${collection.id}`);
  };
  
  const handleCollectionMenuToggle = (collectionId: string) => {
    setIsCollectionMenuOpen(isCollectionMenuOpen === collectionId ? null : collectionId);
  };
  
  const openRenameModal = (collection: CollectionData) => {
    setCollectionToRename(collection);
    setNewCollectionName(collection.name);
    setIsRenameModalOpen(true);
    setIsCollectionMenuOpen(null);
  };
  
  const closeRenameModal = () => {
    setIsRenameModalOpen(false);
    setCollectionToRename(null);
    setNewCollectionName('');
  };
  
  const handleRenameCollection = async () => {
    if (!collectionToRename) return;
    if (!newCollectionName.trim()) {
      showToast('Collection name cannot be empty.', 'error');
      return;
    }
    try {
      const collectionRef = doc(db, 'userCollections', collectionToRename.id);
      await updateDoc(collectionRef, { name: newCollectionName });
      setCollections(prev =>
        prev.map(c => (c.id === collectionToRename.id ? { ...c, name: newCollectionName } : c))
      );
      closeRenameModal();
      showToast('Collection renamed successfully!', 'success');
    } catch (err: any) {
      setError(`Failed to rename collection: ${err.message}`);
      console.error(err);
      showToast(`Failed to rename collection: ${err.message}`, 'error');
    }
  };
  
  const openCollectionDeleteModal = (collection: CollectionData) => {
    setCollectionToDelete(collection);
    setIsCollectionDeleteModalOpen(true);
    setIsCollectionMenuOpen(null);
  };
  
  const closeCollectionDeleteModal = () => {
    setIsCollectionDeleteModalOpen(false);
    setCollectionToDelete(null);
  };
  
  const confirmDeleteCollection = async () => {
    if (!collectionToDelete) return;
    try {
      const collectionDocRef = doc(db, 'userCollections', collectionToDelete.id);
      await deleteDoc(collectionDocRef);
      setCollections(prev => prev.filter(c => c.id !== collectionToDelete.id));
      showToast('Collection deleted successfully!', 'success');
    } catch (err: any) {
      setError(`Failed to delete collection: ${err.message}`);
      console.error(err);
      showToast(`Failed to delete collection: ${err.message}`, 'error');
    } finally {
      closeCollectionDeleteModal();
    }
  };
  
  const getQrCodesForCollection = (collectionItem: CollectionData): QRCodeData[] => {
    if (!qrCodes) return [];
    return qrCodes.filter(qr => collectionItem.qrCodeIds?.includes(qr.id));
  };
  
  const handleViewQRCode = (qrCode: QRCodeData) => {
    setSelectedQrCode(qrCode);
    setModalLoading(true);
    setModalError(null);
    setTimeout(() => setModalLoading(false), 600);
  };
  
  const handleCloseView = () => {
    setSelectedQrCode(null);
    setModalLoading(false);
    setModalError(null);
  };
  
  // Page navigation
  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      setCurrentPage(page);
    }
  }, [currentPage, totalPages]);
  
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
  
  // Click outside handler for menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (collectionMenuRef.current && !collectionMenuRef.current.contains(event.target as Node)) {
        setIsCollectionMenuOpen(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Pagination pages generation
  const paginationPages = useMemo(() => {
    return generatePaginationPages(currentPage, totalPages, isMobile);
  }, [currentPage, totalPages, isMobile]);
  
  // Unified rendering for both dashboard and full page
  const renderCollections = () => {
    if (loading) {
      return (
        <div className="text-center py-8">
          <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading collections...</p>
        </div>
      );
    }
    
    if (collections.length === 0) {
      return (
        <div className="text-center py-8 rounded-xl">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FolderOpen className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No collections yet</h3>
          <p className="text-gray-500 mb-4">Create your first collection to organize QR codes.</p>
          <button
            onClick={() => navigate('/history')}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Go to QR Codes
          </button>
        </div>
      );
    }
    
    return (
      <div className="space-y-6">
        

        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedCollections.map(collectionItem => (
            <motion.div
              key={collectionItem.id}
              className="rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-300 p-4 flex flex-col justify-between"
              layout
              style={{ backgroundColor: '#ebf8ff' }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-grow">
                  <h3
                    className="text-lg font-semibold text-gray-800 hover:underline cursor-pointer"
                    onClick={() => handleCollectionSelect(collectionItem)}
                  >
                    {collectionItem.name}
                    <span className="text-sm text-gray-600 ml-2">
                      ({collectionItem.qrCodeCount})
                    </span>
                  </h3>
                </div>
                <div className="relative" ref={collectionMenuRef}>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      handleCollectionMenuToggle(collectionItem.id);
                    }}
                    className="text-gray-500 hover:text-gray-700 focus:outline-none"
                  >
                    <MoreVertical className="h-5 w-5" />
                  </button>
                  <AnimatePresence>
                    {isCollectionMenuOpen === collectionItem.id && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-xl z-10"
                      >
                        <button
                          onClick={() => openRenameModal(collectionItem)}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:outline-none"
                        >
                          Rename Collection
                        </button>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            openCollectionDeleteModal(collectionItem);
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-100 focus:outline-none"
                        >
                          Delete Collection
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              <hr className="border-gray-300 mt-1 mb-3" />
              <div className="flex flex-col space-y-2">
                {collectionItem.qrCodeCount === 0 ? (
                  <p className="text-gray-500 text-[10px]">This collection is empty.</p>
                ) : (
                  <CollectionPDFDownloader
                    collectionName={collectionItem.name}
                    qrCodeData={getQrCodesForCollection(collectionItem)}
                  />
                )}
                <button
                  onClick={() => handleCollectionSelect(collectionItem)}
                  className="w-full py-2 px-4 bg-blue-500 text-white rounded-xl shadow-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 transition-all duration-300 inline-flex items-center justify-center"
                >
                  <Eye className="h-5 w-5 mr-2" />
                  Open
                </button>
              </div>
            </motion.div>
          ))}
        </div>
        {prompt.show && (
  <div className="mb-6 rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-amber-100 p-4 sm:p-5 shadow-sm">
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      {/* Message */}
      <div className="flex items-start gap-2">
        <div className="h-5 w-5 flex items-center justify-center text-amber-700">
          ⚠️
        </div>
        <p className="text-amber-800 text-xs sm:text-sm leading-relaxed">
          {upgradeMessage}
        </p>
      </div>

      {/* Button */}
      <a
        href="/plans-and-quota"
        className="inline-block rounded-lg bg-amber-500 px-4 py-2 text-xs sm:text-sm font-medium text-white shadow-sm hover:bg-amber-600 transition-colors"
      >
        Upgrade Plan
      </a>
    </div>
  </div>
)}
        
        {showPagination && totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-white border border-gray-200 py-4 px-4 shadow-sm rounded-lg"
          >
            <div className="flex justify-center w-full">
              {isMobile ? (
                <nav className="flex items-center gap-2 bg-white py-1.5 px-2 rounded-lg shadow-sm border border-gray-100">
                  <button
                    className={`p-1 rounded-md transition-colors text-xs ${
                      currentPage > 1
                        ? 'text-gray-500 hover:bg-gray-100'
                        : 'text-gray-300 cursor-not-allowed'
                    }`}
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage <= 1}
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-1.5 py-0.5 text-xs font-medium text-gray-700 select-none">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    className={`p-1 rounded-md transition-colors text-xs ${
                      currentPage < totalPages
                        ? 'text-gray-500 hover:bg-gray-100'
                        : 'text-gray-300 cursor-not-allowed'
                    }`}
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </nav>
              ) : (
                <nav className="flex flex-row items-center justify-center gap-1 bg-white py-3 px-4 rounded-xl shadow-sm border border-gray-100">
                  {currentPage > 3 && (
                    <button
                      className="p-2 rounded-md text-gray-500 hover:bg-gray-100 transition-colors"
                      onClick={() => goToPage(1)}
                    >
                      <ChevronsLeft className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    className={`p-2 rounded-md transition-colors ${
                      currentPage > 1 
                        ? 'text-gray-500 hover:bg-gray-100' 
                        : 'text-gray-300 cursor-not-allowed'
                    }`}
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage <= 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-1">
                    {(paginationPages as (number | string)[]).map((page, index) => (
                      <React.Fragment key={index}>
                        {page === '...' ? (
                          <span className="px-2 text-gray-400 select-none">...</span>
                        ) : (
                          <button
                            onClick={() => goToPage(page as number)}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                              currentPage === page
                                ? 'bg-purple-600 text-white shadow-md'
                                : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                            }`}
                          >
                            {page}
                          </button>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                  <button
                    className={`p-2 rounded-md transition-colors ${
                      currentPage < totalPages 
                        ? 'text-gray-500 hover:bg-gray-100' 
                        : 'text-gray-300 cursor-not-allowed'
                    }`}
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  {currentPage < totalPages - 2 && (
                    <button
                      className="p-2 rounded-md text-gray-500 hover:bg-gray-100 transition-colors"
                      onClick={() => goToPage(totalPages)}
                    >
                      <ChevronsRight className="w-4 h-4" />
                    </button>
                  )}
                </nav>
              )}
            </div>
          </motion.div>
        )}
      </div>
    );
  };

  return (
    <div className="py-2 sm:py-4">
      <ToastContainer
        position="bottom-center"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        toastClassName="shadow-lg"
        style={{ marginBottom: '10px' }}
      />
      {!isDashboard && (
        <div className="relative max-w-6xl mx-auto px-4 w-full">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="w-1 h-12 bg-gradient-to-b from-purple-500 to-indigo-600 rounded-full"></div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  Collections
                </h1>
                <p className="text-gray-600 text-sm mt-1">
                  Organize and manage your QR code collections
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="relative py-3 max-w-6xl mx-auto px-4 w-full">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-red-600 text-sm">!</span>
              </div>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}
        {renderCollections()}
      </div>
      {selectedQrCode && (
        <QRCodeViewModal
          qrCodeData={selectedQrCode}
          onClose={handleCloseView}
          loading={modalLoading}
          error={modalError}
        />
      )}
      <AnimatePresence>
        {isRenameModalOpen && collectionToRename && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={e => {
              if (e.target === e.currentTarget) closeRenameModal();
            }}
            className="fixed inset-0 backdrop-blur-lg overflow-y-auto flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="relative w-full max-w-md p-6 bg-gradient-to-br from-white via-neutral-100 to-white border border-neutral-200 rounded-3xl shadow-xl"
              onClick={e => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold text-slate-800 mb-5 text-center">Rename Collection</h2>
              <div className="space-y-3">
                <label htmlFor="newCollectionName" className="block text-sm font-medium text-slate-600">
                  New Collection Name
                </label>
                <input
                  type="text"
                  id="newCollectionName"
                  value={newCollectionName}
                  onChange={e => setNewCollectionName(e.target.value)}
                  className="block w-full rounded-lg border border-slate-300 px-4 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-all"
                  placeholder="Enter new name"
                />
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={closeRenameModal}
                  className="px-4 py-2 text-sm font-medium rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRenameCollection}
                  disabled={loading || !newCollectionName.trim()}
                  className={`px-4 py-2 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-all ${
                    loading || !newCollectionName.trim() ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  Rename
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <CollectionDeleteModal
        isOpen={isCollectionDeleteModalOpen}
        onClose={closeCollectionDeleteModal}
        onConfirm={confirmDeleteCollection}
        collectionName={collectionToDelete?.name || ''}
      />
    </div>
  );
};

export default Collection;
