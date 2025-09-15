'use strict';

const { Contract } = require('fabric-contract-api');
const crypto = require('crypto');

class TravelItineraryLogContract extends Contract {

    async initLedger(ctx) {
        console.info('============= START : Initialize Travel Itinerary Log Ledger ===========');
        console.info('============= END : Initialize Travel Itinerary Log Ledger ===========');
    }

    // Add itinerary entry
    async addItineraryEntry(ctx, entryData) {
        console.info('============= START : Add Itinerary Entry ===========');
        
        const data = JSON.parse(entryData);
        
        // Generate unique entry ID
        const entryId = this.generateEntryID();
        
        const itineraryEntry = {
            entryId: entryId,
            touristDID: data.touristDID,
            locationIdentifier: data.locationIdentifier, // Standardized location code
            eventType: data.eventType, // 'HOTEL_CHECK_IN', 'TREK_START', 'MONUMENT_VISIT', etc.
            scheduledDateTime: data.scheduledDateTime,
            transactionTimestamp: new Date().toISOString(),
            addedBy: ctx.clientIdentity.getID(),
            locationDetails: {
                name: data.locationName,
                district: data.district,
                state: data.state,
                coordinates: data.coordinates
            },
            metadata: data.metadata || {}
        };

        await ctx.stub.putState(entryId, Buffer.from(JSON.stringify(itineraryEntry)));
        
        // Create composite key for querying by tourist DID
        const touristItineraryKey = ctx.stub.createCompositeKey('tourist~itinerary', [data.touristDID, entryId]);
        await ctx.stub.putState(touristItineraryKey, Buffer.from('\u0000'));
        
        // Emit event for itinerary addition
        const eventPayload = {
            entryId: entryId,
            touristDID: data.touristDID,
            locationIdentifier: data.locationIdentifier,
            eventType: data.eventType,
            scheduledDateTime: data.scheduledDateTime,
            transactionTimestamp: itineraryEntry.transactionTimestamp
        };
        ctx.stub.setEvent('ItineraryEntryAdded', Buffer.from(JSON.stringify(eventPayload)));
        
        console.info('============= END : Add Itinerary Entry ===========');
        return entryId;
    }

    // Update itinerary entry status (for check-ins, completions, etc.)
    async updateEntryStatus(ctx, entryId, statusData) {
        console.info('============= START : Update Entry Status ===========');
        
        const entryAsBytes = await ctx.stub.getState(entryId);
        if (!entryAsBytes || entryAsBytes.length === 0) {
            throw new Error(`Itinerary entry ${entryId} does not exist`);
        }
        
        const entry = JSON.parse(entryAsBytes.toString());
        const data = JSON.parse(statusData);
        
        // Add status update to the entry
        if (!entry.statusUpdates) {
            entry.statusUpdates = [];
        }
        
        const statusUpdate = {
            updateId: this.generateUpdateID(),
            status: data.status, // 'CHECKED_IN', 'COMPLETED', 'CANCELLED', 'DELAYED'
            actualDateTime: data.actualDateTime,
            updatedBy: ctx.clientIdentity.getID(),
            updateTimestamp: new Date().toISOString(),
            notes: data.notes || '',
            verificationMethod: data.verificationMethod || 'MANUAL'
        };
        
        entry.statusUpdates.push(statusUpdate);
        entry.lastUpdated = statusUpdate.updateTimestamp;
        
        await ctx.stub.putState(entryId, Buffer.from(JSON.stringify(entry)));
        
        // Emit status update event
        const eventPayload = {
            entryId: entryId,
            touristDID: entry.touristDID,
            locationIdentifier: entry.locationIdentifier,
            eventType: entry.eventType,
            status: data.status,
            actualDateTime: data.actualDateTime,
            updateTimestamp: statusUpdate.updateTimestamp
        };
        ctx.stub.setEvent('ItineraryStatusUpdated', Buffer.from(JSON.stringify(eventPayload)));
        
        console.info('============= END : Update Entry Status ===========');
        return JSON.stringify(statusUpdate);
    }

    // Query itinerary entry
    async queryItineraryEntry(ctx, entryId) {
        const entryAsBytes = await ctx.stub.getState(entryId);
        if (!entryAsBytes || entryAsBytes.length === 0) {
            throw new Error(`Itinerary entry ${entryId} does not exist`);
        }
        return entryAsBytes.toString();
    }

    // Query all itinerary entries for a tourist
    async queryTouristItinerary(ctx, touristDID) {
        const iterator = await ctx.stub.getStateByPartialCompositeKey('tourist~itinerary', [touristDID]);
        const entries = [];
        
        let result = await iterator.next();
        while (!result.done) {
            const compositeKey = result.value.key;
            const splitKey = ctx.stub.splitCompositeKey(compositeKey);
            const entryId = splitKey.attributes[1];
            
            const entryAsBytes = await ctx.stub.getState(entryId);
            if (entryAsBytes && entryAsBytes.length > 0) {
                const entry = JSON.parse(entryAsBytes.toString());
                entries.push(entry);
            }
            
            result = await iterator.next();
        }
        
        await iterator.close();
        
        // Sort by scheduled date time
        entries.sort((a, b) => new Date(a.scheduledDateTime) - new Date(b.scheduledDateTime));
        
        return JSON.stringify(entries);
    }

    // Query itinerary entries by location
    async queryEntriesByLocation(ctx, locationIdentifier) {
        const queryString = {
            selector: {
                locationIdentifier: locationIdentifier
            },
            sort: [
                { scheduledDateTime: 'asc' }
            ]
        };
        
        const iterator = await ctx.stub.getQueryResult(JSON.stringify(queryString));
        const entries = [];
        
        let result = await iterator.next();
        while (!result.done) {
            const entry = JSON.parse(result.value.value.toString());
            entries.push(entry);
            result = await iterator.next();
        }
        
        await iterator.close();
        return JSON.stringify(entries);
    }

    // Query itinerary entries by date range
    async queryEntriesByDateRange(ctx, startDate, endDate) {
        const queryString = {
            selector: {
                scheduledDateTime: {
                    $gte: startDate,
                    $lte: endDate
                }
            },
            sort: [
                { scheduledDateTime: 'asc' }
            ]
        };
        
        const iterator = await ctx.stub.getQueryResult(JSON.stringify(queryString));
        const entries = [];
        
        let result = await iterator.next();
        while (!result.done) {
            const entry = JSON.parse(result.value.value.toString());
            entries.push(entry);
            result = await iterator.next();
        }
        
        await iterator.close();
        return JSON.stringify(entries);
    }

    // Generate unique entry ID
    generateEntryID() {
        const timestamp = Date.now().toString(36);
        const randomStr = crypto.randomBytes(6).toString('hex');
        return `itinerary-${timestamp}-${randomStr}`;
    }

    // Generate unique update ID
    generateUpdateID() {
        const timestamp = Date.now().toString(36);
        const randomStr = crypto.randomBytes(4).toString('hex');
        return `update-${timestamp}-${randomStr}`;
    }
}

module.exports = TravelItineraryLogContract;