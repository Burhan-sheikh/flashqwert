import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  getDoc,
  doc,
  deleteDoc,
  getCountFromServer,
} from 'firebase/firestore';
import {
  ArrowRight,
  Trash2,
  QrCode,
  Eye,
  Edit3,
  BarChart3,
  ExternalLink,
  Zap,
  Target
} from 'lucide-react';
import { isPast } from 'date-fns';
import { motion } from 'framer-motion';
import { QRCodeData, getQRValue, isStaticQR, isDynamicQR } from '../types/qrcode';
import Collection from './Collection';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import QRCodeDownloader from './QRCodeDownloader';
import { QRCodeCanvas } from 'qrcode.react';
import QRCodeViewModal from './QRCodeViewModal';
import BulkDeleteModal from './BulkDeleteModal';
import { getCollectionLimitForPlan, getQuotaForPlan } from '../utils/planConfig';
import { getSubscriptionStatus } from '../utils/subscriptionUtils';

interface CollectionData {
  id: string;
  name: string;
  qrCodeIds?: string[];
  createdAt: string;
  userId: string;
  qrCodeCount?: number;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [subscriptionPlan, setSubscriptionPlan] = useState<string>('Free');
  const [qrCodesGenerated, setQrCodesGenerated] = useState<number>(0);
  const [subscriptionExpiry, setSubscriptionExpiry] = useState<string | null>(null);
  const [totalQuota, setTotalQuota] = useState<number>(30);

  const [recentQrCodes, setRecentQrCodes] = useState<QRCodeData[]>([]);
  const [recentCollections, setRecentCollections] = useState<CollectionData[]>([]);

  const [totalQrCodesCount, setTotalQrCodesCount] = useState<number>(0);
  const [totalCollectionsCount, setTotalCollectionsCount] = useState<number>(0);

  const [selectedQrCode, setSelectedQrCode] = useState<QRCodeData | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [qrCodeToDelete, setQrCodeToDelete] = useState<string | null>(null);

  const [screenWidth, setScreenWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);

  useEffect(() => {
    const handleResize = () => setScreenWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = screenWidth <= 700;
  const subscriptionExpired = subscriptionExpiry ? isPast(new Date(subscriptionExpiry)) : false;

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

  const fetchRecentData = useCallback(
    async () => {
      if (!user) return;
      try {
        const qrcodesQuery = query(
          collection(db, 'qrcodes'),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc'),
          limit(12)
        );
        const qrCodeSnapshot = await getDocs(qrcodesQuery);
        const qrCodeList = qrCodeSnapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as QRCodeData[];
        setRecentQrCodes(qrCodeList);

        const qrCountQuery = query(collection(db, 'qrcodes'), where('userId', '==', user.uid));
        const qrCountSnap = await getCountFromServer(qrCountQuery);
        setTotalQrCodesCount(qrCountSnap.data().count);

        const collectionsQuery = query(
          collection(db, 'userCollections'),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc'),
          limit(6)
        );
        const collectionsSnapshot = await getDocs(collectionsQuery);
        const collectionsList = collectionsSnapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<CollectionData, 'id'>),
          qrCodeCount: (d.data() as any).qrCodeIds?.length || 0,
        }));
        setRecentCollections(collectionsList);

        const collectionsCountQuery = query(collection(db, 'userCollections'), where('userId', '==', user.uid));
        const collectionsCountSnap = await getCountFromServer(collectionsCountQuery);
        setTotalCollectionsCount(collectionsCountSnap.data().count);

      } catch (err: any) {
        setError(`Failed to fetch recent data: ${err.message}`);
        console.error(err);
      }
    },
    [user]
  );

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) {
        navigate('/login');
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const userRef = doc(db, 'users', user.uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          const userData = snap.data() as any;
          const planFromProfile: string = userData.subscriptionPlan || 'Free';
          setSubscriptionPlan(planFromProfile);
          setQrCodesGenerated(userData.qrCodesGenerated || 0);
          setSubscriptionExpiry(userData.subscriptionExpiry || null);
          setTotalQuota(userData.quota || 30);
          await fetchRecentData();
        } else {
          setError('User profile not found.');
        }
      } catch (err: any) {
        setError(`Failed to fetch data: ${err.message}`);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchUserProfile();
  }, [user, navigate, fetchRecentData]);

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

  const handleDeleteQRCode = (qrCodeId: string) => {
    setQrCodeToDelete(qrCodeId);
    setShowDeleteModal(true);
  };

  const confirmDeleteQRCode = async () => {
    if (!qrCodeToDelete) return;
    try {
      const qrCodeDoc = doc(db, 'qrcodes', qrCodeToDelete);
      await deleteDoc(qrCodeDoc);
      setRecentQrCodes((prev) => prev.filter((q) => q.id !== qrCodeToDelete));
      showToast('QR code deleted successfully!', 'success');
    } catch (err: any) {
      setError(`Failed to delete QR code: ${err.message}`);
      showToast(`Failed to delete QR code: ${err.message}`, 'error');
    } finally {
      setShowDeleteModal(false);
      setQrCodeToDelete(null);
    }
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setQrCodeToDelete(null);
  };

  if (!user) {
    return <div className="px-4 py-8 text-center text-gray-700">Please log in to view this page.</div>;
  }

  // Fetch subscription status
  const subscriptionStatus = getSubscriptionStatus(subscriptionPlan, subscriptionExpiry);

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
      <div className="relative max-w-6xl mx-auto px-3 sm:px-4 w-full">
        <div className="relative">
          {error && (
            <div
              className="mb-6 bg-red-50 border border-red-200 rounded-2xl p-4"
              role="alert"
              aria-live="polite"
            >
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
              <div className="w-14 h-14 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-600 text-base sm:text-lg">Loading your dashboard...</p>
            </div>
          ) : (
            <>
              <div className="space-y-8">
                <section
                  aria-labelledby="recent-qrs-heading"
                  className="border border-gray-100 rounded-2xl shadow-sm bg-white"
                >
                  <div className="bg-white flex justify-between border-b border-gray-200 px-5 sm:px-6 py-4 rounded-t-2xl shadow-sm">
                    <h2
                      id="recent-qrs-heading"
                      className="text-sm font-semibold text-gray-900"
                    >
                      Recent QR Codes
                    </h2>

                    {recentQrCodes.length > 0 && (
                      <button
                        onClick={() => navigate('/history')}
                        className="mt-2 sm:mt-0 flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition-colors text-xs"
                        aria-label="View all QR codes"
                      >
                        View All
                        <ArrowRight className="w-4 h-4" aria-hidden="true" />
                      </button>
                    )}
                  </div>

                  <div className="p-5 sm:p-6">
                    {recentQrCodes.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
                        {recentQrCodes.map((qrCode) => (
                          <motion.div
                            key={qrCode.id}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.23 }}
                            className="border border-gray-200 rounded-lg p-2 shadow-sm hover:shadow-lg transition group"
                          >
                            {/* QR Code Preview */}
                            <div className="mb-2">
                              <div
                                className="bg-white rounded-lg flex items-center justify-center p-2 relative overflow-hidden cursor-pointer w-full aspect-square group-hover:scale-105 transition-transform duration-200"
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
                                      width: '22%',
                                      height: '22%',
                                      top: '50%',
                                      left: '50%',
                                      transform: 'translate(-50%,-50%)',
                                    }}
                                  />
                                )}
                              </div>
                            </div>

                            {/* QR Code Info */}
                            <div className="px-1 min-h-[40px] text-center">
                              <div className="flex items-center justify-center gap-1 mb-1">
                                <span className={`px-2 py-0.5 text-xs font-medium rounded-full flex items-center gap-1 ${
                                  isStaticQR(qrCode) 
                                    ? 'bg-blue-100 text-blue-700' 
                                    : 'bg-purple-100 text-purple-700'
                                }`}>
                                  {isStaticQR(qrCode) ? (
                                    <>
                                      <Zap className="w-2 h-2" />
                                      Static
                                    </>
                                  ) : (
                                    <>
                                      <Target className="w-2 h-2" />
                                      Dynamic
                                    </>
                                  )}
                                </span>
                              </div>
                              <div
                                className="font-semibold text-gray-900 text-xs truncate"
                                title={qrCode.name}
                              >
                                {qrCode.name || 'Untitled'}
                              </div>
                              <div className="text-xs text-gray-600 truncate">
                                {isStaticQR(qrCode) ? qrCode.url : qrCode.targetUrl}
                              </div>
                              {isDynamicQR(qrCode) && qrCode.visits !== undefined && (
                                <div className="text-xs text-gray-500 mt-1">
                                  {qrCode.visits} visits
                                </div>
                              )}
                            </div>

                            <hr className="mt-2 mb-2" />
                            
                            {/* Action Buttons */}
                            <div className="flex items-center justify-between px-2">
                              <button
                                className="p-2 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-700 transition"
                                onClick={() => handleViewQRCode(qrCode)}
                                aria-label="View QR code"
                                title="View"
                              >
                                <Eye className="w-4 h-4" aria-hidden="true" />
                              </button>
                              
                              <QRCodeDownloader qrCodeData={qrCode} />
                              
                              {isDynamicQR(qrCode) && (
                                <>
                                  <button
                                    className="p-2 rounded-lg hover:bg-green-50 text-gray-400 hover:text-green-700 transition"
                                    onClick={() => navigate(`/analyse/${qrCode.shortId || qrCode.id}`)}
                                    aria-label="View analytics"
                                    title="Analytics"
                                  >
                                    <BarChart3 className="w-4 h-4" aria-hidden="true" />
                                  </button>
                                  <button
                                    className="p-2 rounded-lg hover:bg-purple-50 text-gray-400 hover:text-purple-700 transition"
                                    onClick={() => navigate(`/edit/${qrCode.shortId || qrCode.id}`)}
                                    aria-label="Edit QR code"
                                    title="Edit"
                                  >
                                    <Edit3 className="w-4 h-4" aria-hidden="true" />
                                  </button>
                                  <button
                                    className="p-2 rounded-lg hover:bg-orange-50 text-gray-400 hover:text-orange-700 transition"
                                    onClick={() => window.open(`${window.location.origin}/r/${qrCode.shortId}`, '_blank')}
                                    aria-label="Visit QR code"
                                    title="Visit"
                                  >
                                    <ExternalLink className="w-4 h-4" aria-hidden="true" />
                                  </button>
                                </>
                              )}
                              
                              <button
                                className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-700 transition"
                                onClick={() => handleDeleteQRCode(qrCode.id)}
                                aria-label="Delete QR code"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" aria-hidden="true" />
                              </button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <QrCode className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No QR codes yet</h3>
                        <p className="text-gray-500 mb-4">Create your first QR code to get started.</p>
                        <button
                          onClick={() => navigate('/generator')}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                          Create QR Code
                        </button>
                      </div>
                    )}
                  </div>
                </section>

                <section
                  aria-labelledby="recent-collections-heading"
                  className="border border-gray-100 rounded-2xl shadow-sm bg-white"
                >
                  <div className="flex justify-between border-b border-gray-200 px-5 sm:px-6 py-4">
                    <h2
                      id="recent-collections-heading"
                      className="text-sm font-semibold text-gray-900"
                    >
                      Recent Collections
                    </h2>

                    {recentCollections.length > 0 && (
                      <button
                        onClick={() => navigate('/collections')}
                        className="mt-2 sm:mt-0 flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-medium transition-colors text-xs"
                        aria-label="View all collections"
                      >
                        <span>View All</span>
                        <ArrowRight className="w-4 h-4" aria-hidden="true" />
                      </button>
                    )}
                  </div>

                  <div className="p-5 sm:p-6">
                    <Collection
                      limit={6}
                      mode="grid"
                      showMoreLink={true}
                      isDashboard={true}
                    />
                  </div>
                </section>
              </div>
            </>
          )}
        </div>
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
      
      {/* Delete Confirmation Modal */}
      <BulkDeleteModal
        isOpen={showDeleteModal}
        onClose={handleCloseDeleteModal}
        onConfirm={confirmDeleteQRCode}
        selectedCount={1} 
        isBulkDelete={false} 
      />
    </div>
  );
};

export default Dashboard;
