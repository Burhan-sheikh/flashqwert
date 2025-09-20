 import React, { useState, useEffect, useRef } from 'react';
 import { QrCode, RefreshCw, AlertCircle, CheckCircle, Upload, ChevronDown, ChevronUp, X } from 'lucide-react';
 import ColorPicker from './ColorPicker';
 import { QRCodeData } from '../types/qrcode';
 import AdUnit from './AdUnit';
 import { useAuth } from '../context/AuthContext';
 import { useNavigate } from 'react-router-dom';
 import { motion, AnimatePresence } from 'framer-motion';

 interface QRCodeFormProps {
  qrData: QRCodeData;
  onInputChange: (newData: Partial<QRCodeData>) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  userQuota: number;
  qrCodesGenerated: number;
  subscriptionPlan: string;
  qrCodeName: string;
  onQrCodeNameChange: (name: string) => void;
  subscriptionExpiryDate: string | null;
  totalQuota: number;
 }

 const QRCodeForm: React.FC<QRCodeFormProps> = ({
  qrData,
  onInputChange,
  onGenerate,
  isGenerating,
  userQuota,
  qrCodesGenerated,
  subscriptionPlan,
  qrCodeName,
  onQrCodeNameChange,
  subscriptionExpiryDate,
  totalQuota,
 }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qrCodeNameInputRef = useRef<HTMLInputElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [expiryMessage, setExpiryMessage] = useState<string | null>(null);
  const [qrNameError, setQrNameError] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ url?: string; name?: string }>({});

  const showUpgradeMessage = subscriptionPlan !== 'Standard' && subscriptionPlan !== 'Premium';

  useEffect(() => {
  if (subscriptionExpiryDate) {
  try {
  const expiryDate = new Date(subscriptionExpiryDate);
  if (isNaN(expiryDate.getTime())) {
  setExpiryMessage('Invalid subscription expiry date. Please contact support.');
  return;
  }
  const now = new Date();
  const timeLeft = expiryDate.getTime() - now.getTime();
  const daysLeft = Math.ceil(timeLeft / (1000 * 3600 * 24));
  if (daysLeft <= 3 && daysLeft > 0) {
  setExpiryMessage(`Your plan will expire in ${daysLeft} day(s). Please consider renewing.`);
  } else if (daysLeft <= 0) {
  setExpiryMessage('Your plan has expired. Please renew to continue enjoying premium features.');
  } else {
  setExpiryMessage(null);
  }
  } catch (error) {
  console.error("Error processing subscription expiry date:", error);
  setExpiryMessage('Error processing expiry date. Contact support.');
  }
  } else if (subscriptionPlan !== 'Free') {
  setExpiryMessage('No subscription expiry date found. Please contact support.');
  } else {
  setExpiryMessage(null);
  }
  }, [subscriptionExpiryDate, subscriptionPlan]);

  const handleErrorCorrectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
  onInputChange({ errorCorrectionLevel: e.target.value as 'L' | 'M' | 'Q' | 'H' });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
  if (e.target.files?.[0]) {
  const file = e.target.files[0];
  const maxSizeKB = 700;
  const maxSizeByte = maxSizeKB * 1024;

  setLogoError(null);
  setLogoUploading(true);

  if (file.size > maxSizeByte) {
  setLogoError(`File size too large. Please select an image smaller than ${maxSizeKB}KB.`);
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

  const reader = new FileReader();
  reader.onload = () => {
  onInputChange({ logoDataUrl: reader.result as string });
  setLogoUploading(false);
  };
  reader.onerror = () => {
  setLogoError('Failed to read the image file. Please try again.');
  setLogoUploading(false);
  };
  reader.readAsDataURL(file);
  }
  };

  const removeLogo = () => {
  onInputChange({ logoDataUrl: '' });
  setLogoError(null);
  };

  const validate = () => {
  const newErrors: { url?: string; name?: string } = {};
  if (!qrData.url.trim()) newErrors.url = 'URL is required';
  if (!qrCodeName.trim()) newErrors.name = 'QR Code Name is required';
  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
  };

  // Handler for live validation on name input change
  const handleNameChange = (value: string) => {
  // Clear error for name if fixed
  if (errors.name && value.trim()) {
  setErrors(prevErrors => {
  const newErrs = { ...prevErrors };
  delete newErrs.name;
  return newErrs;
  });
  }
  // Pass name value up
  onQrCodeNameChange(value);
  };

  // Handler for live validation on URL input change
  const handleUrlChange = (value: string) => {
  // Clear error for url if fixed
  if (errors.url && value.trim()) {
  setErrors(prevErrors => {
  const newErrs = { ...prevErrors };
  delete newErrs.url;
  return newErrs;
  });
  }
  // Pass url value up
  onInputChange({ url: value });
  };

  const handleSubmit = () => {
  if (validate()) {
  onGenerate();
  } else {
  if (!qrCodeName.trim() && qrCodeNameInputRef.current) {
  qrCodeNameInputRef.current.focus();
  }
  }
  };

  const toggleOpen = () => {
  setIsOpen(!isOpen);
  };

  const hasErrors = Object.keys(errors).length > 0;
  const isValid = qrData.url && qrCodeName && !hasErrors;

  const truncateText = (text: string, maxLength: number): string => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
  };

  const truncateUrl = (url: string, maxLength: number = 18): string => {
  return truncateText(url, maxLength);
  };

  const truncateName = (name: string, maxLength: number = 14): string => {
  return truncateText(name, maxLength);
  };

  return (
  <motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
  className={`border rounded-xl overflow-hidden transition-all duration-200 ${hasErrors
  ? 'border-red-300 bg-red-50'
  : isValid
  ? 'border-green-300 bg-green-50'
  : 'border-gray-200 bg-white'
  } hover:shadow-md`}
  >
  {/* Header */}
  <div
  onClick={toggleOpen}
  className={`w-full flex justify-between items-center p-4 transition-colors ${isOpen ? 'bg-gray-50' : 'hover:bg-gray-50'
  }`}
  style={{ cursor: 'pointer' }}
  >
  <div className="flex items-center space-x-3">
  {/* Status Indicator */}
  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${hasErrors
  ? 'bg-red-100 text-red-700'
  : isValid
  ? 'bg-green-100 text-green-700'
  : 'bg-blue-100 text-blue-700'
  }`}>
  {hasErrors ? (
  <AlertCircle className="w-4 h-4" />
  ) : isValid ? (
  <CheckCircle className="w-4 h-4" />
  ) : (
  1
  )}
  </div>

  {/* Entry Info */}
  <div className="text-left">
  <div className="font-medium text-gray-900">
  {truncateName(qrCodeName || 'QR Code')}
  </div>
  <div className="text-sm text-gray-500 truncate max-w-xs">
  {truncateUrl(qrData.url)}
  </div>
  {hasErrors && (
  <div className="text-xs text-red-600 mt-1">
  {Object.values(errors).join(', ')}
  </div>
  )}
  </div>
  </div>

  <div className="flex items-center space-x-2">
  {/* Expand/Collapse Icon */}
  {isOpen ? (
  <ChevronUp className="w-5 h-5 text-gray-400" />
  ) : (
  <ChevronDown className="w-5 h-5 text-gray-400" />
  )}
  </div>
  </div>

  {/* Expanded Content */}
  <AnimatePresence>
  {isOpen && (
  <motion.div
  initial={{ opacity: 0, height: 0 }}
  animate={{ opacity: 1, height: 'auto' }}
  exit={{ opacity: 0, height: 0 }}
  transition={{ duration: 0.2 }}
  className="border-t border-gray-200"
  >
  <div className="p-6 space-y-6 bg-white">
  {expiryMessage && (
  <div className="rounded-md bg-yellow-50 p-4">
  <div className="flex">
  <div className="flex-shrink-0">
  <AlertCircle className="h-5 w-5 text-yellow-400" aria-hidden="true" />
  </div>
  <div className="ml-3">
  <h3 className="text-sm font-medium text-yellow-800">Attention!</h3>
  <div className="mt-2 text-sm text-yellow-700">
  <p>{expiryMessage}</p>
  </div>
  </div>
  </div>
  </div>
  )}

  {/* QR Code Name */}
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
  QR Code Name <span className="text-red-500">*</span>
  </label>
  <input
  type="text"
  value={qrCodeName}
  onChange={(e) => handleNameChange(e.target.value)}
  placeholder="My QR Code"
  className={`w-full rounded-lg border p-3 focus:ring-2 focus:ring-blue-500 transition-colors ${errors.name ? 'border-red-500 bg-red-50' : 'border-gray-300'
  }`}
  required
  ref={qrCodeNameInputRef}
  />
  {errors.name && (
  <p className="mt-2 text-sm text-red-600 flex items-center">
  <AlertCircle className="w-4 h-4 mr-1" />
  {errors.name}
  </p>
  )}
  </div>

  {/* URL */}
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
  URL <span className="text-red-500">*</span>
  </label>
  <input
  type="url"
  value={qrData.url}
  onChange={(e) => handleUrlChange(e.target.value)}
  placeholder="https://example.com"
  className={`w-full rounded-lg border p-3 focus:ring-2 focus:ring-blue-500 transition-colors ${errors.url ? 'border-red-500 bg-red-50' : 'border-gray-300'
  }`}
  required
  />
  {errors.url && (
  <p className="mt-2 text-sm text-red-600 flex items-center">
  <AlertCircle className="w-4 h-4 mr-1" />
  {errors.url}
  </p>
  )}
  </div>

  {/* Customization Options */}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  {/* QR Code Color */}
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
  QR Code Color
  </label>
  <ColorPicker
  color={qrData.color}
  onChange={(color) => onInputChange({ color })}
  />
  </div>

  {/* Background Color */}
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
  Background Color
  </label>
  <ColorPicker
  color={qrData.backgroundColor}
  onChange={(backgroundColor) => onInputChange({ backgroundColor })}
  />
  </div>

  {/* Error Correction */}
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
  Error Correction Level
  </label>
  <select
  value={qrData.errorCorrectionLevel}
  onChange={handleErrorCorrectionChange}
  className="w-full rounded-lg border-gray-300 border p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
  >
  <option value="L">Low (7%)</option>
  <option value="M">Medium (15%)</option>
  <option value="Q">Quartile (25%)</option>
  <option value="H">High (30%)</option>
  </select>
  </div>

  {/* Logo Upload */}
  <div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
  Logo (Max 700KB)
  </label>

  {qrData.logoDataUrl ? (
  <div className="space-y-3">
  <div className="flex items-center space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg">
  <img
  src={qrData.logoDataUrl}
  alt="Logo preview"
  className="w-12 h-12 object-contain rounded"
  />
  <div className="flex-1">
  <p className="text-sm font-medium text-green-800">Logo uploaded</p>
  <p className="text-xs text-green-600">Ready to use</p>
  </div>
  <button
  type="button"
  onClick={removeLogo}
  className="p-2 text-green-600 hover:text-red-600 transition-colors"
  title="Remove logo"
  >
  <X className="w-4 h-4" />
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
  <div className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${logoUploading
  ? 'border-blue-300 bg-blue-50'
  : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
  }`}>
  {logoUploading ? (
  <div className="flex items-center justify-center">
  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
  <span className="text-sm text-blue-600">Uploading...</span>
  </div>
  ) : (
  <>
  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
  <p className="text-sm text-gray-600">
  Click to upload or drag and drop
  </p>
  <p className="text-xs text-gray-500 mt-1">
  PNG, JPG up to 700KB
  </p>
  </>
  )}
  </div>
  </div>

  {logoError && (
  <p className="text-sm text-red-600 flex items-center">
  <AlertCircle className="w-4 h-4 mr-1" />
  {logoError}
  </p>
  )}
  </div>
  )}
  </div>
  </div>

  <AdUnit />
  </div>
  </motion.div>
  )}
  </AnimatePresence>

  {/* Quota, Generate Button and Related Messages - Always Visible */}
  <div className="border-t border-gray-200 p-4 bg-gray-50">
  <div className="text-center">
  {/* Quota Display - ADDED HERE */}
  {user && (
  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-3 mb-4 border border-blue-200">
  <div className="text-sm text-gray-500">Remaining Quota: {userQuota}
  </div>
  </div>
  )}
  {user ? (
  <>
  <button
  onClick={handleSubmit}
  className={`w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg
  shadow-sm hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2
  focus:ring-blue-500 focus:ring-offset-2 transition-all duration-300 flex justify-center
  ${isGenerating || userQuota <= 0
  ? 'opacity-50 cursor-not-allowed'
  : ''
  }`}
  >
  {isGenerating ? (
  <>
  <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
  Generating...
  </>
  ) : (
  <>
  <RefreshCw className="w-6 h-6 mr-3" />
  Generate QR Code
  </>
  )}
  </button>

  {userQuota <= 0 && !isGenerating && (
  <div className="mt-4 text-red-500 text-sm text-center">
  You’ve reached your monthly limit.
  <button onClick={() => navigate('/plans-and-pricing')} className="block mt-2 text-blue-600 hover:underline">
  Upgrade your plan to unlock more.
  </button>
  </div>
  )}

  {showUpgradeMessage && (
  <div className="mt-4 text-yellow-500 text-sm text-center">
  Only Standard & Premium users can save QR codes to their account for future access.
  <div className="text-center">
  <button onClick={() => navigate('/plans-and-pricing')} className="mt-2 text-blue-600 hover:underline">
  Upgrade now!
  </button>
  </div>
  </div>
  )}
  </>
  ) : (
  <div className="mt-4 text-center">
  <p className="text-sm text-gray-500 mb-4">Please log in to generate a QR code.</p>
  <button
  onClick={() => navigate('/login')}
  className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg
  shadow-sm hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2
  focus:ring-blue-500 focus:ring-offset-2 transition-all duration-300"
  >
  Log In
  </button>
  </div>
  )}
  </div>
  </div>
  </motion.div>
  );
 };

 export default QRCodeForm;
