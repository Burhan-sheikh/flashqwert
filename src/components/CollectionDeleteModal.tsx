import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XCircle, Trash2 } from 'lucide-react';

interface CollectionDeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    collectionName: string;
}

const CollectionDeleteModal: React.FC<CollectionDeleteModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    collectionName,
}) => {
    // Modal animation variants
    const modalVariants = {
        hidden: { opacity: 0, scale: 0.9 },
        visible: { opacity: 1, scale: 1, transition: { duration: 0.2, ease: 'easeInOut' } },
        exit: { opacity: 0, scale: 0.9, transition: { duration: 0.15, ease: 'easeInOut' } },
    };

    // Function to prevent scrolling on the body
    React.useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    variants={modalVariants}
                    onClick={onClose} // Close on background click
                >
                    <motion.div
                        className="relative bg-white rounded-2xl shadow-lg max-w-md w-full mx-4 p-6"
                        onClick={(e) => e.stopPropagation()} // Prevent background click from closing if click inside
                    >
                        <button
                            onClick={onClose}
                            className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 focus:outline-none"
                            aria-label="Close"
                        >
                            <XCircle className="h-5 w-5" />
                        </button>

                        <div className="text-center">
                            <div className="flex items-center justify-center rounded-full bg-red-100 p-3 mx-auto mb-4">
                                <Trash2 className="h-8 w-8 text-red-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">
                                Delete Collection "{collectionName}"?
                            </h3>
                            <p className="text-sm text-gray-600 mb-4">
                                Are you sure you want to delete this collection? This action cannot be undone.
                                All QR codes within the collection will remain.
                            </p>
                        </div>

                        <div className="flex justify-center space-x-4">
                            <button
                                onClick={onClose}
                                className="py-2 px-5 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1 transition-colors duration-200 text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={onConfirm}
                                className="py-2 px-5 bg-red-600 text-white rounded-xl shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 transition-colors duration-200 text-sm"
                            >
                                Confirm Delete
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default CollectionDeleteModal;