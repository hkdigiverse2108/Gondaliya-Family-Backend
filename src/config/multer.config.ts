import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { randomUUID } from 'crypto';

// Setup disk storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let dest = 'uploads/';
        const ext = path.extname(file.originalname).toLowerCase();
        const mime = file.mimetype;

        // Check if image or pdf to route to proper folder
        if (['.jpeg', '.jpg', '.png', '.webp', '.gif'].includes(ext) || mime.startsWith('image/')) {
            dest = 'uploads/images/';
        } else if (ext === '.pdf' || mime === 'application/pdf') {
            dest = 'uploads/pdfs/';
        }

        // Ensure target directory exists on disk dynamically
        const absoluteDest = path.join(process.cwd(), dest);
        if (!fs.existsSync(absoluteDest)) {
            fs.mkdirSync(absoluteDest, { recursive: true });
        }

        cb(null, absoluteDest);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const uuidStr = randomUUID();
        const filename = `${Date.now()}-${uuidStr}${ext}`;
        cb(null, filename);
    }
});

// Setup file filter configuration
const fileFilter = (req: any, file: any, cb: any) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const mime = file.mimetype;

    const isImage = ['.jpeg', '.jpg', '.png', '.webp', '.gif'].includes(ext) || mime.startsWith('image/');
    const isPdf = ext === '.pdf' || mime === 'application/pdf';

    if (isImage || isPdf) {
        cb(null, true);
    } else {
        cb(new Error("Only images (jpeg, jpg, png, webp, gif) and PDF files are allowed"), false);
    }
};

// Create multer upload instance
export const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB overall max limit (images are validated to 5MB inside controller/middleware)
    }
});
