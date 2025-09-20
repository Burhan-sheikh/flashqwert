import React, { useState, useEffect } from 'react';
import { Star, ChevronLeft, ChevronRight, Quote, Users, TrendingUp } from 'lucide-react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { useAuth } from '../context/AuthContext';
import RateUsModal from './RateUsModal';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface Review {
  id: string;
  username: string;
  rating: number;
  comment: string;
  createdAt: string;
  userId: string;
  photoURL?: string;
}

const ReviewsSection: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();

  const { user, loading: authLoading } = useAuth();

  // Calculate reviews per page based on screen size
  const getReviewsPerPage = () => {
    if (typeof window !== 'undefined') {
      if (window.innerWidth < 640) return 1; // Mobile
      if (window.innerWidth < 1024) return 2; // Tablet
      return 3; // Desktop
    }
    return 3;
  };

  const [reviewsPerPage, setReviewsPerPage] = useState(getReviewsPerPage());

  useEffect(() => {
    const handleResize = () => {
      setReviewsPerPage(getReviewsPerPage());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!authLoading) {
      fetchReviews();
    } else {
      setLoading(false);
    }
  }, [authLoading]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const reviewsRef = collection(db, 'reviews');
      const q = query(reviewsRef, orderBy('createdAt', 'desc'));

      const unsubscribe = onSnapshot(
        q,
        (querySnapshot) => {
          const fetchedReviews = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data()
          })) as Review[];

          setReviews(fetchedReviews);

          if (fetchedReviews.length > 0) {
            const avgRating =
              fetchedReviews.reduce((acc, review) => acc + review.rating, 0) /
              fetchedReviews.length;
            setAverageRating(parseFloat(avgRating.toFixed(1)));
          } else {
            setAverageRating(0);
          }
          setLoading(false);
        },
        (error) => {
          console.error('Error fetching reviews:', error);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setLoading(false);
    }
  };

  const handleReviewSubmitted = () => {
    fetchReviews();
  };

  const handleShowLogin = () => {
    navigate('/login');
  };

  const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'md') => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const starSize = size === 'sm' ? 16 : size === 'lg' ? 24 : 20;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <Star 
            key={i} 
            size={starSize} 
            fill="currentColor" 
            className="text-amber-400 drop-shadow-sm" 
          />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <div key={i} className="relative">
            <Star size={starSize} className="text-gray-300" />
            <div className="absolute inset-0 overflow-hidden w-1/2">
              <Star size={starSize} fill="currentColor" className="text-amber-400" />
            </div>
          </div>
        );
      } else {
        stars.push(<Star key={i} size={starSize} className="text-gray-300" />);
      }
    }
    return stars;
  };

  const getRatingDistribution = () => {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(review => {
      distribution[review.rating as keyof typeof distribution]++;
    });
    return distribution;
  };

  const nextSlide = () => {
    const maxSlide = Math.ceil(reviews.length / reviewsPerPage) - 1;
    setCurrentSlide(prev => prev >= maxSlide ? 0 : prev + 1);
  };

  const prevSlide = () => {
    const maxSlide = Math.ceil(reviews.length / reviewsPerPage) - 1;
    setCurrentSlide(prev => prev <= 0 ? maxSlide : prev - 1);
  };

  const getVisibleReviews = () => {
    const startIndex = currentSlide * reviewsPerPage;
    return reviews.slice(startIndex, startIndex + reviewsPerPage);
  };

  if (loading) {
    return (
      <section className="py-16 px-4 md:px-8 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 mb-10">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-8">
            {/* Header skeleton */}
            <div className="text-center space-y-4">
              <div className="h-12 bg-gray-200 rounded-lg w-80 mx-auto"></div>
              <div className="h-6 bg-gray-200 rounded w-60 mx-auto"></div>
            </div>
            
            {/* Stats skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-2xl p-6 shadow-sm">
                  <div className="h-8 bg-gray-200 rounded w-20 mx-auto mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-32 mx-auto"></div>
                </div>
              ))}
            </div>
            
            {/* Reviews skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <div key={star} className="h-5 w-5 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                    <div className="space-y-1">
                      <div className="h-4 bg-gray-200 rounded w-24"></div>
                      <div className="h-3 bg-gray-200 rounded w-20"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  const ratingDistribution = getRatingDistribution();
  const totalReviews = reviews.length;

  return (
    <section className="py-2">
      <div className="max-w-7xl mx-auto">
        

        {/* Stats Cards */}
        {totalReviews > 0 && (
          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-16 max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 text-center shadow-lg border border-white/20">
              <div className="flex items-center justify-center mb-2">
                <div className="flex space-x-1">{renderStars(averageRating, 'lg')}</div>
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-1">{averageRating.toFixed(1)}</p>
              <p className="text-gray-600 text-sm">Average Rating</p>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 text-center shadow-lg border border-white/20">
              <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-3xl font-bold text-gray-900 mb-1">{totalReviews.toLocaleString()}</p>
              <p className="text-gray-600 text-sm">Happy Customers</p>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 text-center shadow-lg border border-white/20">
              <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-3xl font-bold text-gray-900 mb-1">
                {totalReviews > 0 ? Math.round((ratingDistribution[5] + ratingDistribution[4]) / totalReviews * 100) : 0}%
              </p>
              <p className="text-gray-600 text-sm">Positive Reviews</p>
            </div>
          </motion.div>
        )}

        {/* Reviews */}
        {reviews.length > 0 ? (
          <div className="relative">
            {/* Navigation Buttons */}
            {reviews.length > reviewsPerPage && (
              <>
                <button
                  onClick={prevSlide}
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 bg-white/90 backdrop-blur-sm hover:bg-white shadow-xl rounded-full p-3 transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-4 focus:ring-blue-100"
                  aria-label="Previous reviews"
                >
                  <ChevronLeft className="w-6 h-6 text-gray-700" />
                </button>
                <button
                  onClick={nextSlide}
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 bg-white/90 backdrop-blur-sm hover:bg-white shadow-xl rounded-full p-3 transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-4 focus:ring-blue-100"
                  aria-label="Next reviews"
                >
                  <ChevronRight className="w-6 h-6 text-gray-700" />
                </button>
              </>
            )}

            {/* Reviews Grid */}
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12"
              key={currentSlide}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              {getVisibleReviews().map((review, index) => (
                <motion.div
                  key={review.id}
                  className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 relative overflow-hidden"
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  {/* Quote Icon */}
                  <Quote className="absolute top-6 right-6 w-8 h-8 text-blue-100" />
                  
                  {/* Rating */}
                  <div className="flex items-center space-x-1 mb-4">
                    {renderStars(review.rating)}
                  </div>

                  {/* Comment */}
                  <blockquote className="text-gray-700 text-lg leading-relaxed mb-6 relative z-10">
                    "{review.comment}"
                  </blockquote>

                  {/* User Info */}
                  <div className="flex items-center space-x-4">
                    {review.photoURL ? (
                      <img
                        src={review.photoURL}
                        alt={review.username}
                        className="w-14 h-14 rounded-full object-cover ring-4 ring-blue-100 shadow-md"
                      />
                    ) : (
                      <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-xl ring-4 ring-blue-100 shadow-md">
                        {review.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-gray-900 font-semibold text-lg">{review.username}</p>
                      <p className="text-gray-500 text-sm">
                        {new Date(review.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Decorative gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50/20 to-indigo-50/20 pointer-events-none"></div>
                </motion.div>
              ))}
            </motion.div>

            {/* Pagination Dots */}
            {reviews.length > reviewsPerPage && (
              <div className="flex justify-center space-x-2 mb-8">
                {Array.from({ length: Math.ceil(reviews.length / reviewsPerPage) }).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`w-3 h-3 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-300 ${
                      currentSlide === index 
                        ? 'bg-blue-600 scale-125' 
                        : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            )}

            {/* CTA Button */}
            <div className="text-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowModal(true)}
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-200 group"
              >
                <Star className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform duration-300" />
                Share Your Experience
                <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
              </motion.button>
            </div>
          </div>
        ) : (
          <motion.div 
            className="text-center max-w-md mx-auto"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-12 shadow-xl border border-white/20">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Star className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Be the First!</h3>
              <p className="text-gray-600 mb-8 leading-relaxed">
                No reviews yet — be the first to share your experience and help others discover our platform.
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowModal(true)}
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-200 group"
              >
                <Star className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform duration-300" />
                Write First Review
                <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <RateUsModal
            onClose={() => setShowModal(false)}
            onReviewSubmitted={handleReviewSubmitted}
            onShowLogin={handleShowLogin}
          />
        )}
      </AnimatePresence>
    </section>
  );
};

export default ReviewsSection;
