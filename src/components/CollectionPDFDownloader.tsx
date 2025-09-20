import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Download, X, ArrowLeft, Minimize2, Square } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import DownloadStatusDisplay from './pdf/DownloadStatusDisplay';
import ExportStyleSelector from './pdf/ExportStyleSelector';
import StandardOptions from './pdf/options/StandardOptions';
import MinimalOptions from './pdf/options/MinimalOptions';
import GridOptions from './pdf/options/GridOptions';

import { StandardPDFGenerator } from './pdf/generators/StandardPDFGenerator';
import { MinimalPDFGenerator } from './pdf/generators/MinimalPDFGenerator';
import { GridPDFGenerator } from './pdf/generators/GridPDFGenerator';

import { ExportStyle, PDFSize, CollectionPDFDownloaderProps, SizeUnit } from './pdf/types';
import { DEFAULT_DPI, DEFAULT_PAGE_SIZE } from './pdf/utils/pdfUtils';

const CollectionPDFDownloader: React.FC<CollectionPDFDownloaderProps> = ({
    collectionName,
    qrCodeData
}) => {
    const [isDownloadPopupOpen, setIsDownloadPopupOpen] = useState(false);
    const [selectedExportStyle, setSelectedExportStyle] = useState<ExportStyle | null>(null);
    const [selectedSize, setSelectedSize] = useState<PDFSize>(DEFAULT_PAGE_SIZE);
    const [pdfSizeMinimal, setPdfSizeMinimal] = useState<PDFSize>(DEFAULT_PAGE_SIZE);
    const [dpi, setDpi] = useState(DEFAULT_DPI);
    const [showQrCodeName, setShowQrCodeName] = useState(true);
    const [customWidth, setCustomWidth] = useState('8.5');
    const [customHeight, setCustomHeight] = useState('11');
    const [qrCodesPerPage, setQrCodesPerPage] = useState(4);
    const [addCutLineGuides, setAddCutLineGuides] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [downloadStatus, setDownloadStatus] = useState<'idle' | 'processing' | 'success' | 'failure'>('idle');
    const [downloadError, setDownloadError] = useState<string | null>(null);
    const [isMinimized, setIsMinimized] = useState(false);
    const [progress, setProgress] = useState(0);
    const [abortController, setAbortController] = useState<AbortController | null>(null);
    const [enableCustomLayout, setEnableCustomLayout] = useState(false);
    const [sizeUnit, setSizeUnit] = useState<SizeUnit>('in');
    const [autoLayoutOptimization, setAutoLayoutOptimization] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const modalRef = useRef<HTMLDivElement>(null);

    const popupVariants = {
        hidden: { opacity: 0, scale: 0.95 },
        visible: { opacity: 1, scale: 1, transition: { duration: 0.2 } },
        exit: { opacity: 0, scale: 0.95, transition: { duration: 0.15 } }
    };

    // Background PDF generation with progress tracking
    const generatePDFInBackground = useCallback(async () => {
        if (!selectedExportStyle) {
            setError("Please select an export style.");
            return;
        }

        if (!qrCodeData || qrCodeData.length === 0) {
            setError("No QR codes available for export.");
            return;
        }

        const controller = new AbortController();
        setAbortController(controller);
        setDownloading(true);
        setError(null);
        setDownloadStatus('processing');
        setDownloadError(null);
        setProgress(0);

        try {
            let pdf;
            const totalSteps = qrCodeData.length + 2; // +2 for setup and finalization
            let currentStep = 0;

            // Update progress helper
            const updateProgress = (step: number) => {
                if (controller.signal.aborted) throw new Error('Generation cancelled');
                const progressPercent = Math.round((step / totalSteps) * 100);
                setProgress(progressPercent);
            };

            updateProgress(++currentStep); // Setup step

            switch (selectedExportStyle) {
                case 'standard':
                    const standardGenerator = new StandardPDFGenerator(collectionName, qrCodeData);
                    pdf = await standardGenerator.generateWithProgress(selectedSize, dpi, updateProgress, currentStep);
                    break;
                    
                case 'minimal':
                    const minimalGenerator = new MinimalPDFGenerator(
                        qrCodeData,
                        showQrCodeName,
                        enableCustomLayout,
                        customWidth,
                        customHeight,
                        sizeUnit,
                        dpi
                    );
                    pdf = await minimalGenerator.generateWithProgress(pdfSizeMinimal, updateProgress, currentStep);
                    break;
                    
                case 'grid':
                    const gridGenerator = new GridPDFGenerator(
                        qrCodeData,
                        qrCodesPerPage,
                        showQrCodeName,
                        addCutLineGuides,
                        enableCustomLayout,
                        customWidth,
                        customHeight,
                        sizeUnit,
                        dpi
                    );
                    pdf = await gridGenerator.generateWithProgress(selectedSize, updateProgress, currentStep);
                    break;
                    
                default:
                    throw new Error('Invalid export style selected');
            }

            if (controller.signal.aborted) throw new Error('Generation cancelled');

            updateProgress(totalSteps); // Finalization step

            if (!pdf) {
                throw new Error('Failed to generate PDF');
            }

            // Download the PDF
            const fileName = `collection_${collectionName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
            pdf.save(fileName);
            
            setDownloadStatus('success');
            setProgress(100);
        } catch (error: any) {
            if (error.message === 'Generation cancelled') {
                setDownloadStatus('idle');
                setProgress(0);
            } else {
                console.error('PDF generation error:', error);
                setDownloadError(error.message || 'Failed to generate PDF');
                setDownloadStatus('failure');
            }
        } finally {
            setDownloading(false);
            setAbortController(null);
        }
    }, [
        selectedExportStyle,
        collectionName,
        qrCodeData,
        selectedSize,
        pdfSizeMinimal,
        dpi,
        showQrCodeName,
        enableCustomLayout,
        customWidth,
        customHeight,
        sizeUnit,
        qrCodesPerPage,
        addCutLineGuides
    ]);

    const generateAndDownloadPDF = useCallback(async () => {
        // Start background generation
        generatePDFInBackground();
    }, [generatePDFInBackground]);

    const handleCancel = () => {
        if (abortController) {
            abortController.abort();
        }
        setDownloading(false);
        setDownloadStatus('idle');
        setProgress(0);
        setAbortController(null);
    };

    const handleMinimize = () => {
        setIsMinimized(true);
    };

    const handleRestore = () => {
        setIsMinimized(false);
    };

    const handleDownload = () => {
        if (!qrCodeData || qrCodeData.length === 0) {
            setError("No QR codes available for export.");
            return;
        }
        
        setIsDownloadPopupOpen(true);
        document.body.style.overflow = 'hidden';
        setDownloadStatus('idle');
        setDownloadError(null);
        setSelectedExportStyle(null);
        setError(null);
    };

    const closeDownloadPopup = () => {
        setIsDownloadPopupOpen(false);
        document.body.style.overflow = '';
        setDownloadStatus('idle');
        setDownloadError(null);
        setSelectedExportStyle(null);
        setError(null);
    };

    const handleExportStyleSelect = (style: ExportStyle) => {
        setSelectedExportStyle(style);
        setError(null);
    };

    const handleDownloadAgain = () => {
        setDownloadStatus('idle');
        setDownloadError(null);
        setSelectedExportStyle(null);
        setError(null);
    };

    // Minimized progress indicator
    const MinimizedProgress = () => {
        if (!isMinimized || !downloading) return null;

        return (
            <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                className="fixed bottom-4 right-4 z-50 bg-white rounded-lg shadow-xl border border-gray-200 p-4 min-w-[280px]"
            >
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Generating PDF...</span>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={handleRestore}
                            className="text-gray-400 hover:text-gray-600 p-1"
                            title="Restore window"
                        >
                            <Square className="w-4 h-4" />
                        </button>
                        <button
                            onClick={handleCancel}
                            className="text-gray-400 hover:text-red-600 p-1"
                            title="Cancel generation"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <div className="text-xs text-gray-500 mt-1">{progress}% complete</div>
            </motion.div>
        );
    };

    const renderExportOptions = () => {
        switch (selectedExportStyle) {
            case 'standard':
                return (
                    <StandardOptions
                        selectedSize={selectedSize}
                        onSizeChange={setSelectedSize}
                        dpi={dpi}
                        onDpiChange={setDpi}
                        autoLayoutOptimization={autoLayoutOptimization}
                        onAutoLayoutChange={setAutoLayoutOptimization}
                    />
                );
            case 'minimal':
                return (
                    <MinimalOptions
                        pdfSizeMinimal={pdfSizeMinimal}
                        onPdfSizeMinimalChange={setPdfSizeMinimal}
                        dpi={dpi}
                        onDpiChange={setDpi}
                        enableCustomLayout={enableCustomLayout}
                        onEnableCustomLayoutChange={setEnableCustomLayout}
                        sizeUnit={sizeUnit}
                        onSizeUnitChange={setSizeUnit}
                        customWidth={customWidth}
                        onCustomWidthChange={setCustomWidth}
                        customHeight={customHeight}
                        onCustomHeightChange={setCustomHeight}
                        showQrCodeName={showQrCodeName}
                        onShowQrCodeNameChange={setShowQrCodeName}
                    />
                );
            case 'grid':
                return (
                    <GridOptions
                        selectedSize={selectedSize}
                        onSizeChange={setSelectedSize}
                        dpi={dpi}
                        onDpiChange={setDpi}
                        enableCustomLayout={enableCustomLayout}
                        onEnableCustomLayoutChange={setEnableCustomLayout}
                        sizeUnit={sizeUnit}
                        onSizeUnitChange={setSizeUnit}
                        customWidth={customWidth}
                        onCustomWidthChange={setCustomWidth}
                        customHeight={customHeight}
                        onCustomHeightChange={setCustomHeight}
                        qrCodesPerPage={qrCodesPerPage}
                        onQrCodesPerPageChange={setQrCodesPerPage}
                        showQrCodeName={showQrCodeName}
                        onShowQrCodeNameChange={setShowQrCodeName}
                        addCutLineGuides={addCutLineGuides}
                        onAddCutLineGuidesChange={setAddCutLineGuides}
                        qrCodeData={qrCodeData}
                    />
                );
            default:
                return null;
        }
    };

    const DownloadContent = () => {
        if (downloadStatus === 'processing') {
            return (
                <div className="text-center py-8 px-4">
                    <div className="mb-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">Generating PDF...</h3>
                        <p className="text-gray-600 mb-4">Please wait while we create your collection PDF.</p>
                        
                        {/* Progress bar */}
                        <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                            <div 
                                className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <div className="text-sm text-gray-600 mb-4">{progress}% complete</div>
                        
                        {/* Control buttons */}
                        <div className="flex justify-center space-x-3">
                            <button
                                onClick={handleMinimize}
                                className="inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm"
                            >
                                <Minimize2 className="w-4 h-4 mr-2" />
                                Hide
                            </button>
                            <button
                                onClick={handleCancel}
                                className="inline-flex items-center px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors text-sm"
                            >
                                <X className="w-4 h-4 mr-2" />
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        if (downloadStatus === 'success') {
            return (
                <DownloadStatusDisplay
                    status={downloadStatus}
                    error={downloadError}
                    onDownloadAgain={handleDownloadAgain}
                    onClose={closeDownloadPopup}
                />
            );
        }

        if (downloadStatus === 'processing') {
            // This is now handled above in DownloadContent
        }

        if (downloadStatus === 'failure') {
            return (
                <div className="text-center py-8 px-4">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <X className="w-6 h-6 text-red-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-red-600 mb-2">Download Failed</h3>
                    <p className="text-red-500 mb-4">{downloadError}</p>
                    <button
                        className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md text-sm"
                        onClick={handleDownloadAgain}
                    >
                        Try Again
                    </button>
                </div>
            );
        }

        return (
            <>
                {!selectedExportStyle ? (
                    <ExportStyleSelector onStyleSelect={handleExportStyleSelect} />
                ) : (
                    <div>
                        <button
                            className="inline-flex items-center text-gray-500 hover:text-gray-700 mb-4"
                            onClick={() => setSelectedExportStyle(null)}
                        >
                            <ArrowLeft className="h-4 w-4 mr-1" />
                            Back to Export Styles
                        </button>
                        {renderExportOptions()}
                        {error && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-red-700 text-sm">{error}</p>
                            </div>
                        )}
                        <div className="mt-6 flex justify-end space-x-3">
                            <button
                                className="bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-4 rounded-md text-sm"
                                onClick={closeDownloadPopup}
                            >
                                Cancel
                            </button>
                            <button
                                className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={generateAndDownloadPDF}
                                disabled={downloading || !qrCodeData?.length}
                            >
                                {downloading ? 'Generating...' : 'Download PDF'}
                            </button>
                        </div>
                    </div>
                )}
            </>
        );
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
                closeDownloadPopup();
            }
        };

        if (isDownloadPopupOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isDownloadPopupOpen]);

    // Cleanup body overflow on unmount
    useEffect(() => {
        return () => {
            document.body.style.overflow = '';
        };
    }, []);

    return (
        <div>
            <button
                onClick={handleDownload}
                disabled={downloading || !qrCodeData?.length}
                className="w-full py-2 px-4 bg-green-600 text-white rounded-xl shadow-md hover:bg-green-700 transition-all duration-300 inline-flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Download Collection as PDF"
            >
                <Download className="h-5 w-5 mr-2" />
                {downloading ? 'Generating...' : 'Export PDF'}
            </button>

            <AnimatePresence>
                {isDownloadPopupOpen && (
                    <motion.div
                        className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        variants={popupVariants}
                        onClick={closeDownloadPopup}
                    >
                        <motion.div
                            className="bg-white rounded-2xl shadow-xl w-full max-w-md relative overflow-hidden max-h-[90vh]"
                            variants={popupVariants}
                            ref={modalRef}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={closeDownloadPopup}
                                className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 z-10"
                                aria-label="Close"
                            >
                                <X className="h-5 w-5" />
                            </button>
                            
                            <div className="py-6 px-4 overflow-y-auto max-h-[80vh]">
                                <DownloadContent />
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            
            {/* Minimized progress indicator */}
            <AnimatePresence>
                <MinimizedProgress />
            </AnimatePresence>
        </div>
    );
};

export default CollectionPDFDownloader;
