import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { reqInfo } from '../../helper';

interface MulterFile {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    destination: string;
    filename: string;
    path: string;
    buffer?: Buffer;
}

interface MulterRequest extends Request {
    file?: MulterFile;
}

export const uploadFile = async (req: MulterRequest, res: Response): Promise<any> => {
    // Log request information (logs IP, browser etc.)
    await reqInfo(req);

    try {
        // 1. Check if file is provided in request
        if (!req.file) {
            return res.status(400).json({
                success: false,
                status: 400,
                message: 'No file provided'
            });
        }

        const file = req.file;
        const ext = path.extname(file.originalname).toLowerCase();
        const mime = file.mimetype;

        const isImage = ['.jpeg', '.jpg', '.png', '.webp', '.gif'].includes(ext) || mime.startsWith('image/');
        const isPdf = ext === '.pdf' || mime === 'application/pdf';

        // 2. Validate file type inside controller as a secondary safeguard
        if (!isImage && !isPdf) {
            // Delete uploaded file if somehow it slipped through
            if (fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
            }
            return res.status(400).json({
                success: false,
                status: 400,
                message: 'Only images and PDF files are allowed'
            });
        }

        // 3. Dynamic Size Enforcement (5MB limit for images, 10MB limit for PDFs)
        const fileLimit = isImage ? 5 * 1024 * 1024 : 10 * 1024 * 1024;
        if (file.size > fileLimit) {
            // Delete uploaded file from disk to avoid orphans
            if (fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
            }
            return res.status(400).json({
                success: false,
                status: 400,
                message: 'File size exceeds the allowed limit'
            });
        }

        // 4. Handle oldFileUrl replacement
        const { oldFileUrl } = req.body || {};
        if (oldFileUrl) {
            let relativePath = '';
            const uploadsIndex = oldFileUrl.indexOf('/uploads/');
            if (uploadsIndex !== -1) {
                relativePath = oldFileUrl.substring(uploadsIndex + '/uploads/'.length);
            } else if (oldFileUrl.startsWith('uploads/')) {
                relativePath = oldFileUrl.substring('uploads/'.length);
            } else {
                relativePath = oldFileUrl;
            }

            // Secure file path construction
            const uploadsDir = path.join(process.cwd(), 'uploads');
            const absoluteOldFilePath = path.join(uploadsDir, relativePath);

            // Verify it is indeed within the uploads folder to prevent directory traversal
            if (absoluteOldFilePath.startsWith(uploadsDir)) {
                if (fs.existsSync(absoluteOldFilePath)) {
                    try {
                        fs.unlinkSync(absoluteOldFilePath);
                    } catch (unlinkErr) {
                        console.error(`Failed to delete old file: ${absoluteOldFilePath}`, unlinkErr);
                    }
                }
            }
        }

        // 5. Generate returning base URL and path
        const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
        
        // Determine category for URL and folder structure
        const folderName = isImage ? 'images' : 'pdfs';
        const fileType = isImage ? 'image' : 'pdf';
        
        // Filename is just the basename of the saved file
        const savedFilename = path.basename(file.path);
        const fullUrl = `${baseUrl.replace(/\/$/, '')}/uploads/${folderName}/${savedFilename}`;

        // 6. Return standard success response
        return res.status(200).json({
            success: true,
            status: 200,
            message: 'File uploaded successfully',
            data: {
                url: fullUrl,
                type: fileType,
                originalName: file.originalname,
                size: file.size
            }
        });
    } catch (error: any) {
        console.error('File Upload unexpected error:', error);
        
        // Cleanup file if it exists
        if (req.file && fs.existsSync(req.file.path)) {
            try {
                fs.unlinkSync(req.file.path);
            } catch (err) {
                // ignore
            }
        }

        return res.status(500).json({
            success: false,
            status: 500,
            message: error.message || 'Internal Server Error'
        });
    }
};
