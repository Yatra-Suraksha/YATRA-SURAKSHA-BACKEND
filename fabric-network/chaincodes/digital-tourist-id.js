'use strict';

const { Contract } = require('fabric-contract-api');
const crypto = require('crypto');

class DigitalTouristIDContract extends Contract {

    async initLedger(ctx) {
        console.info('============= START : Initialize Digital Tourist ID Ledger ===========');
        console.info('============= END : Initialize Digital Tourist ID Ledger ===========');
    }

    // Issue a new Digital Tourist ID
    async issueTouristID(ctx, touristData) {
        console.info('============= START : Issue Tourist ID ===========');
        
        const data = JSON.parse(touristData);
        
        // Generate DID (Decentralized Identifier)
        const did = this.generateTouristDID();
        
        // Generate document hash from KYC data
        const documentHash = this.generateDocumentHash(data.kycDocument);
        
        const digitalID = {
            did: did,
            issuerDID: data.issuerDID || 'did:tourismdept:gov-ts',
            status: 'ACTIVE',
            issueDate: new Date().toISOString(),
            expiryDate: data.expiryDate,
            kycDocumentHash: documentHash,
            documentType: data.documentType, // 'PASSPORT' or 'AADHAAR'
            issuedBy: ctx.clientIdentity.getID(),
            createdAt: new Date().toISOString()
        };

        await ctx.stub.putState(did, Buffer.from(JSON.stringify(digitalID)));
        
        // Emit event for ID issuance
        const eventPayload = {
            did: did,
            issuerDID: digitalID.issuerDID,
            status: digitalID.status,
            issueDate: digitalID.issueDate,
            expiryDate: digitalID.expiryDate,
            documentType: digitalID.documentType
        };
        ctx.stub.setEvent('TouristIDIssued', Buffer.from(JSON.stringify(eventPayload)));
        
        console.info('============= END : Issue Tourist ID ===========');
        return did;
    }

    // Verify Tourist ID authenticity
    async verifyTouristID(ctx, did, verifierDID) {
        console.info('============= START : Verify Tourist ID ===========');
        
        const digitalIDAsBytes = await ctx.stub.getState(did);
        if (!digitalIDAsBytes || digitalIDAsBytes.length === 0) {
            throw new Error(`Tourist ID ${did} does not exist`);
        }
        
        const digitalID = JSON.parse(digitalIDAsBytes.toString());
        
        // Check if ID is active and not expired
        const now = new Date();
        const expiryDate = new Date(digitalID.expiryDate);
        
        const verificationResult = {
            did: did,
            isValid: digitalID.status === 'ACTIVE' && now <= expiryDate,
            status: digitalID.status,
            issuerDID: digitalID.issuerDID,
            expiryDate: digitalID.expiryDate,
            verifiedBy: verifierDID,
            verifiedAt: now.toISOString(),
            documentType: digitalID.documentType
        };
        
        // Emit verification event
        ctx.stub.setEvent('TouristIDVerified', Buffer.from(JSON.stringify(verificationResult)));
        
        console.info('============= END : Verify Tourist ID ===========');
        return JSON.stringify(verificationResult);
    }

    // Update Tourist ID status
    async updateTouristIDStatus(ctx, did, newStatus, reason) {
        console.info('============= START : Update Tourist ID Status ===========');
        
        const digitalIDAsBytes = await ctx.stub.getState(did);
        if (!digitalIDAsBytes || digitalIDAsBytes.length === 0) {
            throw new Error(`Tourist ID ${did} does not exist`);
        }
        
        const digitalID = JSON.parse(digitalIDAsBytes.toString());
        const oldStatus = digitalID.status;
        
        digitalID.status = newStatus;
        digitalID.lastUpdated = new Date().toISOString();
        digitalID.updatedBy = ctx.clientIdentity.getID();
        digitalID.updateReason = reason;
        
        await ctx.stub.putState(did, Buffer.from(JSON.stringify(digitalID)));
        
        // Emit status update event
        const eventPayload = {
            did: did,
            oldStatus: oldStatus,
            newStatus: newStatus,
            reason: reason,
            updatedBy: digitalID.updatedBy,
            updatedAt: digitalID.lastUpdated
        };
        ctx.stub.setEvent('TouristIDStatusUpdated', Buffer.from(JSON.stringify(eventPayload)));
        
        console.info('============= END : Update Tourist ID Status ===========');
        return JSON.stringify(digitalID);
    }

    // Query Tourist ID
    async queryTouristID(ctx, did) {
        const digitalIDAsBytes = await ctx.stub.getState(did);
        if (!digitalIDAsBytes || digitalIDAsBytes.length === 0) {
            throw new Error(`Tourist ID ${did} does not exist`);
        }
        return digitalIDAsBytes.toString();
    }

    // Verify document hash
    async verifyDocumentHash(ctx, did, providedHash) {
        const digitalIDAsBytes = await ctx.stub.getState(did);
        if (!digitalIDAsBytes || digitalIDAsBytes.length === 0) {
            throw new Error(`Tourist ID ${did} does not exist`);
        }
        
        const digitalID = JSON.parse(digitalIDAsBytes.toString());
        const isValid = digitalID.kycDocumentHash === providedHash;
        
        return JSON.stringify({
            did: did,
            documentHashValid: isValid,
            verifiedAt: new Date().toISOString()
        });
    }

    // Generate unique DID for tourist
    generateTouristDID() {
        const timestamp = Date.now().toString(36);
        const randomStr = crypto.randomBytes(8).toString('hex');
        return `did:tourist:${timestamp}-${randomStr}`;
    }

    // Generate SHA-256 hash of KYC document
    generateDocumentHash(documentData) {
        if (!documentData) {
            throw new Error('Document data is required for hash generation');
        }
        return crypto.createHash('sha256').update(JSON.stringify(documentData)).digest('hex');
    }
}

module.exports = DigitalTouristIDContract;