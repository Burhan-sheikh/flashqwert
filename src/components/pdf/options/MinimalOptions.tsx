import React from 'react';
import { PDFSize } from '../types';
import { getAvailableDpiOptions, getAvailablePageSizes, DEFAULT_DPI } from '../utils/pdfUtils';
import CustomLayoutOptions from './CustomLayoutOptions';

interface MinimalOptionsProps {
  pdfSizeMinimal: PDFSize;
  onPdfSizeMinimalChange: (size: PDFSize) => void;
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
  showQrCodeName: boolean;
  onShowQrCodeNameChange: (show: boolean) => void;
}

const MinimalOptions: React.FC<MinimalOptionsProps> = ({
  pdfSizeMinimal,
  onPdfSizeMinimalChange,
  dpi,
  onDpiChange,
  enableCustomLayout,
  onEnableCustomLayoutChange,
  sizeUnit,
  onSizeUnitChange,
  customWidth,
  onCustomWidthChange,
  customHeight,
  onCustomHeightChange,
  showQrCodeName,
  onShowQrCodeNameChange
}) => {
  const availablePageSizes = getAvailablePageSizes();
  const availableDpiOptions = getAvailableDpiOptions('minimal');

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2 text-gray-800">Options</h3>
      
      <div className="mb-3">
        <label htmlFor="minimal-size" className="block text-sm font-medium text-gray-700 mb-1">
          Page Size:
        </label>
        <select
          id="minimal-size"
          className="w-full border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm py-2 px-3"
          value={pdfSizeMinimal}
          onChange={(e) => onPdfSizeMinimalChange(e.target.value as PDFSize)}
        >
          {availablePageSizes.map((size) => (
            <option key={size} value={size}>{size}</option>
          ))}
        </select>
      </div>

      <div className="mb-3">
        <label htmlFor="minimal-dpi" className="block text-sm font-medium text-gray-700 mb-1">
          DPI
        </label>
        <select
          id="minimal-dpi"
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

      <CustomLayoutOptions
        enableCustomLayout={enableCustomLayout}
        onEnableCustomLayoutChange={onEnableCustomLayoutChange}
        sizeUnit={sizeUnit}
        onSizeUnitChange={onSizeUnitChange}
        customWidth={customWidth}
        onCustomWidthChange={onCustomWidthChange}
        customHeight={customHeight}
        onCustomHeightChange={onCustomHeightChange}
        dpi={dpi}
        onDpiChange={onDpiChange}
      />

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

      <p className="text-sm text-gray-500">
        Clean design with optional name and custom dimensions.
      </p>
    </div>
  );
};

export default MinimalOptions;
