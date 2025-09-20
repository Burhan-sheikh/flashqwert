// worker.js
import jsPDF from 'jspdf';
import QRCode from 'qrcodejs';

async function generateQRCodeCanvas(qrCode, width, height) {
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Generate QR code
    try {
        QRCode.toCanvas(canvas, qrCode.url, {
            width: width,
            height: height,
            margin: 1,
            color: {
                dark: qrCode.color || '#000000',
                light: qrCode.backgroundColor || '#FFFFFF'
            },
            errorCorrectionLevel: qrCode.errorCorrectionLevel || 'M'
        });
    } catch (error) {
        console.error("QR Code generation error:", error);
        throw new Error("Failed to generate QR Code.");
    }

    // Add logo if present
    if (qrCode.logoDataUrl) {
        const logoImg = new Image();
        logoImg.crossOrigin = 'anonymous';

        await new Promise((resolve, reject) => {
            logoImg.onload = () => {
                const logoSize = Math.min(width, height) * 0.2;
                const logoX = (width - logoSize) / 2;
                const logoY = (height - logoSize) / 2;

                // Draw white background for logo
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(logoX - 5, logoY - 5, logoSize + 10, logoSize + 10);

                // Draw logo
                ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);
                resolve();
            };
            logoImg.onerror = reject;
            logoImg.src = qrCode.logoDataUrl;
        });
    }
    return canvas;
}

self.addEventListener('message', async (event) => {
    const {
        collectionName,
        qrCodeData,
        pdfSize,
        dpi,
        exportStyle
    } = event.data;

    try {
        let pdf;
        const pdfWidth = 2480;
        const pdfHeight = 3508;

        // Function to generate QR code pages
        async function generateQRCodePages(pdfInstance, qrCodeData, pdfWidth, pdfHeight, dpi) {
            for (let i = 0; i < qrCodeData.length; i++) {
                const qrCode = qrCodeData[i];
                if (!qrCode || !qrCode.url) continue;

                pdfInstance.addPage();
                const qrCodeCanvasSide = Math.min(1200 * (dpi / 300), 2400); // Scale canvas size with DPI
                const qrCodeCanvas = await generateQRCodeCanvas(qrCode, qrCodeCanvasSide, qrCodeCanvasSide);
                const imgData = qrCodeCanvas.toDataURL('image/png');
                const qrCodeSize = Math.min(pdfWidth, pdfHeight) * 0.7;
                const qrCodeX = (pdfWidth - qrCodeSize) / 2;
                const qrCodeY = (pdfHeight - qrCodeSize) / 2;
                pdfInstance.addImage(imgData, 'PNG', qrCodeX, qrCodeY, qrCodeSize, qrCodeSize, undefined, 'FAST');

                // Report progress
                self.postMessage({ progress: (i + 1) / qrCodeData.length });
            }
        }

        // Generate PDF based on export style
        if (exportStyle === 'standard') {
            pdf = new jsPDF({
                orientation: pdfWidth > pdfHeight ? 'landscape' : 'portrait',
                unit: 'px',
                format: [pdfWidth, pdfHeight],
                compress: true
            });

            await generateQRCodePages(pdf, qrCodeData, pdfWidth, pdfHeight, dpi);
        } else if (exportStyle === 'minimal') {
            pdf = new jsPDF({
                orientation: pdfWidth > pdfHeight ? 'landscape' : 'portrait',
                unit: 'px',
                format: [pdfWidth, pdfHeight],
                compress: true
            });

            await generateQRCodePages(pdf, qrCodeData, pdfWidth, pdfHeight, dpi);
        } else if (exportStyle === 'grid') {
            pdf = new jsPDF({
                orientation: pdfWidth > pdfHeight ? 'landscape' : 'portrait',
                unit: 'px',
                format: [pdfWidth, pdfHeight],
                compress: true
            });

            await generateQRCodePages(pdf, qrCodeData, pdfWidth, pdfHeight, dpi);
        }

        // Convert the PDF to a Blob
        const pdfBlob = pdf.output('blob');

        // Post the PDF Blob back to the main thread
        self.postMessage({ status: 'success', pdfBlob: pdfBlob });
    } catch (error) {
        self.postMessage({ status: 'error', error: error.message });
    }
});