/**
 * PRODUCTION-GRADE LOCATION HISTORY SHARDING STRATEGY
 * 
 * This implements time-based partitioning with automated collection management
 * for enterprise-scale location tracking
 */

import mongoose from 'mongoose';

// Base schema that will be used for all sharded collections
const locationHistoryBaseSchema = new mongoose.Schema({
    touristId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tourist',
        required: true,
        index: true
    },
    deviceId: {
        type: String,
        index: true
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number],
            required: true
        }
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    },
    accuracy: {
        type: Number,
        default: 10
    },
    speed: {
        type: Number,
        default: 0
    },
    altitude: Number,
    heading: Number,
    batteryLevel: {
        type: Number,
        min: 0,
        max: 100
    },
    source: {
        type: String,
        enum: ['gps', 'network', 'manual', 'iot_device', 'emergency'],
        default: 'gps'
    },
    networkInfo: {
        provider: String,
        signalStrength: Number,
        connectionType: {
            type: String,
            enum: ['wifi', '4g', '3g', '2g', 'satellite']
        }
    },
    context: {
        activity: {
            type: String,
            enum: ['stationary', 'walking', 'running', 'driving', 'cycling', 'unknown']
        },
        confidence: Number,
        weather: String,
        temperature: Number
    }
}, {
    timestamps: false
    // Collection name will be dynamic based on time period
});

// Optimized indexes for performance
locationHistoryBaseSchema.index({ location: '2dsphere' });
locationHistoryBaseSchema.index({ touristId: 1, timestamp: -1 });
locationHistoryBaseSchema.index({ timestamp: 1 });
locationHistoryBaseSchema.index({ source: 1, timestamp: -1 });
locationHistoryBaseSchema.index({ touristId: 1, source: 1, timestamp: -1 }); // Compound for queries

/**
 * Location History Sharding Manager
 * Manages time-based collection sharding for scalable location storage
 */
class LocationHistoryShardManager {
    constructor() {
        this.shardingStrategy = 'monthly'; // daily, weekly, monthly
        this.models = new Map(); // Cache for collection models
        this.retentionPolicy = {
            hot: 30, // days - frequently accessed
            warm: 180, // days - occasionally accessed  
            cold: 365 * 2, // days - rarely accessed
            archive: 365 * 7 // days - archived/deleted after this
        };
    }

    /**
     * Get collection name based on timestamp and sharding strategy
     */
    getCollectionName(timestamp = new Date()) {
        const date = new Date(timestamp);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        switch (this.shardingStrategy) {
            case 'daily':
                return `location_history_${year}_${month}_${day}`;
            case 'weekly':
                const weekNumber = this.getWeekNumber(date);
                return `location_history_${year}_w${weekNumber}`;
            case 'monthly':
                return `location_history_${year}_${month}`;
            default:
                return `location_history_${year}_${month}`;
        }
    }

    /**
     * Get model for specific time period
     */
    getModel(timestamp = new Date()) {
        const collectionName = this.getCollectionName(timestamp);
        
        if (!this.models.has(collectionName)) {
            // Create new model for this collection
            const model = mongoose.model(collectionName, locationHistoryBaseSchema, collectionName);
            this.models.set(collectionName, model);
            
            // Ensure collection exists and is properly indexed
            this.ensureCollectionOptimization(model);
        }
        
        return this.models.get(collectionName);
    }

    /**
     * Save location record to appropriate shard
     */
    async saveLocationRecord(locationData) {
        const timestamp = locationData.timestamp || new Date();
        const Model = this.getModel(timestamp);
        
        const record = new Model(locationData);
        return await record.save();
    }

    /**
     * Query location history across multiple shards
     */
    async queryLocationHistory(touristId, options = {}) {
        const {
            startTime = new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
            endTime = new Date(),
            limit = 100,
            sort = { timestamp: -1 }
        } = options;

        // Determine which collections to query
        const collections = this.getCollectionsForTimeRange(startTime, endTime);
        
        // Query all relevant collections
        const promises = collections.map(async (collectionName) => {
            const Model = this.models.get(collectionName) || this.getModel(startTime);
            
            try {
                return await Model.find({
                    touristId,
                    timestamp: { $gte: startTime, $lte: endTime }
                })
                .sort(sort)
                .limit(limit)
                .lean();
            } catch (error) {
                // Collection might not exist, return empty array
                console.warn(`Collection ${collectionName} not found:`, error.message);
                return [];
            }
        });

        // Combine and sort results
        const results = await Promise.all(promises);
        const combined = results.flat();
        
        // Sort and limit final results
        combined.sort((a, b) => {
            if (sort.timestamp === -1) {
                return new Date(b.timestamp) - new Date(a.timestamp);
            }
            return new Date(a.timestamp) - new Date(b.timestamp);
        });

        return combined.slice(0, limit);
    }

    /**
     * Get collections that might contain data for time range
     */
    getCollectionsForTimeRange(startTime, endTime) {
        const collections = [];
        const current = new Date(startTime);
        
        while (current <= endTime) {
            collections.push(this.getCollectionName(current));
            
            // Move to next period based on sharding strategy
            switch (this.shardingStrategy) {
                case 'daily':
                    current.setDate(current.getDate() + 1);
                    break;
                case 'weekly':
                    current.setDate(current.getDate() + 7);
                    break;
                case 'monthly':
                    current.setMonth(current.getMonth() + 1);
                    break;
            }
        }
        
        return [...new Set(collections)]; // Remove duplicates
    }

    /**
     * Ensure collection is properly optimized
     */
    async ensureCollectionOptimization(Model) {
        try {
            // Create collection if it doesn't exist
            await Model.createCollection();
            
            // Ensure all indexes are created
            await Model.ensureIndexes();
            
            // Set TTL for automatic cleanup (optional)
            if (this.retentionPolicy.archive) {
                await Model.collection.createIndex(
                    { timestamp: 1 },
                    { 
                        expireAfterSeconds: this.retentionPolicy.archive * 24 * 60 * 60,
                        name: 'ttl_timestamp'
                    }
                );
            }
            
            console.log(`Collection ${Model.collection.name} optimized successfully`);
        } catch (error) {
            console.error(`Error optimizing collection ${Model.collection.name}:`, error);
        }
    }

    /**
     * Archive old data to cold storage
     */
    async archiveOldData() {
        // Implementation for moving old data to archive storage
        // This could be MongoDB Atlas Data Lake, AWS S3, etc.
        console.log('Archiving old location data...');
    }

    /**
     * Get week number for weekly sharding
     */
    getWeekNumber(date) {
        const startDate = new Date(date.getFullYear(), 0, 1);
        const days = Math.floor((date - startDate) / (24 * 60 * 60 * 1000));
        return Math.ceil((days + startDate.getDay() + 1) / 7);
    }

    /**
     * Health check and maintenance
     */
    async performMaintenance() {
        console.log('Performing location history maintenance...');
        
        // Archive old data
        await this.archiveOldData();
        
        // Cleanup expired collections
        await this.cleanupExpiredCollections();
        
        // Optimize indexes
        await this.optimizeIndexes();
    }

    async cleanupExpiredCollections() {
        // Implementation for removing very old collections
        console.log('Cleaning up expired collections...');
    }

    async optimizeIndexes() {
        // Implementation for index optimization
        console.log('Optimizing indexes...');
    }
}

// Export singleton instance
export const locationShardManager = new LocationHistoryShardManager();

// Export base schema for reference
export { locationHistoryBaseSchema };

// Backward compatibility - create default model
export const LocationHistory = mongoose.model('LocationHistory', locationHistoryBaseSchema, 'location_history');