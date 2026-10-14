"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.QrCodeService = void 0;
const QRCode = __importStar(require("qrcode"));
/**
 * QR Code Generation Service
 * Generates real QR codes for registration verification
 */
class QrCodeService {
    /**
     * Generate QR code as data URL
     * @param data - Data to encode in QR code (e.g., verification ID)
     * @returns Base64 data URL for embedding in HTML/images
     */
    static async generateQRCode(data) {
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
        }
        catch (error) {
            console.error('QR Code generation error:', error);
            throw new Error('Failed to generate QR code');
        }
    }
    /**
     * Generate QR code as SVG string
     * @param data - Data to encode in QR code
     * @returns SVG string
     */
    static async generateQRCodeSVG(data) {
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
        }
        catch (error) {
            console.error('QR Code SVG generation error:', error);
            throw new Error('Failed to generate QR code SVG');
        }
    }
    /**
     * Generate verification ID
     * Used as fallback when QR code cannot be scanned
     * @returns Unique verification ID (12 characters)
     */
    static generateVerificationId() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < 12; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }
}
exports.QrCodeService = QrCodeService;
//# sourceMappingURL=qr-code.service.js.map