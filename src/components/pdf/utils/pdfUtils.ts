import { PDFSize } from '../types';

// DPI to pixel size mapping for different page sizes
const DPI_SIZE_MAP = {
  72: {
    'A4': [595, 842],
    'A5': [420, 595],
    'A6': [298, 420]
  },
  150: {
    'A4': [1240, 1754],
    'A5': [877, 1240],
    'A6': [620, 877]
  },
  300: {
    'A4': [2480, 3508],
    'A5': [1754, 2480],
    'A6': [1240, 1754]
  }
} as const;

export const getSizeInPixels = (size: PDFSize, dpi: number = 300): number[] | null => {
  const dpiMap = DPI_SIZE_MAP[dpi as keyof typeof DPI_SIZE_MAP];
  if (!dpiMap) return null;
  
  return dpiMap[size] || null;
};

export const convertToPixels = (
  value: number,
  unit: 'in' | 'mm',
  dpi: number
): number => {
  if (unit === 'mm') {
    return (value / 25.4) * dpi;
  }
  return value * dpi;
};

export const validateCustomDimensions = (
  width: string,
  height: string,
  dpi: number
): { isValid: boolean; error?: string } => {
  const widthValue = parseFloat(width);
  const heightValue = parseFloat(height);

  if (isNaN(widthValue) || isNaN(heightValue) || widthValue <= 0 || heightValue <= 0) {
    return { isValid: false, error: "Invalid custom dimensions. Please enter valid positive numbers." };
  }

  if (dpi <= 0) {
    return { isValid: false, error: "Invalid DPI. Please enter a valid positive number." };
  }

  return { isValid: true };
};

// Available DPI options
export const DPI_OPTIONS = [72, 150, 300] as const;

// Available page size options - restricted to A4, A5, and A6 for collections
export const PAGE_SIZE_OPTIONS: PDFSize[] = ['A4', 'A5', 'A6'];

// Helper function to get available page sizes (for collections, always A4, A5, and A6)
export const getAvailablePageSizes = (): PDFSize[] => {
  return ['A4', 'A5', 'A6'];
};

// Helper function to get available DPI options based on layout type
export const getAvailableDpiOptions = (layoutType: 'standard' | 'minimal' | 'grid'): readonly number[] => {
  return DPI_OPTIONS; //  options for standard and minimal and grid
};

// Default values
export const DEFAULT_DPI = 150;
export const DEFAULT_PAGE_SIZE: PDFSize = 'A4';
