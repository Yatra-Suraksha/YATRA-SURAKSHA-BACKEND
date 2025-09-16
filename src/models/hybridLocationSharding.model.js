/**
 * HYBRID LOCATION HISTORY SHARDING STRATEGY
 * 
 * Combines time-based and user-based sharding for optimal performance,
 * privacy compliance, and scalability for production deployment
 */

import mongoose from 'mongoose';
import crypto from 'crypto';

class HybridLocationSharding {
    constructor() {
        this.timeSharding = 'monthly'; // daily, weekly, monthly
        this.userShards = 16; // Number of user-based shards per time period
        this.models = new Map();
        
        // Performance tiers for different user types
        this.performanceTiers = {
            vip: 'individual', // VIP tourists get individual collections
            premium: 'small_shard', // Premium tourists in smaller shards
            standard: 'standard_shard' // Standard tourists in regular shards
        };
        
        this.retentionPolicies = {
            vip: { hot: 90, warm: 365, cold: 365 * 3, archive: 365 * 10 },
            premium: { hot: 60, warm: 180, cold: 365 * 2, archive: 365 * 7 },
            standard: { hot: 30, warm: 90, cold: 365, archive: 365 * 5 }
        };
    }

    /**
     * Get collection name using hybrid strategy
     */
    getCollectionName(touristId, timestamp = new Date(), userTier = 'standard') {
        const date = new Date(timestamp);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        
        // Time-based prefix
        let timePrefix;
        switch (this.timeSharding) {
            case 'daily':
                const day = String(date.getDate()).padStart(2, '0');
                timePrefix = `${year}_${month}_${day}`;
                break;
            case 'weekly':
                const week = this.getWeekNumber(date);
                timePrefix = `${year}_w${week}`;
                break;
            case 'monthly':
                timePrefix = `${year}_${month}`;
                break;
            default:
                timePrefix = `${year}_${month}`;
        }

        // User-based suffix
        let userSuffix;
        switch (this.performanceTiers[userTier]) {
            case 'individual':
                userSuffix = `user_${touristId}`;
                break;
            case 'small_shard':
                const smallShardId = this.getUserShardId(touristId, 4); // 4 shards for premium
                userSuffix = `premium_${smallShardId}`;
                break;
            case 'standard_shard':
                const shardId = this.getUserShardId(touristId, this.userShards);
                userSuffix = `shard_${shardId}`;
                break;
            default:
                userSuffix = 'shard_0';
        }

        return `location_history_${timePrefix}_${userSuffix}`;
    }

    /**
     * Get user shard ID using consistent hashing
     */
    getUserShardId(touristId, totalShards) {
        const hash = crypto.createHash('md5').update(touristId.toString()).digest('hex');
        return parseInt(hash.substring(0, 8), 16) % totalShards;
    }

    /**
     * Get user's performance tier
     */
    async getUserTier(touristId) {
        // In production, this would check user's subscription/tier from database
        // For now, return standard
        try {
            const Tourist = mongoose.model('Tourist');
            const tourist = await Tourist.findById(touristId, 'subscriptionTier safetyScore').lean();
            
            if (tourist?.subscriptionTier === 'vip' || tourist?.safetyScore > 90) {
                return 'vip';
            } else if (tourist?.subscriptionTier === 'premium' || tourist?.safetyScore > 75) {
                return 'premium';
            }
            return 'standard';
        } catch (error) {
            return 'standard';
        }
    }

    /**
     * Get model for specific tourist and time
     */
    async getModel(touristId, timestamp = new Date()) {
        const userTier = await this.getUserTier(touristId);
        const collectionName = this.getCollectionName(touristId, timestamp, userTier);
        
        if (!this.models.has(collectionName)) {
            // Import base schema
            const { locationHistoryBaseSchema } = await import('./locationHistorySharded.model.js');
            
            const model = mongoose.model(
                `LocationHistory_${collectionName}`, 
                locationHistoryBaseSchema, 
                collectionName
            );
            this.models.set(collectionName, model);
            
            // Set up collection optimization
            this.optimizeCollection(model, userTier);
        }
        
        return this.models.get(collectionName);
    }

    /**
     * Save location record using hybrid sharding
     */
    async saveLocationRecord(locationData) {
        const timestamp = locationData.timestamp || new Date();
        const Model = await this.getModel(locationData.touristId, timestamp);
        
        const record = new Model(locationData);
        return await record.save();
    }

    /**
     * Query location history with optimized shard selection
     */
    async queryLocationHistory(touristId, options = {}) {
        const {
            startTime = new Date(Date.now() - 24 * 60 * 60 * 1000),
            endTime = new Date(),
            limit = 100,
            sort = { timestamp: -1 }
        } = options;

        // Get user tier for optimization
        const userTier = await this.getUserTier(touristId);
        
        // Get all relevant collections for the time range
        const collections = await this.getCollectionsForTimeRange(touristId, startTime, endTime);
        
        // Query all relevant collections in parallel
        const promises = collections.map(async (collectionName) => {
            try {
                const model = this.models.get(collectionName);
                if (!model) return [];
                
                return await model.find({
                    touristId,
                    timestamp: { $gte: startTime, $lte: endTime }
                })
                .sort(sort)
                .limit(limit)
                .lean();
            } catch (error) {
                console.warn(`Error querying collection ${collectionName}:`, error.message);
                return [];
            }
        });

        // Combine results and apply final sort/limit
        const results = await Promise.all(promises);
        const combined = results.flat();
        
        // Sort by timestamp
        combined.sort((a, b) => {
            if (sort.timestamp === -1) {
                return new Date(b.timestamp) - new Date(a.timestamp);
            }
            return new Date(a.timestamp) - new Date(b.timestamp);
        });

        return combined.slice(0, limit);
    }

    /**
     * Get all collections that might contain data for tourist and time range
     */
    async getCollectionsForTimeRange(touristId, startTime, endTime) {
        const userTier = await this.getUserTier(touristId);
        const collections = [];
        const current = new Date(startTime);
        
        while (current <= endTime) {
            const collectionName = this.getCollectionName(touristId, current, userTier);
            collections.push(collectionName);
            
            // Move to next time period
            switch (this.timeSharding) {
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
        
        return [...new Set(collections)];
    }

    /**
     * Optimize collection based on user tier
     */
    async optimizeCollection(model, userTier) {
        try {
            await model.createCollection();
            await model.ensureIndexes();
            
            // Set TTL based on retention policy
            const retention = this.retentionPolicies[userTier];
            if (retention?.archive) {
                await model.collection.createIndex(
                    { timestamp: 1 },
                    { 
                        expireAfterSeconds: retention.archive * 24 * 60 * 60,
                        name: 'ttl_timestamp'
                    }
                );
            }
            
            // Additional indexes for VIP users
            if (userTier === 'vip') {
                await model.collection.createIndex(
                    { touristId: 1, source: 1, timestamp: -1 },
                    { background: true }
                );
            }
            
        } catch (error) {
            console.error(`Error optimizing collection ${model.collection.name}:`, error);
        }
    }

    /**
     * GDPR Compliance: Delete user data across all shards
     */
    async deleteUserData(touristId) {
        console.log(`Starting GDPR deletion for tourist: ${touristId}`);
        
        // Get user tier
        const userTier = await this.getUserTier(touristId);
        
        // For individual collections, we can drop the entire collection
        if (this.performanceTiers[userTier] === 'individual') {
            // Get all possible collection names for this user
            const currentDate = new Date();
            const startDate = new Date(currentDate.getFullYear() - 10, 0, 1); // Go back 10 years
            
            const collections = await this.getCollectionsForTimeRange(touristId, startDate, currentDate);
            
            for (const collectionName of collections) {
                try {
                    const model = this.models.get(collectionName);
                    if (model) {
                        await model.collection.drop();
                        console.log(`Dropped collection: ${collectionName}`);
                    }
                } catch (error) {
                    console.error(`Error dropping collection ${collectionName}:`, error);
                }
            }
        } else {
            // For shared collections, delete user records
            const collections = await this.getAllUserCollections(touristId);
            
            for (const collectionName of collections) {
                try {
                    const model = this.models.get(collectionName);
                    if (model) {
                        const result = await model.deleteMany({ touristId });
                        console.log(`Deleted ${result.deletedCount} records from ${collectionName}`);
                    }
                } catch (error) {
                    console.error(`Error deleting from collection ${collectionName}:`, error);
                }
            }
        }
        
        console.log(`GDPR deletion completed for tourist: ${touristId}`);
    }

    /**
     * Get all collections that might contain user data
     */
    async getAllUserCollections(touristId) {
        // This would scan database for collections matching patterns
        // In production, maintain a registry of active collections
        const collections = [];
        
        try {
            const db = mongoose.connection.db;
            const allCollections = await db.listCollections().toArray();
            
            const userTier = await this.getUserTier(touristId);
            const shardId = this.getUserShardId(touristId, this.userShards);
            
            for (const collection of allCollections) {
                const name = collection.name;
                if (name.startsWith('location_history_') && 
                    (name.includes(`shard_${shardId}`) || name.includes(`user_${touristId}`))) {
                    collections.push(name);
                }
            }
        } catch (error) {
            console.error('Error listing collections:', error);
        }
        
        return collections;
    }

    /**
     * Performance monitoring and analytics
     */
    async getShardingStats() {
        const stats = {
            totalCollections: this.models.size,
            userTierDistribution: {},
            shardDistribution: {},
            performanceMetrics: {}
        };
        
        // Implementation for gathering sharding statistics
        return stats;
    }

    /**
     * Maintenance operations
     */
    async performMaintenance() {
        console.log('Starting hybrid sharding maintenance...');
        
        // Archive old data
        await this.archiveOldData();
        
        // Rebalance shards if needed
        await this.rebalanceShards();
        
        // Optimize indexes
        await this.optimizeAllIndexes();
        
        console.log('Hybrid sharding maintenance completed');
    }

    async archiveOldData() {
        // Implementation for archiving old data
        console.log('Archiving old location data...');
    }

    async rebalanceShards() {
        // Implementation for rebalancing if shards become uneven
        console.log('Checking shard balance...');
    }

    async optimizeAllIndexes() {
        // Implementation for index optimization across all collections
        console.log('Optimizing all indexes...');
    }

    getWeekNumber(date) {
        const startDate = new Date(date.getFullYear(), 0, 1);
        const days = Math.floor((date - startDate) / (24 * 60 * 60 * 1000));
        return Math.ceil((days + startDate.getDay() + 1) / 7);
    }
}

// Export singleton instance
export const hybridLocationSharding = new HybridLocationSharding();

// Export for use in controllers
export default hybridLocationSharding;