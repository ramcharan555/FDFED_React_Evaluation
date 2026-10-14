export declare class UploadsController {
    uploadFile(file?: Express.Multer.File): {
        success: boolean;
        message: string;
        data: {
            originalName: string;
            fileName: string;
            mimeType: string;
            size: number;
            path: string;
        };
    };
}
//# sourceMappingURL=uploads.controller.d.ts.map