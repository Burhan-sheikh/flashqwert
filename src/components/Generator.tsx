import React, { useState, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/firebase';
import { doc, runTransaction } from 'firebase/firestore';
import { QRCodeData, StaticQRCodeData, DynamicQRCodeData } from '../types/qrcode';
import { v4 as uuidv4 } from 'uuid';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  AlertCircle,
  Loader2,
  XCircle,
  RefreshCw,
  Sparkles,
  Info,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  FileSpreadsheet,
  Wrench,
  Zap,
  Target,
  CheckCircle2,
  Play,
  Layers
} from 'lucide-react';
import InputForm from './InputForm';
import QRResult from './QRResult';
import CSVUploadModal from './CSVUploadModal';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

interface GeneratorProps {
  onClose: () => void;
  userQuota: number;
  subscriptionPlan: string;
  userId: string;
  onQuotaUpdate: (newQuota: number) => void;
  hasUnsavedChanges: () => boolean;
  resetForm: () => void;
  onUnsavedChanges: (hasChanges: boolean) => void;
  canAccessBulk: boolean;
}

const Generator: React.FC<GeneratorProps> = ({
  onClose,
  userQuota,
  subscriptionPlan,
  userId,
  onQuotaUpdate,
  hasUnsavedChanges,
  resetForm,
  onUnsavedChanges,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Mode state
  const [isDynamicMode, setIsDynamicMode] = useState(false);
  const [qrEntries, setQrEntries] = useState<QRCodeData[]>([]);
  const [generatedQRs, setGeneratedQRs] = useState<QRCodeData[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showCSVModal, setShowCSVModal] = useState(false);
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [errors, setErrors] = useState<Record<number, { url?: string; targetUrl?: string; name?: string }>>({});
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [csvImportSuccess, setCsvImportSuccess] = useState<string | null>(null);

  const [isFabOpen, setIsFabOpen] = useState(false);
  const [showScrollFab, setShowScrollFab] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const [currentPage, setCurrentPage] = useState(1);
  const entriesPerPage = 20;

  React.useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setShowScrollFab(scrollPosition > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Initialize with proper entry type based on mode
  React.useEffect(() => {
    if (qrEntries.length === 0) {
      setQrEntries([createEmptyEntry(isDynamicMode)]);
    }
  }, []);

  const totalPages = Math.ceil(qrEntries.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const currentEntries = qrEntries.slice(startIndex, endIndex);

  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      setCurrentPage(page);
      setOpenIndex(null);
    }
  }, [currentPage, totalPages]);

  const goToPreviousPage = useCallback(() => goToPage(currentPage - 1), [currentPage, goToPage]);
  const goToNextPage = useCallback(() => goToPage(currentPage + 1), [currentPage, goToPage]);
  const goToFirstPage = useCallback(() => goToPage(1), [goToPage]);
  const goToLastPage = useCallback(() => goToPage(totalPages), [goToPage, totalPages]);

  const generatePaginationPages = useMemo(() => {
    if (totalPages <= 1) return [];
    const maxVisible = 7;
    const pages: (number | string)[] = [];

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }

    pages.push(1);
    const halfVisible = Math.floor((maxVisible - 2) / 2);
    let start = Math.max(2, currentPage - halfVisible);
    let end = Math.min(totalPages - 1, currentPage + halfVisible);

    if (currentPage <= halfVisible + 1) {
      end = Math.min(maxVisible - 1, totalPages - 1);
    }
    if (currentPage >= totalPages - halfVisible) {
      start = Math.max(2, totalPages - maxVisible + 2);
    }
    if (start > 2) pages.push('...');
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < totalPages - 1) pages.push('...');
    if (totalPages > 1) pages.push(totalPages);
    return pages.filter((page, idx, arr) => idx === 0 || page !== arr[idx - 1]);
  }, [currentPage, totalPages]);

  React.useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges() && !showResults) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [qrEntries, showResults, hasUnsavedChanges]);

  React.useEffect(() => {
    const hasChanges = qrEntries.some(entry => {
      if (entry.type === 'static') {
        const staticEntry = entry as StaticQRCodeData;
        return staticEntry.url.trim() !== '' ||
               staticEntry.name.trim() !== '' ||
               staticEntry.color !== '#000000' ||
               staticEntry.backgroundColor !== '#FFFFFF' ||
               staticEntry.logoDataUrl !== '';
      } else {
        const dynamicEntry = entry as DynamicQRCodeData;
        return dynamicEntry.targetUrl.trim() !== '' ||
               dynamicEntry.name.trim() !== '' ||
               dynamicEntry.color !== '#000000' ||
               dynamicEntry.backgroundColor !== '#FFFFFF' ||
               dynamicEntry.logoDataUrl !== '';
      }
    });
    onUnsavedChanges(hasChanges);
  }, [qrEntries, onUnsavedChanges]);

  React.useEffect(() => {
    const handleClickOutside = () => {
      if (isFabOpen) setIsFabOpen(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isFabOpen]);

  function createEmptyEntry(dynamicMode?: boolean): QRCodeData {
    const mode = dynamicMode !== undefined ? dynamicMode : isDynamicMode;
    
    if (mode) {
      return {
        id: uuidv4(),
        name: '',
        type: 'dynamic',
        targetUrl: '',
        shortId: generateShortId(),
        tags: [],
        description: '',
        featuredImageUrl: '',
        redirectPageEnabled: true, // Auto-enabled by default
        color: '#000000',
        backgroundColor: '#FFFFFF',
        size: 200,
        errorCorrectionLevel: 'M',
        includeMargin: true,
        containerBackgroundColor: '#FFFFFF',
        logoDataUrl: '',
        userId: user?.uid || '',
        createdAt: new Date().toISOString(),
        order: 0,
        visits: 0,
        scheduleEnabled: false,
        scanLimitEnabled: false,
        passwordEnabled: false,
      } as DynamicQRCodeData;
    } else {
      return {
        id: uuidv4(),
        name: '',
        type: 'static',
        url: '',
        color: '#000000',
        backgroundColor: '#FFFFFF',
        size: 200,
        errorCorrectionLevel: 'M',
        includeMargin: true,
        containerBackgroundColor: '#FFFFFF',
        logoDataUrl: '',
        userId: user?.uid || '',
        createdAt: new Date().toISOString(),
        order: 0,
      } as StaticQRCodeData;
    }
  }

  function generateShortId(): string {
    return Math.random().toString(36).substring(2, 10);
  }

  const toggleMode = () => {
    const newDynamicMode = !isDynamicMode;
    setIsDynamicMode(newDynamicMode);
    
    // Create new entry with the correct type
    const newEntry = createEmptyEntry(newDynamicMode);
    setQrEntries([newEntry]);
    setErrors({});
    setOpenIndex(0);
    setCurrentPage(1);
    setCurrentStep(1);
  };

  const addNewEntry = () => {
    const newEntry = createEmptyEntry();
    newEntry.order = qrEntries.length;
    setQrEntries(prev => [...prev, newEntry]);

    const newEntryPage = Math.ceil((qrEntries.length + 1) / entriesPerPage);
    if (newEntryPage !== currentPage) setCurrentPage(newEntryPage);

    const newEntryIndexOnPage = (qrEntries.length) % entriesPerPage;
    setOpenIndex(newEntryIndexOnPage);
    setIsFabOpen(false);
  };

  const removeEntry = (index: number) => {
    const actualIndex = startIndex + index;

    setQrEntries(prev =>
      prev
        .filter((_, i) => i !== actualIndex)
        .map((entry, newIndex) => ({ ...entry, order: newIndex }))
    );

    setOpenIndex(prev => {
      if (prev === null) return null;
      if (prev === index) return null;
      return prev > index ? prev - 1 : prev;
    });

    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[actualIndex];
      const adjusted: Record<number, { url?: string; targetUrl?: string; name?: string }> = {};
      Object.entries(newErrors).forEach(([key, value]) => {
        const i = parseInt(key);
        if (i < actualIndex) adjusted[i] = value;
        else if (i > actualIndex) adjusted[i - 1] = value;
      });
      return adjusted;
    });

    const newTotalPages = Math.ceil((qrEntries.length - 1) / entriesPerPage);
    if (currentPage > newTotalPages && newTotalPages > 0) {
      setCurrentPage(newTotalPages);
    }

    toast.success('Entry removed');
  };

  const updateEntry = (index: number, updates: Partial<QRCodeData>) => {
    const actualIndex = startIndex + index;
    setQrEntries(prev => prev.map((entry, i) => (i === actualIndex ? { ...entry, ...updates } : entry)));
  };

  const toggleItem = (index: number) => {
    setOpenIndex(prev => (prev === index ? null : index));
  };

  const isValidUrl = (input: string): boolean => {
    try {
      new URL(input);
      return true;
    } catch {
      return false;
    }
  };

  const validateEntries = (): boolean => {
    const newErrors: Record<number, { url?: string; targetUrl?: string; name?: string }> = {};
    let hasErrors = false;

    qrEntries.forEach((entry, index) => {
      const entryErrors: { url?: string; targetUrl?: string; name?: string } = {};

      if (entry.type === 'static') {
        const staticEntry = entry as StaticQRCodeData;
        if (!staticEntry.url.trim()) {
          entryErrors.url = 'URL is required';
          hasErrors = true;
        } else if (!isValidUrl(staticEntry.url)) {
          entryErrors.url = 'Invalid URL';
          hasErrors = true;
        }
        if (!staticEntry.name.trim()) {
          entryErrors.name = 'Name is required';
          hasErrors = true;
        }
      } else {
        const dynamicEntry = entry as DynamicQRCodeData;
        if (!dynamicEntry.targetUrl.trim()) {
          entryErrors.targetUrl = 'Target URL is required';
          hasErrors = true;
        } else if (!isValidUrl(dynamicEntry.targetUrl)) {
          entryErrors.targetUrl = 'Invalid URL';
          hasErrors = true;
        }
        if (!dynamicEntry.name.trim()) {
          entryErrors.name = 'Name is required';
          hasErrors = true;
        }
      }

      if (Object.keys(entryErrors).length > 0) {
        newErrors[index] = entryErrors;
      }
    });

    setErrors(newErrors);
    return !hasErrors;
  };

  const handleCSVUpload = (newEntries: QRCodeData[]) => {
    const entriesWithOrder = newEntries.map((entry, index) => ({
      ...entry,
      type: isDynamicMode ? 'dynamic' : 'static',
      order: qrEntries.length + index
    }));

    setQrEntries(prevEntries => [...prevEntries, ...entriesWithOrder]);

    const newEntriesPage = Math.ceil((qrEntries.length + newEntries.length) / entriesPerPage);
    setCurrentPage(newEntriesPage);
    setOpenIndex(0);
    setShowCSVModal(false);
    setCsvImportSuccess(`${newEntries.length} entries imported!`);

    setTimeout(() => {
      setCsvImportSuccess(null);
    }, 5000);

    toast.success(`${newEntries.length} entries imported!`);
  };

  const handleGenerateClick = () => {
    setIsFabOpen(false);

    if (!user) {
      navigate('/login');
      return;
    }

    setGenerationError(null);

    if (!validateEntries()) {
      setGenerationError('Please complete all required fields.');
      toast.error('Please complete all required fields.');
      return;
    }

    if (qrEntries.length > userQuota) {
      setGenerationError(`Quota exceeded: ${qrEntries.length} entries require ${userQuota} quota.`);
      return;
    }

    setShowConfirmation(true);
  };

  const generateAllQRCodes = async () => {
    if (!user) {
      toast.error('Please log in');
      return;
    }

    setIsGenerating(true);
    setShowConfirmation(false);
    setGenerationError(null);
    
    // Instantly show results with loading state
    setShowResults(true);
    
    // Create placeholder QR codes for immediate display
    const placeholderQRs = qrEntries.map((entry, i) => ({
      ...entry,
      id: entry.type === 'dynamic' ? entry.shortId : uuidv4(),
      name: entry.name || `${entry.type === 'static' ? 'Static' : 'Dynamic'} QR Code ${i + 1}`,
      order: i,
      isLoading: true // Add loading state
    }));
    
    setGeneratedQRs(placeholderQRs);
    
    const generationToastId = toast.loading(`Generating ${qrEntries.length} QR codes...`);

    try {
      const userRef = doc(db, 'users', user.uid);
      const generated: QRCodeData[] = [];

      await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) {
          throw new Error('User not found');
        }
        const currentQuota = userDoc.data().quota || 0;
        if (currentQuota < qrEntries.length) {
          throw new Error('Insufficient quota');
        }

        for (let i = 0; i < qrEntries.length; i++) {
          const entry = qrEntries[i];
          const now = new Date().toISOString();

          let qrCodeData: QRCodeData;

          if (entry.type === 'static') {
            const staticEntry = entry as StaticQRCodeData;
            qrCodeData = {
              ...staticEntry,
              id: uuidv4(),
              name: staticEntry.name || `Static QR Code ${i + 1}`,
              userId: user.uid,
              createdAt: now,
              order: i,
            };
          } else {
            const dynamicEntry = entry as DynamicQRCodeData;
            qrCodeData = {
              ...dynamicEntry,
              id: dynamicEntry.shortId,
              name: dynamicEntry.name || `Dynamic QR Code ${i + 1}`,
              userId: user.uid,
              createdAt: now,
              order: i,
              visits: 0,
            };
          }

          generated.push(qrCodeData);

          // Save to Firestore for all users (removed premium restriction)
          const qrCodeRef = doc(db, 'qrcodes', qrCodeData.id);
          transaction.set(qrCodeRef, qrCodeData);
        }

        const currentGenerated = userDoc.data().qrCodesGenerated || 0;
        transaction.update(userRef, {
          qrCodesGenerated: currentGenerated + qrEntries.length,
          quota: currentQuota - qrEntries.length,
          updatedAt: new Date().toISOString(),
        });
      });

      const sortedGenerated = generated.sort((a, b) => (a.order || 0) - (b.order || 0));

      // Update the existing results with actual data
      setGeneratedQRs(sortedGenerated.map(qr => ({ ...qr, isLoading: false })));
      onQuotaUpdate(userQuota - qrEntries.length);
      setCurrentPage(1);

      toast.success(`${generated.length} QR codes generated!`, {
        id: generationToastId
      });

    } catch (error: any) {
      console.error('Error generating QR codes:', error);
      toast.error(error.message || 'Generation failed', {
        id: generationToastId
      });
      // Revert to form on error
      setShowResults(false);
    } finally {
      setIsGenerating(false);
    }
  };

  const resetGenerator = () => {
    setQrEntries([createEmptyEntry()]);
    setGeneratedQRs([]);
    setShowResults(false);
    setErrors({});
    setOpenIndex(0);
    setCsvImportSuccess(null);
    setCurrentPage(1);
    setIsFabOpen(false);
    setCurrentStep(1);
  };

  const handleClose = () => {
    if (hasUnsavedChanges() && !showResults) {
      setShowExitConfirmation(true);
    } else {
      onClose();
    }
  };

  const confirmExit = () => {
    setShowExitConfirmation(false);
    onClose();
  };

  const cancelExit = () => {
    setShowExitConfirmation(false);
  };

  const handleOpenCSVModal = () => {
    setShowCSVModal(true);
    setIsFabOpen(false);
  };

  const toggleFab = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFabOpen(!isFabOpen);
  };

  const PaginationControls = () => {
    if (totalPages <= 1) return null;

    return (
      <div className="flex justify-center items-center space-x-2 mt-6 mb-4">
        <button
          onClick={goToFirstPage}
          disabled={currentPage === 1}
          className="p-2 rounded-md text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>

        <button
          onClick={goToPreviousPage}
          disabled={currentPage === 1}
          className="p-2 rounded-md text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center space-x-1">
          {generatePaginationPages.map((page, index) => (
            <React.Fragment key={index}>
              {page === '...' ? (
                <span className="px-2 text-gray-400">...</span>
              ) : (
                <button
                  onClick={() => goToPage(page as number)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    currentPage === page
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {page}
                </button>
              )}
            </React.Fragment>
          ))}
        </div>

        <button
          onClick={goToNextPage}
          disabled={currentPage === totalPages}
          className="p-2 rounded-md text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        <button
          onClick={goToLastPage}
          disabled={currentPage === totalPages}
          className="p-2 rounded-md text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>
    );
  };

  // Step-based Progress Indicator
  const StepIndicator = () => {
    const steps = [
      { id: 1, title: 'Choose Mode', icon: Target, completed: true },
      { id: 2, title: 'Configure QR Codes', icon: Layers, completed: qrEntries.some(entry => entry.name && (entry.type === 'static' ? entry.url : entry.targetUrl)) },
      { id: 3, title: 'Generate & Download', icon: CheckCircle2, completed: showResults }
    ];

    return (
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <div className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                  step.completed 
                    ? 'bg-blue-600 border-blue-600 text-white' 
                    : currentStep === step.id 
                      ? 'border-blue-600 text-blue-600 bg-blue-50' 
                      : 'border-gray-300 text-gray-400'
                }`}>
                  <step.icon className="w-5 h-5" />
                </div>
                <div className="ml-3 hidden sm:block">
                  <div className={`text-sm font-medium ${
                    step.completed ? 'text-blue-600' : currentStep === step.id ? 'text-blue-600' : 'text-gray-500'
                  }`}>
                    {step.title}
                  </div>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className={`flex-1 h-1 mx-4 rounded-full ${
                  step.completed ? 'bg-blue-600' : 'bg-gray-200'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  };

  if (showResults) {
    return (
      <QRResult
        generatedQRs={generatedQRs}
        onClose={onClose}
        onGenerateNew={resetGenerator}
        subscriptionPlan={subscriptionPlan}
        userId={userId}
        isGenerating={isGenerating}
      />
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-20">
      {/* Step Progress Indicator */}
      <StepIndicator />

      {/* Mode Toggle */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white rounded-2xl shadow-xl p-6 mb-8 border border-gray-200"
      >
        <div className="flex items-center justify-center mb-6">
          <div className="flex items-center bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => !isDynamicMode || toggleMode()}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                !isDynamicMode
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              <Zap className="w-5 h-5" />
              Static QR
            </button>
            <button
              onClick={() => isDynamicMode || toggleMode()}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                isDynamicMode
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'text-gray-600 hover:text-purple-600'
              }`}
            >
              <Target className="w-5 h-5" />
              Dynamic QR
            </button>
          </div>
        </div>

        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-gray-800 mb-3">
            {isDynamicMode ? 'Dynamic QR Codes' : 'Static QR Codes'}
          </h3>
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm ${
            isDynamicMode ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
          }`}>
            {isDynamicMode ? (
              <>
                <Target className="w-4 h-4" />
                Trackable • Analytics • Advanced Features • Available to All Users
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Permanent • Direct Links • Simple & Fast
              </>
            )}
          </div>
        </div>

        <AnimatePresence>
          {csvImportSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start"
            >
              <Sparkles className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
              <span className="text-green-700">{csvImportSuccess}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-wrap gap-2 sm:gap-3 mb-6 justify-center sm:justify-start">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={addNewEntry}
            className="px-3 py-2 sm:px-4 sm:py-2.5 text-sm bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Entry
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleOpenCSVModal}
            className="px-3 py-2 sm:px-4 sm:py-2.5 text-sm bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-300 focus:ring-offset-2 flex items-center gap-2"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Import CSV
          </motion.button>
        </div>

        <div className="space-y-6 mb-8">
          <div className="flex items-center justify-between gap-3 mb-6">
            <h3 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center gap-3">
              <Layers className="w-6 h-6" />
              {isDynamicMode ? 'Dynamic' : 'Static'} QR Code Entries ({qrEntries.length})
            </h3>
          </div>

          {currentEntries.map((entry, index) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <InputForm
                data={entry}
                onUpdate={(updates) => updateEntry(index, updates)}
                onRemove={() => removeEntry(index)}
                isOpen={openIndex === index}
                onToggle={() => toggleItem(index)}
                index={startIndex + index}
                errors={errors[startIndex + index] || {}}
                subscriptionPlan={subscriptionPlan}
                generatorType={isDynamicMode ? 'dynamic' : 'static'}
                mode={qrEntries.length > 1 ? 'bulk' : 'single'}
              />
            </motion.div>
          ))}

          <PaginationControls />
        </div>

        {user && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 mb-8 border border-blue-200"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-gray-600">
                    Quota Required: <span className="font-semibold">{qrEntries.length}</span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Play className="w-5 h-5 text-blue-600" />
                  <span className="text-sm text-gray-600">
                    Remaining: <span className="font-semibold">{userQuota}</span>
                  </span>
                </div>
              </div>
              {qrEntries.length > userQuota && (
                <div className="flex items-center text-red-600 bg-red-50 px-4 py-2 rounded-xl">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  <span className="text-sm font-medium">Insufficient quota</span>
                </div>
              )}
            </div>
            
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex justify-center w-full mt-6"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGenerateClick}
            disabled={isGenerating || qrEntries.length === 0}
            className={`
              w-full sm:max-w-md py-4 px-6 text-lg font-semibold rounded-xl transition-all duration-300
              focus:outline-none focus:ring-4 focus:ring-offset-2 flex items-center justify-center gap-3
              ${isGenerating || qrEntries.length === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed focus:ring-gray-400'
                : isDynamicMode
                ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800 focus:ring-purple-300 shadow-xl hover:shadow-2xl'
                : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 focus:ring-blue-300 shadow-xl hover:shadow-2xl'
              }
            `}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                Generating...
              </>
            ) : !user ? (
              <>
                <RefreshCw className="w-6 h-6" />
                Login to Generate
              </>
            ) : (
              <>
                <Play className="w-6 h-6" />
                Generate {qrEntries.length} {isDynamicMode ? 'Dynamic' : 'Static'} QR Code{qrEntries.length > 1 ? 's' : ''}
              </>
            )}
          </motion.button>
        </motion.div>

        {generationError && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center"
          >
            <AlertCircle className="w-5 h-5 text-red-500 mr-3 flex-shrink-0" />
            <span className="text-red-700">{generationError}</span>
          </motion.div>
        )}
      </motion.div>

      {/* Floating Action Button */}
      <AnimatePresence>
        {showScrollFab && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3 }}
            className="fixed top-36 right-6 z-50"
          >
            <AnimatePresence>
              {isFabOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, y: -20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: -20 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="absolute top-20 right-0 flex flex-col items-end space-y-3"
                >
                  <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 50 }}
                    transition={{ duration: 0.2, delay: 0.1 }}
                    className="flex items-center"
                  >
                    <div className="bg-black/80 text-white px-3 py-2 rounded-lg text-sm font-medium mr-3 whitespace-nowrap backdrop-blur-sm">
                      {isGenerating
                        ? 'Generating...'
                        : !user
                        ? 'Login to Generate'
                        : `Generate ${isDynamicMode ? 'Dynamic' : 'Static'} QRs`}
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleGenerateClick}
                      disabled={isGenerating || qrEntries.length === 0}
                      className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                        isGenerating || qrEntries.length === 0
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : isDynamicMode
                          ? 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white focus:ring-purple-300'
                          : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white focus:ring-blue-300'
                      }`}
                    >
                      {isGenerating ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                      ) : (
                        <Play className="w-6 h-6" />
                      )}
                    </motion.button>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 50 }}
                    transition={{ duration: 0.2, delay: 0.05 }}
                    className="flex items-center"
                  >
                    <div className="bg-black/80 text-white px-3 py-2 rounded-lg text-sm font-medium mr-3 whitespace-nowrap backdrop-blur-sm">
                      Add Entry
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={addNewEntry}
                      className="w-14 h-14 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-full text-white shadow-lg flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2"
                    >
                      <Plus className="w-6 h-6" />
                    </motion.button>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 50 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center"
                  >
                    <div className="bg-black/80 text-white px-3 py-2 rounded-lg text-sm font-medium mr-3 whitespace-nowrap backdrop-blur-sm">
                      Import CSV File
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleOpenCSVModal}
                      className="w-14 h-14 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white focus:ring-green-300 rounded-full text-white shadow-lg flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
                    >
                      <FileSpreadsheet className="w-5 h-5" />
                    </motion.button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleFab}
              className="
                px-4 py-3 text-sm sm:px-6 sm:py-4 sm:text-base
                bg-indigo-600 hover:bg-indigo-700 
                text-white rounded-full shadow-2xl 
                flex items-center gap-2 
                transition-all duration-300 
                focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:ring-offset-2
              "
            >
              {isFabOpen ? (
                <>
                  <X className="w-5 h-5" />
                  <span className="font-medium hidden sm:inline">Close</span>
                </>
              ) : (
                <>
                  <Wrench className="w-5 h-5" />
                  <span className="font-medium hidden sm:inline">Tools</span>
                </>
              )}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <AnimatePresence>
        {showConfirmation && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={{
              hidden: { opacity: 0, scale: 0.95 },
              visible: { opacity: 1, scale: 1, transition: { duration: 0.2 } },
              exit: { opacity: 0, scale: 0.95, transition: { duration: 0.15 } },
            }}
            onClick={() => setShowConfirmation(false)}
          >
            <motion.div
              className="relative bg-white rounded-2xl shadow-lg max-w-md w-full mx-4 p-6"
              onClick={(e) => e.stopPropagation()}
              variants={{
                hidden: { scale: 0.95 },
                visible: { scale: 1 },
                exit: { scale: 0.95 },
              }}
            >
              <button
                onClick={() => setShowConfirmation(false)}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 focus:outline-none"
                aria-label="Close"
              >
                <XCircle className="h-6 w-6" />
              </button>

              <div className="text-center">
                <div className="flex items-center justify-center rounded-full bg-blue-100 p-3 mx-auto mb-4 w-16 h-16">
                  <Play className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">
                  Generate {qrEntries.length} {isDynamicMode ? 'Dynamic' : 'Static'} QR Code{qrEntries.length > 1 ? 's' : ''}?
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  This will use {qrEntries.length} of your {userQuota} available quota. Your QR codes will be generated instantly and saved to your account.
                </p>
              </div>

              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setShowConfirmation(false)}
                  className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Cancel
                </button>
                <button
                  onClick={generateAllQRCodes}
                  className={`px-6 py-3 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    isDynamicMode
                      ? 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 focus:ring-purple-300'
                      : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:ring-blue-300'
                  }`}
                >
                  Confirm & Generate
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showExitConfirmation && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={{
              hidden: { opacity: 0, scale: 0.95 },
              visible: { opacity: 1, scale: 1, transition: { duration: 0.2 } },
              exit: { opacity: 0, scale: 0.95, transition: { duration: 0.15 } },
            }}
            onClick={cancelExit}
          >
            <motion.div
              className="relative bg-white rounded-2xl shadow-lg max-w-md w-full mx-4 p-6"
              onClick={(e) => e.stopPropagation()}
              variants={{
                hidden: { scale: 0.95 },
                visible: { scale: 1 },
                exit: { scale: 0.95 },
              }}
            >
              <button
                onClick={cancelExit}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 focus:outline-none"
                aria-label="Close"
              >
                <XCircle className="h-6 w-6" />
              </button>
              <div className="text-center">
                <div className="flex items-center justify-center rounded-full bg-yellow-100 p-3 mx-auto mb-4 w-16 h-16">
                  <AlertCircle className="h-8 w-8 text-yellow-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">
                  Unsaved Changes
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  You have unsaved changes. Are you sure you want to leave? Your progress will be lost.
                </p>
              </div>

              <div className="flex justify-center space-x-4">
                <button
                  onClick={cancelExit}
                  className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Stay
                </button>
                <button
                  onClick={confirmExit}
                  className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 active:from-red-800 active:to-red-900 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-offset-2"
                >
                  Leave
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCSVModal && (
          <CSVUploadModal
            onClose={() => setShowCSVModal(false)}
            onUpload={handleCSVUpload}
            existingEntries={qrEntries}
            qrType={isDynamicMode ? 'dynamic' : 'static'}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Generator;
