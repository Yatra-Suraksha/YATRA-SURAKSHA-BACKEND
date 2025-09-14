import { computerVisionClient } from '../config/azure.config.js';
import sharp from 'sharp';

class OCRService {
    constructor() {
        this.client = computerVisionClient;
    }

    async preprocessImage(imageBuffer) {
        try {
            // Get image metadata first
            const metadata = await sharp(imageBuffer).metadata();
            console.log('Original image metadata:', {
                format: metadata.format,
                width: metadata.width,
                height: metadata.height,
                size: imageBuffer.length
            });

            // Process image but maintain JPEG format for Azure compatibility
            const processedImage = await sharp(imageBuffer)
                .resize(1200, null, { withoutEnlargement: true })
                .greyscale()
                .normalize()
                .sharpen()
                .jpeg({ quality: 90 }) // Explicitly convert to JPEG
                .toBuffer();
            
            console.log('Processed image size:', processedImage.length);
            return processedImage;
        } catch (error) {
            console.error('Image preprocessing error:', error);
            console.log('Falling back to original image buffer');
            return imageBuffer;
        }
    }

    async extractTextFromDocument(imageBuffer) {
        try {
            // First, try with the processed image
            let processedImage;
            try {
                processedImage = await this.preprocessImage(imageBuffer);
            } catch (preprocessError) {
                console.warn('Preprocessing failed, using original image:', preprocessError.message);
                processedImage = imageBuffer;
            }
            
            const result = await this.client.readInStream(processedImage);
            const operationId = result.operationLocation.split('/').slice(-1)[0];
            
            let readResult;
            let attempts = 0;
            const maxAttempts = 30;
            
            do {
                await new Promise(resolve => setTimeout(resolve, 1000));
                readResult = await this.client.getReadResult(operationId);
                attempts++;
                
                if (attempts >= maxAttempts) {
                    throw new Error('OCR operation timeout');
                }
            } while (readResult.status === 'running');

            if (readResult.status === 'succeeded') {
                const textLines = [];
                readResult.analyzeResult.readResults.forEach(page => {
                    page.lines.forEach(line => {
                        textLines.push(line.text);
                    });
                });
                return textLines.join('\n');
            }
            
            throw new Error(`OCR operation failed with status: ${readResult.status}`);
        } catch (error) {
            console.error('Azure OCR error:', error);
            
            // If preprocessing was used and failed, try with original image
            if (error.message.includes('InvalidImage') && imageBuffer) {
                console.log('Retrying with original unprocessed image...');
                try {
                    const result = await this.client.readInStream(imageBuffer);
                    const operationId = result.operationLocation.split('/').slice(-1)[0];
                    
                    let readResult;
                    let attempts = 0;
                    const maxAttempts = 30;
                    
                    do {
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        readResult = await this.client.getReadResult(operationId);
                        attempts++;
                        
                        if (attempts >= maxAttempts) {
                            throw new Error('OCR operation timeout');
                        }
                    } while (readResult.status === 'running');

                    if (readResult.status === 'succeeded') {
                        const textLines = [];
                        readResult.analyzeResult.readResults.forEach(page => {
                            page.lines.forEach(line => {
                                textLines.push(line.text);
                            });
                        });
                        return textLines.join('\n');
                    }
                } catch (retryError) {
                    console.error('Retry with original image also failed:', retryError);
                }
            }
            
            throw new Error(`OCR processing failed: ${error.message}`);
        }
    }

    extractAadhaarInfo(text) {
        const info = {
            name: null,
            dob: null,
            address: null,
            phone: null,
            documentNumber: null,
            documentType: 'aadhaar'
        };

        // Handle escaped newlines - convert \\n to actual newlines
        const normalizedText = text.replace(/\\n/g, '\n');
        const lines = normalizedText.split('\n').map(line => line.trim()).filter(line => line);
        console.log('Input text:', text);
        console.log('Normalized text:', normalizedText);
        console.log('Extracted lines for parsing:', lines);

        // Extract Aadhaar number (12 digits) - More specific pattern
        const aadhaarPattern = /\b\d{4}\s+\d{4}\s+\d{4}\b/;
        const aadhaarMatch = normalizedText.match(aadhaarPattern);
        if (aadhaarMatch) {
            info.documentNumber = aadhaarMatch[0].replace(/\s/g, '');
            console.log('Found Aadhaar number:', info.documentNumber);
        }

        // Extract DOB (various formats) - More flexible patterns
        const dobPatterns = [
            /\b(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})\b/,
            /\b(\d{1,2}\s(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s\d{4})\b/i,
            /\b(\d{4}[-\/]\d{1,2}[-\/]\d{1,2})\b/,
            /(?:dob|birth|date of birth)[:\s]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})/i
        ];

        for (const pattern of dobPatterns) {
            const dobMatch = normalizedText.match(pattern);
            if (dobMatch) {
                info.dob = dobMatch[1] || dobMatch[0];
                console.log('Found DOB:', info.dob);
                break;
            }
        }

        // Extract Name - Improved logic for Aadhaar (handles both cases)
        // First try to find name after common keywords
        const nameWithKeywordPatterns = [
            /(?:name|नाम)[:\s]*([a-zA-Z\s]{3,50})/i
        ];

        for (const pattern of nameWithKeywordPatterns) {
            const nameMatch = normalizedText.match(pattern);
            if (nameMatch && nameMatch[1]) {
                const name = nameMatch[1].trim().toUpperCase();
                if (name.length > 2 && name.length < 50 && /^[A-Z\s]+$/.test(name)) {
                    info.name = name;
                    console.log('Found name with keyword:', info.name);
                    break;
                }
            }
        }

        // If name not found, try to find it from lines (common Aadhaar format)
        if (!info.name) {
            for (const line of lines) {
                // Skip common header words
                if (line.includes('GOVERNMENT') || 
                    line.includes('INDIA') || 
                    line.includes('AADHAAR') ||
                    line.includes('Male') ||
                    line.includes('Female') ||
                    /\d/.test(line) || // Skip lines with numbers
                    line.length < 3 || 
                    line.length > 50) {
                    continue;
                }
                
                // Look for name patterns (all caps or title case)
                if (/^[A-Z][A-Z\s]+$/.test(line) || /^[A-Z][a-z]+\s[A-Z][a-z]+/.test(line)) {
                    info.name = line.toUpperCase();
                    console.log('Found name from line:', info.name);
                    break;
                }
            }
        }

        // Extract Phone number (10 digits) - More flexible
        const phonePatterns = [
            /(?:mobile|phone|mob)[:\s]*(\+91\s?)?(\d{10})/i,
            /(\+91[\s-]?\d{10})/,
            /\b(\d{10})\b/,
            /(?:phone|mobile)[:\s]*(\d{10})/i
        ];

        for (const pattern of phonePatterns) {
            const phoneMatch = normalizedText.match(pattern);
            if (phoneMatch) {
                const phone = phoneMatch[phoneMatch.length - 1].replace(/\D/g, '');
                if (phone.length === 10 && phone !== info.documentNumber?.slice(2)) { // Avoid Aadhaar number
                    info.phone = phone;
                    console.log('Found phone:', info.phone);
                    break;
                }
            }
        }

        // Extract Address (improved logic)
        const addressLines = [];
        let foundAddressSection = false;
        const addressKeywords = ['address', 'addr', 'पता', 'स्थायी', 'निवास'];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].toLowerCase();
            
            if (addressKeywords.some(keyword => line.includes(keyword))) {
                foundAddressSection = true;
                continue;
            }

            if (foundAddressSection && lines[i].length > 5) {
                // Skip lines that are clearly not address
                if (!lines[i].match(/\d{6}$/) && // Not just pincode
                    !lines[i].match(/^\d{4}\s?\d{4}\s?\d{4}$/) && // Not Aadhaar number
                    !/^[A-Z]{1,2}\d{1,4}$/i.test(lines[i])) { // Not ID codes
                    addressLines.push(lines[i]);
                    if (addressLines.length >= 3) break;
                }
            }
        }

        // If no structured address found, try pattern-based extraction
        if (addressLines.length === 0) {
            const addressPattern = /([A-Za-z0-9\s,.-]+(?:road|street|lane|colony|nagar|area|dist|district|state)[A-Za-z0-9\s,.-]*)/i;
            const addressMatch = normalizedText.match(addressPattern);
            if (addressMatch) {
                addressLines.push(addressMatch[1].trim());
            }
        }

        if (addressLines.length > 0) {
            info.address = addressLines.join(', ');
            console.log('Found address:', info.address);
        }

        console.log('Final extracted info:', info);
        return info;
    }

    extractPassportInfo(text) {
        const info = {
            name: null,
            dob: null,
            address: null,
            phone: null,
            documentNumber: null,
            documentType: 'passport'
        };

        // Extract Passport Number
        const passportPatterns = [
            /[A-Z]{1}[0-9]{7}/,
            /passport\s*no[:\s]*([A-Z]{1}[0-9]{7})/i
        ];

        for (const pattern of passportPatterns) {
            const passportMatch = text.match(pattern);
            if (passportMatch) {
                info.documentNumber = passportMatch[passportMatch.length - 1];
                break;
            }
        }

        // Extract Phone number
        const phonePatterns = [
            /(?:mobile|phone|contact)[:\s]*(\+91\s?)?(\d{10})/i,
            /(\+91[\s-]?\d{10})/,
            /\b(\d{10})\b/
        ];

        for (const pattern of phonePatterns) {
            const phoneMatch = text.match(pattern);
            if (phoneMatch) {
                const phone = phoneMatch[phoneMatch.length - 1].replace(/\D/g, '');
                if (phone.length === 10) {
                    info.phone = phone;
                    break;
                }
            }
        }

        // Extract DOB
        const dobPatterns = [
            /(?:date of birth|dob)[:\s]*(\d{2}[-\/]\d{2}[-\/]\d{4})/i,
            /(\d{2}[-\/]\d{2}[-\/]\d{4})/
        ];

        for (const pattern of dobPatterns) {
            const dobMatch = text.match(pattern);
            if (dobMatch) {
                info.dob = dobMatch[1];
                break;
            }
        }

        // Extract Name
        const namePatterns = [
            /(?:given names?|name)[:\s]*([a-zA-Z\s]{3,50})/i,
            /surname[:\s]*([a-zA-Z\s]{3,30})/i
        ];

        let givenName = '';
        let surname = '';

        for (const pattern of namePatterns) {
            const nameMatch = text.match(pattern);
            if (nameMatch && nameMatch[1]) {
                if (pattern.source.includes('surname')) {
                    surname = nameMatch[1].trim();
                } else {
                    givenName = nameMatch[1].trim();
                }
            }
        }

        if (givenName || surname) {
            info.name = `${givenName} ${surname}`.trim();
        }

        // Extract Address (if available in passport)
        const addressPattern = /(?:address|resident)[:\s]*([a-zA-Z0-9\s,.-]{10,100})/i;
        const addressMatch = text.match(addressPattern);
        if (addressMatch) {
            info.address = addressMatch[1].trim();
        }

        return info;
    }

    detectDocumentType(text) {
        const lowerText = text.toLowerCase();
        
        if (lowerText.includes('aadhaar') || 
            lowerText.includes('आधार') || 
            /\d{4}\s?\d{4}\s?\d{4}/.test(text)) {
            return 'aadhaar';
        }
        
        if (lowerText.includes('passport') || 
            /[A-Z]{1}[0-9]{7}/.test(text)) {
            return 'passport';
        }

        // Default to aadhaar if uncertain
        return 'aadhaar';
    }

    async processDocument(imageBuffer) {
        try {
            const extractedText = await this.extractTextFromDocument(imageBuffer);
            
            const documentType = this.detectDocumentType(extractedText);
            
            let extractedInfo;
            if (documentType === 'aadhaar') {
                extractedInfo = this.extractAadhaarInfo(extractedText);
            } else {
                extractedInfo = this.extractPassportInfo(extractedText);
            }

            const confidence = this.calculateConfidence(extractedInfo);

            return {
                success: true,
                documentType,
                extractedText,
                extractedInfo,
                confidence
            };

        } catch (error) {
            console.error('Document processing error:', error);
            throw new Error(`Document processing failed: ${error.message}`);
        }
    }

    calculateConfidence(info) {
        // Simplified confidence calculation - can be enhanced with LLM confidence scores
        let score = 0;
        const requiredFields = ['name', 'dob', 'documentNumber'];
        
        requiredFields.forEach(field => {
            if (info[field] && info[field].trim() && info[field].length > 2) {
                score += 33;
            }
        });

        return Math.min(score, 100);
    }

    // Placeholder for LLM validation - implement your LLM logic here
    async validateExtractedInfo(extractedText, parsedInfo = null) {
        // TODO: Implement LLM-based validation
        // This method should send the extractedText to an LLM and get structured validation
        
        return {
            isValid: true,
            message: "LLM validation not implemented yet",
            extractedInfo: parsedInfo || {},
            confidence: 0
        };
    }
}

export default new OCRService();