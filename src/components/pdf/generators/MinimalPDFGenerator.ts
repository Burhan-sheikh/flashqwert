import jsPDF from 'jspdf';
import { PDFSize, SizeUnit } from '../types';
import { getSizeInPixels, convertToPixels, validateCustomDimensions } from '../utils/pdfUtils';
import { generateQRCodeCanvas } from '../utils/qrCodeGenerator';

export class MinimalPDFGenerator {
    constructor(
        private qrCodeData: any[],
        private showQrCodeName: boolean,
        private enableCustomLayout: boolean,
        private customWidth: string,
        private customHeight: string,
        private sizeUnit: SizeUnit,
        private dpi: number
    ) { }

    async generate(pdfSize: PDFSize): Promise<jsPDF | null> {
        return this.generateWithProgress(pdfSize);
    }

    async generateWithProgress(
        pdfSize: PDFSize,
        onProgress?: (step: number) => void,
        startStep: number = 0
    ): Promise<jsPDF | null> {
        console.time("MinimalPDFGenerator.generate");
        console.time("MinimalPDFGenerator.generate.calculateDimensions");
        const { pdfWidth, pdfHeight } = this.calculateDimensions(pdfSize);
        console.timeEnd("MinimalPDFGenerator.generate.calculateDimensions");

        const pdf = new jsPDF({
            orientation: pdfWidth > pdfHeight ? 'landscape' : 'portrait',
            unit: 'px',
            format: [pdfWidth, pdfHeight],
            compress: true
        });

        console.time("MinimalPDFGenerator.generate.qrCodeLoop");
        for (let i = 0; i < this.qrCodeData.length; i++) {
            const qrCode = this.qrCodeData[i];
            if (!qrCode || !qrCode.url) continue;

            if (i > 0) pdf.addPage();
            await this.generateQRCodePage(pdf, qrCode, pdfWidth, pdfHeight, pdfSize);
            
            // Allow UI to update between pages
            await new Promise(resolve => setTimeout(resolve, 10));
            onProgress?.(startStep + 1 + i);
        }
        console.timeEnd("MinimalPDFGenerator.generate.qrCodeLoop");

        console.timeEnd("MinimalPDFGenerator.generate");
        return pdf;
    }

    private calculateDimensions(pdfSize: PDFSize): { pdfWidth: number; pdfHeight: number } {
        console.time("MinimalPDFGenerator.calculateDimensions");
        if (this.enableCustomLayout && this.customWidth && this.customHeight) {
            const validation = validateCustomDimensions(this.customWidth, this.customHeight, this.dpi);
            if (!validation.isValid) {
                throw new Error(validation.error);
            }

            const widthValue = parseFloat(this.customWidth);
            const heightValue = parseFloat(this.customHeight);

            console.timeEnd("MinimalPDFGenerator.calculateDimensions");
            return {
                pdfWidth: convertToPixels(widthValue, this.sizeUnit, this.dpi),
                pdfHeight: convertToPixels(heightValue, this.sizeUnit, this.dpi)
            };
        }

        const sizeInPixels = getSizeInPixels(pdfSize, this.dpi);
        if (!sizeInPixels) {
            console.timeEnd("MinimalPDFGenerator.calculateDimensions");
            return { pdfWidth: 2480, pdfHeight: 3508 }; // Default A4 at 300 DPI
        }

        console.timeEnd("MinimalPDFGenerator.calculateDimensions");
        return { pdfWidth: sizeInPixels[0], pdfHeight: sizeInPixels[1] };
    }

    private async generateQRCodePage(
        pdf: jsPDF,
        qrCode: any,
        pdfWidth: number,
        pdfHeight: number,
        pdfSize: PDFSize
    ): Promise<void> {
        console.time("MinimalPDFGenerator.generateQRCodePage");
        pdf.setFillColor('#FFFFFF');
        pdf.rect(0, 0, pdfWidth, pdfHeight, 'F');

        console.time("MinimalPDFGenerator.generateQRCodePage.generateQRCodeCanvas");
        const qrCodeCanvasSide = Math.min(1200 * (this.dpi / 300), 2400); // Scale canvas size with DPI
        const qrCodeCanvas = await generateQRCodeCanvas(qrCode, qrCodeCanvasSide, qrCodeCanvasSide);
        console.timeEnd("MinimalPDFGenerator.generateQRCodePage.generateQRCodeCanvas");

        console.time("MinimalPDFGenerator.generateQRCodePage.toDataURL");
        const imgData = qrCodeCanvas.toDataURL('image/png');
        console.timeEnd("MinimalPDFGenerator.generateQRCodePage.toDataURL");

        console.time("MinimalPDFGenerator.generateQRCodePage.addImage");
        const qrCodeSize = Math.min(pdfWidth, pdfHeight) * 0.7;
        const qrCodeX = (pdfWidth - qrCodeSize) / 2;
        const qrCodeY = (pdfHeight - qrCodeSize) / 2;
        pdf.addImage(imgData, 'PNG', qrCodeX, qrCodeY, qrCodeSize, qrCodeSize, undefined, 'FAST');
        console.timeEnd("MinimalPDFGenerator.generateQRCodePage.addImage");

        if (this.showQrCodeName) {
            this.addQRCodeName(pdf, qrCode, pdfWidth, qrCodeY, qrCodeSize, pdfSize);
        }
        console.timeEnd("MinimalPDFGenerator.generateQRCodePage");
    }

    private addQRCodeName(
        pdf: jsPDF,
        qrCode: any,
        pdfWidth: number,
        qrCodeY: number,
        qrCodeSize: number,
        pdfSize: PDFSize
    ): void {
        console.time("MinimalPDFGenerator.addQRCodeName");
        // Scale font sizes based on DPI and page size
        const scaleFactor = (this.dpi / 300) * (Math.min(pdfWidth, 3508) / 2480);

        const nameFontSize = Math.max(8, 18 * scaleFactor);
        const nameMarginTop = Math.max(15, 30 * scaleFactor);

        pdf.setFontSize(nameFontSize);
        pdf.setTextColor('#333333');
        const nameWidth = pdf.getTextWidth(qrCode.name);
        const nameX = (pdfWidth - nameWidth) / 2;
        const nameY = qrCodeY + qrCodeSize + nameMarginTop;

        pdf.text(qrCode.name, nameX, nameY);
        console.timeEnd("MinimalPDFGenerator.addQRCodeName");
    }
}
