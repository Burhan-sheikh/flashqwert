import jsPDF from 'jspdf';
import { PDFSize, SizeUnit } from '../types';
import { getSizeInPixels, convertToPixels, validateCustomDimensions } from '../utils/pdfUtils';
import { generateQRCodeCanvas } from '../utils/qrCodeGenerator';

export class GridPDFGenerator {
    constructor(
        private qrCodeData: any[],
        private qrCodesPerPage: number,
        private showQrCodeName: boolean,
        private addCutLineGuides: boolean,
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
        console.time("GridPDFGenerator.generate");
        console.time("GridPDFGenerator.generate.calculateDimensions");
        const { pdfWidth, pdfHeight } = this.calculateDimensions(pdfSize);
        console.timeEnd("GridPDFGenerator.generate.calculateDimensions");

        const pdf = new jsPDF({
            orientation: pdfWidth > pdfHeight ? 'landscape' : 'portrait',
            unit: 'px',
            format: [pdfWidth, pdfHeight],
            compress: true
        });

        console.time("GridPDFGenerator.generate.calculateGrid");
        const { cols, rows } = this.calculateGrid();
        console.timeEnd("GridPDFGenerator.generate.calculateGrid");
        console.time("GridPDFGenerator.generate.calculateLayout");
        const layout = this.calculateLayout(pdfWidth, pdfHeight, cols, rows);
        console.timeEnd("GridPDFGenerator.generate.calculateLayout");

        let qrIndex = 0;
        const totalPages = Math.ceil(this.qrCodeData.length / this.qrCodesPerPage);

        console.time("GridPDFGenerator.generate.pageLoop");
        for (let page = 0; page < totalPages; page++) {
            if (page > 0) pdf.addPage();

            pdf.setFillColor('#FFFFFF');
            pdf.rect(0, 0, pdfWidth, pdfHeight, 'F');

            qrIndex = await this.generateGridPage(pdf, page, qrIndex, cols, rows, layout, pdfSize);
            
            // Allow UI to update between pages
            await new Promise(resolve => setTimeout(resolve, 10));
            onProgress?.(startStep + 1 + page);
        }
        console.timeEnd("GridPDFGenerator.generate.pageLoop");

        console.timeEnd("GridPDFGenerator.generate");
        return pdf;
    }

    private calculateDimensions(pdfSize: PDFSize): { pdfWidth: number; pdfHeight: number } {
        console.time("GridPDFGenerator.calculateDimensions");
        if (this.enableCustomLayout && this.customWidth && this.customHeight) {
            const validation = validateCustomDimensions(this.customWidth, this.customHeight, this.dpi);
            if (!validation.isValid) {
                throw new Error(validation.error);
            }

            const widthValue = parseFloat(this.customWidth);
            const heightValue = parseFloat(this.customHeight);

            console.timeEnd("GridPDFGenerator.calculateDimensions");
            return {
                pdfWidth: convertToPixels(widthValue, this.sizeUnit, this.dpi),
                pdfHeight: convertToPixels(heightValue, this.sizeUnit, this.dpi)
            };
        }

        const sizeInPixels = getSizeInPixels(pdfSize, this.dpi);
        if (!sizeInPixels) {
            console.timeEnd("GridPDFGenerator.calculateDimensions");
            return { pdfWidth: 2480, pdfHeight: 3508 }; // Default A4 at 300 DPI
        }

        console.timeEnd("GridPDFGenerator.calculateDimensions");
        return { pdfWidth: sizeInPixels[0], pdfHeight: sizeInPixels[1] };
    }

    private calculateGrid(): { cols: number; rows: number } {
        console.time("GridPDFGenerator.calculateGrid");
        let cols = Math.floor(Math.sqrt(this.qrCodesPerPage));
        let rows = Math.ceil(this.qrCodesPerPage / cols);

        if (cols * rows < this.qrCodesPerPage) {
            cols++;
            if (cols * rows < this.qrCodesPerPage) {
                rows++;
            }
        }

        console.timeEnd("GridPDFGenerator.calculateGrid");
        return { cols, rows };
    }

    private calculateLayout(pdfWidth: number, pdfHeight: number, cols: number, rows: number) {
        console.time("GridPDFGenerator.calculateLayout");
        // Scale margins and spacing based on DPI
        const scaleFactor = this.dpi / 300;
        const marginX = 20 * scaleFactor;
        const marginTop = 20 * scaleFactor;
        const marginBottom = 40 * scaleFactor;
        const horizontalSpacing = 10 * scaleFactor;
        const verticalSpacing = 45 * scaleFactor;

        const availablePageWidth = pdfWidth - 2 * marginX;
        const availablePageHeight = pdfHeight - marginTop - marginBottom;

        const totalHorizontalSpacing = (cols - 1) * horizontalSpacing;
        const totalVerticalSpacing = (rows - 1) * verticalSpacing;

        const qrCodeWidth = (availablePageWidth - totalHorizontalSpacing) / cols;
        const qrCodeHeight = (availablePageHeight - totalVerticalSpacing) / rows;
        const qrCodeSize = Math.min(qrCodeWidth, qrCodeHeight);

        const gridWidth = cols * qrCodeSize + (cols - 1) * horizontalSpacing;
        const gridHeight = rows * qrCodeSize + (rows - 1) * verticalSpacing;
        const startX = (pdfWidth - gridWidth) / 2;
        const startY = marginTop + (availablePageHeight - gridHeight) / 2;

        console.timeEnd("GridPDFGenerator.calculateLayout");
        return {
            qrCodeSize,
            startX,
            startY,
            horizontalSpacing,
            verticalSpacing
        };
    }

    private async generateGridPage(
        pdf: jsPDF,
        page: number,
        startQrIndex: number,
        cols: number,
        rows: number,
        layout: any,
        pdfSize: PDFSize
    ): Promise<number> {
        console.time("GridPDFGenerator.generateGridPage");
        let qrIndex = startQrIndex;

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                if (qrIndex >= this.qrCodeData.length) {
                    console.timeEnd("GridPDFGenerator.generateGridPage");
                    return qrIndex;
                }

                const qrCode = this.qrCodeData[qrIndex];
                if (!qrCode || !qrCode.url) {
                    qrIndex++;
                    continue;
                }

                const x = layout.startX + col * (layout.qrCodeSize + layout.horizontalSpacing);
                const y = layout.startY + row * (layout.qrCodeSize + layout.verticalSpacing);

                await this.renderQRCodeInGrid(pdf, qrCode, x, y, layout.qrCodeSize, pdfSize);
                qrIndex++;
            }
        }

        console.timeEnd("GridPDFGenerator.generateGridPage");
        return qrIndex;
    }

    private async renderQRCodeInGrid(
        pdf: jsPDF,
        qrCode: any,
        x: number,
        y: number,
        qrCodeSize: number,
        pdfSize: PDFSize
    ): Promise<void> {
        console.time("GridPDFGenerator.renderQRCodeInGrid");
        console.time("GridPDFGenerator.renderQRCodeInGrid.generateQRCodeCanvas");
        const qrCodeCanvasSide = Math.min(1200 * (this.dpi / 300), 2400); // Scale canvas size with DPI
        const qrCodeCanvas = await generateQRCodeCanvas(qrCode, qrCodeCanvasSide, qrCodeCanvasSide);
        console.timeEnd("GridPDFGenerator.renderQRCodeInGrid.generateQRCodeCanvas");

        console.time("GridPDFGenerator.renderQRCodeInGrid.toDataURL");
        const imgData = qrCodeCanvas.toDataURL('image/png');
        console.timeEnd("GridPDFGenerator.renderQRCodeInGrid.toDataURL");

        console.time("GridPDFGenerator.renderQRCodeInGrid.addImage");
        pdf.addImage(imgData, 'PNG', x, y, qrCodeSize, qrCodeSize, undefined, 'FAST');
        console.timeEnd("GridPDFGenerator.renderQRCodeInGrid.addImage");

        if (this.showQrCodeName) {
            this.addQRCodeNameInGrid(pdf, qrCode, x, y, qrCodeSize, pdfSize);
        }

        if (this.addCutLineGuides) {
            this.addCutLines(pdf, x, y, qrCodeSize);
        }
        console.timeEnd("GridPDFGenerator.renderQRCodeInGrid");
    }

    private addQRCodeNameInGrid(
        pdf: jsPDF,
        qrCode: any,
        x: number,
        y: number,
        qrCodeSize: number,
        pdfSize: PDFSize
    ): void {
        console.time("GridPDFGenerator.addQRCodeNameInGrid");
        // Scale font sizes based on DPI
        const scaleFactor = this.dpi / 300;
        const nameFontSize = Math.max(8, 20 * scaleFactor);
        const nameMarginTop = Math.max(9, 18 * scaleFactor);

        pdf.setFontSize(nameFontSize);
        pdf.setTextColor('#333333');
        const nameWidth = pdf.getTextWidth(qrCode.name);
        const nameX = x + (qrCodeSize - nameWidth) / 2;
        const nameY = y + qrCodeSize + nameMarginTop;

        pdf.text(qrCode.name, nameX, nameY);
        console.timeEnd("GridPDFGenerator.addQRCodeNameInGrid");
    }

    private addCutLines(pdf: jsPDF, x: number, y: number, qrCodeSize: number): void {
        console.time("GridPDFGenerator.addCutLines");
        const lineWidth = Math.max(0.25, 0.5 * (this.dpi / 300));

        pdf.setDrawColor('#ccc');
        pdf.setLineWidth(lineWidth);
        pdf.line(x, y, x + qrCodeSize, y);
        pdf.line(x, y, x, y + qrCodeSize);
        pdf.line(x + qrCodeSize, y, x + qrCodeSize, y + qrCodeSize);
        pdf.line(x, y + qrCodeSize, x + qrCodeSize, y + qrCodeSize);
        console.timeEnd("GridPDFGenerator.addCutLines");
    }
}
