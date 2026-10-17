"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashPassword = hashPassword;
exports.verifyPassword = verifyPassword;
const crypto_1 = require("crypto");
function hashPassword(password) {
    const salt = (0, crypto_1.randomBytes)(16).toString('hex');
    return `scrypt:${salt}:${(0, crypto_1.scryptSync)(password, salt, 64).toString('hex')}`;
}
function verifyPassword(password, stored) {
    if (stored.startsWith('scrypt:')) {
        const parts = stored.split(':');
        if (parts.length !== 3 || !/^[a-f0-9]{32}$/.test(parts[1]) || !/^[a-f0-9]{128}$/.test(parts[2]))
            return false;
        return (0, crypto_1.timingSafeEqual)((0, crypto_1.scryptSync)(password, parts[1], 64), Buffer.from(parts[2], 'hex'));
    }
    // Existing demo accounts were stored in plaintext. Newly changed passwords use scrypt.
    return stored === password;
}
//# sourceMappingURL=password.js.map