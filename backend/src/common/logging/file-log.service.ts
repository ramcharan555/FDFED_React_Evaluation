import * as fs from 'fs';
import * as path from 'path';

const MAX_LOG_SIZE_BYTES = 1024 * 1024;
const MAX_ROTATED_FILES = 5;

export class FileLogService {
  private static readonly logsDir = path.join(process.cwd(), 'logs');

  static writeAccess(message: string): void {
    this.write('access.log', message);
  }

  static writeError(message: string): void {
    this.write('error.log', message);
  }

  private static write(fileName: string, message: string): void {
    this.ensureLogsDir();
    const filePath = path.join(this.logsDir, fileName);
    this.rotateIfNeeded(filePath);
    fs.appendFileSync(filePath, `${message}\n`, { encoding: 'utf8' });
  }

  private static ensureLogsDir(): void {
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
    }
  }

  private static rotateIfNeeded(filePath: string): void {
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
