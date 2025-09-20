import React, { useState, useEffect } from 'react';
import { QRCodeData, StaticQRCodeData, DynamicQRCodeData } from '../types/qrcode';
import { v4 as uuidv4 } from 'uuid';
import Papa from 'papaparse';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Upload,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle,
  Info,
  Loader2,
  Zap,
  Target
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface CSVUploadModalProps {
  onClose: () => void;
  onUpload: (entries: QRCodeData[]) => void;
  existingEntries: QRCodeData[];
  qrType: 'static' | 'dynamic';
}

const CSVUploadModal: React.FC<CSVUploadModalProps> = ({
  onClose,
  onUpload,
  existingEntries,
  qrType
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [preview, setPreview] = useState<QRCodeData[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  const generateShortId = (): string => {
    return Math.random().toString(36).substring(2, 10);
  };

  const getStaticTemplate = () => {
    return `name,url,color,backgroundColor,errorCorrectionLevel
"My Website","https://example.com","#000000","#FFFFFF","M"
"Contact Info","https://mysite.com/contact","#0066CC","#FFFFFF","M"
"Product Page","https://shop.com/product/123","#FF6600","#FFFFFF","H"`;
  };

  const getDynamicTemplate = () => {
    return `name,targetUrl,description,tags,featuredImageUrl,scheduleEnabled,scheduleStart,scheduleEnd,dailyStartTime,dailyEndTime,scanLimitEnabled,maxScans,passwordEnabled,password,color,backgroundColor,errorCorrectionLevel
"Marketing Campaign","https://example.com/campaign","Visit our latest campaign","marketing,promo","https://example.com/image.jpg","false","","","","","false","","false","","#000000","#FFFFFF","M"
"Event Registration","https://events.com/register","Register for our upcoming event","event,registration","","true","2024-01-01T00:00:00.000Z","2024-12-31T23:59:59.999Z","09:00","17:00","true","100","false","","#0066CC","#FFFFFF","M"
"VIP Access","https://vip.com/access","Exclusive VIP content access","vip,exclusive","","false","","","","","false","","true","vip123","#FFD700","#000000","H"`;
  };

  const downloadTemplate = () => {
    const template = qrType === 'static' ? getStaticTemplate() : getDynamicTemplate();
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${qrType}_qr_template.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`${qrType === 'static' ? 'Static' : 'Dynamic'} QR template downloaded!`);
  };

  const validateStaticEntry = (row: any, index: number): { entry: StaticQRCodeData | null, error: string | null } => {
    const errors: string[] = [];
    
    if (!row.name || !row.name.trim()) {
      errors.push(`Row ${index + 1}: Name is required`);
    }
    
    if (!row.url || !row.url.trim()) {
      errors.push(`Row ${index + 1}: URL is required`);
    } else {
      try {
        new URL(row.url);
      } catch {
        errors.push(`Row ${index + 1}: Invalid URL format`);
      }
    }

    if (errors.length > 0) {
      return { entry: null, error: errors.join(', ') };
    }

    const entry: StaticQRCodeData = {
      id: uuidv4(),
      name: row.name.trim(),
      type: 'static',
      url: row.url.trim(),
      color: row.color || '#000000',
      backgroundColor: row.backgroundColor || '#FFFFFF',
      size: 200,
      errorCorrectionLevel: (row.errorCorrectionLevel as 'L' | 'M' | 'Q' | 'H') || 'M',
      includeMargin: true,
      containerBackgroundColor: '#FFFFFF',
      logoDataUrl: '',
      userId: '',
      createdAt: new Date().toISOString(),
      order: 0
    };

    return { entry, error: null };
  };

  const validateDynamicEntry = (row: any, index: number): { entry: DynamicQRCodeData | null, error: string | null } => {
    const errors: string[] = [];
    
    if (!row.name || !row.name.trim()) {
      errors.push(`Row ${index + 1}: Name is required`);
    }
    
    if (!row.targetUrl || !row.targetUrl.trim()) {
      errors.push(`Row ${index + 1}: Target URL is required`);
    } else {
      try {
        new URL(row.targetUrl);
      } catch {
        errors.push(`Row ${index + 1}: Invalid target URL format`);
      }
    }

    if (errors.length > 0) {
      return { entry: null, error: errors.join(', ') };
    }

    // Parse boolean fields safely
    const parseBoolean = (value: any): boolean => {
      if (typeof value === 'boolean') return value;
      if (typeof value === 'string') {
        return value.toLowerCase() === 'true' || value === '1';
      }
      return false;
    };

    // Parse tags safely
    const parseTags = (value: any): string[] => {
      if (!value) return [];
      if (typeof value === 'string') {
        return value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      }
      return [];
    };

    // Parse number safely
    const parseNumber = (value: any): number | undefined => {
      if (!value) return undefined;
      const num = parseInt(value);
      return isNaN(num) ? undefined : num;
    };

    const entry: DynamicQRCodeData = {
      id: generateShortId(),
      name: row.name.trim(),
      type: 'dynamic',
      targetUrl: row.targetUrl.trim(),
      shortId: generateShortId(),
      tags: parseTags(row.tags),
      description: row.description || '',
      featuredImageUrl: row.featuredImageUrl || '',
      redirectPageEnabled: true,
      color: row.color || '#000000',
      backgroundColor: row.backgroundColor || '#FFFFFF',
      size: 200,
      errorCorrectionLevel: (row.errorCorrectionLevel as 'L' | 'M' | 'Q' | 'H') || 'M',
      includeMargin: true,
      containerBackgroundColor: '#FFFFFF',
      logoDataUrl: '',
      userId: '',
      createdAt: new Date().toISOString(),
      order: 0,
      visits: 0,
      scheduleEnabled: parseBoolean(row.scheduleEnabled),
      scheduleStart: row.scheduleStart || '',
      scheduleEnd: row.scheduleEnd || '',
      dailyStartTime: row.dailyStartTime || '',
      dailyEndTime: row.dailyEndTime || '',
      scanLimitEnabled: parseBoolean(row.scanLimitEnabled),
      maxScans: parseNumber(row.maxScans),
      passwordEnabled: parseBoolean(row.passwordEnabled),
      password: row.password || ''
    };

    return { entry, error: null };
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
      setErrors(['Please select a CSV file']);
      return;
    }

    setFile(selectedFile);
    setParsing(true);
    setErrors([]);
    setParsedData([]);
    setPreview([]);
    setShowPreview(false);

    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setParsing(false);
        
        if (results.errors.length > 0) {
          setErrors(['CSV parsing errors: ' + results.errors.map(e => e.message).join(', ')]);
          return;
        }

        if (!results.data || results.data.length === 0) {
          setErrors(['CSV file is empty or contains no valid data']);
          return;
        }

        setParsedData(results.data);
        validateAndPreview(results.data);
      },
      error: (error) => {
        setParsing(false);
        setErrors(['Failed to parse CSV file: ' + error.message]);
      }
    });
  };

  const validateAndPreview = (data: any[]) => {
    const validEntries: QRCodeData[] = [];
    const errorMessages: string[] = [];

    data.forEach((row, index) => {
      let result;
      
      if (qrType === 'static') {
        result = validateStaticEntry(row, index);
      } else {
        result = validateDynamicEntry(row, index);
      }

      if (result.entry) {
        validEntries.push(result.entry);
      }
      
      if (result.error) {
        errorMessages.push(result.error);
      }
    });

    setPreview(validEntries);
    setErrors(errorMessages);
    setShowPreview(true);
  };

  const handleImport = () => {
    if (preview.length === 0) {
      toast.error('No valid entries to import');
      return;
    }

    onUpload(preview);
    onClose();
  };

  const getRequiredFields = () => {
    if (qrType === 'static') {
      return ['name', 'url'];
    } else {
      return ['name', 'targetUrl'];
    }
  };

  const getOptionalFields = () => {
    if (qrType === 'static') {
      return ['color', 'backgroundColor', 'errorCorrectionLevel'];
    } else {
      return [
        'description', 'tags', 'featuredImageUrl', 'color', 'backgroundColor', 
        'errorCorrectionLevel', 'scheduleEnabled', 'scheduleStart', 'scheduleEnd',
        'dailyStartTime', 'dailyEndTime', 'scanLimitEnabled', 'maxScans',
        'passwordEnabled', 'password'
      ];
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="relative bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
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
                <h2 className="text-xl font-semibold text-gray-900">
                  Import {qrType === 'static' ? 'Static' : 'Dynamic'} QR Codes from CSV
                </h2>
                <p className="text-sm text-gray-600">
                  Upload a CSV file to bulk import QR code entries
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Template Download Section */}
          <div className={`rounded-xl p-4 border ${
            qrType === 'static' ? 'bg-blue-50 border-blue-200' : 'bg-purple-50 border-purple-200'
          }`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className={`font-medium ${
                  qrType === 'static' ? 'text-blue-900' : 'text-purple-900'
                } mb-2`}>
                  Download Template
                </h3>
                <p className={`text-sm ${
                  qrType === 'static' ? 'text-blue-700' : 'text-purple-700'
                } mb-3`}>
                  Get the {qrType === 'static' ? 'static' : 'dynamic'} QR code CSV template with all required and optional fields.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <h4 className={`text-xs font-medium ${
                      qrType === 'static' ? 'text-blue-800' : 'text-purple-800'
                    } mb-2`}>
                      Required Fields:
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {getRequiredFields().map(field => (
                        <span key={field} className={`px-2 py-1 text-xs rounded-full ${
                          qrType === 'static' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {field}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className={`text-xs font-medium ${
                      qrType === 'static' ? 'text-blue-800' : 'text-purple-800'
                    } mb-2`}>
                      Optional Fields:
                    </h4>
                    <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                      {getOptionalFields().map(field => (
                        <span key={field} className={`px-2 py-1 text-xs rounded-full ${
                          qrType === 'static' 
                            ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                            : 'bg-purple-50 text-purple-700 border border-purple-200'
                        }`}>
                          {field}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              <button
                onClick={downloadTemplate}
                className={`ml-4 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  qrType === 'static'
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-purple-600 hover:bg-purple-700 text-white'
                }`}
              >
                <Download className="w-4 h-4" />
                Download Template
              </button>
            </div>
          </div>

          {/* File Upload Section */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Upload CSV File</h3>
            
            {!file ? (
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-gray-400 transition-colors">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <FileSpreadsheet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">
                  Choose CSV file or drag and drop
                </h4>
                <p className="text-gray-600 mb-4">
                  Upload your {qrType === 'static' ? 'static' : 'dynamic'} QR codes CSV file
                </p>
                <div className="flex justify-center">
                  <span className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium">
                    Select CSV File
                  </span>
                </div>
              </div>
            ) : (
              <div className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="w-8 h-8 text-green-600" />
                    <div>
                      <h4 className="font-medium text-gray-900">{file.name}</h4>
                      <p className="text-sm text-gray-600">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    {parsing && (
                      <div className="flex items-center gap-2 text-blue-600">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm">Parsing...</span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setFile(null);
                      setParsedData([]);
                      setPreview([]);
                      setErrors([]);
                      setShowPreview(false);
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Errors Section */}
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-red-900 mb-2">Validation Errors</h4>
                  <ul className="text-sm text-red-700 space-y-1">
                    {errors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Preview Section */}
          {showPreview && preview.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-start gap-3 mb-4">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-green-900 mb-2">
                    Preview ({preview.length} valid entries)
                  </h4>
                  <p className="text-sm text-green-700">
                    The following entries will be imported:
                  </p>
                </div>
              </div>
              
              <div className="max-h-60 overflow-y-auto">
                <div className="grid gap-2">
                  {preview.slice(0, 5).map((entry, index) => (
                    <div key={index} className="bg-white rounded-lg p-3 border border-green-200">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-900">{entry.name}</h5>
                          <p className="text-sm text-gray-600">
                            {qrType === 'static' 
                              ? (entry as StaticQRCodeData).url 
                              : (entry as DynamicQRCodeData).targetUrl
                            }
                          </p>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          qrType === 'static' 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'bg-purple-100 text-purple-700'
                        }`}>
                          {qrType === 'static' ? 'Static' : 'Dynamic'}
                        </span>
                      </div>
                    </div>
                  ))}
                  {preview.length > 5 && (
                    <div className="text-center text-sm text-gray-600 py-2">
                      ... and {preview.length - 5} more entries
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Info Section */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-700">
                <h4 className="font-medium text-blue-900 mb-2">Import Guidelines</h4>
                <ul className="space-y-1">
                  <li>• Make sure your CSV file has the correct column headers</li>
                  <li>• Required fields must not be empty</li>
                  <li>• URLs must be valid and start with http:// or https://</li>
                  {qrType === 'dynamic' && (
                    <>
                      <li>• Boolean fields should be "true" or "false"</li>
                      <li>• Tags should be comma-separated</li>
                      <li>• Dates should be in ISO format (YYYY-MM-DDTHH:MM:SS.sssZ)</li>
                      <li>• Times should be in HH:MM format</li>
                    </>
                  )}
                  <li>• Color values should be hex codes (e.g., #FF0000)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 rounded-b-2xl">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {preview.length > 0 && (
                <span>{preview.length} valid entries ready to import</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={preview.length === 0 || parsing}
                className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  preview.length > 0 && !parsing
                    ? qrType === 'static'
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-purple-600 hover:bg-purple-700 text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {parsing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Import {preview.length} Entries
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default CSVUploadModal;
