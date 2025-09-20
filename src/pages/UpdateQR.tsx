import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/firebase';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Save, AlertCircle, CheckCircle, Edit3, Zap, Target, Eye, EyeOff, 
  Globe2, Settings, Calendar, Upload, Hash, X, Lock 
} from 'lucide-react';
import { QRCodeData, StaticQRCodeData, DynamicQRCodeData, isStaticQR, isDynamicQR } from '../types/qrcode';
import { toast } from 'react-hot-toast';
import ColorPicker from '../components/ColorPicker';

const UpdateQR: React.FC = () => {
  const { qrCodeId } = useParams<{ qrCodeId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [qrCode, setQrCode] = useState<QRCodeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalData, setOriginalData] = useState<QRCodeData | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQRCode = async () => {
      if (!user || !qrCodeId) {
        setError('Invalid request');
        setLoading(false);
        return;
      }

      try {
        // For dynamic QRs, qrCodeId might be the shortId, try both
        let qrRef = doc(db, 'qrcodes', qrCodeId);
        const qrSnap = await getDoc(qrRef);
        
        if (!qrSnap.exists()) {
          // Try to find by shortId if not found by regular ID
          const qrQuery = query(
            collection(db, 'qrcodes'),
            where('shortId', '==', qrCodeId),
            where('userId', '==', user.uid)
          );
          const qrQuerySnap = await getDocs(qrQuery);
          
          if (qrQuerySnap.empty) {
            setError('QR code not found');
            return;
          }
          
          const qrDoc = qrQuerySnap.docs[0];
          const qrData = { id: qrDoc.id, ...qrDoc.data() } as QRCodeData;
          setQrCode(qrData);
          setOriginalData(qrData);
        } else {
          const qrData = { id: qrSnap.id, ...qrSnap.data() } as QRCodeData;
          
          // Verify ownership
          if (qrData.userId !== user.uid) {
            setError('Access denied');
            return;
          }

          setQrCode(qrData);
          setOriginalData(qrData);
        }
      } catch (err: any) {
        setError(`Failed to load QR code: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchQRCode();
  }, [user, qrCodeId]);

  const handleUpdate = (field: string, value: any) => {
    if (!qrCode) return;
    
    const updatedQR = { ...qrCode, [field]: value };
    setQrCode(updatedQR);
    
    // Check if there are changes
    if (originalData) {
      const hasChanges = JSON.stringify(updatedQR) !== JSON.stringify(originalData);
      setHasChanges(hasChanges);
    }
  };

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

        handleUpdate('logoDataUrl', dataURL);
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
    handleUpdate('logoDataUrl', '');
    setLogoError(null);
  };

  const handleSave = async () => {
  if (!qrCode || !hasChanges) return;

  setSaving(true);
  try {
    const qrRef = doc(db, 'qrcodes', qrCode.id);
    
    // Build your update object
    const updateData: any = {
      name: qrCode.name,
      color: qrCode.color,
      backgroundColor: qrCode.backgroundColor,
      logoDataUrl: qrCode.logoDataUrl,
      errorCorrectionLevel: qrCode.errorCorrectionLevel,
      updatedAt: new Date().toISOString()
    };

    if (isDynamicQR(qrCode)) {
      updateData.targetUrl = qrCode.targetUrl;
      updateData.tags = qrCode.tags;
      updateData.description = qrCode.description;
      updateData.featuredImageUrl = qrCode.featuredImageUrl;
      updateData.scheduleEnabled = qrCode.scheduleEnabled;
      updateData.scheduleStart = qrCode.scheduleStart;
      updateData.scheduleEnd = qrCode.scheduleEnd;
      updateData.dailyStartTime = qrCode.dailyStartTime;
      updateData.dailyEndTime = qrCode.dailyEndTime;
      updateData.scanLimitEnabled = qrCode.scanLimitEnabled;
      updateData.maxScans = qrCode.maxScans;
      updateData.passwordEnabled = qrCode.passwordEnabled;
      updateData.password = qrCode.password;
      updateData.redirectPageEnabled = qrCode.redirectPageEnabled;
    }

    // 🚀 Omit undefined fields before saving
    const cleanData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined)
    );

    await updateDoc(qrRef, cleanData);

    setOriginalData(qrCode);
    setHasChanges(false);
    toast.success('QR code updated successfully!');
    navigate('/history');
  } catch (err: any) {
    console.error('Error updating QR code:', err);
    toast.error(`Failed to update QR code: ${err.message}`);
  } finally {
    setSaving(false);
  }
};


  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-gray-600">Loading QR code...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>
        <h3 className="text-lg font-medium text-gray-900">Error</h3>
        <p className="text-red-600 text-center">{error}</p>
        <button
          onClick={() => navigate('/history')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Back to QR Codes
        </button>
      </div>
    );
  }

  if (!qrCode) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/history')}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Edit3 className="w-6 h-6 text-blue-600" />
              Edit QR Code
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-2 py-1 text-xs font-medium rounded-full flex items-center gap-1 ${
                isStaticQR(qrCode) 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-purple-100 text-purple-700'
              }`}>
                {isStaticQR(qrCode) ? (
                  <>
                    <Zap className="w-3 h-3" />
                    Static QR Code
                  </>
                ) : (
                  <>
                    <Target className="w-3 h-3" />
                    Dynamic QR Code
                  </>
                )}
              </span>
              <span className="text-gray-600">•</span>
              <span className="text-gray-600">{qrCode.name}</span>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={!hasChanges || saving}
          className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 ${
            hasChanges && !saving
              ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Changes
            </>
          )}
        </button>
      </div>

      {/* Edit Form */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        {isStaticQR(qrCode) && (
          <div className="p-4 bg-blue-50 border-b border-blue-200">
            <div className="flex items-center gap-2 text-blue-800">
              <AlertCircle className="w-4 h-4" />
              <p className="text-sm">
                <strong>Note:</strong> For static QR codes, the URL cannot be changed. You can only update the name, colors, and logo.
              </p>
            </div>
          </div>
        )}
        
        <div className="p-6 space-y-8">
          {/* Basic Information */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Globe2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
                <p className="text-sm text-gray-600">Update name and destination</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* QR Code Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  QR Code Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={qrCode.name || ''}
                  onChange={(e) => handleUpdate('name', e.target.value)}
                  className="w-full rounded-xl border border-gray-300 p-3 focus:ring-2 focus:ring-blue-500 transition-all duration-200 hover:border-gray-400"
                  placeholder="Enter QR code name"
                  required
                />
              </div>

              {/* URL Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {isStaticQR(qrCode) ? 'URL (Cannot be changed)' : 'Target URL'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  value={isStaticQR(qrCode) ? qrCode.url : qrCode.targetUrl}
                  onChange={(e) => {
                    if (isDynamicQR(qrCode)) {
                      handleUpdate('targetUrl', e.target.value);
                    }
                  }}
                  disabled={isStaticQR(qrCode)}
                  className={`w-full rounded-xl border p-3 focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${
                    isStaticQR(qrCode) 
                      ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  placeholder="https://example.com"
                  required
                />
              </div>
            </div>

            {/* Dynamic-specific fields */}
            {isDynamicQR(qrCode) && (
              <div className="space-y-4">
                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={qrCode.description || ''}
                    onChange={(e) => handleUpdate('description', e.target.value)}
                    placeholder="Brief description of this QR code's purpose"
                    rows={3}
                    className="w-full rounded-xl border border-gray-300 p-3 focus:ring-2 focus:ring-blue-500 transition-all duration-200 resize-none hover:border-gray-400"
                  />
                </div>

                {/* Featured Image */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Featured Image URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={qrCode.featuredImageUrl || ''}
                    onChange={(e) => handleUpdate('featuredImageUrl', e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="w-full rounded-xl border border-gray-300 p-3 focus:ring-2 focus:ring-blue-500 transition-all duration-200 hover:border-gray-400"
                  />
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags (Optional)
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {(qrCode.tags || []).map((tag, tagIndex) => (
                      <motion.span
                        key={tagIndex}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                      >
                        <Hash className="w-3 h-3" />
                        {tag}
                        <button
                          type="button"
                          onClick={() => {
                            const newTags = qrCode.tags?.filter(t => t !== tag) || [];
                            handleUpdate('tags', newTags);
                          }}
                          className="text-blue-600 hover:text-blue-800 ml-1"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </motion.span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Advanced Features for Dynamic QRs */}
          {isDynamicQR(qrCode) && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
                <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                  <Settings className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Advanced Features</h3>
                  <p className="text-sm text-gray-600">Security, scheduling, and access controls</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Schedule Settings */}
                <div className="border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
                  <label className="flex items-center gap-3 mb-3">
                    <input
                      type="checkbox"
                      checked={qrCode.scheduleEnabled || false}
                      onChange={(e) => handleUpdate('scheduleEnabled', e.target.checked)}
                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <Calendar className="w-5 h-5 text-purple-600" />
                    <span className="font-medium text-gray-700">Enable Scheduling</span>
                  </label>
                  {qrCode.scheduleEnabled && (
                    <div className="space-y-3 ml-7">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
                          <input
                            type="date"
                            value={qrCode.scheduleStart?.split('T')[0] || ''}
                            onChange={(e) => handleUpdate('scheduleStart', e.target.value ? `${e.target.value}T00:00:00.000Z` : '')}
                            className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
                          <input
                            type="date"
                            value={qrCode.scheduleEnd?.split('T')[0] || ''}
                            onChange={(e) => handleUpdate('scheduleEnd', e.target.value ? `${e.target.value}T23:59:59.999Z` : '')}
                            className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Start Time</label>
                          <input
                            type="time"
                            value={qrCode.dailyStartTime || ''}
                            onChange={(e) => handleUpdate('dailyStartTime', e.target.value)}
                            className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">End Time</label>
                          <input
                            type="time"
                            value={qrCode.dailyEndTime || ''}
                            onChange={(e) => handleUpdate('dailyEndTime', e.target.value)}
                            className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Scan Limits */}
                <div className="border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
                  <label className="flex items-center gap-3 mb-3">
                    <input
                      type="checkbox"
                      checked={qrCode.scanLimitEnabled || false}
                      onChange={(e) => handleUpdate('scanLimitEnabled', e.target.checked)}
                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <Target className="w-5 h-5 text-purple-600" />
                    <span className="font-medium text-gray-700">Enable Scan Limits</span>
                  </label>
                  {qrCode.scanLimitEnabled && (
                    <div className="ml-7">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Maximum Scans</label>
                      <input
                        type="number"
                        min="1"
                        value={qrCode.maxScans || ''}
                        onChange={(e) => handleUpdate('maxScans', parseInt(e.target.value) || undefined)}
                        placeholder="e.g., 100"
                        className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  )}
                </div>

                {/* Password Protection */}
                <div className="border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow lg:col-span-2">
                  <label className="flex items-center gap-3 mb-3">
                    <input
                      type="checkbox"
                      checked={qrCode.passwordEnabled || false}
                      onChange={(e) => handleUpdate('passwordEnabled', e.target.checked)}
                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <Lock className="w-5 h-5 text-purple-600" />
                    <span className="font-medium text-gray-700">Password Protection</span>
                  </label>
                  {qrCode.passwordEnabled && (
                    <div className="ml-7">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Access Password</label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={qrCode.password || ''}
                          onChange={(e) => handleUpdate('password', e.target.value)}
                          placeholder="Enter password"
                          className="w-full rounded-lg border border-gray-300 p-2 pr-10 text-sm focus:ring-2 focus:ring-purple-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Design Customization */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                <Eye className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Design & Customization</h3>
                <p className="text-sm text-gray-600">Colors, logo, and appearance</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* QR Code Color */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">QR Code Color</label>
                <ColorPicker color={qrCode.color} onChange={(color) => handleUpdate('color', color)} />
              </div>

              {/* Background Color */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Background Color</label>
                <ColorPicker color={qrCode.backgroundColor} onChange={(backgroundColor) => handleUpdate('backgroundColor', backgroundColor)} />
              </div>

              {/* Error Correction */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Error Correction Level</label>
                <select
                  value={qrCode.errorCorrectionLevel}
                  onChange={(e) => handleUpdate('errorCorrectionLevel', e.target.value)}
                  className="w-full rounded-xl border-gray-300 border p-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 hover:border-gray-400 transition-colors"
                >
                  <option value="L">Low (7%)</option>
                  <option value="M">Medium (15%)</option>
                  <option value="Q">Quartile (25%)</option>
                  <option value="H">High (30%)</option>
                </select>
              </div>
            </div>

            {/* Logo Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Logo</label>
              {qrCode.logoDataUrl ? (
                <div className="flex items-center space-x-4 p-4 bg-green-50 border border-green-200 rounded-xl">
                  <img src={qrCode.logoDataUrl} alt="Logo preview" className="w-16 h-16 object-contain rounded-lg" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-800">Logo uploaded successfully</p>
                    <p className="text-xs text-green-600">Your logo will appear in the center of the QR code</p>
                  </div>
                  <button
                    type="button"
                    onClick={removeLogo}
                    className="p-2 text-green-600 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"
                    title="Remove logo"
                  >
                    <X className="w-5 h-5" />
                  </button>
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
                      className={`border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 ${
                        logoUploading ? 'border-green-300 bg-green-50' : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                      }`}
                    >
                      {logoUploading ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mr-2"></div>
                          <span className="text-sm text-green-600">Uploading...</span>
                        </div>
                      ) : (
                        <>
                          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                          <p className="text-xs text-gray-500 mt-1">PNG, JPG (max 5MB)</p>
                        </>
                      )}
                    </div>
                  </div>

                  {logoError && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-sm text-red-600 flex items-center"
                    >
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {logoError}
                    </motion.p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Changes Indicator */}
      <AnimatePresence>
        {hasChanges && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl"
          >
            <div className="flex items-center gap-2 text-yellow-800">
              <CheckCircle className="w-4 h-4" />
              <p className="text-sm">You have unsaved changes. Don't forget to save!</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UpdateQR;
