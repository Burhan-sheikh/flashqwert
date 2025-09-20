export type ExportStyle = 'standard' | 'minimal' | 'grid';
export type PDFSize = 'A0' | 'A1' | 'A2' | 'A3' | 'A4';
export type SizeUnit = 'in' | 'mm';

export interface PDFGenerationOptions {
  selectedExportStyle: ExportStyle;
  selectedSize: PDFSize;
  pdfSizeMinimal: PDFSize;
  showQrCodeName: boolean;
  customWidth: string;
  customHeight: string;
  qrCodesPerPage: number;
  addCutLineGuides: boolean;
  enableCustomLayout: boolean;
  sizeUnit: SizeUnit;
  dpi: number;
}

export interface CollectionPDFDownloaderProps {
  collectionName: string;
  qrCodeData: any[];
}