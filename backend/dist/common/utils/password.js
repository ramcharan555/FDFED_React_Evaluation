"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashPassword = hashPassword;
exports.verifyPassword = verifyPassword;
const crypto_1 = require("crypto");
function hashPassword(value) { const salt = (0, crypto_1.randomBytes)(16).toString('hex'); return `scrypt$${salt}$${(0, crypto_1.scryptSync)(value, salt, 64).toString('hex')}`; }
function verifyPassword(value, stored) {
    if (!stored.startsWith('scrypt$'))
        return value === stored;
    const [, salt, digest] = stored.split('$');
    if (!salt || !digest)
        return false;
    const expected = Buffer.from(digest, 'hex'), actual = (0, crypto_1.scryptSync)(value, salt, 64);
    return expected.length === actual.length && (0, crypto_1.timingSafeEqual)(expected, actual);
}
//# sourceMappingURL=password.js.map