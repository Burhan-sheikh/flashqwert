import React from 'react';
import { SizeUnit } from '../types';

interface CustomLayoutOptionsProps {
  enableCustomLayout: boolean;
  onEnableCustomLayoutChange: (enabled: boolean) => void;
  sizeUnit: SizeUnit;
  onSizeUnitChange: (unit: SizeUnit) => void;
  customWidth: string;
  onCustomWidthChange: (width: string) => void;
  customHeight: string;
  onCustomHeightChange: (height: string) => void;
  dpi: number;
  onDpiChange: (dpi: number) => void;
}

const CustomLayoutOptions: React.FC<CustomLayoutOptionsProps> = ({
  enableCustomLayout,
  onEnableCustomLayoutChange,
  sizeUnit,
  onSizeUnitChange,
  customWidth,
  onCustomWidthChange,
  customHeight,
  onCustomHeightChange,
  dpi,
  onDpiChange
}) => {
  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*\.?\d*$/.test(value)) {
      onCustomWidthChange(value);
    }
  };

  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*\.?\d*$/.test(value)) {
      onCustomHeightChange(value);
    }
  };

  return (
    <div className="mb-3">
      <label className="inline-flex items-center">
        <input
          type="checkbox"
          className="form-checkbox h-4 w-4 text-green-500 rounded transition duration-150 ease-in-out"
          checked={enableCustomLayout}
          onChange={(e) => onEnableCustomLayoutChange(e.target.checked)}
        />
        <span className="ml-2 text-gray-700 text-sm">Enable Custom Layout</span>
      </label>

      {enableCustomLayout && (
        <div className="mt-2">
          <div className="flex items-center space-x-2 mb-2">
            <label htmlFor="size-unit" className="block text-sm font-medium text-gray-700">
              Unit:
            </label>
            <select
              id="size-unit"
              className="border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm py-2 px-3"
              value={sizeUnit}
              onChange={(e) => onSizeUnitChange(e.target.value as SizeUnit)}
            >
              <option value="in">in</option>
              <option value="mm">mm</option>
            </select>
          </div>

          <label htmlFor="custom-width" className="block text-sm font-medium text-gray-700 mb-1">
            Width ({sizeUnit}):
          </label>
          <input
            type="number"
            id="custom-width"
            className="w-full border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm py-2 px-3"
            value={customWidth}
            onChange={handleWidthChange}
          />

          <label htmlFor="custom-height" className="block text-sm font-medium text-gray-700 mt-2 mb-1">
            Height ({sizeUnit}):
          </label>
          <input
            type="number"
            id="custom-height"
            className="w-full border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm py-2 px-3"
            value={customHeight}
            onChange={handleHeightChange}
          />

          
        </div>
      )}
    </div>
  );
};

export default CustomLayoutOptions;
