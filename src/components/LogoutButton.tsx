import React, { useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../firebase/firebase";
import { Power } from "lucide-react";
import { motion, AnimatePresence } from 'framer-motion';
import { XCircle, CheckCircle } from 'lucide-react'; // Corrected import
import { useNavigate } from 'react-router-dom'; // Import useNavigate

interface LogoutButtonProps {
  onClick?: () => void;
  className?: string;
  showLabel?: boolean; // New prop to conditionally show text
}

const LogoutConfirmationModal: React.FC<{ isOpen: boolean; onClose: () => void; onConfirm: () => void }> = ({ isOpen, onClose, onConfirm }) => {
  const modalVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.2, ease: "easeInOut" } },
    exit: { opacity: 0, scale: 0.9, transition: { duration: 0.15, ease: "easeInOut" } }
  };

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
            variants={modalVariants}
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
                <Power className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Confirm Logout?
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Are you sure you want to log out?
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
                Confirm Logout
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const LogoutSuccessModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const modalVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.2, ease: "easeInOut" } },
    exit: { opacity: 0, scale: 0.9, transition: { duration: 0.15, ease: "easeInOut" } }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={modalVariants}
          onClick={onClose}
        >
          <motion.div
            className="relative bg-white rounded-2xl shadow-lg max-w-md w-full mx-4 p-6"
            onClick={(e) => e.stopPropagation()}
            variants={modalVariants}
          >
            <button
              onClick={onClose}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 focus:outline-none"
              aria-label="Close"
            >
              <XCircle className="h-5 w-5" />
            </button>

            <div className="text-center">
              <div className="flex items-center justify-center rounded-full bg-green-100 p-3 mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Logout Successful
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                You have successfully logged out of your account.
              </p>
            </div>

            <div className="flex justify-center">
              <button
                onClick={onClose}
                className="py-2 px-5 bg-green-600 text-white rounded-xl shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 transition-colors duration-200 text-sm"
              >
                OK
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const LogoutButton: React.FC<LogoutButtonProps> = ({ onClick, className, showLabel = false }) => {
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const navigate = useNavigate(); // Initialize useNavigate

  const openConfirmationModal = () => {
    setIsConfirmationOpen(true);
  };

  const closeConfirmationModal = () => {
    setIsConfirmationOpen(false);
  };

  const closeSuccessModal = () => {
    setIsSuccessOpen(false);
    navigate('/'); // Redirect to home page after successful logout
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsConfirmationOpen(false); // Close confirmation modal
      setIsSuccessOpen(true); // Open success modal
      if (onClick) onClick();
    } catch (error: any) {
      console.error("Logout Error:", error.message);
      // Handle error appropriately, perhaps show an error message
    }
  };

  return (
    <>
      <button
        onClick={openConfirmationModal}
        className={`inline-flex items-center gap-2 align-middle hover:text-red-400 focus:outline-none transition duration-300 ease-in-out ${className ?? "text-red-700"}`}
      >
        <Power className="h-4 w-4 inline-block align-middle" />
        {showLabel && <span className="text-base align-middle">Logout</span>}
      </button>

      <LogoutConfirmationModal
        isOpen={isConfirmationOpen}
        onClose={closeConfirmationModal}
        onConfirm={handleLogout}
      />

      <LogoutSuccessModal
        isOpen={isSuccessOpen}
        onClose={closeSuccessModal}
      />
    </>
  );
};