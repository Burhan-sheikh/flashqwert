import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/firebase';
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  updateDoc,
  arrayRemove,
} from 'firebase/firestore';
import { QRCodeCanvas } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Eye,
  CheckCircle,
  Grid3X3,
  List,
  SlidersHorizontal,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Trash2,
  FolderOpen,
} from 'lucide-react';
import QRCodeDownloader from '../components/QRCodeDownloader';
import QRCodeViewModal from '../components/QRCodeViewModal';
import BulkRemoveModal from '../components/BulkRemoveModal';
import { QRCodeData } from '../types/qrcode';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { canAccessCollections } from '../utils/planConfig';

const DEFAULT_SETTINGS = {
  viewMode: 'grid' as 'list' | 'grid',
  sortBy: 'date' as 'date' | 'name',
  sortOrder: 'desc' as 'asc' | 'desc',
};

interface CollectionData {
  id: string;
  name: string;
  qrCodeIds?: string[];
  createdAt: string;
  userId: string;
}

function useOutsideClick(ref: React.RefObject<HTMLDivElement>, handler: () => void) {
  useEffect(() => {
    const listener = (event: MouseEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) return;
      handler();
    };
    document.addEventListener('mousedown', listener);
    return () => document.removeEventListener('mousedown', listener);
  }, [ref, handler]);
}

// Settings Modal Component
const SettingsModal = ({
  open, onClose, settings, onChange, onApply
}: {
  open: boolean;
  onClose: () => void;
  settings: any;
  onChange: (settings: any) => void;
  onApply: (settings: any) => void;
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  useOutsideClick(modalRef, onClose);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center"
          style={{ backdropFilter: 'blur(2px)' }}
        >
          <motion.div
            ref={modalRef}
            initial={{ scale: 0.95, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 40 }}
            transition={{ duration: 0.22 }}
            className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 border border-gray-100"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="font-bold text-lg flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-blue-600" />
                Quick Tools
              </div>
              <button className="text-gray-400 hover:text-gray-800" onClick={onClose}>
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-5">
              {/* Toggle View */}
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-700">View</span>
                <button
                  className={`px-4 py-2 rounded-lg flex items-center gap-1 transition 
                    ${settings.viewMode === 'grid'
                    ? 'bg-blue-600 text-white shadow font-bold'
                    : 'bg-gray-100 text-gray-500 hover:bg-blue-50'}`
                  }
                  onClick={() => onChange({ ...settings, viewMode: 'grid' })}
                  aria-label="Grid view"
                >
                  <Grid3X3 className="w-4 h-4" /> Grid
                </button>
                <button
                  className={`px-4 py-2 rounded-lg flex items-center gap-1 transition 
                    ${settings.viewMode === 'list'
                    ? 'bg-blue-600 text-white shadow font-bold'
                    : 'bg-gray-100 text-gray-500 hover:bg-blue-50'}`
                  }
                  onClick={() => onChange({ ...settings, viewMode: 'list' })}
                  aria-label="List view"
                >
                  <List className="w-4 h-4" /> List
                </button>
              </div>
              {/* Sort By */}
              <div className="flex flex-col gap-2">
                <label className="block text-sm font-medium text-gray-700">Sort By</label>
                <div className="flex gap-3">
                  <button
                    className={`px-4 py-2 rounded-lg font-medium transition
                      ${settings.sortBy === 'name'
                        ? 'bg-blue-600 text-white shadow font-bold'
                        : 'bg-gray-100 text-gray-500 hover:bg-blue-50'}`
                    }
                    onClick={() => onChange({ ...settings, sortBy: 'name' })}
                  >Name</button>
                  <button
                    className={`px-4 py-2 rounded-lg font-medium transition
                      ${settings.sortBy === 'date'
                        ? 'bg-blue-600 text-white shadow font-bold'
                        : 'bg-gray-100 text-gray-500 hover:bg-blue-50'}`
                    }
                    onClick={() => onChange({ ...settings, sortBy: 'date' })}
                  >Date</button>
                  <button
                    className={`px-4 py-2 rounded-lg font-medium transition
                      ${settings.sortOrder === 'asc'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-500 hover:bg-blue-50'}`
                    }
                    onClick={() => onChange({ ...settings, sortOrder: 'asc' })}
                  >Asc</button>
                  <button
                    className={`px-4 py-2 rounded-lg font-medium transition
                      ${settings.sortOrder === 'desc'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-500 hover:bg-blue-50'}`
                    }
                    onClick={() => onChange({ ...settings, sortOrder: 'desc' })}
                  >Desc</button>
                </div>
              </div>
              {/* Apply */}
              <div className="flex justify-end">
                <button
                  className="px-5 py-2 font-bold bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
                  onClick={() => onApply(settings)}
                >Apply</button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Enhanced pagination utility function
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

const CollectionDetailPage: React.FC = () => {
  const { collectionId } = useParams<{ collectionId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Core state - FIXED: Renamed 'collection' to 'currentCollection' to avoid naming conflict
  const [currentCollection, setCurrentCollection] = useState<CollectionData | null>(null);
  const [qrCodes, setQrCodes] = useState<QRCodeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscriptionPlan, setSubscriptionPlan] = useState<string>('Free');

  // UI State
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [settingsTmp, setSettingsTmp] = useState(DEFAULT_SETTINGS);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  // Selection state
  const [selectedQrCodeIds, setSelectedQrCodeIds] = useState<string[]>([]);
  const [isSelectMode, setIsSelectMode] = useState(false);

  // Modal state
  const [selectedQrCode, setSelectedQrCode] = useState<QRCodeData | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [isBulkRemoveModalOpen, setIsBulkRemoveModalOpen] = useState(false);
  const [qrCodeToRemove, setQrCodeToRemove] = useState<string | null>(null);
  const [isSingleRemoveModalOpen, setIsSingleRemoveModalOpen] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const qrsPerPage = 50;

  // Responsive
  const [screenWidth, setScreenWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  useEffect(() => {
    const handleResize = () => setScreenWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const isMobile = screenWidth <= 700;

  // Fetch collection and QR codes
  useEffect(() => {
    const fetchData = async () => {
      if (!user || !collectionId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        // Fetch user profile
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data() as any;
          setSubscriptionPlan(userData.subscriptionPlan || 'Free');
        }

        // Fetch collection
        const collectionRef = doc(db, 'userCollections', collectionId);
        const collectionSnap = await getDoc(collectionRef);
        
        if (!collectionSnap.exists()) {
          setError('Collection not found.');
          return;
        }

        const collectionData = { id: collectionSnap.id, ...collectionSnap.data() } as CollectionData;
        
        // Verify user owns this collection
        if (collectionData.userId !== user.uid) {
          setError('You do not have access to this collection.');
          return;
        }

        setCurrentCollection(collectionData);

        // Fetch QR codes in this collection
        if (collectionData.qrCodeIds && collectionData.qrCodeIds.length > 0) {
          const qrcodesQuery = query(
            collection(db, 'qrcodes'), // This should now work correctly
            where('userId', '==', user.uid),
            orderBy('createdAt', 'desc')
          );
          const qrCodeSnapshot = await getDocs(qrcodesQuery);
          const allQrCodes = qrCodeSnapshot.docs.map(d => ({
            id: d.id,
            ...(d.data() as any)
          })) as QRCodeData[];

          // Filter to only QR codes in this collection
          const collectionQrCodes = allQrCodes.filter(qr => 
            collectionData.qrCodeIds!.includes(qr.id)
          );
          setQrCodes(collectionQrCodes);
        } else {
          setQrCodes([]);
        }
      } catch (err: any) {
        setError(`Failed to fetch data: ${err.message}`);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user, collectionId]);

  // Filtering and sorting
  const filteredQrCodes = useMemo(() => {
    let filtered = [...qrCodes];
    filtered.sort((a, b) => {
      if (settings.sortBy === 'name') {
        const nameA = (a.name ?? '').toLowerCase();
        const nameB = (b.name ?? '').toLowerCase();
        return settings.sortOrder === 'asc'
          ? nameA.localeCompare(nameB)
          : nameB.localeCompare(nameA);
      } else {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return settings.sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      }
    });
    return filtered;
  }, [qrCodes, settings]);

  const paginatedQrs = useMemo(() => {
    const startIdx = (currentPage - 1) * qrsPerPage;
    return filteredQrCodes.slice(startIdx, startIdx + qrsPerPage);
  }, [filteredQrCodes, currentPage, qrsPerPage]);

  const totalPages = Math.max(1, Math.ceil(filteredQrCodes.length / qrsPerPage));
  const totalQrCodes = filteredQrCodes.length;
  const showPagination = totalQrCodes > qrsPerPage;

  // Handlers
  const handleRemoveFromCollection = async (qrCodeIds: string | string[]) => {
    if (!currentCollection) return;
    
    try {
      const collectionRef = doc(db, 'userCollections', currentCollection.id);
      const idsToRemove = Array.isArray(qrCodeIds) ? qrCodeIds : [qrCodeIds];
      
      await updateDoc(collectionRef, {
        qrCodeIds: arrayRemove(...idsToRemove)
      });

      // Update local state
      setQrCodes(prev => prev.filter(qr => !idsToRemove.includes(qr.id)));
      setCurrentCollection(prev => prev ? {
        ...prev,
        qrCodeIds: prev.qrCodeIds?.filter(id => !idsToRemove.includes(id))
      } : null);

      showToast('QR code(s) removed from collection successfully!', 'success');
    } catch (err: any) {
      setError(`Failed to remove QR codes: ${err.message}`);
      showToast(`Failed to remove QR codes: ${err.message}`, 'error');
    }
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

  const handleSelectQrCode = (qrCodeId: string) => {
    setSelectedQrCodeIds(prev =>
      prev.includes(qrCodeId)
        ? prev.filter(id => id !== qrCodeId)
        : [...prev, qrCodeId]
    );
  };

  const toggleSelectMode = () => {
    setIsSelectMode(prev => !prev);
    setSelectedQrCodeIds([]);
  };

  const handleBulkRemove = () => {
    if (selectedQrCodeIds.length === 0) {
      showToast('Please select QR codes to remove.', 'error');
      return;
    }
    setIsBulkRemoveModalOpen(true);
  };

  const confirmBulkRemove = async () => {
    try {
      await handleRemoveFromCollection(selectedQrCodeIds);
      setSelectedQrCodeIds([]);
      setIsSelectMode(false);
    } finally {
      setIsBulkRemoveModalOpen(false);
    }
  };

  // Individual QR code removal handlers
  const handleSingleRemove = (qrCodeId: string) => {
    setQrCodeToRemove(qrCodeId);
    setIsSingleRemoveModalOpen(true);
  };

  const confirmSingleRemove = async () => {
    if (qrCodeToRemove) {
      try {
        await handleRemoveFromCollection(qrCodeToRemove);
      } finally {
        setQrCodeToRemove(null);
        setIsSingleRemoveModalOpen(false);
      }
    }
  };

  const cancelSingleRemove = () => {
    setQrCodeToRemove(null);
    setIsSingleRemoveModalOpen(false);
  };

  // Page navigation
  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      setSelectedQrCodeIds([]);
      if (isSelectMode) setIsSelectMode(false);
      setCurrentPage(page);
    }
  }, [currentPage, totalPages, isSelectMode]);

  // Settings handlers
  const openSettingsModal = () => {
    setSettingsTmp(settings);
    setSettingsModalOpen(true);
  };

  const closeSettingsModal = () => {
    setSettingsModalOpen(false);
  };

  const applySettings = (newSettings: any) => {
    setSettings(newSettings);
    setSettingsModalOpen(false);
    setCurrentPage(1);
    setSelectedQrCodeIds([]);
    if (isSelectMode) setIsSelectMode(false);
  };

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

  const getLogoSize = () => {
    return isMobile
      ? (settings.viewMode === 'grid' ? '26%' : '32%')
      : (settings.viewMode === 'grid' ? '20%' : '22%');
  };

  // Pagination components
  const paginationPages = useMemo(() => {
    return generatePaginationPages(currentPage, totalPages, isMobile);
  }, [currentPage, totalPages, isMobile]);

  const BulkActionButtons = () => {
    if (!isSelectMode || selectedQrCodeIds.length === 0) return null;

    return (
      <div className={`mt-3 pt-3 border-t border-gray-200 ${isMobile ? 'flex flex-col gap-2' : 'flex flex-row gap-3'}`}>
        <button
          className={`flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white font-medium rounded-lg transition shadow hover:from-red-600 hover:to-red-700 disabled:opacity-50 ${isMobile ? 'justify-center w-full' : ''}`}
          disabled={loading || !selectedQrCodeIds.length}
          onClick={handleBulkRemove}
        >
          <Trash2 className="w-4 h-4" />
          <span>Remove Selected</span>
        </button>
      </div>
    );
  };

  const TopControlBar = () => {
    const allPageSelected = paginatedQrs.length > 0 && paginatedQrs.every(qr => selectedQrCodeIds.includes(qr.id));

    return (
      <motion.nav
        className="bg-white border border-gray-200 py-3 px-4 shadow-sm rounded-t-lg"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <div className="max-w-full w-full mx-auto">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3 flex-wrap">
              {isSelectMode ? (
                <>
                  <label className="flex items-center gap-1 bg-white border border-gray-200 px-2.5 py-1 rounded-lg shadow-sm">
                    <input
                      type="checkbox"
                      checked={allPageSelected}
                      onChange={() => {
                        const pageIds = paginatedQrs.map(qr => qr.id);
                        const newSelection = allPageSelected
                          ? selectedQrCodeIds.filter(id => !pageIds.includes(id))
                          : [...selectedQrCodeIds, ...pageIds.filter(id => !selectedQrCodeIds.includes(id))];
                        setSelectedQrCodeIds(newSelection);
                      }}
                      className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:outline-none"
                    />
                    <span className="text-sm text-gray-700 pl-1">All</span>
                  </label>
                  <button
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg transition bg-gray-50 hover:bg-red-100 text-red-600 text-sm font-medium"
                    onClick={() => {
                      setSelectedQrCodeIds([]);
                      setIsSelectMode(false);
                    }}
                  >
                    <span>Close</span>
                    <X className="w-4 h-4" />
                  </button>
                  <span className="text-sm font-bold text-blue-800 select-none">
                    {selectedQrCodeIds.length} / 50
                  </span>
                </>
              ) : (
                <button
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold bg-blue-100 text-blue-700 border-none shadow-sm hover:bg-blue-200 transition"
                  onClick={toggleSelectMode}
                >
                  <CheckCircle className="w-5 h-5" />
                  <span className="hidden sm:inline">Select</span>
                </button>
              )}
            </div>

            {!isSelectMode && (
              <div className="flex items-center gap-2">
                <button
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold bg-white text-gray-700 border border-gray-200 shadow-sm hover:bg-blue-50 transition focus:outline-none focus:ring-2 focus:ring-blue-200"
                  onClick={openSettingsModal}
                >
                  <SlidersHorizontal className="w-5 h-5" />
                  <span className="hidden sm:inline">Quick Tools</span>
                </button>
              </div>
            )}
          </div>

          <BulkActionButtons />
        </div>
      </motion.nav>
    );
  };

  if (!user) {
    return <div className="px-4 py-8 text-center text-gray-700">Please log in to view this page.</div>;
  }

  if (!canAccessCollections(subscriptionPlan)) {
    return (
      <div className="py-2 sm:py-4">
        <div className="relative py-3 max-w-6xl mx-auto px-4 w-full">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/collections')}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="w-1 h-12 bg-gradient-to-b from-purple-500 to-indigo-600 rounded-full"></div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  Collection Details
                </h1>
                <p className="text-gray-600 text-sm mt-1">
                  Collections feature
                </p>
              </div>
            </div>
          </div>
          
          <div className="mb-4 text-center max-w-sm mx-auto">
            <a
              href="/plans-and-quota"
              className="flex items-center justify-start gap-4 px-6 py-5 bg-gradient-to-r from-amber-500 to-orange-500 border border-amber-400 rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-transform text-white"
              aria-label="Unlock Collections"
            >
              <div className="p-3 rounded-xl bg-white/20 flex items-center justify-center">
                <FolderOpen className="w-7 h-7 text-white" aria-hidden="true" />
              </div>
              <div className="flex flex-col items-start">
                <span className="text-base font-semibold leading-tight">
                  Unlock Collections
                </span>
                <span className="text-xs text-white/80 tracking-wide">
                  Available with Basic plan and above
                </span>
              </div>
            </a>
          </div>
        </div>
      </div>
    );
  }

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

      <div className="relative py-3 max-w-6xl mx-auto px-4 w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/collections')}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="w-1 h-12 bg-gradient-to-b from-purple-500 to-indigo-600 rounded-full"></div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                {currentCollection?.name || 'Collection'}
              </h1>
              <p className="text-gray-600 text-sm mt-1">
                Manage QR codes in this collection
              </p>
            </div>
          </div>
        </div>

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

        {loading ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">Loading collection...</p>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto px-1 sm:px-6 lg:px-8">
            <div className="space-y-0">
              <TopControlBar />

              <SettingsModal
                open={settingsModalOpen}
                onClose={closeSettingsModal}
                settings={settingsTmp}
                onChange={setSettingsTmp}
                onApply={applySettings}
              />

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.08 }}
                className="bg-white border border-gray-200 border-t-0 border-b-0 p-2 sm:p-6 shadow-sm"
              >
                {filteredQrCodes.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FolderOpen className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Collection is empty</h3>
                    <p className="text-gray-500 mb-4">Add QR codes to this collection from your history</p>
                    <button
                      onClick={() => navigate('/history')}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
                    >
                      Go to QR Codes
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-center mb-2 text-gray-600">
                      <span className="text-sm">{`Showing ${paginatedQrs.length} of ${totalQrCodes} QR Codes`}</span>
                    </div>
                    <div
                      className={
                        settings.viewMode === 'grid'
                          ? "grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6"
                          : "space-y-3"
                      }
                      style={{ marginBottom: '15px' }}
                    >
                      {paginatedQrs.map(qrCode => (
                        <motion.div
                          key={qrCode.id}
                          initial={{ opacity: 0, y: 30 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.23 }}
                          className={`relative group ${
                            settings.viewMode === 'grid'
                              ? "bg-gray-50 border border-gray-200 rounded-lg p-2 shadow-sm hover:shadow-lg transition"
                              : "bg-gray-50 border border-gray-200 rounded-lg p-2 shadow-sm hover:shadow-lg transition"
                          }`}
                        >
                          {settings.viewMode === 'grid' ? (
                            <>
                              <div className="mb-2">
                                <div
                                  className="bg-white rounded-lg flex items-center justify-center p-2 relative overflow-hidden cursor-pointer w-full aspect-square"
                                  onClick={() => handleViewQRCode(qrCode)}
                                >
                                  <QRCodeCanvas
                                    value={qrCode.url}
                                    size={isMobile ? 96 : 160}
                                    bgColor={qrCode.backgroundColor}
                                    fgColor={qrCode.color}
                                    level={qrCode.errorCorrectionLevel}
                                    includeMargin={false}
                                  />
                                  {qrCode.logoDataUrl && (
                                    <img
                                      src={qrCode.logoDataUrl}
                                      alt=""
                                      className="absolute rounded-full bg-white p-0.5 object-contain"
                                      style={{
                                        width: getLogoSize(), height: getLogoSize(),
                                        top: '50%', left: '50%', transform: 'translate(-50%,-50%)'
                                      }}
                                    />
                                  )}
                                </div>
                              </div>
                              <div className="px-1 min-h-[32px] align-middle text-center">
                                <div className="font-semibold text-gray-900 text-xs truncate" title={qrCode.name}>
                                  {qrCode.name || 'Untitled'}
                                </div>
                                <div className="text-xs text-gray-600 truncate">{qrCode.url}</div>
                              </div>
                              {!isSelectMode && (
                                <div className="flex items-center justify-between mt-2 px-2">
                                  <button
                                    className="p-2 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-700 transition"
                                    onClick={() => handleViewQRCode(qrCode)}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  <QRCodeDownloader qrCodeData={qrCode} />
                                  <button
                                    className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-700 transition"
                                    onClick={() => handleSingleRemove(qrCode.id)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              )}
                              {isSelectMode && (
                                <div className="mt-2 border-t border-gray-200 flex justify-center pt-2">
                                  <input
                                    type="checkbox"
                                    checked={selectedQrCodeIds.includes(qrCode.id)}
                                    onChange={() => handleSelectQrCode(qrCode.id)}
                                    className="w-5 h-5 text-blue-600 border-gray-300 rounded"
                                  />
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="flex flex-row items-center">
                              <div className="mr-3 flex-shrink-0">
                                <div
                                  className={`${isMobile ? 'w-12 h-12' : 'w-16 h-16'} bg-white rounded-lg flex items-center justify-center relative overflow-hidden cursor-pointer`}
                                  onClick={() => handleViewQRCode(qrCode)}
                                >
                                  <QRCodeCanvas
                                    value={qrCode.url}
                                    size={isMobile ? 44 : 60}
                                    bgColor={qrCode.backgroundColor}
                                    fgColor={qrCode.color}
                                    level={qrCode.errorCorrectionLevel}
                                    includeMargin={false}
                                  />
                                  {qrCode.logoDataUrl && (
                                    <img
                                      src={qrCode.logoDataUrl}
                                      alt=""
                                      className="absolute rounded-full bg-white p-0.5 object-contain"
                                      style={{
                                        width: getLogoSize(), height: getLogoSize(),
                                        top: '50%', left: '50%', transform: 'translate(-50%,-50%)'
                                      }}
                                    />
                                  )}
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-bold text-gray-800 truncate">{qrCode.name || 'Untitled'}</div>
                                <div className="text-xs text-gray-500 truncate">{qrCode.url}</div>
                              </div>
                              <div className="flex items-center ml-2">
                                {!isSelectMode && (
                                  <>
                                    <button
                                      className="p-2 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-700 transition"
                                      onClick={() => handleViewQRCode(qrCode)}
                                    >
                                      <Eye className="w-4 h-4" />
                                    </button>
                                    <QRCodeDownloader qrCodeData={qrCode} />
                                    <button
                                      className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-700 transition"
                                      onClick={() => handleSingleRemove(qrCode.id)}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </>
                                )}
                                {isSelectMode && (
                                  <input
                                    type="checkbox"
                                    checked={selectedQrCodeIds.includes(qrCode.id)}
                                    onChange={() => handleSelectQrCode(qrCode.id)}
                                    className="w-5 h-5 text-blue-600 border-gray-300 rounded"
                                  />
                                )}
                              </div>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </>
                )}
              </motion.div>

              {/* Pagination */}
              {showPagination && totalPages > 1 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="bg-white border border-gray-200 border-t-0 py-4 px-4 shadow-sm"
                >
                  <div className="flex justify-center w-full">
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
                        {Array.isArray(paginationPages) ? (
                          (paginationPages as (number | string)[]).map((page, index) => (
                            <React.Fragment key={index}>
                              {page === '...' ? (
                                <span className="px-2 text-gray-400 select-none">...</span>
                              ) : (
                                <button
                                  onClick={() => goToPage(page as number)}
                                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                                    currentPage === page
                                      ? 'bg-blue-600 text-white shadow-md'
                                      : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                                  }`}
                                >
                                  {page}
                                </button>
                              )}
                            </React.Fragment>
                          ))
                        ) : (
                          <span>
                            Page {(paginationPages as any).currentPage} of {(paginationPages as any).totalPages}
                          </span>
                        )}
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
                  </div>
                </motion.div>
              )}

              {/* Bottom Control Bar */}
              <motion.nav
                className="bg-white border border-gray-200 border-t-0 py-3 px-4 shadow-sm rounded-b-lg"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="max-w-full w-full mx-auto">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3 flex-wrap">
                      {isSelectMode ? (
                        <>
                          <label className="flex items-center gap-1 bg-white border border-gray-200 px-2.5 py-1 rounded-lg shadow-sm">
                            <input
                              type="checkbox"
                              checked={paginatedQrs.length > 0 && paginatedQrs.every(qr => selectedQrCodeIds.includes(qr.id))}
                              onChange={() => {
                                const pageIds = paginatedQrs.map(qr => qr.id);
                                const allPageSelected = pageIds.every(id => selectedQrCodeIds.includes(id));
                                const newSelection = allPageSelected
                                  ? selectedQrCodeIds.filter(id => !pageIds.includes(id))
                                  : [...selectedQrCodeIds, ...pageIds.filter(id => !selectedQrCodeIds.includes(id))];
                                setSelectedQrCodeIds(newSelection);
                              }}
                              className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:outline-none"
                            />
                            <span className="text-sm text-gray-700 pl-1">All</span>
                          </label>

                          <button
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg transition bg-gray-50 hover:bg-red-100 text-red-600 text-sm font-medium"
                            onClick={() => {
                              setSelectedQrCodeIds([]);
                              setIsSelectMode(false);
                            }}
                          >
                            <span>Close</span>
                            <X className="w-4 h-4" />
                          </button>

                          <span className="text-sm font-bold text-blue-800 select-none">
                            {selectedQrCodeIds.length} / 50
                          </span>
                        </>
                      ) : (
                        <button
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold bg-blue-100 text-blue-700 border-none shadow-sm hover:bg-blue-200 transition"
                          onClick={toggleSelectMode}
                        >
                          <CheckCircle className="w-5 h-5" />
                          <span className="hidden sm:inline">Select</span>
                        </button>
                      )}
                    </div>

                    {!isSelectMode && (
                      <div className="flex items-center gap-2">
                        <button
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold bg-white text-gray-700 border border-gray-200 shadow-sm hover:bg-blue-50 transition focus:outline-none focus:ring-2 focus:ring-blue-200"
                          onClick={openSettingsModal}
                        >
                          <SlidersHorizontal className="w-5 h-5" />
                          <span className="hidden sm:inline">Quick Tools</span>
                        </button>
                      </div>
                    )}
                  </div>

                  <BulkActionButtons />
                </div>
              </motion.nav>
            </div>
          </div>
        )}
      </div>

      {/* QR Code View Modal */}
      {selectedQrCode && (
        <QRCodeViewModal
          qrCodeData={selectedQrCode}
          onClose={handleCloseView}
          loading={modalLoading}
          error={modalError}
        />
      )}

      {/* Bulk Remove Modal */}
      <BulkRemoveModal
        isOpen={isBulkRemoveModalOpen}
        onClose={() => setIsBulkRemoveModalOpen(false)}
        onConfirm={confirmBulkRemove}
        selectedCount={selectedQrCodeIds.length}
      />

      {/* Single Remove Modal */}
      <BulkRemoveModal
        isOpen={isSingleRemoveModalOpen}
        onClose={cancelSingleRemove}
        onConfirm={confirmSingleRemove}
        selectedCount={1}
      />
    </div>
  );
};

export default CollectionDetailPage;