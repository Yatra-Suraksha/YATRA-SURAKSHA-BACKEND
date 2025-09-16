import ocrService from '../services/ocr.service.js';
export const processDocument = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No document image uploaded'
            });
        }
        if (req.file.size > 10 * 1024 * 1024) {
            return res.status(400).json({
                success: false,
                message: 'File size too large. Maximum size is 10MB.'
            });
        }
        const allowedMimeTypes = [
            'image/jpeg', 'image/jpg', 'image/png', 
            'image/bmp', 'image/tiff', 'image/tif'
        ];
        
        if (!allowedMimeTypes.includes(req.file.mimetype.toLowerCase())) {
            return res.status(400).json({
                success: false,
                message: 'Invalid file type. Only JPEG, PNG, BMP, and TIFF images are allowed.'
            });
        }
        if (!req.file.buffer || req.file.buffer.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Uploaded file is empty or corrupted.'
            });
        }

        console.log(`Processing document: ${req.file.originalname}, Size: ${Math.round(req.file.size / 1024)}KB`);

        const result = await ocrService.processDocument(req.file.buffer);
        if (!result || !result.documentType) {
            return res.status(422).json({
                success: false,
                message: 'Could not process document. Please ensure the image is clear and contains valid document data.'
            });
        }

        res.json({
            success: true,
            message: 'Document processed successfully',
            data: {
                documentType: result.documentType,
                extractedInfo: result.extractedInfo,
                confidence: result.confidence,
                extractedText: result.extractedText
            }
        });

    } catch (error) {
        console.error('OCR processing error:', error);
        
        
        let statusCode = 500;
        let errorMessage = 'Document processing failed';
        
        if (error.message.includes('Invalid image file format')) {
            statusCode = 400;
            errorMessage = 'Invalid image file format. Please upload a valid JPEG, PNG, BMP, or TIFF image.';
        } else if (error.message.includes('preprocessing failed')) {
            statusCode = 400;
            errorMessage = 'Image processing failed. The file may be corrupted or in an unsupported format.';
        } else if (error.message.includes('Azure')) {
            statusCode = 503;
            errorMessage = 'OCR service temporarily unavailable. Please try again later.';
        } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
            statusCode = 503;
            errorMessage = 'OCR service is not reachable. Please try again later.';
        }
        
        res.status(statusCode).json({
            success: false,
            message: errorMessage,
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            details: process.env.NODE_ENV === 'development' ? {
                originalName: req.file?.originalname,
                mimeType: req.file?.mimetype,
                size: req.file?.size
            } : undefined
        });
    }
};

export const getOCRHealth = async (req, res) => {
    res.json({
        success: true,
        message: 'OCR service is healthy',
        data: {
            service: 'Azure Computer Vision',
            status: 'active'
        }
    });
};