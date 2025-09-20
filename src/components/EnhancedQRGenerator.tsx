import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, 
  Target, 
  Settings, 
  Palette, 
  Download, 
  Eye, 
  Save, 
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Lock,
  Calendar,
  Timer,
  Shield,
  Upload,
  X
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/firebase';
import { collection, addDoc, doc, runTransaction } from 'firebase/firestore';
import { 
  QRContentType, 
  QRContent, 
  EnhancedQRCodeData, 
  createEmptyContent, 
  generateQRValue 
} from '../types/qrContentTypes';
import QRContentSelector from './QRContentSelector';
import QRContentForm from './QRContentForms';
import ColorPicker from './ColorPicker';
import { toast } from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';

interface EnhancedQRGeneratorProps {
  onClose: () => void;
  userQuota: number;
  onQuotaUpdate: (newQuota: number) => void;
}

const EnhancedQRGenerator: React.FC<EnhancedQRGeneratorProps> = ({
  onClose,
  userQuota,
  onQuotaUpdate
}) => {
  const { user } = useAuth();
  
  // Core state
  const [qrType, setQrType] = useState<'static' | 'dynamic'>('static');
  const [contentType, setContentType] = useState<QRContentType>('url');
  const [content, setContent] = useState<QRContent>(createEmptyContent('url'));
  const [currentStep, setCurrentStep] = useState(1);
  
  // QR Code data
  const [qrData, setQrData] = useState<EnhancedQRCodeData>({
    id: '',
    name: '',
    qrType: 'static',
    contentType: 'url',
    content: createEmptyContent('url'),
    foregroundColor: '#000000',
    backgroundColor: '#FFFFFF',
    errorCorrectionLevel: 'M',
    cornerStyle: 'square',
    patternStyle: 'square',
    logoDataUrl: '',
    logoSize: 20,
    userId: user?.uid || '',
    createdAt: new Date().toISOString(),
  });

  // UI state
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isGenerating, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);

  // Update QR data when content changes
  useEffect(() => {
    setQrData(prev => ({
      ...prev,
      qrType,
      contentType,
      content,
      shortId: qrType === 'dynamic' ? generateShortId() : undefined
    }));
  }, [qrType, contentType, content]);

  const generateShortId = (): string => {
    return Math.random().toString(36).substring(2, 10);
  };

  const handleContentTypeChange = (newType: QRContentType) => {
    setContentType(newType);
    setContent(createEmptyContent(newType));
    setErrors({});
  };

  const handleContentChange = (newContent: QRContent) => {
    setContent(newContent);
    setErrors({});
  };

  const validateContent = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    // Common validation
    if (!content.title.trim()) {
      newErrors.title = 'Title is required';
    }

    // Type-specific validation
    switch (content.type) {
      case 'url':
        const urlContent = content as any;
        if (!urlContent.url.trim()) {
          newErrors.url = 'URL is required';
        } else {
          try {
            new URL(urlContent.url);
          } catch {
            newErrors.url = 'Invalid URL format';
          }
        }
        break;
      
      case 'event':
        const eventContent = content as any;
        if (!eventContent.startDate) newErrors.startDate = 'Start date is required';
        if (!eventContent.endDate) newErrors.endDate = 'End date is required';
        if (!eventContent.allDay && !eventContent.startTime) newErrors.startTime = 'Start time is required';
        if (!eventContent.allDay && !eventContent.endTime) newErrors.endTime = 'End time is required';
        break;
      
      case 'vcard':
        const vcardContent = content as any;
        if (!vcardContent.fullName.trim()) newErrors.fullName = 'Full name is required';
        break;
      
      case 'wifi':
        const wifiContent = content as any;
        if (!wifiContent.ssid.trim()) newErrors.ssid = 'Network name (SSID) is required';
        if (wifiContent.encryption !== 'None' && !wifiContent.password.trim()) {
          newErrors.password = 'Password is required for secured networks';
        }
        break;
      
      case 'text':
        const textContent = content as any;
        if (!textContent.content.trim()) newErrors.content = 'Text content is required';
        break;
      
      case 'email':
        const emailContent = content as any;
        if (!emailContent.email.trim()) {
          newErrors.email = 'Email address is required';
        } else if (!/\S+@\S+\.\S+/.test(emailContent.email)) {
          newErrors.email = 'Invalid email format';
        }
        break;
      
      case 'phone':
        const phoneContent = content as any;
        if (!phoneContent.phoneNumber.trim()) newErrors.phoneNumber = 'Phone number is required';
        break;
      
      case 'sms':
        const smsContent = content as any;
        if (!smsContent.phoneNumber.trim()) newErrors.phoneNumber = 'Phone number is required';
        break;
      
      case 'geolocation':
        const geoContent = content as any;
        if (!geoContent.latitude || !geoContent.longitude) {
          newErrors.coordinates = 'Both latitude and longitude are required';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      const maxUploadSizeMB = 5;
      const maxStorageSizeKB = 700;
      const maxStorageSizeBytes = maxStorageSizeKB * 1024;

      setLogoUploading(true);

      if (file.size > maxUploadSizeMB * 1024 * 1024) {
        toast.error(`File size too large. Please select an image smaller than ${maxUploadSizeMB}MB.`);
        e.target.value = '';
        setLogoUploading(false);
        return;
      }

      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file.');
        e.target.value = '';
        setLogoUploading(false);
        return;
      }

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Resize if needed
        const targetArea = 600 * 600;
        if (width * height > targetArea) {
          const aspectRatio = width / height;
          width = Math.sqrt(targetArea * aspectRatio);
          height = Math.sqrt(targetArea / aspectRatio);
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          toast.error('Could not process image.');
          setLogoUploading(false);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        let dataURL = canvas.toDataURL(file.type, 0.9);
        let quality = 0.9;

        while (dataURL.length > maxStorageSizeBytes && quality > 0.1) {
          quality -= 0.1;
          dataURL = canvas.toDataURL(file.type, quality);
        }

        if (dataURL.length > maxStorageSizeBytes) {
          toast.error('Logo file too large after compression. Please select a different file.');
          setLogoUploading(false);
          return;
        }

        setQrData(prev => ({ ...prev, logoDataUrl: dataURL }));
        setLogoUploading(false);
        toast.success('Logo uploaded successfully!');
      };
      
      img.onerror = () => {
        toast.error('Failed to load the image. Please try again.');
        setLogoUploading(false);
      };
      
      img.src = URL.createObjectURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!user) {
      toast.error('Please log in to generate QR codes');
      return;
    }

    if (!validateContent()) {
      toast.error('Please fix the errors before generating');
      return;
    }

    if (userQuota <= 0) {
      toast.error('Insufficient quota. Please upgrade your plan.');
      return;
    }

    setSaving(true);

    try {
      const userRef = doc(db, 'users', user.uid);
      
      await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) {
          throw new Error('User not found');
        }

        const currentQuota = userDoc.data().quota || 0;
        if (currentQuota < 1) {
          throw new Error('Insufficient quota');
        }

        const finalQrData: EnhancedQRCodeData = {
          ...qrData,
          id: qrType === 'dynamic' ? qrData.shortId! : uuidv4(),
          name: content.title || `${contentType.toUpperCase()} QR Code`,
          content,
          userId: user.uid,
          createdAt: new Date().toISOString(),
          visits: qrType === 'dynamic' ? 0 : undefined,
        };

        // Save to Firestore
        const qrCodeRef = doc(db, 'enhancedQRCodes', finalQrData.id);
        transaction.set(qrCodeRef, finalQrData);

        // Update user quota
        const currentGenerated = userDoc.data().qrCodesGenerated || 0;
        transaction.update(userRef, {
          qrCodesGenerated: currentGenerated + 1,
          quota: currentQuota - 1,
          updatedAt: new Date().toISOString(),
        });
      });

      onQuotaUpdate(userQuota - 1);
      toast.success('QR code generated successfully!');
      setShowPreview(true);
    } catch (error: any) {
      console.error('Error generating QR code:', error);
      toast.error(error.message || 'Failed to generate QR code');
    } finally {
      setSaving(false);
    }
  };

  const getQRValue = (): string => {
    if (qrType === 'static') {
      return generateQRValue(content);
    } else {
      return `${window.location.origin}/r/${qrData.shortId}`;
    }
  };

  const StepIndicator = () => {
    const steps = [
      { id: 1, title: 'Type & Content', completed: currentStep > 1 },
      { id: 2, title: 'Design & Settings', completed: currentStep > 2 },
      { id: 3, title: 'Generate & Download', completed: showPreview }
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
                  {step.completed ? <CheckCircle className="w-5 h-5" /> : step.id}
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

  return (
    <div className="max-w-6xl mx-auto">
      <StepIndicator />

      {/* QR Type Toggle */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-xl p-6 mb-8 border border-gray-200"
      >
        <div className="flex items-center justify-center mb-6">
          <div className="flex items-center bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setQrType('static')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                qrType === 'static'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              <Zap className="w-5 h-5" />
              Static QR
            </button>
            <button
              onClick={() => setQrType('dynamic')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                qrType === 'dynamic'
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'text-gray-600 hover:text-purple-600'
              }`}
            >
              <Target className="w-5 h-5" />
              Dynamic QR
            </button>
          </div>
        </div>

        <div className="text-center">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm ${
            qrType === 'static' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
          }`}>
            {qrType === 'static' ? (
              <>
                <Zap className="w-4 h-4" />
                Direct encoding • Permanent • No tracking
              </>
            ) : (
              <>
                <Target className="w-4 h-4" />
                Database stored • Analytics • Advanced features
              </>
            )}
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Content Configuration */}
        <div className="space-y-6">
          {/* Step 1: Content Type & Data */}
          {currentStep === 1 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200"
            >
              <QRContentSelector
                selectedType={contentType}
                onTypeChange={handleContentTypeChange}
              />
              
              <div className="mt-8">
                <QRContentForm
                  contentType={contentType}
                  content={content}
                  onChange={handleContentChange}
                  errors={errors}
                />
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => {
                    if (validateContent()) {
                      setCurrentStep(2);
                    }
                  }}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Next: Design & Settings
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Design & Settings */}
          {currentStep === 2 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              {/* Design Options */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                    <Palette className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Design Options</h3>
                    <p className="text-sm text-gray-600">Customize colors and appearance</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Foreground Color</label>
                    <ColorPicker 
                      color={qrData.foregroundColor} 
                      onChange={(color) => setQrData(prev => ({ ...prev, foregroundColor: color }))} 
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Background Color</label>
                    <ColorPicker 
                      color={qrData.backgroundColor} 
                      onChange={(color) => setQrData(prev => ({ ...prev, backgroundColor: color }))} 
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Error Correction</label>
                    <select
                      value={qrData.errorCorrectionLevel}
                      onChange={(e) => setQrData(prev => ({ 
                        ...prev, 
                        errorCorrectionLevel: e.target.value as 'L' | 'M' | 'Q' | 'H' 
                      }))}
                      className="w-full rounded-lg border border-gray-300 p-3 focus:ring-2 focus:ring-green-500"
                    >
                      <option value="L">Low (7%)</option>
                      <option value="M">Medium (15%)</option>
                      <option value="Q">Quartile (25%)</option>
                      <option value="H">High (30%)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Corner Style</label>
                    <select
                      value={qrData.cornerStyle}
                      onChange={(e) => setQrData(prev => ({ 
                        ...prev, 
                        cornerStyle: e.target.value as 'square' | 'rounded' | 'circle' 
                      }))}
                      className="w-full rounded-lg border border-gray-300 p-3 focus:ring-2 focus:ring-green-500"
                    >
                      <option value="square">Square</option>
                      <option value="rounded">Rounded</option>
                      <option value="circle">Circle</option>
                    </select>
                  </div>
                </div>

                {/* Logo Upload */}
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Logo</label>
                  {qrData.logoDataUrl ? (
                    <div className="flex items-center space-x-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <img src={qrData.logoDataUrl} alt="Logo preview" className="w-16 h-16 object-contain rounded-lg" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-green-800">Logo uploaded</p>
                        <div className="mt-2">
                          <label className="block text-xs text-gray-600 mb-1">Logo Size: {qrData.logoSize}%</label>
                          <input
                            type="range"
                            min="10"
                            max="30"
                            value={qrData.logoSize}
                            onChange={(e) => setQrData(prev => ({ ...prev, logoSize: parseInt(e.target.value) }))}
                            className="w-full"
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setQrData(prev => ({ ...prev, logoDataUrl: '' }))}
                        className="p-2 text-green-600 hover:text-red-600 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        disabled={logoUploading}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                        logoUploading ? 'border-green-300 bg-green-50' : 'border-gray-300 hover:border-gray-400'
                      }`}>
                        {logoUploading ? (
                          <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mr-2"></div>
                            <span className="text-sm text-green-600">Uploading...</span>
                          </div>
                        ) : (
                          <>
                            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-600">Click to upload logo</p>
                            <p className="text-xs text-gray-500 mt-1">PNG, JPG (max 5MB)</p>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Dynamic QR Features */}
              {qrType === 'dynamic' && (
                <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                      <Settings className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Dynamic Features</h3>
                      <p className="text-sm text-gray-600">Advanced controls and security</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Password Protection */}
                    <div className="border border-gray-200 rounded-lg p-4">
                      <label className="flex items-center gap-3 mb-3">
                        <input
                          type="checkbox"
                          checked={qrData.passwordEnabled || false}
                          onChange={(e) => setQrData(prev => ({ ...prev, passwordEnabled: e.target.checked }))}
                          className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                        />
                        <Lock className="w-5 h-5 text-purple-600" />
                        <span className="font-medium text-gray-700">Password Protection</span>
                      </label>
                      {qrData.passwordEnabled && (
                        <div className="ml-7">
                          <input
                            type="password"
                            value={qrData.password || ''}
                            onChange={(e) => setQrData(prev => ({ ...prev, password: e.target.value }))}
                            placeholder="Enter password"
                            className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                      )}
                    </div>

                    {/* Scheduling */}
                    <div className="border border-gray-200 rounded-lg p-4">
                      <label className="flex items-center gap-3 mb-3">
                        <input
                          type="checkbox"
                          checked={qrData.scheduleEnabled || false}
                          onChange={(e) => setQrData(prev => ({ ...prev, scheduleEnabled: e.target.checked }))}
                          className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                        />
                        <Calendar className="w-5 h-5 text-purple-600" />
                        <span className="font-medium text-gray-700">Enable Scheduling</span>
                      </label>
                      {qrData.scheduleEnabled && (
                        <div className="ml-7 grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Start Date</label>
                            <input
                              type="date"
                              value={qrData.scheduleStart?.split('T')[0] || ''}
                              onChange={(e) => setQrData(prev => ({ 
                                ...prev, 
                                scheduleStart: e.target.value ? `${e.target.value}T00:00:00.000Z` : '' 
                              }))}
                              className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:ring-2 focus:ring-purple-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">End Date</label>
                            <input
                              type="date"
                              value={qrData.scheduleEnd?.split('T')[0] || ''}
                              onChange={(e) => setQrData(prev => ({ 
                                ...prev, 
                                scheduleEnd: e.target.value ? `${e.target.value}T23:59:59.999Z` : '' 
                              }))}
                              className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:ring-2 focus:ring-purple-500"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Countdown */}
                    <div className="border border-gray-200 rounded-lg p-4">
                      <label className="flex items-center gap-3 mb-3">
                        <input
                          type="checkbox"
                          checked={qrData.countdownEnabled || false}
                          onChange={(e) => setQrData(prev => ({ ...prev, countdownEnabled: e.target.checked }))}
                          className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                        />
                        <Timer className="w-5 h-5 text-purple-600" />
                        <span className="font-medium text-gray-700">Countdown Timer</span>
                      </label>
                      {qrData.countdownEnabled && (
                        <div className="ml-7">
                          <label className="block text-xs text-gray-600 mb-1">Countdown Duration (seconds)</label>
                          <input
                            type="number"
                            min="1"
                            max="60"
                            value={qrData.countdownDuration || 5}
                            onChange={(e) => setQrData(prev => ({ 
                              ...prev, 
                              countdownDuration: parseInt(e.target.value) || 5 
                            }))}
                            className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-between">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => setCurrentStep(3)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Next: Generate
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Generate */}
          {currentStep === 3 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200"
            >
              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Ready to Generate</h3>
                <p className="text-gray-600 mb-6">
                  Your {qrType} QR code for {contentType} is ready to be created
                </p>

                <div className="space-y-4">
                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating || userQuota <= 0}
                    className={`w-full py-4 px-6 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-3 ${
                      isGenerating || userQuota <= 0
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : qrType === 'static'
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-lg'
                        : 'bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800 shadow-lg'
                    }`}
                  >
                    {isGenerating ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-5 h-5" />
                        Generate QR Code
                      </>
                    )}
                  </button>

                  {userQuota <= 0 && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center gap-2 text-red-700">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">Insufficient quota</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-between mt-6">
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Back
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Right Column - Preview */}
        <div className="lg:sticky lg:top-8 lg:h-fit">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gray-600 rounded-lg flex items-center justify-center">
                <Eye className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Live Preview</h3>
                <p className="text-sm text-gray-600">See how your QR code will look</p>
              </div>
            </div>

            <div className="text-center">
              <div className="inline-block p-6 bg-gray-50 rounded-2xl mb-4">
                <QRCodeCanvas
                  value={getQRValue() || 'https://example.com'}
                  size={200}
                  bgColor={qrData.backgroundColor}
                  fgColor={qrData.foregroundColor}
                  level={qrData.errorCorrectionLevel}
                  includeMargin={true}
                />
                {qrData.logoDataUrl && (
                  <div className="relative -mt-[200px] flex items-center justify-center">
                    <img
                      src={qrData.logoDataUrl}
                      alt="Logo"
                      className="rounded-full bg-white p-1 object-contain"
                      style={{
                        width: `${qrData.logoSize}%`,
                        height: `${qrData.logoSize}%`,
                        maxWidth: '60px',
                        maxHeight: '60px'
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                <p><strong>Type:</strong> {qrType === 'static' ? 'Static' : 'Dynamic'}</p>
                <p><strong>Content:</strong> {contentType.toUpperCase()}</p>
                <p><strong>Title:</strong> {content.title || 'Untitled'}</p>
                {qrType === 'dynamic' && (
                  <>
                    {qrData.passwordEnabled && (
                      <div className="flex items-center justify-center gap-1 text-purple-600">
                        <Shield className="w-3 h-3" />
                        <span>Password Protected</span>
                      </div>
                    )}
                    {qrData.scheduleEnabled && (
                      <div className="flex items-center justify-center gap-1 text-orange-600">
                        <Calendar className="w-3 h-3" />
                        <span>Scheduled</span>
                      </div>
                    )}
                    {qrData.countdownEnabled && (
                      <div className="flex items-center justify-center gap-1 text-blue-600">
                        <Timer className="w-3 h-3" />
                        <span>Countdown: {qrData.countdownDuration}s</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedQRGenerator;