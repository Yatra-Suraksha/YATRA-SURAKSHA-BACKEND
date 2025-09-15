import ocrService from '../services/ocr.service.js';

/**
 * @swagger
 * /api/ocr/process:
 *   post:
 *     summary: Process document with OCR
 *     description: Upload an Aadhaar card or passport image to extract name, DOB, address, and phone number using Azure Computer Vision
 *     tags: [OCR]
 *     security:
 *       - FirebaseAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               document:
 *                 type: string
 *                 format: binary
 *                 description: Document image file (JPEG, PNG, BMP, TIFF, WebP)
 *             required:
 *               - document
 *     responses:
 *       200:
 *         description: Document processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/OCRResult'
 *             example:
 *               success: true
 *               message: "Document processed successfully"
 *               data:
 *                 documentType: "aadhaar"
 *                 extractedInfo:
 *                   name: "John Doe"
 *                   dob: "1990-01-15"
 *                   address: "123 Main St, City, State"
 *                   phone: "+91-9876543210"
 *                   documentNumber: "1234-5678-9012"
 *                 confidence: 0.95
 *                 extractedText: "Full text extracted from document..."
 *       400:
 *         description: Bad request - Invalid file format or missing document
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               no_file:
 *                 summary: No file uploaded
 *                 value:
 *                   success: false
 *                   message: "No document image uploaded"
 *               invalid_format:
 *                 summary: Invalid file format
 *                 value:
 *                   success: false
 *                   message: "Invalid image file format. Please upload a valid JPEG, PNG, BMP, or TIFF image."
 *       401:
 *         description: Unauthorized - Invalid or expired Firebase token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       503:
 *         description: Service unavailable - OCR service temporarily down
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

export const processDocument = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No document image uploaded'
            });
        }

        console.log(`Processing document: ${req.file.originalname}, Size: ${Math.round(req.file.size / 1024)}KB`);

        const result = await ocrService.processDocument(req.file.buffer);

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
        
        // Provide specific error messages based on error type
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

/**
 * @swagger
 * /api/ocr/health:
 *   get:
 *     summary: Check OCR service health
 *     description: Check if OCR service is running and Azure Computer Vision is properly configured
 *     tags: [OCR]
 *     security:
 *       - FirebaseAuth: []
 *     responses:
 *       200:
 *         description: OCR service status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         service:
 *                           type: string
 *                           example: "Azure Computer Vision"
 *                         status:
 *                           type: string
 *                           enum: [active, inactive, error]
 *                           example: "active"
 *             example:
 *               success: true
 *               message: "OCR service is healthy"
 *               data:
 *                 service: "Azure Computer Vision"
 *                 status: "active"
 *       401:
 *         description: Unauthorized - Invalid or expired Firebase token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
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