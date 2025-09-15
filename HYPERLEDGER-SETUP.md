# 🔗 Hyperledger Fabric Setup Guide - Yatra Suraksha

This guide provides step-by-step instructions for setting up and configuring Hyperledger Fabric blockchain network for the Yatra Suraksha tourism safety system.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Detailed Setup](#detailed-setup)
- [Smart Contracts Overview](#smart-contracts-overview)
- [Network Architecture](#network-architecture)
- [Development Workflow](#development-workflow)
- [Troubleshooting](#troubleshooting)
- [Production Deployment](#production-deployment)

## 🚀 Prerequisites

Before setting up Hyperledger Fabric, ensure you have the following installed:

### Required Software

1. **Docker** (v20.10.7 or higher)
   ```bash
   # Install Docker
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   
   # Add user to docker group
   sudo usermod -aG docker $USER
   newgrp docker
   
   # Verify installation
   docker --version
   docker-compose --version
   ```

2. **Node.js** (v16.x or higher)
   ```bash
   # Already installed in your project
   node --version
   npm --version
   ```

3. **Git** (for downloading Fabric binaries)
   ```bash
   sudo apt-get install git
   ```

### System Requirements

- **RAM**: Minimum 8GB (16GB recommended)
- **Storage**: 10GB free space
- **Ports**: 7050, 7051, 7054, 8051, 8054, 9051, 9054 should be available

## ⚡ Quick Start

### Option 1: Development Mode (Recommended for Testing)

```bash
# 1. Set Fabric network to disabled for development
# In .env file: FABRIC_NETWORK_ENABLED=false

# 2. Start your application
npm run dev

# 3. Test OCR and other features without blockchain
# Your app will return mock blockchain responses
```

### Option 2: Full Blockchain Setup

```bash
# 1. Setup Fabric network (downloads binaries and creates configs)
npm run fabric:setup

# 2. Generate crypto materials (certificates and keys)
npm run fabric:crypto

# 3. Start the Fabric network
npm run fabric:start

# 4. Deploy smart contracts
npm run fabric:deploy

# 5. Enable Fabric in environment
# In .env file: FABRIC_NETWORK_ENABLED=true

# 6. Start your application
npm run dev
```

## 🔧 Detailed Setup

### Step 1: Initial Network Setup

```bash
# Navigate to your project directory
cd /path/to/YATRA-SURAKSHA-BACKEND

# Setup Fabric network infrastructure
npm run fabric:setup
```

**What this does:**
- Downloads Hyperledger Fabric binaries (fabric-tools)
- Creates Docker Compose configuration
- Sets up network topology files
- Creates crypto-config templates

### Step 2: Generate Cryptographic Materials

```bash
# Generate certificates and keys for all network participants
npm run fabric:crypto
```

**What this creates:**
- `/fabric-network/crypto-config/` - All certificates and private keys
- `/fabric-network/channel-artifacts/` - Channel configuration files
- Genesis block for the orderer
- Channel transaction files

### Step 3: Start the Network

```bash
# Start Docker containers for the blockchain network
npm run fabric:start
```

**What this starts:**
- Orderer node (orderer.yatrasuraksha.com:7050)
- Tourism Department peer (peer0.tourismdept.yatrasuraksha.com:7051)
- Police peer (peer0.police.yatrasuraksha.com:8051)
- Emergency Services peer (peer0.emergency.yatrasuraksha.com:9051)
- Certificate Authorities for each organization

### Step 4: Deploy Smart Contracts

```bash
# Deploy all chaincodes to the network
npm run fabric:deploy
```

**Deploys:**
- Digital Tourist ID Chaincode
- Travel Itinerary Log Chaincode
- Incident Log Chaincode

### Step 5: Enable Fabric Integration

Edit your `.env` file:

```properties
# Change this line from false to true
FABRIC_NETWORK_ENABLED=true
```

### Step 6: Start Your Application

```bash
# Start the Node.js server with Fabric integration
npm run dev
```

## 📜 Smart Contracts Overview

### 1. Digital Tourist ID Chaincode (`digital-tourist-id.js`)

**Purpose**: Manages decentralized digital identities for tourists

**Key Functions:**
- `issueTouristID()` - Issue new digital ID with KYC verification
- `verifyTouristID()` - Verify ID authenticity
- `updateTouristIDStatus()` - Update ID status (active/revoked)
- `queryTouristID()` - Retrieve ID information
- `verifyDocumentHash()` - Verify document integrity

**Data Stored On-Chain:**
```json
{
  "did": "did:tourist:1693234567-abc123",
  "issuerDID": "did:tourismdept:gov-ts", 
  "status": "ACTIVE",
  "issueDate": "2025-09-15T10:30:00Z",
  "expiryDate": "2025-12-15T23:59:59Z",
  "kycDocumentHash": "sha256:e3b0c44298fc1c149...",
  "documentType": "AADHAAR"
}
```

### 2. Travel Itinerary Log Chaincode (`travel-itinerary-log.js`)

**Purpose**: Creates immutable log of tourist movements and activities

**Key Functions:**
- `addItineraryEntry()` - Log planned travel activities
- `updateEntryStatus()` - Update with actual check-ins/completions
- `queryTouristItinerary()` - Get complete travel history
- `queryEntriesByLocation()` - Find all tourists at a location
- `queryEntriesByDateRange()` - Time-based queries

**Data Stored On-Chain:**
```json
{
  "entryId": "itinerary-1693234567-def456",
  "touristDID": "did:tourist:1693234567-abc123",
  "locationIdentifier": "GOA-BEACH-CALANGUTE-001",
  "eventType": "HOTEL_CHECK_IN",
  "scheduledDateTime": "2025-09-20T15:00:00Z",
  "transactionTimestamp": "2025-09-15T10:30:00Z"
}
```

### 3. Incident Log Chaincode (`incident-log.js`)

**Purpose**: Immutable emergency incident recording and response tracking

**Key Functions:**
- `logIncident()` - Record safety incidents
- `updateIncidentStatus()` - Track response progress
- `addIncidentAction()` - Log actions taken
- `queryIncidentsByTourist()` - Get tourist's incident history
- `queryActiveIncidents()` - Get ongoing emergencies
- `getIncidentAuditTrail()` - Complete response audit

**Data Stored On-Chain:**
```json
{
  "incidentId": "incident-1693234567-ghi789",
  "touristDID": "did:tourist:1693234567-abc123", 
  "reporterDID": "did:police:mumbai-station-001",
  "incidentType": "PANIC_BUTTON",
  "immutableTimestamp": "2025-09-15T10:30:00Z",
  "status": "LOGGED",
  "severity": "HIGH"
}
```

## 🏗️ Network Architecture

### Organizations
- **Tourism Department**: Issues and manages digital IDs
- **Police**: Verifies IDs and manages incidents
- **Emergency Services**: Responds to emergencies

### Channels
- **digitalid-channel**: Digital identity management
- **travel-channel**: Travel itinerary tracking  
- **incidents-channel**: Emergency incident handling

### Network Topology
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────────┐
│   Tourism Dept  │    │      Police      │    │  Emergency Services │
│                 │    │                  │    │                     │
│ peer0:7051      │    │ peer0:8051       │    │ peer0:9051          │
│ ca:7054         │    │ ca:8054          │    │ ca:9054             │
└─────────────────┘    └──────────────────┘    └─────────────────────┘
         │                       │                        │
         └───────────────────────┼────────────────────────┘
                                 │
                    ┌─────────────────────┐
                    │     Orderer         │
                    │ orderer:7050        │
                    └─────────────────────┘
```

## 💻 Development Workflow

### For Feature Development

1. **Start with Fabric disabled** (faster development):
   ```bash
   # .env file
   FABRIC_NETWORK_ENABLED=false
   
   # Start development
   npm run dev
   ```

2. **Test your APIs** with mock blockchain responses

3. **Enable Fabric when ready** for blockchain integration:
   ```bash
   # .env file  
   FABRIC_NETWORK_ENABLED=true
   
   # Restart server
   npm run dev
   ```

### Testing Blockchain Integration

```bash
# Test Digital ID issuance
curl -X POST http://localhost:3000/api/digital-id/issue \
  -H "Content-Type: application/json" \
  -d '{
    "touristData": {
      "expiryDate": "2025-12-31T23:59:59Z",
      "documentType": "AADHAAR",
      "ocrData": {"name": "John Doe", "dob": "1990-01-01"}
    }
  }'

# Test ID verification
curl -X POST http://localhost:3000/api/digital-id/verify \
  -H "Content-Type: application/json" \
  -d '{"did": "did:tourist:1693234567-abc123"}'
```

### Available NPM Scripts

```bash
# Fabric management
npm run fabric:setup     # Initial setup (run once)
npm run fabric:crypto    # Generate certificates
npm run fabric:start     # Start network
npm run fabric:deploy    # Deploy smart contracts
npm run fabric:stop      # Stop network
npm run fabric:clean     # Complete cleanup

# Application
npm run dev              # Start development server
npm run start            # Start production server
```

## 🐛 Troubleshooting

### Common Issues

#### 1. Docker Permission Denied
```bash
# Solution: Add user to docker group
sudo usermod -aG docker $USER
newgrp docker
```

#### 2. Port Already in Use
```bash
# Check what's using the ports
sudo netstat -tulpn | grep :7050
sudo netstat -tulpn | grep :7051

# Kill processes if needed
sudo pkill -f "docker.*7050"
```

#### 3. Network Startup Fails
```bash
# Check Docker logs
docker logs orderer.yatrasuraksha.com
docker logs peer0.tourismdept.yatrasuraksha.com

# Restart clean
npm run fabric:stop
npm run fabric:clean
npm run fabric:setup
```

#### 4. Chaincode Deployment Fails
```bash
# Check peer logs
docker logs peer0.tourismdept.yatrasuraksha.com

# Redeploy chaincodes
npm run fabric:deploy
```

#### 5. Connection Refused Errors
```bash
# Verify containers are running
docker ps

# Check network connectivity
docker network ls
docker network inspect yatrasuraksha
```

### Debugging Commands

```bash
# Check container status
docker ps -a

# View container logs
docker logs [container-name]

# Execute commands in peer container
docker exec -it peer0.tourismdept.yatrasuraksha.com bash

# Check channel info
docker exec peer0.tourismdept.yatrasuraksha.com peer channel list

# Query chaincode
docker exec peer0.tourismdept.yatrasuraksha.com \
  peer chaincode query -C digitalid-channel -n digital-tourist-id \
  -c '{"function":"queryTouristID","Args":["did:tourist:test"]}'
```

### Performance Optimization

```bash
# Increase Docker memory (if needed)
# Docker Desktop: Settings > Resources > Memory > 8GB+

# Clean up unused Docker resources
docker system prune -f
docker volume prune -f
```

## 🚀 Production Deployment

### Environment Configuration

For production deployment, update your `.env`:

```properties
NODE_ENV=production
FABRIC_NETWORK_ENABLED=true

# Use production network endpoints
FABRIC_ORDERER_URL=grpcs://orderer.prod.yatrasuraksha.com:7050
FABRIC_PEER_TOURISM_URL=grpcs://peer0.tourismdept.prod.yatrasuraksha.com:7051

# Enable TLS
FABRIC_TLS_ENABLED=true
```

### Security Considerations

1. **Replace development certificates** with production CA-signed certificates
2. **Enable TLS** for all network communications
3. **Use hardware security modules** for key storage
4. **Implement proper access controls** and user management
5. **Set up monitoring** and logging for all network components

### Scaling the Network

1. **Add more peers** per organization for redundancy
2. **Use Raft consensus** with multiple orderer nodes
3. **Implement load balancers** for peer endpoints
4. **Set up backup and disaster recovery** procedures

## 📞 Support

For issues and questions:

1. **Check logs** using the debugging commands above
2. **Review Hyperledger Fabric documentation**: https://hyperledger-fabric.readthedocs.io/
3. **Check project issues**: https://github.com/Yatra-Suraksha/YATRA-SURAKSHA-BACKEND/issues

## 📚 Additional Resources

- [Hyperledger Fabric Documentation](https://hyperledger-fabric.readthedocs.io/)
- [Fabric SDK for Node.js](https://hyperledger.github.io/fabric-sdk-node/)
- [Docker Compose Reference](https://docs.docker.com/compose/)
- [Certificate Authority Guide](https://hyperledger-fabric-ca.readthedocs.io/)

---

**🎯 Happy Blockchain Development!** 

Your Yatra Suraksha system is now ready with enterprise-grade blockchain infrastructure for immutable tourist safety records.