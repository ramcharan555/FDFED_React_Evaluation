import * as QRCode from 'qrcode';

/**
 * QR Code Generation Service
 * Generates real QR codes for registration verification
 */
export class QrCodeService {
  /**
   * Generate QR code as data URL
   * @param data - Data to encode in QR code (e.g., verification ID)
   * @returns Base64 data URL for embedding in HTML/images
   */
  static async generateQRCode(data: string): Promise<string> {
    try {
      const qrCode = await QRCode.toDataURL(data, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
      return qrCode;
    } catch (error) {
      console.error('QR Code generation error:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  /**
   * Generate QR code as SVG string
   * @param data - Data to encode in QR code
   * @returns SVG string
   */
  static async generateQRCodeSVG(data: string): Promise<string> {
  try {
    const qrCode = await QRCode.toString(data, {
      type: 'svg', // ✅ FIXED
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });
    return qrCode;
  } catch (error) {
    console.error('QR Code SVG generation error:', error);
    throw new Error('Failed to generate QR code SVG');
  }
}

  /**
   * Generate verification ID
   * Used as fallback when QR code cannot be scanned
   * @returns Unique verification ID (12 characters)
   */
  static generateVerificationId(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 12; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}
