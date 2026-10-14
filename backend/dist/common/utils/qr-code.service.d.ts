/**
 * QR Code Generation Service
 * Generates real QR codes for registration verification
 */
export declare class QrCodeService {
    /**
     * Generate QR code as data URL
     * @param data - Data to encode in QR code (e.g., verification ID)
     * @returns Base64 data URL for embedding in HTML/images
     */
    static generateQRCode(data: string): Promise<string>;
    /**
     * Generate QR code as SVG string
     * @param data - Data to encode in QR code
     * @returns SVG string
     */
    static generateQRCodeSVG(data: string): Promise<string>;
    /**
     * Generate verification ID
     * Used as fallback when QR code cannot be scanned
     * @returns Unique verification ID (12 characters)
     */
    static generateVerificationId(): string;
}
//# sourceMappingURL=qr-code.service.d.ts.map