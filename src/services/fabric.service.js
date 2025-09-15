import { Gateway, Wallets } from 'fabric-network';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class FabricService {
    constructor() {
        this.gateway = null;
        this.wallet = null;
        this.connectionProfile = null;
        this.isConnected = false;
        this.networkEnabled = process.env.FABRIC_NETWORK_ENABLED === 'true';
    }

    async initialize() {
        try {
            if (!this.networkEnabled) {
                console.log('Fabric network is disabled. Enable with FABRIC_NETWORK_ENABLED=true');
                return;
            }

            // Load connection profile
            const ccpPath = path.resolve(__dirname, '..', 'fabric-network', 'connection-profiles', 'connection-profile.json');
            
            if (!fs.existsSync(ccpPath)) {
                console.warn('Fabric connection profile not found. Run npm run fabric:setup first.');
                return;
            }
            
            const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
            this.connectionProfile = ccp;

            // Create wallet
            const walletPath = path.resolve(__dirname, '..', 'fabric-network', 'wallet');
            this.wallet = await Wallets.newFileSystemWallet(walletPath);

            console.log('Fabric service initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Fabric service:', error);
            // Don't throw error to allow server to start without Fabric
        }
    }

    async connectGateway(userId = 'appUser') {
        try {
            if (!this.networkEnabled) {
                throw new Error('Fabric network is disabled');
            }

            // Check if user exists in wallet
            const identity = await this.wallet.get(userId);
            if (!identity) {
                console.warn(`Identity for user ${userId} does not exist in wallet. Creating mock identity for development.`);
                await this.createMockIdentity(userId);
            }

            // Create gateway
            this.gateway = new Gateway();
            
            // Connect to gateway
            await this.gateway.connect(this.connectionProfile, {
                wallet: this.wallet,
                identity: userId,
                discovery: { enabled: true, asLocalhost: true }
            });

            this.isConnected = true;
            console.log(`Connected to Fabric network as ${userId}`);
        } catch (error) {
            console.error('Failed to connect to Fabric network:', error);
            throw error;
        }
    }

    async createMockIdentity(userId) {
        // Create a mock identity for development
        const identity = {
            credentials: {
                certificate: '-----BEGIN CERTIFICATE-----\nMOCK_CERTIFICATE\n-----END CERTIFICATE-----',
                privateKey: '-----BEGIN PRIVATE KEY-----\nMOCK_PRIVATE_KEY\n-----END PRIVATE KEY-----'
            },
            mspId: 'TourismDeptMSP',
            type: 'X.509'
        };
        
        await this.wallet.put(userId, identity);
        console.log(`Created mock identity for ${userId}`);
    }

    async getContract(channelName, chaincodeName) {
        if (!this.isConnected) {
            throw new Error('Gateway not connected. Call connectGateway() first.');
        }

        try {
            const network = await this.gateway.getNetwork(channelName);
            const contract = network.getContract(chaincodeName);
            return contract;
        } catch (error) {
            console.error(`Failed to get contract ${chaincodeName} on channel ${channelName}:`, error);
            throw error;
        }
    }

    async disconnect() {
        if (this.gateway) {
            await this.gateway.disconnect();
            this.isConnected = false;
            console.log('Disconnected from Fabric network');
        }
    }

    // ========== DIGITAL TOURIST ID METHODS ==========

    async issueTouristID(touristData) {
        try {
            if (!this.networkEnabled) {
                console.warn('Fabric network disabled. Returning mock DID.');
                return `did:tourist:mock-${Date.now()}`;
            }

            const contract = await this.getContract('digitalid-channel', 'digital-tourist-id');
            
            const digitalIdData = {
                issuerDID: 'did:tourismdept:gov-ts',
                expiryDate: touristData.expiryDate,
                kycDocument: touristData.ocrData, // OCR extracted data for hash generation
                documentType: touristData.documentType // 'PASSPORT' or 'AADHAAR'
            };

            const result = await contract.submitTransaction('issueTouristID', JSON.stringify(digitalIdData));
            return result.toString(); // Returns the DID
        } catch (error) {
            console.error('Failed to issue tourist digital ID:', error);
            // Return mock DID in case of error for development
            return `did:tourist:mock-${Date.now()}`;
        }
    }

    async verifyTouristID(did, verifierDID = 'did:police:verification') {
        try {
            const contract = await this.getContract('digitalid-channel', 'digital-tourist-id');
            
            const result = await contract.submitTransaction('verifyTouristID', did, verifierDID);
            return JSON.parse(result.toString());
        } catch (error) {
            console.error('Failed to verify tourist digital ID:', error);
            throw error;
        }
    }

    async updateTouristIDStatus(did, newStatus, reason) {
        try {
            const contract = await this.getContract('digitalid-channel', 'digital-tourist-id');
            
            const result = await contract.submitTransaction('updateTouristIDStatus', did, newStatus, reason);
            return JSON.parse(result.toString());
        } catch (error) {
            console.error('Failed to update tourist ID status:', error);
            throw error;
        }
    }

    async queryTouristID(did) {
        try {
            const contract = await this.getContract('digitalid-channel', 'digital-tourist-id');
            
            const result = await contract.evaluateTransaction('queryTouristID', did);
            return JSON.parse(result.toString());
        } catch (error) {
            console.error('Failed to query tourist digital ID:', error);
            throw error;
        }
    }

    async verifyDocumentHash(did, providedHash) {
        try {
            const contract = await this.getContract('digitalid-channel', 'digital-tourist-id');
            
            const result = await contract.evaluateTransaction('verifyDocumentHash', did, providedHash);
            return JSON.parse(result.toString());
        } catch (error) {
            console.error('Failed to verify document hash:', error);
            throw error;
        }
    }

    // ========== TRAVEL ITINERARY LOG METHODS ==========

    async addItineraryEntry(itineraryData) {
        try {
            const contract = await this.getContract('travel-channel', 'travel-itinerary-log');
            
            const result = await contract.submitTransaction('addItineraryEntry', JSON.stringify(itineraryData));
            return result.toString(); // Returns entry ID
        } catch (error) {
            console.error('Failed to add itinerary entry:', error);
            throw error;
        }
    }

    async updateEntryStatus(entryId, statusData) {
        try {
            const contract = await this.getContract('travel-channel', 'travel-itinerary-log');
            
            const result = await contract.submitTransaction('updateEntryStatus', entryId, JSON.stringify(statusData));
            return JSON.parse(result.toString());
        } catch (error) {
            console.error('Failed to update entry status:', error);
            throw error;
        }
    }

    async queryTouristItinerary(touristDID) {
        try {
            const contract = await this.getContract('travel-channel', 'travel-itinerary-log');
            
            const result = await contract.evaluateTransaction('queryTouristItinerary', touristDID);
            return JSON.parse(result.toString());
        } catch (error) {
            console.error('Failed to query tourist itinerary:', error);
            throw error;
        }
    }

    async queryEntriesByLocation(locationIdentifier) {
        try {
            const contract = await this.getContract('travel-channel', 'travel-itinerary-log');
            
            const result = await contract.evaluateTransaction('queryEntriesByLocation', locationIdentifier);
            return JSON.parse(result.toString());
        } catch (error) {
            console.error('Failed to query entries by location:', error);
            throw error;
        }
    }

    async queryEntriesByDateRange(startDate, endDate) {
        try {
            const contract = await this.getContract('travel-channel', 'travel-itinerary-log');
            
            const result = await contract.evaluateTransaction('queryEntriesByDateRange', startDate, endDate);
            return JSON.parse(result.toString());
        } catch (error) {
            console.error('Failed to query entries by date range:', error);
            throw error;
        }
    }

    // ========== INCIDENT LOG METHODS ==========

    async logIncident(incidentData) {
        try {
            const contract = await this.getContract('incidents-channel', 'incident-log');
            
            const result = await contract.submitTransaction('logIncident', JSON.stringify(incidentData));
            return result.toString(); // Returns incident ID
        } catch (error) {
            console.error('Failed to log incident:', error);
            throw error;
        }
    }

    async updateIncidentStatus(incidentId, newStatus, updateData) {
        try {
            const contract = await this.getContract('incidents-channel', 'incident-log');
            
            const result = await contract.submitTransaction('updateIncidentStatus', incidentId, newStatus, JSON.stringify(updateData));
            return JSON.parse(result.toString());
        } catch (error) {
            console.error('Failed to update incident status:', error);
            throw error;
        }
    }

    async addIncidentAction(incidentId, actionData) {
        try {
            const contract = await this.getContract('incidents-channel', 'incident-log');
            
            const result = await contract.submitTransaction('addIncidentAction', incidentId, JSON.stringify(actionData));
            return result.toString(); // Returns action ID
        } catch (error) {
            console.error('Failed to add incident action:', error);
            throw error;
        }
    }

    async queryIncident(incidentId) {
        try {
            const contract = await this.getContract('incidents-channel', 'incident-log');
            
            const result = await contract.evaluateTransaction('queryIncident', incidentId);
            return JSON.parse(result.toString());
        } catch (error) {
            console.error('Failed to query incident:', error);
            throw error;
        }
    }

    async queryIncidentsByTourist(touristDID) {
        try {
            const contract = await this.getContract('incidents-channel', 'incident-log');
            
            const result = await contract.evaluateTransaction('queryIncidentsByTourist', touristDID);
            return JSON.parse(result.toString());
        } catch (error) {
            console.error('Failed to query incidents by tourist:', error);
            throw error;
        }
    }

    async queryIncidentsByType(incidentType) {
        try {
            const contract = await this.getContract('incidents-channel', 'incident-log');
            
            const result = await contract.evaluateTransaction('queryIncidentsByType', incidentType);
            return JSON.parse(result.toString());
        } catch (error) {
            console.error('Failed to query incidents by type:', error);
            throw error;
        }
    }

    async queryActiveIncidents() {
        try {
            const contract = await this.getContract('incidents-channel', 'incident-log');
            
            const result = await contract.evaluateTransaction('queryActiveIncidents');
            return JSON.parse(result.toString());
        } catch (error) {
            console.error('Failed to query active incidents:', error);
            throw error;
        }
    }

    async getIncidentAuditTrail(incidentId) {
        try {
            const contract = await this.getContract('incidents-channel', 'incident-log');
            
            const result = await contract.evaluateTransaction('getIncidentAuditTrail', incidentId);
            return JSON.parse(result.toString());
        } catch (error) {
            console.error('Failed to get incident audit trail:', error);
            throw error;
        }
    }

    // ========== EVENT LISTENING ==========

    async startEventListener(channelName, chaincodeName, eventName, callback) {
        try {
            const network = await this.gateway.getNetwork(channelName);
            
            const listener = await network.addBlockListener(
                async (event) => {
                    for (const action of event.actionList) {
                        if (action.payload && action.payload.events) {
                            for (const eventData of action.payload.events) {
                                if (eventData.eventName === eventName) {
                                    const payload = JSON.parse(eventData.payload.toString());
                                    callback(payload);
                                }
                            }
                        }
                    }
                },
                { startBlock: 'newest' }
            );

            console.log(`Started listening for ${eventName} events on ${channelName}`);
            return listener;
        } catch (error) {
            console.error(`Failed to start event listener for ${eventName}:`, error);
            throw error;
        }
    }
}

export default new FabricService();