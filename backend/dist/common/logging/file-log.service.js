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
exports.FileLogService = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const MAX_LOG_SIZE_BYTES = 1024 * 1024;
const MAX_ROTATED_FILES = 5;
class FileLogService {
    static writeAccess(message) {
        this.write('access.log', message);
    }
    static writeError(message) {
        this.write('error.log', message);
    }
    static write(fileName, message) {
        this.ensureLogsDir();
        const filePath = path.join(this.logsDir, fileName);
        this.rotateIfNeeded(filePath);
        fs.appendFileSync(filePath, `${message}\n`, { encoding: 'utf8' });
    }
    static ensureLogsDir() {
        if (!fs.existsSync(this.logsDir)) {
            fs.mkdirSync(this.logsDir, { recursive: true });
        }
    }
    static rotateIfNeeded(filePath) {
        if (!fs.existsSync(filePath)) {
            return;
        }
        const stats = fs.statSync(filePath);
        if (stats.size < MAX_LOG_SIZE_BYTES) {
            return;
        }
        for (let index = MAX_ROTATED_FILES - 1; index >= 1; index -= 1) {
            const current = `${filePath}.${index}`;
            const next = `${filePath}.${index + 1}`;
            if (fs.existsSync(current)) {
                if (index === MAX_ROTATED_FILES - 1 && fs.existsSync(next)) {
                    fs.unlinkSync(next);
                }
                fs.renameSync(current, next);
            }
        }
        fs.renameSync(filePath, `${filePath}.1`);
    }
}
exports.FileLogService = FileLogService;
FileLogService.logsDir = path.join(process.cwd(), 'logs');
//# sourceMappingURL=file-log.service.js.map