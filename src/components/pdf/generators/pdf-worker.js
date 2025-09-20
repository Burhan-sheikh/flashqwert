importScripts('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
importScripts('https://cdn.jsdelivr.net/npm/qrcode@1.5.3/qrcode.min.js');

self.onmessage = async (event) => {
  const { collectionName, qrCodeData, selectedSize, dpi } = event.data;
  try {
    const pdf = await generatePdf(collectionName, qrCodeData, selectedSize, dpi);
    self.postMessage({ status: 'success', pdf });
  } catch (error) {
    self.postMessage({ status: 'error', error: error.message });
  }
};

async function generatePdf(collectionName, qrCodeData, selectedSize, dpi) {
  // (This is where you would move the logic from StandardPDFGenerator)
  const generator = new StandardPDFGenerator(collectionName, qrCodeData);
  return await generator.generate(selectedSize, dpi);
}

// Mock class since it will be used in the worker
class StandardPDFGenerator {
    constructor(
        private collectionName: string,
        private qrCodeData: any[]
    ) { }

    async generate(pdfSize: any, dpi: number = 300): Promise<any | null> {
        console.time("StandardPDFGenerator.generate");
        console.time("StandardPDFGenerator.generate.calculateDimensions");
        const { pdfWidth, pdfHeight } = this.calculateDimensions(pdfSize, dpi);
        console.timeEnd("StandardPDFGenerator.generate.calculateDimensions");

        // @ts-ignore
        const pdf = new jspdf.jsPDF({
            orientation: pdfWidth > pdfHeight ? 'landscape' : 'portrait',
            unit: 'px',
            format: [pdfWidth, pdfHeight],
            compress: true
        });

        console.time("StandardPDFGenerator.generate.addCoverPage");
        // Add the cover page
        this.addCoverPage(pdf, pdfWidth, pdfHeight);
        console.timeEnd("StandardPDFGenerator.generate.addCoverPage");

        console.time("StandardPDFGenerator.generate.qrCodeLoop");
        // Add QR code pages
        for (let i = 0; i < this.qrCodeData.length; i++) {
            const qrCode = this.qrCodeData[i];
            if (!qrCode || !qrCode.url) continue;

            pdf.addPage();
            await this.generateQRCodePage(pdf, qrCode, pdfWidth, pdfHeight, pdfSize, dpi);
        }
        console.timeEnd("StandardPDFGenerator.generate.qrCodeLoop");

        console.timeEnd("StandardPDFGenerator.generate");
        return pdf;
    }

    private calculateDimensions(pdfSize: any, dpi: number): { pdfWidth: number; pdfHeight: number } {
        console.time("StandardPDFGenerator.calculateDimensions");
        const sizeInPixels = getSizeInPixels(pdfSize, dpi);
        if (!sizeInPixels) {
            console.timeEnd("StandardPDFGenerator.calculateDimensions");
            return { pdfWidth: 2480, pdfHeight: 3508 }; // Default A4 at 300 DPI
        }

        console.timeEnd("StandardPDFGenerator.calculateDimensions");
        return { pdfWidth: sizeInPixels[0], pdfHeight: sizeInPixels[1] };
    }

    private addCoverPage(pdf: any, pdfWidth: number, pdfHeight: number): void {
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
        pdf: any,
        qrCode: any,
        pdfWidth: number,
        pdfHeight: number,
        pdfSize: any,
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
    },
    600: {
      'A4': [4960, 7015],
      'A5': [3508, 4961],
      'A6': [2480, 3508]
    }
  } as const;
  
const getSizeInPixels = (size: any, dpi: number = 300): number[] | null => {
    const dpiMap = DPI_SIZE_MAP[dpi as keyof typeof DPI_SIZE_MAP];
    if (!dpiMap) return null;
    
    return dpiMap[size] || null;
};

const generateQRCodeCanvas = async (qrCodeData: any, width: number, height: number): Promise<any> => {
    // @ts-ignore
    return QRCode.toCanvas(qrCodeData.url, {
        width: width,
        height: height,
        errorCorrectionLevel: qrCodeData.errorCorrectionLevel || 'L',
    });
};
