// QRCodeDownloader.tsx

import React, { useCallback, useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import jsPDF from 'jspdf';
import { Download, X, CheckCircle, Image as ImageIcon, File as FileIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ---- Only A4, A5, A6; DPI 70, 150, 300 ----
export const PAGE_SIZE_OPTIONS = ['A4', 'A5', 'A6'] as const;
export const DPI_OPTIONS = [70, 150, 300];
export const DEFAULT_DPI = 150;
export const DEFAULT_PAGE_SIZE = 'A4';
// Accurate size table, per your specs:
const A4_sizes: Record<number, [number, number]> = {
  70: [595, 842],
  150: [1240, 1754],
  300: [2480, 3508]
};
const A5_sizes: Record<number, [number, number]> = {
  70: [297, 421],
  150: [620, 877],
  300: [1240, 1754]
};
const A6_sizes: Record<number, [number, number]> = {
  70: [148, 210],
  150: [310, 438],
  300: [620, 877]
};
export function getSizeInPixels(pdfSize: string, dpi: number): number[] {
  const sizeMap: Record<string, Record<number, [number, number]>> = {
    A4: A4_sizes, A5: A5_sizes, A6: A6_sizes
  };
  const map = sizeMap[pdfSize] || A4_sizes;
  return map[dpi] || map[DEFAULT_DPI];
}
// -------------------------------------------

import { getQRValue } from '../types/qrcode';

type ImageFormat = 'png' | 'jpeg' | 'pdf';
type ImageSize = '512x512' | '1080x1080' | '2048x2048';
type PDFSize = 'A4' | 'A5' | 'A6';

interface QRCodeDownloaderProps {
  qrCodeData: {
    url?: string;
    targetUrl?: string;
    type?: 'static' | 'dynamic';
    shortId?: string;
    name: string;
    color?: string;
    backgroundColor?: string;
    containerBackgroundColor?: string;
    logoDataUrl?: string;
    errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
    createdAt?: string;
  };
}

const IMAGE_OPTIONS: Array<{ format: ImageFormat; label: string; icon: React.ReactNode }> = [
  { format: 'png', label: 'PNG', icon: <ImageIcon className="h-7 w-7" /> },
  { format: 'jpeg', label: 'JPEG', icon: <ImageIcon className="h-7 w-7" /> },
  { format: 'pdf', label: 'PDF', icon: <FileIcon className="h-7 w-7" /> }
];

const QRCodeDownloader: React.FC<QRCodeDownloaderProps> = ({ qrCodeData }) => {
  const [selectedFormat, setSelectedFormat] = useState<ImageFormat | null>(null);
  const [selectedSize, setSelectedSize] = useState<ImageSize>('1080x1080');
  const [selectedPdfSize, setSelectedPdfSize] = useState<PDFSize>(DEFAULT_PAGE_SIZE);
  const [selectedDpi, setSelectedDpi] = useState(DEFAULT_DPI);
  const [isDownloadPopupOpen, setIsDownloadPopupOpen] = useState(false);
  const [targetSizePixels, setTargetSizePixels] = useState<number[] | null>(null);
  const [downloadStatus, setDownloadStatus] = useState<'idle' | 'success' | 'failure'>('idle');
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let newSizePixels = null;
    if (selectedFormat === 'pdf') {
      newSizePixels = getSizeInPixels(selectedPdfSize, selectedDpi);
    } else if (selectedFormat) {
      switch (selectedSize) {
        case '512x512': newSizePixels = [512, 512]; break;
        case '1080x1080': newSizePixels = [1080, 1080]; break;
        case '2048x2048': newSizePixels = [2048, 2048]; break;
        default: newSizePixels = [1080, 1080]; break;
      }
    }
    setTargetSizePixels(newSizePixels);
  }, [selectedFormat, selectedSize, selectedPdfSize, selectedDpi]);

  const generateQRCodeCanvas = useCallback(async (width: number, height: number) => {
    const side = Math.min(width, height);
    const canvas = document.createElement('canvas');
    canvas.width = side;
    canvas.height = side;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error("Could not create image.");
    ctx.fillStyle = qrCodeData.containerBackgroundColor ?? 'transparent';
    ctx.fillRect(0, 0, side, side);
    const padding = 10;
    const qrCodeSize = side - 2 * padding;
    const qrCanvas = document.createElement('canvas');
    qrCanvas.width = qrCodeSize;
    qrCanvas.height = qrCodeSize;
    
    // Get the correct URL for QR generation
    const qrValue = getQRValue(qrCodeData as any);
    if (!qrValue) {
      throw new Error("No URL available for QR generation");
    }
    
    await QRCode.toCanvas(qrCanvas, qrValue, {
      errorCorrectionLevel: qrCodeData.errorCorrectionLevel || 'L',
      width: qrCodeSize,
      margin: 0,
      color: { dark: qrCodeData.color || '#000', light: qrCodeData.backgroundColor || 'transparent' }
    });
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(qrCanvas, padding, padding, qrCodeSize, qrCodeSize);
    if (qrCodeData.logoDataUrl) {
      const logoSize = qrCodeSize * 0.2;
      const logoX = padding + (qrCodeSize - logoSize) / 2;
      const logoY = padding + (qrCodeSize - logoSize) / 2;
      ctx.beginPath();
      ctx.arc(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2 * 1.1, 0, 2 * Math.PI);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.save();
      ctx.beginPath();
      ctx.arc(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2, 0, 2 * Math.PI);
      ctx.clip();
      const logo = new window.Image();
      logo.crossOrigin = 'anonymous';
      await new Promise<void>((resolve, reject) => {
        logo.onload = () => { ctx.drawImage(logo, logoX, logoY, logoSize, logoSize); ctx.restore(); resolve(); };
        logo.onerror = reject;
        logo.src = qrCodeData.logoDataUrl!;
      });
    }
    return canvas;
  }, [qrCodeData]);

  const downloadPDF = useCallback(
  async (qrCodeCanvas: HTMLCanvasElement) => {
    if (!targetSizePixels) {
      setDownloadStatus('failure');
      setDownloadError("Invalid size selected.");
      return;
    }
    try {
      const [pageWidth, pageHeight] = targetSizePixels;
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [pageWidth, pageHeight]
      });

      // Responsive layout constants
      const margin = Math.round(0.07 * Math.min(pageWidth, pageHeight)); // 7% margin
      const qrBlockSize = Math.round(0.63 * Math.min(pageWidth, pageHeight));  // 63% of shorter side
      const headingFontSize = Math.round(qrBlockSize * 0.12); // 12% of QR block
      const urlFontSize = Math.round(qrBlockSize * 0.07);     // 7% of QR block
      const helperFontSize = Math.max(9, Math.round(qrBlockSize * 0.055)); // minimal readable for A6

      // Content positions
      let y = margin + headingFontSize;
      // Heading
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(headingFontSize);
      pdf.setTextColor('#212121');
      const heading = qrCodeData.name;
      pdf.text(heading, pageWidth / 2, y, { align: 'center' });

      // QR code center
      y += margin;
      const qrX = (pageWidth - qrBlockSize) / 2;
      pdf.addImage(qrCodeCanvas.toDataURL('image/png'), 'PNG', qrX, y, qrBlockSize, qrBlockSize);

      // "Scan me..." below QR
      y += qrBlockSize + margin / 2;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(helperFontSize);
      pdf.setTextColor('#6b7280');
      pdf.text("Scan me with your smartphone camera.", pageWidth / 2, y, { align: 'center' });

      // URL, further down
      y += helperFontSize + margin / 4;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(urlFontSize);
      pdf.setTextColor('#009688');
      pdf.text(qrCodeData.url, pageWidth / 2, y, { align: 'center' });

      // Created at (footer)
      y = pageHeight - margin * 1.2;
      pdf.setFontSize(helperFontSize);
      pdf.setTextColor('#bdbdbd');
      const dateText = qrCodeData.createdAt
        ? `Created: ${new Date(qrCodeData.createdAt).toLocaleDateString()}`
        : '';
      if (dateText) pdf.text(dateText, margin + 5, y);

      // Copyright/brand (footer, right)
      const copyrightText = `© ${new Date().getFullYear()} FlashQR`;
      pdf.text(
        copyrightText,
        pageWidth - margin - 5,
        y,
        { align: 'right' }
      );

      pdf.save(`qrcode_${qrCodeData.name}.pdf`);
      setDownloadStatus('success');
    } catch (e: any) {
      setDownloadStatus('failure');
      setDownloadError(e.message ?? 'Unknown error generating PDF.');
    }
  },
  [targetSizePixels, qrCodeData.name, qrCodeData.url, qrCodeData.createdAt]
);

  const downloadImage = useCallback(async () => {
    if (!selectedFormat || !targetSizePixels) return;
    setDownloadStatus('idle'); setDownloadError(null);
    try {
      const [width, height] = targetSizePixels;
      const canvas = await generateQRCodeCanvas(width, height);
      if (selectedFormat === 'png' || selectedFormat === 'jpeg') {
        const mime = `image/${selectedFormat}`;
        const url = canvas.toDataURL(mime);
        const link = document.createElement('a');
        link.download = `qrcode_${qrCodeData.name}.${selectedFormat}`;
        link.href = url;
        link.click();
        setDownloadStatus('success');
      } else if (selectedFormat === 'pdf') {
        await downloadPDF(canvas);
      }
    } catch (e: any) {
      setDownloadStatus('failure');
      setDownloadError(e.message ?? 'Download failed.');
    }
  }, [selectedFormat, targetSizePixels, generateQRCodeCanvas, qrCodeData.name, downloadPDF]);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) setIsDownloadPopupOpen(false);
    };
    if (isDownloadPopupOpen) document.addEventListener('mousedown', handle);
    return () => { document.removeEventListener('mousedown', handle); };
  }, [isDownloadPopupOpen]);

  function FormatSelection() {
    return (
      <div className="flex flex-row justify-center gap-4 mb-6">
        {IMAGE_OPTIONS.map(opt => (
          <button
            key={opt.format}
            type="button"
            className={`flex flex-col items-center p-4 rounded-xl border shadow focus:outline-none transition
              ${selectedFormat === opt.format ? "bg-green-600 text-white border-green-600 scale-105" : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-green-50"}
            `}
            style={{ minWidth: 80 }}
            onClick={() => setSelectedFormat(opt.format)}
          >
            {opt.icon}
            <span className="mt-2 text-sm font-semibold uppercase tracking-wide">{opt.label}</span>
          </button>
        ))}
      </div>
    );
  }

  function DynamicOptions() {
    if (!selectedFormat) return null;
    return (
      <>
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">Size:</label>
          <select
            className="w-full border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 text-sm py-2 px-3"
            value={selectedFormat === 'pdf' ? selectedPdfSize : selectedSize}
            onChange={e =>
              selectedFormat === 'pdf'
                ? setSelectedPdfSize(e.target.value as PDFSize)
                : setSelectedSize(e.target.value as ImageSize)
            }
          >
            {(selectedFormat === 'pdf' ? PAGE_SIZE_OPTIONS : ['512x512', '1080x1080', '2048x2048'])
              .map(val => (<option key={val} value={val}>{val}</option>))}
          </select>
        </div>
        {selectedFormat === 'pdf' && (
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">DPI:</label>
            <select
              className="w-full border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 text-sm py-2 px-3"
              value={selectedDpi}
              onChange={e => setSelectedDpi(Number(e.target.value))}
            >
              {DPI_OPTIONS.map(dpi => (
                <option key={dpi} value={dpi}>{dpi} DPI {dpi === DEFAULT_DPI ? '(Recommended)' : ''}</option>
              ))}
            </select>
          </div>
        )}
        {selectedFormat !== 'pdf' && (
          <p className="text-xs text-gray-500 mb-3">
            For best results, use 1080x1080 for PNG or JPEG.
          </p>
        )}
      </>
    );
  }

  function DownloadModalContent() {
    switch (downloadStatus) {
      case 'success': return (
        <div className="py-8 text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold mb-2">QR Code Downloaded!</h3>
          <button className="mt-2 bg-gray-200 px-4 py-2 rounded" onClick={() => setDownloadStatus('idle')}>Download Again</button>
          <button className="mt-2 bg-green-600 text-white px-4 py-2 rounded ml-2" onClick={() => { setIsDownloadPopupOpen(false); setDownloadStatus('idle'); }}>Close</button>
        </div>
      );
      case 'failure': return (
        <div className="py-8 text-center">
          <h3 className="text-lg font-semibold text-red-600 mb-2">Download Failed</h3>
          <p className="text-red-500">{downloadError}</p>
          <button className="mt-2 bg-red-600 text-white px-4 py-2 rounded" onClick={() => setDownloadStatus('idle')}>Try Again</button>
        </div>
      );
      default: return (
        <form
          className="p-5"
          onSubmit={async e => { e.preventDefault(); if (selectedFormat) await downloadImage(); }}
        >
          <h2 className="text-xl font-bold mb-4 text-center text-gray-800">Download Options</h2>
          <FormatSelection />
          <DynamicOptions />
          <div className="mt-7 flex justify-end">
            <button
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded-md mr-2"
              type="button"
              onClick={() => setIsDownloadPopupOpen(false)}
            >
              Cancel
            </button>
            <button
              className={`bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md focus:outline-none transition-colors duration-200 text-sm ${!selectedFormat ? 'opacity-50 cursor-not-allowed' : ''}`}
              type="submit"
              disabled={!selectedFormat}
            >
              Download
            </button>
          </div>
        </form>
      );
    }
  }

  return (
    <div>
      <button
        onClick={() => { setIsDownloadPopupOpen(true); setSelectedFormat(null); setDownloadError(null); setDownloadStatus('idle'); }}
        className="inline-flex items-center rounded-md text-gray-600 hover:text-green-600 transition"
        aria-label="Download"
      >
        <Download className="h-5 w-5 mr-2" />
      </button>
      <AnimatePresence>
        {isDownloadPopupOpen && (
          <motion.div className="fixed inset-0 bg-gray-500 bg-opacity-60 flex items-center justify-center z-50"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div
              className="bg-white rounded-2xl shadow-xl w-full max-w-sm m-4 relative"
              ref={modalRef}
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}>
              <button
                onClick={() => setIsDownloadPopupOpen(false)}
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-800"
                aria-label="Close">
                <X className="h-4 w-4" />
              </button>
              <DownloadModalContent />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default QRCodeDownloader;
