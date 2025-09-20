import React, { useState, useEffect } from 'react';
import { QRCodeData, StaticQRCodeData, DynamicQRCodeData, isStaticQR, isDynamicQR } from '../types/qrcode';
import ColorPicker from './ColorPicker';
import { 
  X, 
  ChevronDown, 
  ChevronUp, 
  AlertCircle, 
  CheckCircle, 
  Upload, 
  Trash2, 
  Tag, 
  Hash, 
  Clock,
  Shield,
  Eye,
  Settings,
  Calendar,
  Lock,
  Globe2,
  FileText,
  Target,
  Zap,
  Image as ImageIcon,
  Palette,
  Timer,
  Users,
  BarChart
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface InputFormProps {
  data: QRCodeData;
  onUpdate: (newData: Partial<QRCodeData>) => void;
  onRemove: () => void;
  isOpen: boolean;
  onToggle: () => void;
  index: number;
  errors: { url?: string; targetUrl?: string; name?: string };
  subscriptionPlan: string;
  generatorType: 'static' | 'dynamic';
  mode: 'single' | 'bulk';
}

const InputForm: React.FC<InputFormProps> = ({
  data,
  onUpdate,
  onRemove,
  isOpen,
  onToggle,
  index,
  errors: propErrors,
  subscriptionPlan,
  generatorType,
  mode
}) => {
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [localErrors, setLocalErrors] = useState(propErrors);
  const [tagInput, setTagInput] = useState('');
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    advanced: false,
    design: false
  });

  useEffect(() => {
    setLocalErrors(propErrors);
  }, [propErrors]);

  const hasErrors = Object.keys(localErrors).length > 0;
  const isValid = getValidationStatus();

  function getValidationStatus(): boolean {
    if (isStaticQR(data)) {
      return data.url && data.name && !hasErrors;
    } else if (isDynamicQR(data)) {
      return data.targetUrl && data.name && !hasErrors;
    }
    return false;
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      const maxUploadSizeMB = 5;
      const maxStorageSizeKB = 700;
      const maxStorageSizeBytes = maxStorageSizeKB * 1024;

      setLogoError(null);
      setLogoUploading(true);

      if (file.size > maxUploadSizeMB * 1024 * 1024) {
        setLogoError(`File size too large. Please select an image smaller than ${maxUploadSizeMB}MB.`);
        e.target.value = '';
        setLogoUploading(false);
        return;
      }

      if (!file.type.startsWith('image/')) {
        setLogoError('Please select a valid image file.');
        e.target.value = '';
        setLogoUploading(false);
        return;
      }

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        let newWidth = width;
        let newHeight = height;
        const aspectRatio = width / height;

        const targetArea = 600 * 600;

        if (width * height > targetArea) {
          newWidth = Math.sqrt(targetArea * aspectRatio);
          newHeight = Math.sqrt(targetArea / aspectRatio);
        }

        canvas.width = newWidth;
        canvas.height = newHeight;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          setLogoError('Could not get canvas context.');
          setLogoUploading(false);
          URL.revokeObjectURL(img.src);
          return;
        }

        ctx.drawImage(img, 0, 0, newWidth, newHeight);

        let dataURL = canvas.toDataURL(file.type, 0.9);
        let quality = 0.9;

        while (dataURL.length > maxStorageSizeBytes && quality > 0.1) {
          quality -= 0.1;
          dataURL = canvas.toDataURL(file.type, quality);
        }

        if (dataURL.length > maxStorageSizeBytes) {
          setLogoError('Logo not supported. Please select a different file.');
          setLogoUploading(false);
          URL.revokeObjectURL(img.src);
          return;
        }

        onUpdate({ logoDataUrl: dataURL });
        setLogoUploading(false);
        URL.revokeObjectURL(img.src);
      };
      img.onerror = () => {
        setLogoError('Failed to load the image. Please try again.');
        setLogoUploading(false);
        URL.revokeObjectURL(img.src);
      };
      img.src = URL.createObjectURL(file);
    }
  };

  const removeLogo = () => {
    onUpdate({ logoDataUrl: '' });
    setLogoError(null);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (localErrors.name && value.trim()) {
      setLocalErrors(prev => {
        const newErr = { ...prev };
        delete newErr.name;
        return newErr;
      });
    }
    onUpdate({ name: value });
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const urlField = isStaticQR(data) ? 'url' : 'targetUrl';
    
    if (localErrors[urlField] && value.trim()) {
      setLocalErrors(prev => {
        const newErr = { ...prev };
        delete newErr[urlField];
        return newErr;
      });
    }
    
    if (isStaticQR(data)) {
      onUpdate({ url: value });
    } else {
      onUpdate({ targetUrl: value });
    }
  };

  const handleTagAdd = () => {
    if (tagInput.trim() && isDynamicQR(data)) {
      const newTags = [...(data.tags || []), tagInput.trim()];
      onUpdate({ tags: newTags });
      setTagInput('');
    }
  };

  const handleTagRemove = (tagToRemove: string) => {
    if (isDynamicQR(data)) {
      const newTags = (data.tags || []).filter(tag => tag !== tagToRemove);
      onUpdate({ tags: newTags });
    }
  };

  const toggleSection = (section: 'basic' | 'advanced' | 'design') => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const truncateText = (text: string, maxLength: number): string => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const truncateUrl = (url: string, maxLength: number = 30): string => {
    return truncateText(url, maxLength);
  };

  const truncateName = (name: string, maxLength: number = 25): string => {
    return truncateText(name, maxLength);
  };

  const getDisplayUrl = (): string => {
    if (isStaticQR(data)) {
      return data.url;
    } else if (isDynamicQR(data)) {
      return data.targetUrl;
    }
    return '';
  };

  const getUrlFieldError = () => {
    if (isStaticQR(data)) {
      return localErrors.url;
    } else if (isDynamicQR(data)) {
      return localErrors.targetUrl;
    }
    return undefined;
  };

  // Auto-enable redirect page for password protected, scheduled, or scan-limited QRs
  useEffect(() => {
    if (isDynamicQR(data) && (data.passwordEnabled || data.scheduleEnabled || data.scanLimitEnabled)) {
      onUpdate({ redirectPageEnabled: true });
    }
  }, [data.passwordEnabled, data.scheduleEnabled, data.scanLimitEnabled]);

  const SectionHeader = ({ 
    title, 
    description, 
    icon: Icon, 
    gradient, 
    isExpanded, 
    onToggle,
    badge 
  }: {
    title: string;
    description: string;
    icon: any;
    gradient: string;
    isExpanded: boolean;
    onToggle: () => void;
    badge?: string;
  }) => (
    <div
      onClick={onToggle}
      className={`flex items-center justify-between cursor-pointer p-4 ${gradient} rounded-xl hover:shadow-md transition-all duration-300 shadow-sm group`}
    >
      <div className="flex items-center gap-3 flex-1">
        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-white text-lg">{title}</h4>
            {badge && (
              <span className="text-xs bg-white/20 text-white px-2 py-1 rounded-full font-medium backdrop-blur-sm">
                {badge}
              </span>
            )}
          </div>
          <p className="text-white/80 text-sm">{description}</p>
        </div>
      </div>
      <motion.div
        animate={{ rotate: isExpanded ? 180 : 0 }}
        transition={{ duration: 0.2 }}
        className="text-white/80"
      >
        <ChevronDown className="w-5 h-5" />
      </motion.div>
    </div>
  );

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`border-2 rounded-3xl overflow-hidden transition-all duration-300 shadow-lg ${
        hasErrors 
          ? 'border-red-300 bg-red-50/30 shadow-red-100' 
          : isValid 
            ? 'border-green-300 bg-green-50/30 shadow-green-100' 
            : 'border-gray-200 bg-white shadow-gray-100'
      } hover:shadow-xl`}
    >
      {/* Enhanced Header */}
      <div
        onClick={onToggle}
        className={`w-full flex justify-between items-center p-5 sm:p-6 transition-all cursor-pointer ${
          isOpen 
            ? 'bg-gradient-to-r from-slate-50 to-slate-100' 
            : 'hover:bg-gradient-to-r hover:from-slate-50 hover:to-slate-100'
        }`}
      >
        <div className="flex items-center space-x-4 flex-1 min-w-0">
          {/* Enhanced Status Indicator */}
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-bold flex-shrink-0 transition-all duration-300 ${
              hasErrors 
                ? 'bg-gradient-to-br from-red-400 to-red-600 text-white shadow-lg' 
                : isValid 
                  ? 'bg-gradient-to-br from-green-400 to-green-600 text-white shadow-lg' 
                  : 'bg-gradient-to-br from-blue-400 to-blue-600 text-white shadow-lg'
            }`}
          >
            {hasErrors ? <AlertCircle className="w-6 h-6" /> : isValid ? <CheckCircle className="w-6 h-6" /> : index + 1}
          </div>

          {/* Enhanced Entry Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <div className="font-bold text-gray-900 text-base sm:text-lg truncate">
                {truncateName(data.name || `${generatorType === 'static' ? 'Static' : 'Dynamic'} QR Code ${index + 1}`)}
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="truncate flex-1">
                {truncateUrl(getDisplayUrl()) || 'No URL provided'}
              </div>
              {isDynamicQR(data) && data.visits !== undefined && (
                <div className="flex items-center gap-1 bg-blue-100 px-2 py-1 rounded-full text-xs font-medium text-blue-700">
                  <BarChart className="w-3 h-3" />
                  {data.visits} visits
                </div>
              )}
            </div>

            {/* Enhanced Features Indicators for Dynamic QR */}
            {isDynamicQR(data) && (
              <div className="flex items-center gap-1 mt-2">
                {data.scheduleEnabled && (
                  <div className="flex items-center gap-1 bg-orange-100 px-2 py-1 rounded-full text-xs font-medium text-orange-700">
                    <Calendar className="w-3 h-3" />
                    Scheduled
                  </div>
                )}
                {data.passwordEnabled && (
                  <div className="flex items-center gap-1 bg-purple-100 px-2 py-1 rounded-full text-xs font-medium text-purple-700">
                    <Lock className="w-3 h-3" />
                    Protected
                  </div>
                )}
                {data.scanLimitEnabled && (
                  <div className="flex items-center gap-1 bg-yellow-100 px-2 py-1 rounded-full text-xs font-medium text-yellow-700">
                    <Target className="w-3 h-3" />
                    Limited
                  </div>
                )}
              </div>
            )}

            {hasErrors && (
              <div className="text-xs text-red-600 mt-1 truncate bg-red-100 px-2 py-1 rounded-lg">
                {Object.values(localErrors).join(', ')}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-3 flex-shrink-0">
          {/* Enhanced Type Badge */}
          <span className={`px-3 py-2 text-sm font-bold rounded-2xl flex items-center gap-2 shadow-md ${
            generatorType === 'static' 
              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' 
              : 'bg-gradient-to-r from-purple-500 to-purple-600 text-white'
          }`}>
            {generatorType === 'static' ? (
              <>
                <Zap className="w-4 h-4" />
                Static
              </>
            ) : (
              <>
                <Target className="w-4 h-4" />
                Dynamic
              </>
            )}
          </span>

          {/* Remove Button (when collapsed) */}
          {!isOpen && mode === 'bulk' && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all duration-200 rounded-xl"
              title="Remove entry"
            >
              <Trash2 className="w-5 h-5" />
            </motion.button>
          )}

          {/* Enhanced Expand/Collapse Icon */}
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.3 }}
            className="text-gray-400"
          >
            <ChevronDown className="w-6 h-6" />
          </motion.div>
        </div>
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="border-t-2 border-gray-100"
          >
            <div className="p-6 space-y-8 bg-gradient-to-br from-gray-50/50 to-white">
              {/* Remove Button (when expanded) */}
              {mode === 'bulk' && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-end"
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove();
                    }}
                    className="inline-flex items-center px-4 py-2 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-xl transition-all duration-200 font-medium border border-red-200 hover:border-red-300"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Remove Entry
                  </button>
                </motion.div>
              )}

              {/* Basic Information Section */}
              <div className="space-y-6">
                <SectionHeader
                  title="Basic Information"
                  description="Essential details for your QR code"
                  icon={Globe2}
                  gradient="bg-gradient-to-r from-blue-500 to-blue-600"
                  isExpanded={expandedSections.basic}
                  onToggle={() => toggleSection('basic')}
                  badge="Required"
                />

                <AnimatePresence>
                  {expandedSections.basic && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-6 pl-4"
                    >
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* QR Code Name */}
                        <div className="space-y-2">
                          <label className="block text-sm font-semibold text-gray-700">
                            QR Code Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={data.name || ''}
                            onChange={handleNameChange}
                            placeholder={`${generatorType === 'static' ? 'Static' : 'Dynamic'} QR Code ${index + 1}`}
                            required
                            className={`w-full rounded-2xl border-2 p-4 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 ${
                              localErrors.name ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                            }`}
                          />
                          {localErrors.name && (
                            <motion.p
                              initial={{ opacity: 0, y: -5 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="mt-2 text-sm text-red-600 flex items-center bg-red-50 p-3 rounded-xl"
                            >
                              <AlertCircle className="w-4 h-4 mr-2" />
                              {localErrors.name}
                            </motion.p>
                          )}
                        </div>

                        {/* URL Field */}
                        <div className="space-y-2">
                          <label className="block text-sm font-semibold text-gray-700">
                            {generatorType === 'static' ? 'URL' : 'Target URL'} <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="url"
                            value={getDisplayUrl()}
                            onChange={handleUrlChange}
                            placeholder={generatorType === 'static' ? 'https://example.com' : 'https://your-website.com/landing-page'}
                            className={`w-full rounded-2xl border-2 p-4 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 ${
                              getUrlFieldError() ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                            }`}
                            required
                          />
                          {getUrlFieldError() && (
                            <motion.p
                              initial={{ opacity: 0, y: -5 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="mt-2 text-sm text-red-600 flex items-center bg-red-50 p-3 rounded-xl"
                            >
                              <AlertCircle className="w-4 h-4 mr-2" />
                              {getUrlFieldError()}
                            </motion.p>
                          )}
                          {generatorType === 'dynamic' && (
                            <p className="mt-2 text-xs text-gray-500 bg-blue-50 p-3 rounded-xl">
                              This is where users will be redirected after scanning the QR code
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Dynamic-specific fields - Only shown when scheduling is enabled */}
                      {generatorType === 'dynamic' && isDynamicQR(data) && data.scheduleEnabled && (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="space-y-6"
                        >
                          {/* Description - Only show if scheduling is enabled */}
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-2"
                          >
                            <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                              <FileText className="w-4 h-4" />
                              Description
                            </label>
                            <textarea
                              value={data.description || ''}
                              onChange={(e) => onUpdate({ description: e.target.value })}
                              placeholder="Brief description of this QR code's purpose"
                              rows={3}
                              className="w-full rounded-2xl border-2 border-gray-200 p-4 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 resize-none hover:border-gray-300"
                            />
                            <p className="text-xs text-gray-500 bg-orange-50 p-3 rounded-xl">
                              Description shown on scheduled redirect page
                            </p>
                          </motion.div>

                          {/* Featured Image - Only show if scheduling is enabled */}
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-2"
                          >
                            <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                              <ImageIcon className="w-4 h-4" />
                              Featured Image URL
                            </label>
                            <input
                              type="url"
                              value={data.featuredImageUrl || ''}
                              onChange={(e) => onUpdate({ featuredImageUrl: e.target.value })}
                              placeholder="https://example.com/image.jpg"
                              className="w-full rounded-2xl border-2 border-gray-200 p-4 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 hover:border-gray-300"
                            />
                            <p className="text-xs text-gray-500 bg-orange-50 p-3 rounded-xl">
                              Image displayed on scheduled redirect page
                            </p>
                          </motion.div>

                          {/* Tags - Only show if scheduling is enabled */}
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-2"
                          >
                            <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                              <Tag className="w-4 h-4" />
                              Tags
                            </label>
                            <div className="flex flex-wrap gap-2 mb-3">
                              {(data.tags || []).map((tag, tagIndex) => (
                                <motion.span
                                  key={tagIndex}
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  className="inline-flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 text-sm rounded-full font-medium"
                                >
                                  <Hash className="w-3 h-3" />
                                  {tag}
                                  <button
                                    type="button"
                                    onClick={() => handleTagRemove(tag)}
                                    className="text-blue-600 hover:text-blue-800 transition-colors"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </motion.span>
                              ))}
                            </div>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                placeholder="Add a tag"
                                className="flex-1 rounded-xl border-2 border-gray-200 p-3 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-sm hover:border-gray-300"
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleTagAdd();
                                  }
                                }}
                              />
                              <button
                                type="button"
                                onClick={handleTagAdd}
                                disabled={!tagInput.trim()}
                                className="px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
                              >
                                <Tag className="w-4 h-4" />
                              </button>
                            </div>
                            <p className="text-xs text-gray-500 bg-orange-50 p-3 rounded-xl">
                              Tags help organize and categorize your scheduled QR codes
                            </p>
                          </motion.div>
                        </motion.div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Advanced Features Section - Available for all dynamic QR codes */}
              {generatorType === 'dynamic' && isDynamicQR(data) && (
                <div className="space-y-6">
                  <SectionHeader
                    title="Advanced Features"
                    description="Security, scheduling, and access controls"
                    icon={Settings}
                    gradient="bg-gradient-to-r from-purple-500 to-purple-600"
                    isExpanded={expandedSections.advanced}
                    onToggle={() => toggleSection('advanced')}
                    badge="Premium"
                  />

                  <AnimatePresence>
                    {expandedSections.advanced && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-6 pl-4"
                      >
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Schedule Settings */}
                          <motion.div 
                            whileHover={{ scale: 1.02 }}
                            className="border-2 border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all bg-gradient-to-br from-orange-50 to-orange-100"
                          >
                            <label className="flex items-center gap-3 mb-4">
                              <input
                                type="checkbox"
                                checked={data.scheduleEnabled || false}
                                onChange={(e) => onUpdate({ scheduleEnabled: e.target.checked })}
                                className="w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                              />
                              <Calendar className="w-6 h-6 text-orange-600" />
                              <span className="font-semibold text-gray-800">Enable Scheduling</span>
                            </label>
                            <p className="text-sm text-orange-700 mb-4 pl-8">Control when your QR code is active</p>
                            
                            <AnimatePresence>
                              {data.scheduleEnabled && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="space-y-4 pl-8"
                                >
                                  <div className="grid grid-cols-2 gap-3">
                                    <div>
                                      <label className="block text-xs font-semibold text-gray-700 mb-2">Start Date</label>
                                      <input
                                        type="date"
                                        value={data.scheduleStart?.split('T')[0] || ''}
                                        onChange={(e) => onUpdate({ scheduleStart: e.target.value ? `${e.target.value}T00:00:00.000Z` : '' })}
                                        className="w-full rounded-xl border-2 border-orange-200 p-3 text-sm focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs font-semibold text-gray-700 mb-2">End Date</label>
                                      <input
                                        type="date"
                                        value={data.scheduleEnd?.split('T')[0] || ''}
                                        onChange={(e) => onUpdate({ scheduleEnd: e.target.value ? `${e.target.value}T23:59:59.999Z` : '' })}
                                        className="w-full rounded-xl border-2 border-orange-200 p-3 text-sm focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs font-semibold text-gray-700 mb-2">Daily Start</label>
                                      <input
                                        type="time"
                                        value={data.dailyStartTime || ''}
                                        onChange={(e) => onUpdate({ dailyStartTime: e.target.value })}
                                        className="w-full rounded-xl border-2 border-orange-200 p-3 text-sm focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs font-semibold text-gray-700 mb-2">Daily End</label>
                                      <input
                                        type="time"
                                        value={data.dailyEndTime || ''}
                                        onChange={(e) => onUpdate({ dailyEndTime: e.target.value })}
                                        className="w-full rounded-xl border-2 border-orange-200 p-3 text-sm focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                                      />
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>

                          {/* Scan Limits */}
                          <motion.div 
                            whileHover={{ scale: 1.02 }}
                            className="border-2 border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all bg-gradient-to-br from-yellow-50 to-yellow-100"
                          >
                            <label className="flex items-center gap-3 mb-4">
                              <input
                                type="checkbox"
                                checked={data.scanLimitEnabled || false}
                                onChange={(e) => onUpdate({ scanLimitEnabled: e.target.checked })}
                                className="w-5 h-5 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500"
                              />
                              <Target className="w-6 h-6 text-yellow-600" />
                              <span className="font-semibold text-gray-800">Enable Scan Limits</span>
                            </label>
                            <p className="text-sm text-yellow-700 mb-4 pl-8">Limit the number of scans</p>
                            
                            <AnimatePresence>
                              {data.scanLimitEnabled && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="pl-8"
                                >
                                  <label className="block text-xs font-semibold text-gray-700 mb-2">Maximum Scans</label>
                                  <input
                                    type="number"
                                    min="1"
                                    value={data.maxScans || ''}
                                    onChange={(e) => onUpdate({ maxScans: parseInt(e.target.value) || undefined })}
                                    placeholder="e.g., 100"
                                    className="w-full rounded-xl border-2 border-yellow-200 p-3 text-sm focus:ring-4 focus:ring-yellow-500/20 focus:border-yellow-500 transition-all"
                                  />
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>

                          {/* Password Protection */}
                          <motion.div 
                            whileHover={{ scale: 1.02 }}
                            className="border-2 border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all bg-gradient-to-br from-red-50 to-red-100 lg:col-span-2"
                          >
                            <label className="flex items-center gap-3 mb-4">
                              <input
                                type="checkbox"
                                checked={data.passwordEnabled || false}
                                onChange={(e) => onUpdate({ passwordEnabled: e.target.checked })}
                                className="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500"
                              />
                              <Lock className="w-6 h-6 text-red-600" />
                              <span className="font-semibold text-gray-800">Password Protection</span>
                            </label>
                            <p className="text-sm text-red-700 mb-4 pl-8">Require a password to access content</p>
                            
                            <AnimatePresence>
                              {data.passwordEnabled && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="pl-8"
                                >
                                  <label className="block text-xs font-semibold text-gray-700 mb-2">Access Password</label>
                                  <input
                                    type="password"
                                    value={data.password || ''}
                                    onChange={(e) => onUpdate({ password: e.target.value })}
                                    placeholder="Enter password"
                                    className="w-full rounded-xl border-2 border-red-200 p-3 text-sm focus:ring-4 focus:ring-red-500/20 focus:border-red-500 transition-all"
                                  />
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Design Customization Section */}
              <div className="space-y-6">
                <SectionHeader
                  title="Design & Customization"
                  description="Colors, logo, and visual appearance"
                  icon={Palette}
                  gradient="bg-gradient-to-r from-green-500 to-green-600"
                  isExpanded={expandedSections.design}
                  onToggle={() => toggleSection('design')}
                />

                <AnimatePresence>
                  {expandedSections.design && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-6 pl-4"
                    >
                      {/* Customization Options */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* QR Code Color */}
                        <motion.div whileHover={{ scale: 1.02 }} className="space-y-3">
                          <label className="block text-sm font-semibold text-gray-700">QR Code Color</label>
                          <div className="p-4 border-2 border-gray-200 rounded-2xl hover:border-green-300 transition-all bg-white">
                            <ColorPicker color={data.color} onChange={(color) => onUpdate({ color })} />
                          </div>
                        </motion.div>

                        {/* Background Color */}
                        <motion.div whileHover={{ scale: 1.02 }} className="space-y-3">
                          <label className="block text-sm font-semibold text-gray-700">Background Color</label>
                          <div className="p-4 border-2 border-gray-200 rounded-2xl hover:border-green-300 transition-all bg-white">
                            <ColorPicker color={data.backgroundColor} onChange={(backgroundColor) => onUpdate({ backgroundColor })} />
                          </div>
                        </motion.div>

                        {/* Error Correction */}
                        <motion.div whileHover={{ scale: 1.02 }} className="space-y-3">
                          <label className="block text-sm font-semibold text-gray-700">Error Correction Level</label>
                          <select
                            value={data.errorCorrectionLevel}
                            onChange={(e) => onUpdate({ errorCorrectionLevel: e.target.value as 'L' | 'M' | 'Q' | 'H' })}
                            className="w-full rounded-2xl border-2 border-gray-200 p-4 focus:ring-4 focus:ring-green-500/20 focus:border-green-500 hover:border-gray-300 transition-all"
                          >
                            <option value="L">Low (7%)</option>
                            <option value="M">Medium (15%)</option>
                            <option value="Q">Quartile (25%)</option>
                            <option value="H">High (30%)</option>
                          </select>
                        </motion.div>
                      </div>

                      {/* Logo Upload */}
                      <motion.div whileHover={{ scale: 1.01 }} className="space-y-3">
                        <label className="block text-sm font-semibold text-gray-700">Upload Your Logo</label>
                        {data.logoDataUrl ? (
                          <div className="space-y-3">
                            <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-200 rounded-2xl">
                              <img src={data.logoDataUrl} alt="Logo preview" className="w-16 h-16 object-contain rounded-xl shadow-md" />
                              <div className="flex-1">
                                <p className="text-sm font-semibold text-green-800">Logo uploaded successfully</p>
                                <p className="text-xs text-green-600">Your logo will appear in the center of the QR code</p>
                              </div>
                              <button
                                type="button"
                                onClick={removeLogo}
                                className="p-3 text-green-600 hover:text-red-600 transition-colors rounded-xl hover:bg-red-50"
                                title="Remove logo"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="relative">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleLogoUpload}
                                disabled={logoUploading}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                              />
                              <div
                                className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 ${
                                  logoUploading ? 'border-green-300 bg-green-50' : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                                }`}
                              >
                                {logoUploading ? (
                                  <div className="flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mr-3"></div>
                                    <span className="text-sm text-green-600 font-medium">Uploading...</span>
                                  </div>
                                ) : (
                                  <>
                                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                    <p className="text-sm text-gray-600 font-medium">Click to upload or drag and drop</p>
                                    <p className="text-xs text-gray-500 mt-2">PNG, JPG (max 5MB)</p>
                                  </>
                                )}
                              </div>
                            </div>

                            {logoError && (
                              <motion.p
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-sm text-red-600 flex items-center bg-red-50 p-3 rounded-xl"
                              >
                                <AlertCircle className="w-4 h-4 mr-2" />
                                {logoError}
                              </motion.p>
                            )}
                          </div>
                        )}
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default InputForm;
