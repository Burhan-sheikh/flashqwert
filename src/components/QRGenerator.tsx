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
  X,
  ArrowRight,
  Sparkles,
  Play,
  Layers,
  Globe,
  FileText,
  User,
  Wifi,
  Mail,
  Phone,
  MessageSquare,
  MapPin
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
  generateQRValue,
  CONTENT_TYPE_CONFIG
} from '../types/qrContentTypes';
import QRContentSelector from './QRContentSelector';
import QRContentForm from './QRContentForms';
import ColorPicker from './ColorPicker';
import { toast } from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';

interface QRGeneratorProps {
  onClose: () => void;
  userQuota: number;
  onQuotaUpdate: (newQuota: number) => void;
}

const QRGenerator: React.FC<QRGeneratorProps> = ({
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
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [generatedQR, setGeneratedQR] = useState<EnhancedQRCodeData | null>(null);

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
    // Restrict content types based on QR type
    if (qrType === 'static' && newType !== 'url') {
      toast.error('Static QR codes only support URL/Website content type');
      return;
    }
    
    setContentType(newType);
    setContent(createEmptyContent(newType));
    setErrors({});
  };

  const handleQRTypeChange = (newType: 'static' | 'dynamic') => {
    setQrType(newType);
    
    // Reset to URL if switching to static
    if (newType === 'static') {
      setContentType('url');
      setContent(createEmptyContent('url'));
    }
    
    setErrors({});
    setCurrentStep(1);
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

    setIsGenerating(true);

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
        const collectionName = qrType === 'static' ? 'qrcodes' : 'enhancedQRCodes';
        const qrCodeRef = doc(db, collectionName, finalQrData.id);
        transaction.set(qrCodeRef, finalQrData);

        // Update user quota
        const currentGenerated = userDoc.data().qrCodesGenerated || 0;
        transaction.update(userRef, {
          qrCodesGenerated: currentGenerated + 1,
          quota: currentQuota - 1,
          updatedAt: new Date().toISOString(),
        });

        setGeneratedQR(finalQrData);
      });

      onQuotaUpdate(userQuota - 1);
      toast.success('QR code generated successfully!');
      setShowPreview(true);
      setCurrentStep(4);
    } catch (error: any) {
      console.error('Error generating QR code:', error);
      toast.error(error.message || 'Failed to generate QR code');
    } finally {
      setIsGenerating(false);
    }
  };

  const getQRValue = (): string => {
    if (qrType === 'static') {
      return generateQRValue(content);
    } else {
      return `${window.location.origin}/e/${qrData.shortId}`;
    }
  };

  const resetGenerator = () => {
    setQrType('static');
    setContentType('url');
    setContent(createEmptyContent('url'));
    setQrData({
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
    setErrors({});
    setShowPreview(false);
    setGeneratedQR(null);
    setCurrentStep(1);
  };

  const getContentTypeIcon = (type: QRContentType) => {
    const iconMap = {
      url: Globe,
      text: FileText,
      email: Mail,
      phone: Phone,
      sms: MessageSquare,
      wifi: Wifi,
      vcard: User,
      event: Calendar,
      geolocation: MapPin
    };
    return iconMap[type] || Globe;
  };

  const StepIndicator = () => {
    const steps = [
      { id: 1, title: 'QR Type', icon: Target, completed: currentStep > 1 },
      { id: 2, title: 'Content', icon: Layers, completed: currentStep > 2 },
      { id: 3, title: 'Design', icon: Palette, completed: currentStep > 3 },
      { id: 4, title: 'Generate', icon: CheckCircle, completed: showPreview }
    ];

    return (
      <div className="mb-8">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                  step.completed 
                    ? 'bg-blue-600 border-blue-600 text-white' 
                    : currentStep === step.id 
                      ? 'border-blue-600 text-blue-600 bg-blue-50' 
                      : 'border-gray-300 text-gray-400'
                }`}>
                  <step.icon className="w-5 h-5" />
                </div>
                <div className="mt-2 text-center">
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

  if (showPreview && generatedQR) {
    return (
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden"
        >
          {/* Success Header */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", bounce: 0.5 }}
              className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <CheckCircle className="w-10 h-10 text-white" />
            </motion.div>
            <h2 className="text-3xl font-bold mb-2">QR Code Generated! 🎉</h2>
            <p className="text-green-100">Your {qrType} QR code is ready to use</p>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* QR Code Preview */}
              <div className="text-center">
                <div className="inline-block p-8 bg-gray-50 rounded-2xl mb-6 shadow-inner">
                  <QRCodeCanvas
                    value={getQRValue() || 'https://example.com'}
                    size={250}
                    bgColor={qrData.backgroundColor}
                    fgColor={qrData.foregroundColor}
                    level={qrData.errorCorrectionLevel}
                    includeMargin={true}
                  />
                  {qrData.logoDataUrl && (
                    <div className="relative -mt-[250px] flex items-center justify-center">
                      <img
                        src={qrData.logoDataUrl}
                        alt="Logo"
                        className="rounded-full bg-white p-1 object-contain shadow-lg"
                        style={{
                          width: `${qrData.logoSize}%`,
                          height: `${qrData.logoSize}%`,
                          maxWidth: '75px',
                          maxHeight: '75px'
                        }}
                      />
                    </div>
                  )}
                </div>
                
                <div className="space-y-3">
                  <button
                    onClick={() => {
                      const canvas = document.querySelector('canvas');
                      if (canvas) {
                        const link = document.createElement('a');
                        link.download = `${content.title || 'qr-code'}.png`;
                        link.href = canvas.toDataURL();
                        link.click();
                      }
                    }}
                    className="w-full px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <Download className="w-5 h-5" />
                    Download PNG
                  </button>
                </div>
              </div>

              {/* QR Details */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">QR Code Details</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        qrType === 'static' ? 'bg-blue-100' : 'bg-purple-100'
                      }`}>
                        {qrType === 'static' ? (
                          <Zap className={`w-5 h-5 ${qrType === 'static' ? 'text-blue-600' : 'text-purple-600'}`} />
                        ) : (
                          <Target className={`w-5 h-5 ${qrType === 'static' ? 'text-blue-600' : 'text-purple-600'}`} />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {qrType === 'static' ? 'Static QR Code' : 'Dynamic QR Code'}
                        </div>
                        <div className="text-sm text-gray-600">
                          {qrType === 'static' ? 'Direct encoding • Permanent' : 'Database stored • Trackable'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        {React.createElement(getContentTypeIcon(contentType), { 
                          className: "w-5 h-5 text-green-600" 
                        })}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{CONTENT_TYPE_CONFIG[contentType].label}</div>
                        <div className="text-sm text-gray-600">{content.title}</div>
                      </div>
                    </div>

                    {qrType === 'dynamic' && (
                      <div className="space-y-3">
                        {qrData.passwordEnabled && (
                          <div className="flex items-center gap-2 text-purple-600 bg-purple-50 px-3 py-2 rounded-lg">
                            <Shield className="w-4 h-4" />
                            <span className="text-sm font-medium">Password Protected</span>
                          </div>
                        )}
                        {qrData.scheduleEnabled && (
                          <div className="flex items-center gap-2 text-orange-600 bg-orange-50 px-3 py-2 rounded-lg">
                            <Calendar className="w-4 h-4" />
                            <span className="text-sm font-medium">Scheduled Access</span>
                          </div>
                        )}
                        {qrData.countdownEnabled && (
                          <div className="flex items-center gap-2 text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
                            <Timer className="w-4 h-4" />
                            <span className="text-sm font-medium">Countdown: {qrData.countdownDuration}s</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={resetGenerator}
                    className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-5 h-5" />
                    Create Another QR Code
                  </button>
                  
                  <button
                    onClick={() => window.location.href = '/history'}
                    className="w-full px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <Eye className="w-5 h-5" />
                    View All QR Codes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <StepIndicator />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Left Column - Configuration */}
        <div className="xl:col-span-2 space-y-6">
          {/* Step 1: QR Type Selection */}
          {currentStep === 1 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-3xl shadow-xl p-8 border border-gray-200"
            >
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-3">Choose QR Code Type</h2>
                <p className="text-gray-600">Select the type that best fits your needs</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleQRTypeChange('static')}
                  className={`p-6 rounded-2xl border-2 transition-all duration-300 text-left ${
                    qrType === 'static'
                      ? 'border-blue-500 bg-blue-50 shadow-lg'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                  }`}
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      qrType === 'static' ? 'bg-blue-600' : 'bg-gray-400'
                    }`}>
                      <Zap className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Static QR Code</h3>
                      <p className="text-sm text-gray-600">Direct encoding</p>
                    </div>
                  </div>
                  <ul className="text-sm text-gray-700 space-y-2">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Permanent & reliable
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      No tracking required
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Works offline
                    </li>
                    <li className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-orange-500" />
                      URL/Website only
                    </li>
                  </ul>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleQRTypeChange('dynamic')}
                  className={`p-6 rounded-2xl border-2 transition-all duration-300 text-left ${
                    qrType === 'dynamic'
                      ? 'border-purple-500 bg-purple-50 shadow-lg'
                      : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                  }`}
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      qrType === 'dynamic' ? 'bg-purple-600' : 'bg-gray-400'
                    }`}>
                      <Target className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Dynamic QR Code</h3>
                      <p className="text-sm text-gray-600">Advanced features</p>
                    </div>
                  </div>
                  <ul className="text-sm text-gray-700 space-y-2">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      9 content types
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Password protection
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Scheduling & analytics
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Custom redirect pages
                    </li>
                  </ul>
                </motion.button>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
                >
                  Next: Choose Content
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Content Type & Data */}
          {currentStep === 2 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-3xl shadow-xl p-8 border border-gray-200"
            >
              <QRContentSelector
                selectedType={contentType}
                onTypeChange={handleContentTypeChange}
                qrType={qrType}
              />
              
              <div className="mt-8">
                <QRContentForm
                  contentType={contentType}
                  content={content}
                  onChange={handleContentChange}
                  errors={errors}
                />
              </div>

              <div className="flex justify-between mt-8">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                >
                  Back
                </button>
                <button
                  onClick={() => {
                    if (validateContent()) {
                      setCurrentStep(3);
                    }
                  }}
                  className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
                >
                  Next: Design
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Design & Settings */}
          {currentStep === 3 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              {/* Design Options */}
              <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-200">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                    <Palette className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Design Options</h3>
                    <p className="text-gray-600">Customize colors and appearance</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">Foreground Color</label>
                      <div className="p-4 border-2 border-gray-200 rounded-2xl hover:border-green-300 transition-all bg-gray-50">
                        <ColorPicker 
                          color={qrData.foregroundColor} 
                          onChange={(color) => setQrData(prev => ({ ...prev, foregroundColor: color }))} 
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">Background Color</label>
                      <div className="p-4 border-2 border-gray-200 rounded-2xl hover:border-green-300 transition-all bg-gray-50">
                        <ColorPicker 
                          color={qrData.backgroundColor} 
                          onChange={(color) => setQrData(prev => ({ ...prev, backgroundColor: color }))} 
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">Error Correction</label>
                      <select
                        value={qrData.errorCorrectionLevel}
                        onChange={(e) => setQrData(prev => ({ 
                          ...prev, 
                          errorCorrectionLevel: e.target.value as 'L' | 'M' | 'Q' | 'H' 
                        }))}
                        className="w-full rounded-2xl border-2 border-gray-200 p-4 focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all text-lg"
                      >
                        <option value="L">Low (7%)</option>
                        <option value="M">Medium (15%)</option>
                        <option value="Q">Quartile (25%)</option>
                        <option value="H">High (30%)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">Corner Style</label>
                      <select
                        value={qrData.cornerStyle}
                        onChange={(e) => setQrData(prev => ({ 
                          ...prev, 
                          cornerStyle: e.target.value as 'square' | 'rounded' | 'circle' 
                        }))}
                        className="w-full rounded-2xl border-2 border-gray-200 p-4 focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all text-lg"
                      >
                        <option value="square">Square</option>
                        <option value="rounded">Rounded</option>
                        <option value="circle">Circle</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Logo Upload */}
                <div className="mt-8">
                  <label className="block text-sm font-semibold text-gray-700 mb-4">Brand Logo</label>
                  {qrData.logoDataUrl ? (
                    <div className="flex items-center space-x-6 p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl">
                      <img src={qrData.logoDataUrl} alt="Logo preview" className="w-20 h-20 object-contain rounded-xl shadow-md" />
                      <div className="flex-1">
                        <p className="text-lg font-semibold text-green-800 mb-2">Logo uploaded successfully</p>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm text-gray-700 mb-2">Logo Size: {qrData.logoSize}%</label>
                            <input
                              type="range"
                              min="10"
                              max="30"
                              value={qrData.logoSize}
                              onChange={(e) => setQrData(prev => ({ ...prev, logoSize: parseInt(e.target.value) }))}
                              className="w-full h-2 bg-green-200 rounded-lg appearance-none cursor-pointer slider"
                            />
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setQrData(prev => ({ ...prev, logoDataUrl: '' }))}
                        className="p-3 text-green-600 hover:text-red-600 transition-colors rounded-xl hover:bg-red-50"
                      >
                        <X className="w-6 h-6" />
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
                      <div className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 ${
                        logoUploading ? 'border-green-300 bg-green-50' : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                      }`}>
                        {logoUploading ? (
                          <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mr-3"></div>
                            <span className="text-lg text-green-600 font-medium">Uploading...</span>
                          </div>
                        ) : (
                          <>
                            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-lg text-gray-600 font-medium mb-2">Click to upload logo</p>
                            <p className="text-sm text-gray-500">PNG, JPG (max 5MB)</p>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Dynamic QR Features */}
              {qrType === 'dynamic' && (
                <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-200">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
                      <Settings className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Dynamic Features</h3>
                      <p className="text-gray-600">Advanced controls and security</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Password Protection */}
                    <div className="border-2 border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all bg-gradient-to-br from-red-50 to-pink-50">
                      <label className="flex items-center gap-3 mb-4">
                        <input
                          type="checkbox"
                          checked={qrData.passwordEnabled || false}
                          onChange={(e) => setQrData(prev => ({ ...prev, passwordEnabled: e.target.checked }))}
                          className="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500"
                        />
                        <Lock className="w-6 h-6 text-red-600" />
                        <span className="font-semibold text-gray-800">Password Protection</span>
                      </label>
                      <p className="text-sm text-red-700 mb-4">Require a password to access content</p>
                      
                      <AnimatePresence>
                        {qrData.passwordEnabled && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                          >
                            <input
                              type="password"
                              value={qrData.password || ''}
                              onChange={(e) => setQrData(prev => ({ ...prev, password: e.target.value }))}
                              placeholder="Enter password"
                              className="w-full rounded-xl border-2 border-red-200 p-3 text-sm focus:ring-4 focus:ring-red-500/20 focus:border-red-500 transition-all"
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Scheduling */}
                    <div className="border-2 border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all bg-gradient-to-br from-orange-50 to-amber-50">
                      <label className="flex items-center gap-3 mb-4">
                        <input
                          type="checkbox"
                          checked={qrData.scheduleEnabled || false}
                          onChange={(e) => setQrData(prev => ({ ...prev, scheduleEnabled: e.target.checked }))}
                          className="w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                        />
                        <Calendar className="w-6 h-6 text-orange-600" />
                        <span className="font-semibold text-gray-800">Enable Scheduling</span>
                      </label>
                      <p className="text-sm text-orange-700 mb-4">Control when your QR code is active</p>
                      
                      <AnimatePresence>
                        {qrData.scheduleEnabled && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="grid grid-cols-2 gap-3"
                          >
                            <div>
                              <label className="block text-xs font-semibold text-gray-700 mb-2">Start Date</label>
                              <input
                                type="date"
                                value={qrData.scheduleStart?.split('T')[0] || ''}
                                onChange={(e) => setQrData(prev => ({ 
                                  ...prev, 
                                  scheduleStart: e.target.value ? `${e.target.value}T00:00:00.000Z` : '' 
                                }))}
                                className="w-full rounded-xl border-2 border-orange-200 p-2 text-sm focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-gray-700 mb-2">End Date</label>
                              <input
                                type="date"
                                value={qrData.scheduleEnd?.split('T')[0] || ''}
                                onChange={(e) => setQrData(prev => ({ 
                                  ...prev, 
                                  scheduleEnd: e.target.value ? `${e.target.value}T23:59:59.999Z` : '' 
                                }))}
                                className="w-full rounded-xl border-2 border-orange-200 p-2 text-sm focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-gray-700 mb-2">Start Time</label>
                              <input
                                type="time"
                                value={qrData.dailyStartTime || ''}
                                onChange={(e) => setQrData(prev => ({ ...prev, dailyStartTime: e.target.value }))}
                                className="w-full rounded-xl border-2 border-orange-200 p-2 text-sm focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-gray-700 mb-2">End Time</label>
                              <input
                                type="time"
                                value={qrData.dailyEndTime || ''}
                                onChange={(e) => setQrData(prev => ({ ...prev, dailyEndTime: e.target.value }))}
                                className="w-full rounded-xl border-2 border-orange-200 p-2 text-sm focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                              />
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Countdown Timer */}
                    <div className="border-2 border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all bg-gradient-to-br from-blue-50 to-cyan-50 md:col-span-2">
                      <label className="flex items-center gap-3 mb-4">
                        <input
                          type="checkbox"
                          checked={qrData.countdownEnabled || false}
                          onChange={(e) => setQrData(prev => ({ ...prev, countdownEnabled: e.target.checked }))}
                          className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <Timer className="w-6 h-6 text-blue-600" />
                        <span className="font-semibold text-gray-800">Countdown Timer</span>
                      </label>
                      <p className="text-sm text-blue-700 mb-4">Add a delay before redirecting users</p>
                      
                      <AnimatePresence>
                        {qrData.countdownEnabled && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                          >
                            <label className="block text-xs font-semibold text-gray-700 mb-2">Countdown Duration (seconds)</label>
                            <input
                              type="number"
                              min="1"
                              max="60"
                              value={qrData.countdownDuration || 5}
                              onChange={(e) => setQrData(prev => ({ 
                                ...prev, 
                                countdownDuration: parseInt(e.target.value) || 5 
                              }))}
                              className="w-full rounded-xl border-2 border-blue-200 p-3 text-sm focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-between">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                >
                  Back
                </button>
                <button
                  onClick={() => setCurrentStep(4)}
                  className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
                >
                  Next: Generate
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 4: Generate */}
          {currentStep === 4 && !showPreview && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-3xl shadow-xl p-8 border border-gray-200"
            >
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Sparkles className="w-10 h-10 text-white" />
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Ready to Generate</h3>
                <p className="text-gray-600 mb-8 text-lg">
                  Your {qrType} QR code for {CONTENT_TYPE_CONFIG[contentType].label} is ready to be created
                </p>

                <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-2xl p-6 mb-8">
                  <div className="flex items-center justify-center gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{userQuota}</div>
                      <div className="text-sm text-gray-600">Quota Remaining</div>
                    </div>
                    <div className="w-px h-12 bg-gray-300"></div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">1</div>
                      <div className="text-sm text-gray-600">Will Be Used</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating || userQuota <= 0}
                    className={`w-full py-6 px-8 rounded-2xl font-bold text-xl transition-all duration-300 flex items-center justify-center gap-4 ${
                      isGenerating || userQuota <= 0
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : qrType === 'static'
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-xl hover:shadow-2xl transform hover:scale-105'
                        : 'bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800 shadow-xl hover:shadow-2xl transform hover:scale-105'
                    }`}
                  >
                    {isGenerating ? (
                      <>
                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Generating QR Code...
                      </>
                    ) : (
                      <>
                        <Play className="w-6 h-6" />
                        Generate {qrType === 'static' ? 'Static' : 'Dynamic'} QR Code
                      </>
                    )}
                  </button>

                  {userQuota <= 0 && (
                    <div className="p-6 bg-red-50 border-2 border-red-200 rounded-2xl">
                      <div className="flex items-center gap-3 text-red-700 mb-3">
                        <AlertCircle className="w-6 h-6" />
                        <span className="font-semibold text-lg">Insufficient quota</span>
                      </div>
                      <p className="text-red-600 mb-4">You need at least 1 quota to generate a QR code.</p>
                      <button
                        onClick={() => window.location.href = '/plans-and-quota'}
                        className="w-full px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium"
                      >
                        Upgrade Plan
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex justify-between mt-8">
                  <button
                    onClick={() => setCurrentStep(3)}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                  >
                    Back
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Right Column - Live Preview */}
        <div className="xl:sticky xl:top-8 xl:h-fit">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-3xl shadow-xl p-8 border border-gray-200"
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl flex items-center justify-center">
                <Eye className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Live Preview</h3>
                <p className="text-gray-600">See how your QR code will look</p>
              </div>
            </div>

            <div className="text-center">
              <div className="inline-block p-8 bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl mb-6 shadow-inner">
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
                      className="rounded-full bg-white p-1 object-contain shadow-lg"
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

              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="text-gray-600 text-xs uppercase tracking-wide mb-1">Type</div>
                    <div className={`font-bold ${qrType === 'static' ? 'text-blue-600' : 'text-purple-600'}`}>
                      {qrType === 'static' ? 'Static' : 'Dynamic'}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="text-gray-600 text-xs uppercase tracking-wide mb-1">Content</div>
                    <div className="font-bold text-gray-900">{CONTENT_TYPE_CONFIG[contentType].label}</div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="text-gray-600 text-xs uppercase tracking-wide mb-2">Title</div>
                  <div className="font-medium text-gray-900">{content.title || 'Untitled'}</div>
                </div>

                {qrType === 'dynamic' && (
                  <div className="space-y-2">
                    {qrData.passwordEnabled && (
                      <div className="flex items-center justify-center gap-2 text-purple-600 bg-purple-50 px-3 py-2 rounded-lg">
                        <Shield className="w-4 h-4" />
                        <span className="text-sm font-medium">Password Protected</span>
                      </div>
                    )}
                    {qrData.scheduleEnabled && (
                      <div className="flex items-center justify-center gap-2 text-orange-600 bg-orange-50 px-3 py-2 rounded-lg">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm font-medium">Scheduled</span>
                      </div>
                    )}
                    {qrData.countdownEnabled && (
                      <div className="flex items-center justify-center gap-2 text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
                        <Timer className="w-4 h-4" />
                        <span className="text-sm font-medium">Countdown: {qrData.countdownDuration}s</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default QRGenerator;