import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { diskStorage } from 'multer';
import * as fs from 'fs';
import * as path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'text/plain',
]);

function ensureUploadDir(): void {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

function safeFileName(originalName: string): string {
  const parsed = path.parse(originalName);
  const baseName = parsed.name.replace(/[^a-zA-Z0-9-_]/g, '-').slice(0, 80) || 'upload';
  const extension = parsed.ext.toLowerCase().replace(/[^a-z0-9.]/g, '');

  return `${Date.now()}-${baseName}${extension}`;
}

@ApiTags('uploads')
@Controller('api/uploads')
export class UploadsController {
  @Post()
  @ApiOperation({ summary: 'Upload an event-related file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
      required: ['file'],
    },
  })
  @ApiResponse({ status: 201, description: 'File uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Missing file or invalid file type' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, callback) => {
          ensureUploadDir();
          callback(null, UPLOAD_DIR);
        },
        filename: (_req, file, callback) => {
          callback(null, safeFileName(file.originalname));
        },
      }),
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
      fileFilter: (_req, file, callback) => {
        if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
          callback(
            new BadRequestException(
              'Invalid file type. Allowed: JPG, PNG, WEBP, PDF, TXT.',
            ),
            false,
          );
          return;
        }

        callback(null, true);
      },
    }),
  )
  uploadFile(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    return {
      success: true,
      message: 'File uploaded successfully',
      data: {
        originalName: file.originalname,
        fileName: file.filename,
        mimeType: file.mimetype,
        size: file.size,
        path: `uploads/${file.filename}`,
      },
    };
  }
}
