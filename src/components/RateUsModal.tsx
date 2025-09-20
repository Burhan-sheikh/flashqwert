import React, { useState, useRef, useEffect } from 'react';
import { Star, X } from 'lucide-react';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';

interface RateUsModalProps {
    onClose: () => void;
    onReviewSubmitted: () => void;
    onShowLogin: () => void;
}

const RateUsModal: React.FC<RateUsModalProps> = ({ onClose, onReviewSubmitted, onShowLogin }) => {
    const { user } = useAuth();
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const modalRef = useRef<HTMLDivElement>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) {
            onShowLogin();
            onClose();
            return;
        }

        if (rating === 0) {
            toast.error('Please select a rating', {
                position: 'top-center',
                style: {
                    background: '#F44336',
                    color: '#fff',
                },
            });
            return;
        }

        setIsSubmitting(true);
        try {
            const reviewsRef = collection(db, 'reviews');
            const reviewData = {
                username: user.displayName || 'Anonymous',
                rating: rating,
                comment: comment,
                createdAt: new Date().toISOString(),
                userId: user.uid,
                photoURL: user.photoURL || null // Save Google profile pic if available
            };

            await addDoc(reviewsRef, reviewData);
            toast.success('Thank you! Your review was submitted successfully.', {
                position: 'top-center',
                style: {
                    background: '#10B981',
                    color: '#fff',
                },
                icon: '👏',
            });
            onReviewSubmitted();
            onClose();
        } catch (error) {
            console.error("Error submitting review:", error);
            toast.error('Failed to submit review. Please try again.', {
                position: 'top-center',
                style: {
                    background: '#F44336',
                    color: '#fff',
                },
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [onClose]);

    const modalVariants = {
        hidden: { opacity: 0, y: 20, scale: 0.95 },
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: { type: "spring", damping: 25, stiffness: 500, duration: 0.3 }
        },
        exit: { opacity: 0, y: 20, scale: 0.95, transition: { ease: "easeIn", duration: 0.2 } }
    };

    const backdropVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1 },
        exit: { opacity: 0 }
    };

    return (
        <>
            <Toaster />
            <motion.div
                className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4 mt-20"
                variants={backdropVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
            >
                <motion.div
                    ref={modalRef}
                    className="relative rounded-xl shadow-2xl w-full max-w-md bg-white p-6 mx-auto"
                    variants={modalVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    onClick={(e) => e.stopPropagation()}
                    style={{ overflowY: 'auto', color: 'black' }}
                >
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 transition-colors"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>

                    <div className="text-center mb-6">
                        <h3 className="text-2xl font-bold text-gray-800 mb-1">Rate Your Experience</h3>
                        <p className="text-gray-600 text-sm">We'd love to hear your feedback!</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <textarea
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-xs"
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                rows={4}
                                placeholder="Share a few words about your experience…"
                            />
                        </div>

                        <div className="space-y-2">
                            <p className="text-sm font-medium text-gray-700 text-center">How would you rate us?</p>
                            <div className="flex items-center justify-center space-x-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setRating(star)}
                                        onMouseEnter={() => setHoverRating(star)}
                                        onMouseLeave={() => setHoverRating(0)}
                                        className="focus:outline-none"
                                    >
                                        <Star
                                            size={36}
                                            fill={(hoverRating || rating) >= star ? 'currentColor' : 'none'}
                                            className={
                                                (hoverRating || rating) >= star
                                                    ? 'text-yellow-400 hover:text-yellow-500 transform hover:scale-110 transition-all duration-150'
                                                    : 'text-gray-300 hover:text-yellow-400 transform hover:scale-110 transition-all duration-150'
                                            }
                                        />
                                    </button>
                                ))}
                            </div>
                            <p className="text-xs text-gray-500 text-center mt-1">
                                {rating > 0 && `You selected ${rating} star${rating > 1 ? 's' : ''}`}
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium hover:shadow-md disabled:opacity-50"
                            >
                                {isSubmitting ? (
                                    <span className="flex items-center justify-center">
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                        Submitting...
                                    </span>
                                ) : (
                                    'Submit Review'
                                )}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </motion.div>
        </>
    );
};

export default RateUsModal;
