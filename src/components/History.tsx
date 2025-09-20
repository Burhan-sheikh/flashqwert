import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  getDoc,
  writeBatch,
} from 'firebase/firestore';
import { QRCodeCanvas } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Eye,
  Trash2,
  CheckCircle,
  Grid3X3,
  List,
  SlidersHorizontal,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  Filter,
  Calendar,
  Tag,
  FolderOpen,
  Edit3,
  BarChart3,
  CloudUpload,
} from 'lucide-react';
import QRCodeDownloader from './QRCodeDownloader';
import QRCodeViewModal from './QRCodeViewModal';
import BulkDeleteModal from './BulkDeleteModal';
import CollectionComponent from './CollectionComponent';
import { QRCodeData, getQRValue, isStaticQR, isDynamicQR } from '../types/qrcode';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { generatePaginationPages } from '../utils/pagination';
import { 
  getSubscriptionStatus, 
  shouldShowUpgradePromptWithUsage, 
  getUpgradeMessage,
  calculateQuotaUsage 
} from '../utils/subscriptionUtils';
import { 
  canAccessHistory, 
  getHistoryStorageForPlan 
} from '../utils/planConfig';

const DEFAULT_SETTINGS = {
  viewMode: 'grid' as 'list' | 'grid',
  sortBy: 'date' as 'date' | 'name' | 'type',
  sortOrder: 'desc' as 'asc' | 'desc',
  filterType: 'all' as 'all' | 'static' | 'dynamic',
};

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

              {/* Filter Type */}
              <div className="flex flex-col gap-2">
                <label className="block text-sm font-medium text-gray-700">Filter by Type</label>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { value: 'all', label: 'All' },
                    { value: 'static', label: 'Static' },
                    { value: 'dynamic', label: 'Dynamic' }
                  ].map(option => (
                    <button
                      key={option.value}
                      className={`px-3 py-1.5 rounded-lg font-medium transition text-sm
                        ${settings.filterType === option.value
                          ? 'bg-blue-600 text-white shadow font-bold'
                          : 'bg-gray-100 text-gray-500 hover:bg-blue-50'}`
                      }
                      onClick={() => onChange({ ...settings, filterType: option.value })}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort By */}
              <div className="flex flex-col gap-2">
                <label className="block text-sm font-medium text-gray-700">Sort By</label>
                <div className="flex gap-3 flex-wrap">
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
                      ${settings.sortBy === 'type'
                        ? 'bg-blue-600 text-white shadow font-bold'
                        : 'bg-gray-100 text-gray-500 hover:bg-blue-50'}`
                    }
                    onClick={() => onChange({ ...settings, sortBy: 'type' })}
                  >Type</button>
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

const History: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Core state
  const [qrCodes, setQrCodes] = useState<QRCodeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscriptionPlan, setSubscriptionPlan] = useState<string>('Free');
  const [subscriptionExpiry, setSubscriptionExpiry] = useState<string | null>(null);
  const [historyStorage, setHistoryStorage] = useState<number>(30);

  // UI State
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [settingsTmp, setSettingsTmp] = useState(DEFAULT_SETTINGS);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [searchQuery, setSearchQuery] = useState('');

  // Selection state
  const [selectedQrCodeIds, setSelectedQrCodeIds] = useState<string[]>([]);
  const [isSelectMode, setIsSelectMode] = useState(false);

  // Modal state
  const [selectedQrCode, setSelectedQrCode] = useState<QRCodeData | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);

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

  // Get search query from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const searchParam = urlParams.get('search');
    if (searchParam) {
      setSearchQuery(searchParam);
    }
  }, [location.search]);

  // Fetch user profile and QR codes
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      setLoading(true);
      try {
        // Fetch user profile
        const userRef = doc(db, 'users', user.uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          const userData = snap.data() as any;
          const status = getSubscriptionStatus(userData.subscriptionPlan || 'Free', userData.subscriptionExpiry || null);
          setSubscriptionPlan(status.planName);
          setSubscriptionExpiry(userData.subscriptionExpiry || null);
          setHistoryStorage(status.features.historyStorage);
        }
        await fetchQRCodes();
      } catch (err: any) {
        setError(`Failed to fetch data: ${err.message}`);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

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
    } catch (err: any) {
      setError(`Failed to fetch QR codes: ${err.message}`);
      console.error(err);
    }
  };

  // Filtering and sorting
  const filteredQrCodes = useMemo(() => {
    let filtered = [...qrCodes];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(qr =>
        qr.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        getQRValue(qr).toLowerCase().includes(searchQuery.toLowerCase()) ||
        (isDynamicQR(qr) && qr.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())))
      );
    }

    // Type filter
    if (settings.filterType !== 'all') {
      filtered = filtered.filter(qr => qr.type === settings.filterType);
    }

    // Sort
    filtered.sort((a, b) => {
      if (settings.sortBy === 'name') {
        const nameA = (a.name ?? '').toLowerCase();
        const nameB = (b.name ?? '').toLowerCase();
        return settings.sortOrder === 'asc'
          ? nameA.localeCompare(nameB)
          : nameB.localeCompare(nameA);
      } else if (settings.sortBy === 'type') {
        const typeA = a.type;
        const typeB = b.type;
        return settings.sortOrder === 'asc'
          ? typeA.localeCompare(typeB)
          : typeB.localeCompare(typeA);
      } else {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return settings.sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      }
    });

    return filtered;
  }, [qrCodes, searchQuery, settings]);

  const paginatedQrs = useMemo(() => {
    const startIdx = (currentPage - 1) * qrsPerPage;
    return filteredQrCodes.slice(startIdx, startIdx + qrsPerPage);
  }, [filteredQrCodes, currentPage, qrsPerPage]);

  const totalPages = Math.max(1, Math.ceil(filteredQrCodes.length / qrsPerPage));
  const totalQrCodes = filteredQrCodes.length;
  const showPagination = totalQrCodes > qrsPerPage;

  // Check if user can access history
  const canAccess = canAccessHistory(subscriptionPlan);
  const usage = calculateQuotaUsage(qrCodes.length, historyStorage);
  const prompt = shouldShowUpgradePromptWithUsage(subscriptionPlan, { historyUsed: qrCodes.length });
  const upgradeMessage = getUpgradeMessage(subscriptionPlan, 'history');

  // Handlers
  const handleDeleteQRCode = async (qrCodeIds: string | string[]) => {
    const idsToDelete = Array.isArray(qrCodeIds) ? qrCodeIds : [qrCodeIds];
    
    try {
      const batch = writeBatch(db);
      idsToDelete.forEach(id => {
        const qrCodeDoc = doc(db, 'qrcodes', id);
        batch.delete(qrCodeDoc);
      });
      await batch.commit();

      setQrCodes(prev => prev.filter(qr => !idsToDelete.includes(qr.id)));
      showToast('QR code(s) deleted successfully!', 'success');
    } catch (err: any) {
      setError(`Failed to delete QR codes: ${err.message}`);
      showToast(`Failed to delete QR codes: ${err.message}`, 'error');
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

  const handleBulkDelete = () => {
    if (selectedQrCodeIds.length === 0) {
      showToast('Please select QR codes to delete.', 'error');
      return;
    }
    setIsBulkDeleteModalOpen(true);
  };

  const confirmBulkDelete = async () => {
    try {
      await handleDeleteQRCode(selectedQrCodeIds);
      setSelectedQrCodeIds([]);
      setIsSelectMode(false);
    } finally {
      setIsBulkDeleteModalOpen(false);
    }
  };

  const handleSaveToCollection = () => {
    if (selectedQrCodeIds.length === 0) {
      showToast('Please select QR codes to save to collection.', 'error');
      return;
    }
    setIsCollectionModalOpen(true);
  };

  const handleEditQRCode = (qrCode: QRCodeData) => {
    if (isDynamicQR(qrCode)) {
      navigate(`/edit/${qrCode.id}`);
    } else {
      navigate(`/edit/${qrCode.id}`);
    }
  };

  const handleAnalyzeQRCode = (qrCode: QRCodeData) => {
    if (isDynamicQR(qrCode)) {
      navigate(`/analyse/${qrCode.id}`);
    }
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
          className={`flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-lg transition shadow hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 ${isMobile ? 'justify-center w-full' : ''}`}
          disabled={loading || !selectedQrCodeIds.length}
          onClick={handleSaveToCollection}
        >
          <FolderOpen className="w-4 h-4" />
          <span>Save to Collection</span>
        </button>
        <button
          className={`flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white font-medium rounded-lg transition shadow hover:from-red-600 hover:to-red-700 disabled:opacity-50 ${isMobile ? 'justify-center w-full' : ''}`}
          disabled={loading || !selectedQrCodeIds.length}
          onClick={handleBulkDelete}
        >
          <Trash2 className="w-4 h-4" />
          <span>Delete Selected</span>
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

  if (!canAccess) {
    return (
      <div className="py-2 sm:py-4">
        <div className="relative py-3 max-w-6xl mx-auto px-4 w-full">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="w-1 h-12 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full"></div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  QR Code History
                </h1>
                <p className="text-gray-600 text-sm mt-1">
                  Access your saved QR codes
                </p>
              </div>
            </div>
          </div>
          
          <div className="mb-4 text-center max-w-sm mx-auto">
            <a
              href="/plans-and-quota"
              className="flex items-center justify-start gap-4 px-6 py-5 bg-gradient-to-r from-emerald-500 to-emerald-600 border border-emerald-400 rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-transform text-white"
              aria-label="Unlock QR History"
            >
              <div className="p-3 rounded-xl bg-white/20 flex items-center justify-center">
                <CloudUpload className="w-7 h-7 text-white" aria-hidden="true" />
              </div>
              <div className="flex flex-col items-start">
                <span className="text-base font-semibold leading-tight">
                  Get History Access
                </span>
                <span className="text-xs text-white/80 tracking-wide">
                  Available with any paid plan
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
              onClick={() => navigate('/dashboard')}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="w-1 h-12 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full"></div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                QR Code History
              </h1>
              <p className="text-gray-600 text-sm mt-1">
                Manage and organize your QR codes
              </p>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search QR codes..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Upgrade Prompt */}
        {prompt.show && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-amber-100 p-4 sm:p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-start gap-2">
                <div className="h-5 w-5 flex items-center justify-center text-amber-700">
                  ⚠️
                </div>
                <p className="text-amber-800 text-xs sm:text-sm leading-relaxed">
                  {upgradeMessage}
                </p>
              </div>
              <a
                href="/plans-and-quota"
                className="inline-block rounded-lg bg-amber-500 px-4 py-2 text-xs sm:text-sm font-medium text-white shadow-sm hover:bg-amber-600 transition-colors"
              >
                Upgrade Plan
              </a>
            </div>
          </div>
        )}

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
            <p className="text-gray-600 text-lg">Loading QR codes...</p>
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
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No QR codes found</h3>
                    <p className="text-gray-500 mb-4">
                      {searchQuery ? 'No QR codes match your search.' : 'Create your first QR code to get started.'}
                    </p>
                    <button
                      onClick={() => navigate('/static-code')}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
                    >
                      Create QR Code
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
                              {/* Type Badge */}
                              <div className="absolute top-2 right-2 z-10">
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  qrCode.type === 'dynamic' 
                                    ? 'bg-purple-100 text-purple-700' 
                                    : 'bg-blue-100 text-blue-700'
                                }`}>
                                  {qrCode.type === 'dynamic' ? 'Dynamic' : 'Static'}
                                </span>
                              </div>

                              <div className="mb-2">
                                <div
                                  className="bg-white rounded-lg flex items-center justify-center p-2 relative overflow-hidden cursor-pointer w-full aspect-square"
                                  onClick={() => handleViewQRCode(qrCode)}
                                >
                                  <QRCodeCanvas
                                    value={getQRValue(qrCode)}
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
                                <div className="text-xs text-gray-600 truncate">{getQRValue(qrCode)}</div>
                              </div>
                              {!isSelectMode && (
                                <div className="flex items-center justify-between mt-2 px-2">
                                  <button
                                    className="p-2 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-700 transition"
                                    onClick={() => handleViewQRCode(qrCode)}
                                    title="View QR Code"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  {isDynamicQR(qrCode) && (
                                    <>
                                      <button
                                        className="p-2 rounded-lg hover:bg-green-50 text-gray-400 hover:text-green-700 transition"
                                        onClick={() => handleEditQRCode(qrCode)}
                                        title="Edit QR Code"
                                      >
                                        <Edit3 className="w-4 h-4" />
                                      </button>
                                      <button
                                        className="p-2 rounded-lg hover:bg-purple-50 text-gray-400 hover:text-purple-700 transition"
                                        onClick={() => handleAnalyzeQRCode(qrCode)}
                                        title="View Analytics"
                                      >
                                        <BarChart3 className="w-4 h-4" />
                                      </button>
                                    </>
                                  )}
                                  <QRCodeDownloader qrCodeData={qrCode} />
                                  <button
                                    className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-700 transition"
                                    onClick={() => handleDeleteQRCode(qrCode.id)}
                                    title="Delete QR Code"
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
                                    value={getQRValue(qrCode)}
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
                                <div className="flex items-center gap-2">
                                  <div className="font-bold text-gray-800 truncate">{qrCode.name || 'Untitled'}</div>
                                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                    qrCode.type === 'dynamic' 
                                      ? 'bg-purple-100 text-purple-700' 
                                      : 'bg-blue-100 text-blue-700'
                                  }`}>
                                    {qrCode.type === 'dynamic' ? 'Dynamic' : 'Static'}
                                  </span>
                                </div>
                                <div className="text-xs text-gray-500 truncate">{getQRValue(qrCode)}</div>
                              </div>
                              <div className="flex items-center ml-2">
                                {!isSelectMode && (
                                  <>
                                    <button
                                      className="p-2 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-700 transition"
                                      onClick={() => handleViewQRCode(qrCode)}
                                      title="View QR Code"
                                    >
                                      <Eye className="w-4 h-4" />
                                    </button>
                                    {isDynamicQR(qrCode) && (
                                      <>
                                        <button
                                          className="p-2 rounded-lg hover:bg-green-50 text-gray-400 hover:text-green-700 transition"
                                          onClick={() => handleEditQRCode(qrCode)}
                                          title="Edit QR Code"
                                        >
                                          <Edit3 className="w-4 h-4" />
                                        </button>
                                        <button
                                          className="p-2 rounded-lg hover:bg-purple-50 text-gray-400 hover:text-purple-700 transition"
                                          onClick={() => handleAnalyzeQRCode(qrCode)}
                                          title="View Analytics"
                                        >
                                          <BarChart3 className="w-4 h-4" />
                                        </button>
                                      </>
                                    )}
                                    <QRCodeDownloader qrCodeData={qrCode} />
                                    <button
                                      className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-700 transition"
                                      onClick={() => handleDeleteQRCode(qrCode.id)}
                                      title="Delete QR Code"
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
                  className="bg-white border border-gray-200 border-t-0 border-b-0 py-4 px-4 shadow-sm"
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
                                      ? 'bg-blue-600 text-white shadow-md'
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

      {/* Bulk Delete Modal */}
      <BulkDeleteModal
        isOpen={isBulkDeleteModalOpen}
        onClose={() => setIsBulkDeleteModalOpen(false)}
        onConfirm={confirmBulkDelete}
        selectedCount={selectedQrCodeIds.length}
        isBulkDelete={true}
      />

      {/* Collection Modal */}
      {isCollectionModalOpen && (
        <CollectionComponent
          userId={user.uid}
          qrCodeIds={selectedQrCodeIds}
          onClose={() => setIsCollectionModalOpen(false)}
          onCollectionCreated={() => {
            setIsCollectionModalOpen(false);
            setSelectedQrCodeIds([]);
            setIsSelectMode(false);
          }}
          onQrCodesUpdated={() => {
            setSelectedQrCodeIds([]);
            setIsSelectMode(false);
          }}
          qrCodeData={qrCodes.filter(qr => selectedQrCodeIds.includes(qr.id))}
        />
      )}
    </div>
  );
};

export default History;