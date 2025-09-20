// DownloadStatusDisplay.tsx
import React from 'react';
import { CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DownloadStatusDisplayProps {
    status: 'idle' | 'processing' | 'success' | 'failure';
    error?: string | null;
    progress?: number;
    onDownloadAgain: () => void;
    onClose: () => void;
    onMinimize?: () => void;
    onCancel?: () => void;
    fileName?: string;
    fileType?: string;
    fileSize?: string;
}

const DownloadStatusDisplay: React.FC<DownloadStatusDisplayProps> = ({
    status,
    error,
    progress = 0,
    onDownloadAgain,
    onClose,
    onMinimize,
    onCancel,
    fileName,
    fileType,
    fileSize,
}) => {
    const successVariants = {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
        exit: { opacity: 0, y: 20, transition: { duration: 0.2 } },
    };

    if (status === 'processing') {
        return (
            <AnimatePresence>
                <motion.div
                    className="text-center py-6 px-4"
                    variants={successVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                >
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
                        {onMinimize && (
                            <button
                                onClick={onMinimize}
                                className="inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm"
                            >
                                Hide
                            </button>
                        )}
                        {onCancel && (
                            <button
                                onClick={onCancel}
                                className="inline-flex items-center px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors text-sm"
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                </motion.div>
            </AnimatePresence>
        );
    }

    if (status === 'success') {
        return (
            <AnimatePresence>
                <motion.div
                    className="text-center py-6 px-4"
                    variants={successVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                >
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Collection Downloaded!</h3>
                    <p className="text-gray-600 text-sm mb-4">
                        Check your downloads folder.
                        {fileName && fileType && (
                            <span className="block mt-1">
                                Downloaded: <span className="font-medium">{fileName}.{fileType}</span>
                                {fileSize && <>, Size: {fileSize}</>}
                            </span>
                        )}
                    </p>
                    <div className="flex justify-center space-x-3 flex-wrap gap-2">
                        <button
                            className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-3 rounded-md focus:outline-none transition-colors duration-200 text-sm"
                            onClick={onDownloadAgain}
                            aria-label="Download collection again"
                        >
                            Download Again
                        </button>
                        <button
                            className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-3 rounded-md focus:outline-none transition-colors duration-200 text-sm"
                            onClick={onClose}
                            aria-label="Close download status"
                        >
                            Close
                        </button>
                    </div>
                </motion.div>
            </AnimatePresence>
        );
    }

    return null;
};

export default DownloadStatusDisplay;
