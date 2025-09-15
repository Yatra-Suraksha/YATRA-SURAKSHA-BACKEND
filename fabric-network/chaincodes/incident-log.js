'use strict';

const { Contract } = require('fabric-contract-api');
const crypto = require('crypto');

class IncidentLogContract extends Contract {

    async initLedger(ctx) {
        console.info('============= START : Initialize Incident Log Ledger ===========');
        console.info('============= END : Initialize Incident Log Ledger ===========');
    }

    // Log a new incident
    async logIncident(ctx, incidentData) {
        console.info('============= START : Log Incident ===========');
        
        const data = JSON.parse(incidentData);
        
        // Generate unique incident ID
        const incidentId = this.generateIncidentID();
        
        const incident = {
            incidentId: incidentId,
            touristDID: data.touristDID,
            reporterDID: data.reporterDID, // Police unit DID, AI system DID, etc.
            incidentType: data.incidentType, // 'PANIC_BUTTON', 'GEO_FENCE_BREACH', 'ANOMALY_DETECTED', 'E-FIR_GENERATED'
            immutableTimestamp: new Date().toISOString(),
            status: 'LOGGED',
            severity: data.severity || 'MEDIUM', // 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
            locationData: {
                coordinates: data.coordinates,
                address: data.address,
                landmark: data.landmark
            },
            metadata: data.metadata || {},
            loggedBy: ctx.clientIdentity.getID(),
            statusHistory: [{
                status: 'LOGGED',
                timestamp: new Date().toISOString(),
                updatedBy: ctx.clientIdentity.getID()
            }]
        };

        await ctx.stub.putState(incidentId, Buffer.from(JSON.stringify(incident)));
        
        // Create composite keys for efficient querying
        const touristIncidentKey = ctx.stub.createCompositeKey('tourist~incident', [data.touristDID, incidentId]);
        await ctx.stub.putState(touristIncidentKey, Buffer.from('\u0000'));
        
        const typeIncidentKey = ctx.stub.createCompositeKey('type~incident', [data.incidentType, incidentId]);
        await ctx.stub.putState(typeIncidentKey, Buffer.from('\u0000'));
        
        // Emit incident logged event
        const eventPayload = {
            incidentId: incidentId,
            touristDID: data.touristDID,
            reporterDID: data.reporterDID,
            incidentType: data.incidentType,
            severity: data.severity,
            immutableTimestamp: incident.immutableTimestamp,
            status: incident.status
        };
        ctx.stub.setEvent('IncidentLogged', Buffer.from(JSON.stringify(eventPayload)));
        
        console.info('============= END : Log Incident ===========');
        return incidentId;
    }

    // Update incident status
    async updateIncidentStatus(ctx, incidentId, newStatus, updateData) {
        console.info('============= START : Update Incident Status ===========');
        
        const incidentAsBytes = await ctx.stub.getState(incidentId);
        if (!incidentAsBytes || incidentAsBytes.length === 0) {
            throw new Error(`Incident ${incidentId} does not exist`);
        }
        
        const incident = JSON.parse(incidentAsBytes.toString());
        const data = JSON.parse(updateData);
        
        const oldStatus = incident.status;
        incident.status = newStatus;
        incident.lastUpdated = new Date().toISOString();
        
        // Add to status history
        const statusUpdate = {
            status: newStatus,
            timestamp: incident.lastUpdated,
            updatedBy: ctx.clientIdentity.getID(),
            reason: data.reason || '',
            actionTaken: data.actionTaken || '',
            notes: data.notes || ''
        };
        
        incident.statusHistory.push(statusUpdate);
        
        // Add resolution details if resolved
        if (newStatus === 'RESOLVED') {
            incident.resolvedAt = incident.lastUpdated;
            incident.resolvedBy = ctx.clientIdentity.getID();
            incident.resolutionDetails = data.resolutionDetails || '';
        }
        
        await ctx.stub.putState(incidentId, Buffer.from(JSON.stringify(incident)));
        
        // Emit status update event
        const eventPayload = {
            incidentId: incidentId,
            touristDID: incident.touristDID,
            oldStatus: oldStatus,
            newStatus: newStatus,
            updatedBy: statusUpdate.updatedBy,
            updateTimestamp: statusUpdate.timestamp,
            actionTaken: statusUpdate.actionTaken
        };
        ctx.stub.setEvent('IncidentStatusUpdated', Buffer.from(JSON.stringify(eventPayload)));
        
        console.info('============= END : Update Incident Status ===========');
        return JSON.stringify(statusUpdate);
    }

    // Add action taken for incident
    async addIncidentAction(ctx, incidentId, actionData) {
        console.info('============= START : Add Incident Action ===========');
        
        const incidentAsBytes = await ctx.stub.getState(incidentId);
        if (!incidentAsBytes || incidentAsBytes.length === 0) {
            throw new Error(`Incident ${incidentId} does not exist`);
        }
        
        const incident = JSON.parse(incidentAsBytes.toString());
        const data = JSON.parse(actionData);
        
        if (!incident.actionsTaken) {
            incident.actionsTaken = [];
        }
        
        const action = {
            actionId: this.generateActionID(),
            actionType: data.actionType, // 'RESPONSE_DISPATCHED', 'E-FIR_FILED', 'SEARCH_INITIATED'
            performedBy: ctx.clientIdentity.getID(),
            performerDID: data.performerDID,
            timestamp: new Date().toISOString(),
            description: data.description,
            evidence: data.evidence || [],
            outcome: data.outcome || ''
        };
        
        incident.actionsTaken.push(action);
        incident.lastUpdated = action.timestamp;
        
        await ctx.stub.putState(incidentId, Buffer.from(JSON.stringify(incident)));
        
        // Emit action taken event
        const eventPayload = {
            incidentId: incidentId,
            actionId: action.actionId,
            actionType: action.actionType,
            performedBy: action.performedBy,
            timestamp: action.timestamp
        };
        ctx.stub.setEvent('IncidentActionTaken', Buffer.from(JSON.stringify(eventPayload)));
        
        console.info('============= END : Add Incident Action ===========');
        return action.actionId;
    }

    // Query incident
    async queryIncident(ctx, incidentId) {
        const incidentAsBytes = await ctx.stub.getState(incidentId);
        if (!incidentAsBytes || incidentAsBytes.length === 0) {
            throw new Error(`Incident ${incidentId} does not exist`);
        }
        return incidentAsBytes.toString();
    }

    // Query incidents by tourist DID
    async queryIncidentsByTourist(ctx, touristDID) {
        const iterator = await ctx.stub.getStateByPartialCompositeKey('tourist~incident', [touristDID]);
        const incidents = [];
        
        let result = await iterator.next();
        while (!result.done) {
            const compositeKey = result.value.key;
            const splitKey = ctx.stub.splitCompositeKey(compositeKey);
            const incidentId = splitKey.attributes[1];
            
            const incidentAsBytes = await ctx.stub.getState(incidentId);
            if (incidentAsBytes && incidentAsBytes.length > 0) {
                const incident = JSON.parse(incidentAsBytes.toString());
                incidents.push(incident);
            }
            
            result = await iterator.next();
        }
        
        await iterator.close();
        
        // Sort by timestamp (newest first)
        incidents.sort((a, b) => new Date(b.immutableTimestamp) - new Date(a.immutableTimestamp));
        
        return JSON.stringify(incidents);
    }

    // Query incidents by type
    async queryIncidentsByType(ctx, incidentType) {
        const iterator = await ctx.stub.getStateByPartialCompositeKey('type~incident', [incidentType]);
        const incidents = [];
        
        let result = await iterator.next();
        while (!result.done) {
            const compositeKey = result.value.key;
            const splitKey = ctx.stub.splitCompositeKey(compositeKey);
            const incidentId = splitKey.attributes[1];
            
            const incidentAsBytes = await ctx.stub.getState(incidentId);
            if (incidentAsBytes && incidentAsBytes.length > 0) {
                const incident = JSON.parse(incidentAsBytes.toString());
                incidents.push(incident);
            }
            
            result = await iterator.next();
        }
        
        await iterator.close();
        
        // Sort by timestamp (newest first)
        incidents.sort((a, b) => new Date(b.immutableTimestamp) - new Date(a.immutableTimestamp));
        
        return JSON.stringify(incidents);
    }

    // Query active incidents
    async queryActiveIncidents(ctx) {
        const queryString = {
            selector: {
                status: {
                    $in: ['LOGGED', 'ACTION_TAKEN', 'INVESTIGATING']
                }
            },
            sort: [
                { immutableTimestamp: 'desc' }
            ]
        };
        
        const iterator = await ctx.stub.getQueryResult(JSON.stringify(queryString));
        const incidents = [];
        
        let result = await iterator.next();
        while (!result.done) {
            const incident = JSON.parse(result.value.value.toString());
            incidents.push(incident);
            result = await iterator.next();
        }
        
        await iterator.close();
        return JSON.stringify(incidents);
    }

    // Get incident audit trail
    async getIncidentAuditTrail(ctx, incidentId) {
        const incidentAsBytes = await ctx.stub.getState(incidentId);
        if (!incidentAsBytes || incidentAsBytes.length === 0) {
            throw new Error(`Incident ${incidentId} does not exist`);
        }
        
        const incident = JSON.parse(incidentAsBytes.toString());
        
        const auditTrail = {
            incidentId: incidentId,
            immutableTimestamp: incident.immutableTimestamp,
            statusHistory: incident.statusHistory,
            actionsTaken: incident.actionsTaken || [],
            currentStatus: incident.status
        };
        
        return JSON.stringify(auditTrail);
    }

    // Generate unique incident ID
    generateIncidentID() {
        const timestamp = Date.now().toString(36);
        const randomStr = crypto.randomBytes(6).toString('hex');
        return `incident-${timestamp}-${randomStr}`;
    }

    // Generate unique action ID
    generateActionID() {
        const timestamp = Date.now().toString(36);
        const randomStr = crypto.randomBytes(4).toString('hex');
        return `action-${timestamp}-${randomStr}`;
    }
}

module.exports = IncidentLogContract;