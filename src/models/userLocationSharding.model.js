/**
 * USER-BASED LOCATION HISTORY SHARDING
 * 
 * Alternative approach: Separate collections per user or user groups
 * Better for privacy compliance and user data isolation
 */

import mongoose from 'mongoose';
import crypto from 'crypto';

class UserBasedLocationSharding {
    constructor() {
        this.shardingStrategy = 'user_hash'; // user_individual, user_hash, user_region
        this.shardsCount = 64; // Number of shards for hash-based sharding
        this.models = new Map();
    }

    /**
     * Get collection name based on user ID
     */
    getUserCollectionName(touristId) {
        switch (this.shardingStrategy) {
            case 'user_individual':
                // One collection per user (for VIP/high-value tourists)
                return `location_history_user_${touristId}`;
            
            case 'user_hash':
                // Hash-based sharding for balanced distribution
                const hash = crypto.createHash('md5').update(touristId.toString()).digest('hex');
                const shardId = parseInt(hash.substring(0, 2), 16) % this.shardsCount;
                return `location_history_shard_${shardId}`;
            
            case 'user_region':
                // Region-based sharding (requires tourist region info)
                return `location_history_region_${this.getUserRegion(touristId)}`;
            
            default:
                return `location_history_shard_0`;
        }
    }

    /**
     * Get model for specific user
     */
    getUserModel(touristId) {
        const collectionName = this.getUserCollectionName(touristId);
        
        if (!this.models.has(collectionName)) {
            const model = mongoose.model(
                `LocationHistory_${collectionName}`, 
                locationHistoryBaseSchema, 
                collectionName
            );
            this.models.set(collectionName, model);
        }
        
        return this.models.get(collectionName);
    }

    /**
     * Save location record to user-specific shard
     */
    async saveLocationRecord(locationData) {
        const Model = this.getUserModel(locationData.touristId);
        const record = new Model(locationData);
        return await record.save();
    }

    /**
     * Query user's location history (much faster than cross-shard queries)
     */
    async queryUserLocationHistory(touristId, options = {}) {
        const Model = this.getUserModel(touristId);
        
        const {
            startTime = new Date(Date.now() - 24 * 60 * 60 * 1000),
            endTime = new Date(),
            limit = 100,
            sort = { timestamp: -1 }
        } = options;

        return await Model.find({
            touristId,
            timestamp: { $gte: startTime, $lte: endTime }
        })
        .sort(sort)
        .limit(limit)
        .lean();
    }

    /**
     * GDPR Compliance: Delete all user data
     */
    async deleteUserData(touristId) {
        const Model = this.getUserModel(touristId);
        
        if (this.shardingStrategy === 'user_individual') {
            // Drop entire collection for individual user collections
            await Model.collection.drop();
        } else {
            // Delete user records from shared shard
            await Model.deleteMany({ touristId });
        }
    }

    getUserRegion(touristId) {
        // Implementation to get user's primary region
        // Could be based on registration location, most frequent location, etc.
        return 'default';
    }
}

export const userLocationSharding = new UserBasedLocationSharding();