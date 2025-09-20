import jsPDF from 'jspdf';
import { PDFSize, SizeUnit } from '../types';
import { getSizeInPixels, convertToPixels, validateCustomDimensions } from '../utils/pdfUtils';
import { generateQRCodeCanvas } from '../utils/qrCodeGenerator';

export class StandardPDFGenerator {
    constructor(
        private collectionName: string,
        private qrCodeData: any[]
    ) { }

    async generate(pdfSize: PDFSize, dpi: number = 300): Promise<jsPDF | null> {
        return this.generateWithProgress(pdfSize, dpi);
    }

    async generateWithProgress(
        pdfSize: PDFSize, 
        dpi: number = 300, 
        onProgress?: (step: number) => void,
        startStep: number = 0
    ): Promise<jsPDF | null> {
        console.time("StandardPDFGenerator.generate");
        console.time("StandardPDFGenerator.generate.calculateDimensions");
        const { pdfWidth, pdfHeight } = this.calculateDimensions(pdfSize, dpi);
        console.timeEnd("StandardPDFGenerator.generate.calculateDimensions");

        const pdf = new jsPDF({
            orientation: pdfWidth > pdfHeight ? 'landscape' : 'portrait',
            unit: 'px',
            format: [pdfWidth, pdfHeight],
            compress: true
        });

        console.time("StandardPDFGenerator.generate.addCoverPage");
        // Add the cover page
        this.addCoverPage(pdf, pdfWidth, pdfHeight);
        onProgress?.(startStep + 1);
        console.timeEnd("StandardPDFGenerator.generate.addCoverPage");

        console.time("StandardPDFGenerator.generate.qrCodeLoop");
        // Add QR code pages
        for (let i = 0; i < this.qrCodeData.length; i++) {
            const qrCode = this.qrCodeData[i];
            if (!qrCode || !qrCode.url) continue;

            pdf.addPage();
            await this.generateQRCodePage(pdf, qrCode, pdfWidth, pdfHeight, pdfSize, dpi);
            
            // Allow UI to update between pages
            await new Promise(resolve => setTimeout(resolve, 10));
            onProgress?.(startStep + 2 + i);
        }
        console.timeEnd("StandardPDFGenerator.generate.qrCodeLoop");

        console.timeEnd("StandardPDFGenerator.generate");
        return pdf;
    }

    private calculateDimensions(pdfSize: PDFSize, dpi: number): { pdfWidth: number; pdfHeight: number } {
        console.time("StandardPDFGenerator.calculateDimensions");
        const sizeInPixels = getSizeInPixels(pdfSize, dpi);
        if (!sizeInPixels) {
            console.timeEnd("StandardPDFGenerator.calculateDimensions");
            return { pdfWidth: 2480, pdfHeight: 3508 }; // Default A4 at 300 DPI
        }

        console.timeEnd("StandardPDFGenerator.calculateDimensions");
        return { pdfWidth: sizeInPixels[0], pdfHeight: sizeInPixels[1] };
    }

    private addCoverPage(pdf: jsPDF, pdfWidth: number, pdfHeight: number): void {
        console.time("StandardPDFGenerator.addCoverPage");
        pdf.setFillColor('#FFFFFF');
        pdf.rect(0, 0, pdfWidth, pdfHeight, 'F');

        // Scale font sizes based on page size
        const scaleFactor = Math.min(pdfWidth, pdfHeight) / 2480; // Base scale on A4 width at 300 DPI

        const collectionNameFontSize = Math.max(24, 48 * scaleFactor);
        const downloadDateFontSize = Math.max(12, 24 * scaleFactor);
        const thankYouFontSize = Math.max(16, 32 * scaleFactor);

        const now = new Date();
        const downloadDate = now.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const thankYouMessage = "Thank you for using our service!";

        // Define text array
        const lines = [
            { text: this.collectionName, fontSize: collectionNameFontSize, color: '#333333' },
            { text: `Downloaded on: ${downloadDate}`, fontSize: downloadDateFontSize, color: '#777777' },
            { text: thankYouMessage, fontSize: thankYouFontSize, color: '#333333' }
        ];

        const lineSpacing = 20 * scaleFactor;

        // Compute total height of block
        const totalTextHeight = lines.reduce((sum, line) => sum + line.fontSize, 0) + lineSpacing * (lines.length - 1);

        // Compute starting Y to center the block vertically
        let currentY = (pdfHeight - totalTextHeight) / 2;

        // Draw each line
        lines.forEach(line => {
            pdf.setFontSize(line.fontSize);
            pdf.setTextColor(line.color);

            const textWidth = pdf.getTextWidth(line.text);
            const textX = (pdfWidth - textWidth) / 2;

            pdf.text(line.text, textX, currentY + line.fontSize * 0.75);

            // Move to next line
            currentY += line.fontSize + lineSpacing;
        });
        console.timeEnd("StandardPDFGenerator.addCoverPage");
    }

    private async generateQRCodePage(
        pdf: jsPDF,
        qrCode: any,
        pdfWidth: number,
        pdfHeight: number,
        pdfSize: PDFSize,
        dpi: number
    ): Promise<void> {
        console.time("StandardPDFGenerator.generateQRCodePage");
        pdf.setFillColor('#FFFFFF');
        pdf.rect(0, 0, pdfWidth, pdfHeight, 'F');

        // Responsive layout constants (consistent with single QR code download)
        const margin = Math.round(0.07 * Math.min(pdfWidth, pdfHeight)); // 7% margin
        const qrBlockSize = Math.round(0.63 * Math.min(pdfWidth, pdfHeight));  // 63% of shorter side
        const headingFontSize = Math.round(qrBlockSize * 0.12); // 12% of QR block
        const urlFontSize = Math.round(qrBlockSize * 0.07);     // 7% of QR block
        const helperFontSize = Math.max(9, Math.round(qrBlockSize * 0.055)); // minimal readable for A6

        // Content positions
        let y = margin + headingFontSize;

        // Heading
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(headingFontSize);
        pdf.setTextColor('#212121');
        const heading = qrCode.name;
        pdf.text(heading, pdfWidth / 2, y, { align: 'center' });

        console.time("StandardPDFGenerator.generateQRCodePage.generateQRCodeCanvas");
        // QR Code
        y += margin;
        const qrCodeCanvasSide = Math.min(1200 * (dpi / 300), 2400); // Scale canvas size with DPI
        const qrCodeCanvas = await generateQRCodeCanvas(qrCode, qrCodeCanvasSide, qrCodeCanvasSide);
        console.timeEnd("StandardPDFGenerator.generateQRCodePage.generateQRCodeCanvas");
        const qrX = (pdfWidth - qrBlockSize) / 2;

        console.time("StandardPDFGenerator.generateQRCodePage.toDataURL");
        const imgData = qrCodeCanvas.toDataURL('image/png');
        console.timeEnd("StandardPDFGenerator.generateQRCodePage.toDataURL");

        console.time("StandardPDFGenerator.generateQRCodePage.addImage");
        pdf.addImage(imgData, 'PNG', qrX, y, qrBlockSize, qrBlockSize);
        console.timeEnd("StandardPDFGenerator.generateQRCodePage.addImage");

        // "Scan me..." below QR
        y += qrBlockSize + margin / 2;
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(helperFontSize);
        pdf.setTextColor('#6b7280');
        pdf.text("Scan me with your smartphone camera.", pdfWidth / 2, y, { align: 'center' });

        // URL, further down
        y += helperFontSize + margin / 4;
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(urlFontSize);
        pdf.setTextColor('#009688');
        pdf.text(qrCode.url, pdfWidth / 2, y, { align: 'center' });

        // Created at (footer)
        y = pdfHeight - margin * 1.2;
        pdf.setFontSize(helperFontSize);
        pdf.setTextColor('#bdbdbd');
        const dateText = qrCode.createdAt
            ? `Created: ${new Date(qrCode.createdAt).toLocaleDateString()}`
            : '';
        if (dateText) pdf.text(dateText, margin + 5, y);

        // Copyright/brand (footer, right)
        const copyrightText = `© ${new Date().getFullYear()} FlashQR`;
        pdf.text(
            copyrightText,
            pdfWidth - margin - 5,
            y,
            { align: 'right' }
        );
        console.timeEnd("StandardPDFGenerator.generateQRCodePage");
    }
}
