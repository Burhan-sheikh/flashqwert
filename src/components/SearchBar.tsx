// /home/project/src/components/SearchBar.tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  X,
  QrCode,
  Clock,
  CloudUpload,
} from 'lucide-react';
import { db } from '../firebase/firebase'; // Import your Firebase database instance
import { doc, getDoc } from 'firebase/firestore'; // Import Firestore functions

interface SearchBarProps {
  className?: string;
}

type SearchType = 'qrcodes'; // Removed 'collections'

const SearchBar: React.FC<SearchBarProps> = ({ className = '' }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Core state
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<SearchType>('qrcodes'); // Fixed to 'qrcodes'
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [subscriptionPlan, setSubscriptionPlan] = useState<string | null>(null); // State to hold the plan

  // Refs
  const searchInputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Fetch subscription plan from Firestore
  useEffect(() => {
    const fetchSubscriptionPlan = async () => {
      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const userData = userDoc.data();
            setSubscriptionPlan(userData.subscriptionPlan || 'Free'); // Default to 'Free' if not found
          } else {
            setSubscriptionPlan('Free'); // Default to 'Free' if user doc doesn't exist
          }
        } catch (error) {
          console.error('Error fetching subscription plan:', error);
          setSubscriptionPlan('Free'); // Default to 'Free' on error
        }
      } else {
        setSubscriptionPlan('Free'); // Default to 'Free' if no user
      }
    };

    fetchSubscriptionPlan();
  }, [user]);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`recentSearches_${searchType}`); // Modified key
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, [searchType]); // Added dependency on searchType

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    };

    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = '';
    };
  }, [isExpanded]);

  // Save to recent searches
  const saveToRecentSearches = useCallback((query: string) => {
    if (!query.trim()) return;

    const updated = [query, ...recentSearches.filter(q => q !== query)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem(`recentSearches_${searchType}`, JSON.stringify(updated)); // Modified key
  }, [recentSearches, searchType]);


  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    saveToRecentSearches(searchQuery);

    navigate(`/history?search=${encodeURIComponent(searchQuery)}`);


    setIsExpanded(false);
    setSearchQuery('');
  };

  // Handle search input focus
  const handleSearchFocus = () => {
    setIsExpanded(true);
    setTimeout(() => searchInputRef.current?.focus(), 100);
  };

  const handleRecentSearchClick = (query: string) => {
    setSearchQuery(query);
    navigate(`/history?search=${encodeURIComponent(query)}`);
    setIsExpanded(false);
  };

  // Clear recent searches
  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem(`recentSearches_${searchType}`); // Modified key
  };

  // Don't render if user is not logged in
  if (!user) return null;

  const placeholder = 'Find your QR by Name or URL';

  const renderUpgradeMessage = () => {
      return (
        <div className="mb-4 text-center max-w-sm mx-auto">
  <a
    href="/plans-and-quota"
    className="flex items-center justify-start gap-4 px-6 py-5
               bg-gradient-to-r from-emerald-500 to-emerald-600
               border border-emerald-400 rounded-2xl shadow-lg
               hover:shadow-xl hover:scale-[1.02] transition-transform
               text-white"
    aria-label="Unlock QR History"
  >
    {/* Icon Container */}
    <div className="p-3 rounded-xl bg-white/20 flex items-center justify-center">
      <CloudUpload className="w-7 h-7 text-white" aria-hidden="true" />
    </div>

    {/* Texts */}
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

      );
  };

  return (
    <>
      {/* Search Bar in Header */}
      <div className={`relative ${className}`}>
        <div className="relative">
          <div
            className="flex items-center bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 cursor-text hover:bg-gray-100 transition-colors"
            onClick={handleSearchFocus}
          >
            <Search className="w-4 h-4 text-gray-400 mr-2" />
            <input
              type="text"
              placeholder={placeholder}
              className="bg-transparent flex-1 text-sm text-black placeholder-gray-500 focus:outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={handleSearchFocus}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && isExpanded) {
                  handleSearchSubmit(e);
                }
              }}
            />
            {isExpanded && (
              <button
                type="submit"
                onClick={(e) => { handleSearchSubmit(e) }}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                Search
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Full-Screen Search Panel */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-white"
          >
            <div ref={panelRef} className="h-full flex flex-col">
              {/* Header */}
              <div className="bg-white border-b border-gray-200 px-4 py-4">
                <div className="max-w-4xl mx-auto">
                  <div className="flex items-center gap-4 mb-4">
                    <button
                      onClick={() => setIsExpanded(false)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5 text-gray-500" />
                    </button>
                    <h2 className="text-lg font-semibold text-gray-900">Search</h2>
                  </div>

                  {/* Search Form */}
                  <form onSubmit={handleSearchSubmit} className="space-y-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        ref={searchInputRef}
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={placeholder}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-sm text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        autoComplete="off"
                      />
                    </div>

                    <button
                      type="submit"
                      className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                    >
                      Search
                    </button>
                  </form>
                </div>
              </div>

              {/* Results */}
              <div className="flex-1 overflow-y-auto">
                <div className="max-w-4xl mx-auto px-4 py-6">
                  {/* Recent Searches */}
                  {/* Conditionally render recent searches based on plan and tab */}
                  {subscriptionPlan === 'Free' ? (
                    renderUpgradeMessage()
                  ) : recentSearches.length > 0 ? (
                    <div className="mb-8">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-gray-500 flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Recent Searches
                        </h3>
                        <button
                          onClick={clearRecentSearches}
                          className="text-xs text-gray-400 hover:text-gray-600"
                        >
                          Clear
                        </button>
                      </div>
                      <div className="space-y-2">
                        {recentSearches.map((query, index) => (
                          <button
                            key={index}
                            onClick={() => handleRecentSearchClick(query)}
                            className="flex items-center w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 text-sm text-gray-700"
                          >
                            <Search className="w-4 h-4 text-gray-400 mr-3" />
                            {query}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-gray-500 mb-2">No recent searches</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default SearchBar;
