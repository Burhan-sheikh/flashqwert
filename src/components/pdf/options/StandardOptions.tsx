import React from 'react';
import { PDFSize } from '../types';
import { getAvailableDpiOptions, getAvailablePageSizes, DEFAULT_DPI } from '../utils/pdfUtils';

interface StandardOptionsProps {
  selectedSize: PDFSize;
  onSizeChange: (size: PDFSize) => void;
  dpi: number;
  onDpiChange: (dpi: number) => void;
  autoLayoutOptimization: boolean;
  onAutoLayoutChange: (enabled: boolean) => void;
}

const StandardOptions: React.FC<StandardOptionsProps> = ({
  selectedSize,
  onSizeChange,
  dpi,
  onDpiChange,
  autoLayoutOptimization,
  onAutoLayoutChange
}) => {
  const availablePageSizes = getAvailablePageSizes();
  const availableDpiOptions = getAvailableDpiOptions('standard');

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2 text-gray-800">Options</h3>
      
      <div className="mb-3">
        <label htmlFor="standard-size" className="block text-sm font-medium text-gray-700 mb-1">
          Page Size:
        </label>
        <select
          id="standard-size"
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
        <label htmlFor="standard-dpi" className="block text-sm font-medium text-gray-700 mb-1">
          DPI
        </label>
        <select
          id="standard-dpi"
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
        <label className="inline-flex items-center">
          <input
            type="checkbox"
            className="form-checkbox h-4 w-4 text-green-500 rounded transition duration-150 ease-in-out"
            checked={autoLayoutOptimization}
            onChange={(e) => onAutoLayoutChange(e.target.checked)}
          />
          <span className="ml-2 text-gray-700 text-sm">Auto Layout Optimization</span>
        </label>
      </div>

      <p className="text-sm text-gray-500">
        Optimizes one QR code per page with all details, perfect for archiving.
      </p>
    </div>
  );
};

export default StandardOptions;
