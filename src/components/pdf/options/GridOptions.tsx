import React from 'react';
import { PDFSize } from '../types';
import { getAvailableDpiOptions, getAvailablePageSizes, DEFAULT_DPI } from '../utils/pdfUtils';

interface GridOptionsProps {
  selectedSize: PDFSize;
  onSizeChange: (size: PDFSize) => void;
  dpi: number;
  onDpiChange: (dpi: number) => void;
  enableCustomLayout: boolean;
  onEnableCustomLayoutChange: (enabled: boolean) => void;
  sizeUnit: 'in' | 'mm';
  onSizeUnitChange: (unit: 'in' | 'mm') => void;
  customWidth: string;
  onCustomWidthChange: (width: string) => void;
  customHeight: string;
  onCustomHeightChange: (height: string) => void;
  qrCodesPerPage: number;
  onQrCodesPerPageChange: (count: number) => void;
  showQrCodeName: boolean;
  onShowQrCodeNameChange: (show: boolean) => void;
  addCutLineGuides: boolean;
  onAddCutLineGuidesChange: (add: boolean) => void;
  qrCodeData: any[];
}

const GridOptions: React.FC<GridOptionsProps> = ({
  selectedSize,
  onSizeChange,
  dpi,
  onDpiChange,
  qrCodesPerPage,
  onQrCodesPerPageChange,
  showQrCodeName,
  onShowQrCodeNameChange,
  addCutLineGuides,
  onAddCutLineGuidesChange,
  qrCodeData
}) => {
  const availablePageSizes = getAvailablePageSizes();
  const availableDpiOptions = getAvailableDpiOptions('grid');
  const qrCodesPerPageOptions = [2, 4, 6, 8, 12, 15, 20, 24, 30];

  const showWarning = (selectedSize === 'A4' || selectedSize === 'A3') && 
                     qrCodeData.some(qr => qr.logoDataUrl);

  return (
    <div>
      {showWarning && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative mb-4\" role="alert">
          <strong className="font-bold">Tip!</strong>
          <span className="block sm:inline">Enable cut lines to help separate QR codes on the PDF.</span>
        </div>
      )}

      <h3 className="text-lg font-semibold mb-2 text-gray-800">Options</h3>
      
      <div className="mb-3">
        <label htmlFor="grid-size" className="block text-sm font-medium text-gray-700 mb-1">
          Page Size:
        </label>
        <select
          id="grid-size"
          className="w-full border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm py-2 px-3"
          value={selectedSize}
          onChange={(e) => onSizeChange(e.target.value as PDFSize)}
        >
          {availablePageSizes.map((size) => (
            <option key={size} value={size}>{size}</option>
          ))}
        </select>
      </div>

      <div className="mb-3">
        <label htmlFor="grid-dpi" className="block text-sm font-medium text-gray-700 mb-1">
          DPI
        </label>
        <select
          id="grid-dpi"
          className="w-full border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm py-2 px-3"
          value={dpi}
          onChange={(e) => onDpiChange(parseInt(e.target.value, 10))}
        >
          {availableDpiOptions.map((dpiOption) => (
            <option key={dpiOption} value={dpiOption}>
              {dpiOption} DPI {dpiOption === DEFAULT_DPI ? '(Recommended)' : ''}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-3">
        <label htmlFor="qr-codes-per-page" className="block text-sm font-medium text-gray-700 mb-1">
          QR Codes Per Page:
        </label>
        <select
          id="qr-codes-per-page"
          className="w-full border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm py-2 px-3"
          value={qrCodesPerPage}
          onChange={(e) => onQrCodesPerPageChange(parseInt(e.target.value, 10))}
        >
          {qrCodesPerPageOptions.map((num) => (
            <option key={num} value={num}>{num}</option>
          ))}
        </select>
      </div>

      <div className="mb-3">
        <label className="inline-flex items-center">
          <input
            type="checkbox"
            className="form-checkbox h-4 w-4 text-green-500 rounded transition duration-150 ease-in-out"
            checked={showQrCodeName}
            onChange={(e) => onShowQrCodeNameChange(e.target.checked)}
          />
          <span className="ml-2 text-gray-700 text-sm">Show QR Code Name</span>
        </label>
      </div>

      <div className="mb-3">
        <label className="inline-flex items-center">
          <input
            type="checkbox"
            className="form-checkbox h-4 w-4 text-green-500 rounded transition duration-150 ease-in-out"
            checked={addCutLineGuides}
            onChange={(e) => onAddCutLineGuidesChange(e.target.checked)}
          />
          <span className="ml-2 text-gray-700 text-sm">Add Cut Line Guides</span>
        </label>
      </div>

      <p className="text-sm text-gray-500">
        Optimized for bulk sharing or printing, grid layout arranges multiple QR codes per page efficiently.
      </p>
    </div>
  );
};

export default GridOptions;
