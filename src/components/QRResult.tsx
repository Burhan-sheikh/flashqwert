import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeData, isStaticQR, isDynamicQR } from '../types/qrcode';
import { 
  CheckCircle,
  Eye,
  BarChart3,
  ExternalLink,
  Copy,
  Smartphone,
  Monitor,
  Tablet,
  Grid3X3,
  List,
  SlidersHorizontal,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Trash2,
  Share2, 
  RefreshCw, 
  Loader2,
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import QRCodeDownloader from './QRCodeDownloader';
import QRCodeViewModal from './QRCodeViewModal';
import { toast } from 'react-hot-toast';

interface QRResultProps {
  generatedQRs: QRCodeData[];
  onClose: () => void;
  onGenerateNew: () => void;
  subscriptionPlan: string;
  userId: string;
  isGenerating?: boolean;
}

const QRResult: React.FC<QRResultProps> = ({
  generatedQRs,
  onClose,
  onGenerateNew,
  subscriptionPlan,
  userId,
  isGenerating = false
}) => {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedQrCode, setSelectedQrCode] = useState<QRCodeData | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const qrsPerPage = 20;
  
  const [screenWidth, setScreenWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  
  useEffect(() => {
    const handleResize = () => setScreenWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const isMobile = screenWidth <= 700;

  useEffect(() => {
    initializeLoadingStates();
  }, [generatedQRs]);

  const initializeLoadingStates = () => {
    const newLoadingStates: Record<string, boolean> = {};

    // Initialize all as loading
    generatedQRs.forEach(qr => {
      newLoadingStates[qr.id] = true;
    });
    setLoadingStates(newLoadingStates);

    // Simulate loading completion with delays
    generatedQRs.forEach((qr, index) => {
      setTimeout(() => {
        setLoadingStates(prev => ({ ...prev, [qr.id]: false }));
      }, 500 + index * 200);
    });
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

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard`);
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const shareQR = async (qr: QRCodeData) => {
    const url = isStaticQR(qr) ? qr.url : `${window.location.origin}/r/${qr.shortId}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: qr.name || 'QR Code',
          text: `Check out this QR code: ${qr.name || 'Unnamed'}`,
          url: url,
        });
      } catch (error) {
        // Fallback to clipboard
        copyToClipboard(url, 'QR Code URL');
      }
    } else {
      copyToClipboard(url, 'QR Code URL');
    }
  };

  // Pagination
  const totalPages = Math.ceil(generatedQRs.length / qrsPerPage);
  const startIndex = (currentPage - 1) * qrsPerPage;
  const paginatedQRs = generatedQRs.slice(startIndex, startIndex + qrsPerPage);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      setCurrentPage(page);
    }
  };

  const getLogoSize = () => {
    return isMobile
      ? (viewMode === 'grid' ? '26%' : '32%')
      : (viewMode === 'grid' ? '20%' : '22%');
  };

  const getQRValue = (qr: QRCodeData): string => {
    if (isStaticQR(qr)) {
      return qr.url;
    } else {
      return `${window.location.origin}/r/${qr.shortId}`;
    }
  };

  const completedCount = Object.values(loadingStates).filter(loading => !loading).length;
  const totalCount = generatedQRs.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-7xl mx-auto pb-20"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white rounded-2xl shadow-xl p-6 mb-8 border border-gray-200"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Your QR Codes Are Ready! 🎉
            </h2>
            <p className="text-gray-600">
              Generated {totalCount} QR code{totalCount > 1 ? 's' : ''} successfully
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Progress Bar */}
        {isGenerating || completedCount < totalCount ? (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Loading QR Codes... ({completedCount}/{totalCount})
              </span>
              <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <motion.div
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        ) : (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center">
            <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
            <span className="text-green-700 font-medium">All QR codes generated successfully!</span>
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={onGenerateNew}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Generate More
            </button>
          </div>

          <div className="flex items-center gap-4">
            {/* View Mode Controls */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">View:</span>
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title="Grid View"
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'list'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title="List View"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* QR Codes Display */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="bg-white border border-gray-200 rounded-lg shadow-sm"
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-gray-600">
              Showing {paginatedQRs.length} of {totalCount} QR Codes
            </span>
          </div>
          
          <div className={
            viewMode === 'grid'
              ? "grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6"
              : "space-y-3"
          }>
          {paginatedQRs.map((qr, index) => {
            const isLoading = loadingStates[qr.id];
            const url = isStaticQR(qr) ? qr.url : `${window.location.origin}/r/${qr.shortId}`;

            return (
              <motion.div
                key={qr.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className={`relative group ${
                  viewMode === 'grid'
                    ? "bg-gray-50 border border-gray-200 rounded-lg p-2 shadow-sm hover:shadow-lg transition"
                    : "bg-gray-50 border border-gray-200 rounded-lg p-2 shadow-sm hover:shadow-lg transition"
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    {viewMode === 'grid' ? (
                      <div className="w-full aspect-square bg-gray-200 rounded-lg flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
                      </div>
                    ) : (
                      <div className="flex items-center w-full p-4">
                        <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center mr-3">
                          <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                        </div>
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 rounded mb-2"></div>
                          <div className="h-3 bg-gray-100 rounded"></div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    {viewMode === 'grid' ? (
                      <>
                        <div className="mb-2">
                          <div
                            className="bg-white rounded-lg flex items-center justify-center p-2 relative overflow-hidden cursor-pointer w-full aspect-square"
                            onClick={() => handleViewQRCode(qr)}
                          >
                            <QRCodeCanvas
                              value={getQRValue(qr)}
                              size={isMobile ? 96 : 160}
                              bgColor={qr.backgroundColor}
                              fgColor={qr.color}
                              level={qr.errorCorrectionLevel}
                              includeMargin={false}
                            />
                            {qr.logoDataUrl && (
                              <img
                                src={qr.logoDataUrl}
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
                          <div className="font-semibold text-gray-900 text-xs truncate" title={qr.name}>
                            {qr.name || 'Untitled'}
                          </div>
                          <div className="text-xs text-gray-600 truncate">{url}</div>
                        </div>
                        <div className="flex items-center justify-between mt-2 px-2">
                          <button
                            className="p-2 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-700 transition"
                            onClick={() => handleViewQRCode(qr)}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <QRCodeDownloader qrCodeData={qr} />
                          <button
                            className="p-2 rounded-lg hover:bg-purple-50 text-gray-400 hover:text-purple-700 transition"
                            onClick={() => shareQR(qr)}
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-row items-center">
                        <div className="mr-3 flex-shrink-0">
                          <div
                            className={`${isMobile ? 'w-12 h-12' : 'w-16 h-16'} bg-white rounded-lg flex items-center justify-center relative overflow-hidden cursor-pointer`}
                            onClick={() => handleViewQRCode(qr)}
                          >
                            <QRCodeCanvas
                              value={getQRValue(qr)}
                              size={isMobile ? 44 : 60}
                              bgColor={qr.backgroundColor}
                              fgColor={qr.color}
                              level={qr.errorCorrectionLevel}
                              includeMargin={false}
                            />
                            {qr.logoDataUrl && (
                              <img
                                src={qr.logoDataUrl}
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
                          <div className="font-bold text-gray-800 truncate">{qr.name || 'Untitled'}</div>
                          <div className="text-xs text-gray-500 truncate">{url}</div>
                          {isDynamicQR(qr) && qr.visits !== undefined && (
                            <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                              <BarChart3 className="w-3 h-3" />
                              {qr.visits} visits
                            </div>
                          )}
                        </div>
                        <div className="flex items-center ml-2">
                          <button
                            className="p-2 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-700 transition"
                            onClick={() => handleViewQRCode(qr)}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <QRCodeDownloader qrCodeData={qr} />
                          <button
                            className="p-2 rounded-lg hover:bg-purple-50 text-gray-400 hover:text-purple-700 transition"
                            onClick={() => shareQR(qr)}
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            );
          })}
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex justify-center">
              <nav className="flex items-center gap-1">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 rounded-md text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      currentPage === page
                        ? 'bg-purple-600 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-md text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </nav>
            </div>
          )}
        </div>
      </motion.div>
      
      {/* QR Code View Modal */}
      {selectedQrCode && (
        <QRCodeViewModal
          qrCodeData={selectedQrCode}
          onClose={handleCloseView}
          loading={modalLoading}
          error={modalError}
        />
      )}
    </motion.div>
  );
};

export default QRResult;
