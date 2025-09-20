import QRCode from 'qrcode';

export const generateQRCodeCanvas = async (qrCodeData: any, width: number, height: number): Promise<HTMLCanvasElement> => {
  const side = Math.min(width, height);
  const canvas = document.createElement('canvas');
  canvas.width = side;
  canvas.height = side;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error("Could not create image. Please try again.");
  }

  // Set container background
  ctx.fillStyle = qrCodeData.containerBackgroundColor || 'transparent';
  ctx.fillRect(0, 0, side, side);

  const padding = 10;
  const qrCodeSize = side - 2 * padding;

  const qrCanvas = document.createElement('canvas');
  qrCanvas.width = qrCodeSize;
  qrCanvas.height = qrCodeSize;

  try {
    await QRCode.toCanvas(qrCanvas, qrCodeData.url, {
      errorCorrectionLevel: qrCodeData.errorCorrectionLevel || 'L',
      width: qrCodeSize,
      height: qrCodeSize,
      margin: 0,
      color: {
        dark: qrCodeData.color || '#000000',
        light: qrCodeData.backgroundColor || 'transparent'
      }
    });
  } catch (err) {
    console.error("QR Code generation error:", err);
    throw new Error("Failed to generate QR Code.");
  }

  const x = padding;
  const y = padding;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(qrCanvas, x, y, qrCodeSize, qrCodeSize);

  // Add logo if present
  if (qrCodeData.logoDataUrl) {
    const logoSize = qrCodeSize * 0.2;
    const logoX = x + (qrCodeSize - logoSize) / 2;
    const logoY = y + (qrCodeSize - logoSize) / 2;

    const logoPadding = logoSize * 0.1;
    const circleRadius = logoSize / 2;

    // Draw white background circle
    ctx.beginPath();
    ctx.arc(logoX + circleRadius, logoY + circleRadius, circleRadius + logoPadding, 0, 2 * Math.PI);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();

    // Clip and draw logo
    ctx.save();
    ctx.beginPath();
    ctx.arc(logoX + circleRadius, logoY + circleRadius, circleRadius, 0, 2 * Math.PI);
    ctx.closePath();
    ctx.clip();

    const logo = new Image();
    logo.crossOrigin = "anonymous";

    await new Promise<void>((resolve, reject) => {
      logo.onload = () => {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);
        ctx.restore();
        resolve();
      };
      logo.onerror = (err) => {
        console.error("Logo load error:", err);
        reject(err);
      };
      logo.src = qrCodeData.logoDataUrl;
    });
  }

  return canvas;
};
