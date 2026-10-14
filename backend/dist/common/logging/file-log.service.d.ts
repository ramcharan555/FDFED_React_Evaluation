export declare class FileLogService {
    private static readonly logsDir;
    static writeAccess(message: string): void;
    static writeError(message: string): void;
    private static write;
    private static ensureLogsDir;
    private static rotateIfNeeded;
}
//# sourceMappingURL=file-log.service.d.ts.map