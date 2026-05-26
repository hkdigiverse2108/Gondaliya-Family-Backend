import { Router, Request, Response, NextFunction } from 'express';
import { MulterError } from 'multer';
import { upload } from '../config/multer.config';
import { uploadController } from '../controllers';
import { uploadFileSchema, validateRequest } from '../validation';

const router = Router();

// Wrapper middleware to execute Multer and handle any upload/limit errors cleanly
const uploadWithErrorHandler = (req: Request, res: Response, next: NextFunction) => {
    upload.single('file')(req, res, (err: any) => {
        if (err) {
            // 1. Handle MulterError (specifically LIMIT_FILE_SIZE)
            if (err instanceof MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(400).json({
                        success: false,
                        status: 400,
                        message: 'File size exceeds the allowed limit'
                    });
                }
                return res.status(400).json({
                    success: false,
                    status: 400,
                    message: err.message
                });
            }

            // 2. Handle Custom FileFilter rejection error
            if (err.message && err.message.includes('Only images')) {
                return res.status(400).json({
                    success: false,
                    status: 400,
                    message: err.message
                });
            }

            // 3. Fallback for other errors
            return res.status(400).json({
                success: false,
                status: 400,
                message: err.message || 'Error uploading file'
            });
        }
        next();
    });
};

// POST /upload (public, accepts file & optional oldFileUrl)
router.post(
    '/',
    uploadWithErrorHandler,
    validateRequest(uploadFileSchema),
    uploadController.uploadFile
);

export const uploadRouter = router;
