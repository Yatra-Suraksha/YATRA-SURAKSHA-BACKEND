import ocrService from '../services/ocr.service.js';

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
        res.status(500).json({
            success: false,
            message: 'Document processing failed',
            error: error.message
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