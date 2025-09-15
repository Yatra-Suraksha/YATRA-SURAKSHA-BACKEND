#!/bin/bash
#
# Start Yatra Suraksha Hyperledger Fabric Network

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting Yatra Suraksha Fabric Network...${NC}"

# Navigate to fabric-network directory
cd "$(dirname "$0")/.."

# Set PATH to include fabric binaries
export PATH=$PWD/bin:$PATH

# Start the network
echo -e "${YELLOW}Starting Docker containers...${NC}"
docker-compose -f docker-compose-dev.yml up -d

# Wait for containers to start
echo -e "${YELLOW}Waiting for containers to start...${NC}"
sleep 10

# Create channel
echo -e "${YELLOW}Creating channel...${NC}"
docker exec -e CORE_PEER_LOCALMSPID=TourismDeptMSP \
           -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/tourismdept.yatrasuraksha.com/users/Admin@tourismdept.yatrasuraksha.com/msp \
           peer0.tourismdept.yatrasuraksha.com \
           peer channel create -o orderer.yatrasuraksha.com:7050 -c digitalid-channel -f /opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/channel.tx

# Join channel
echo -e "${YELLOW}Joining channel...${NC}"
docker exec -e CORE_PEER_LOCALMSPID=TourismDeptMSP \
           -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/tourismdept.yatrasuraksha.com/users/Admin@tourismdept.yatrasuraksha.com/msp \
           peer0.tourismdept.yatrasuraksha.com \
           peer channel join -b digitalid-channel.block

echo -e "${GREEN}Network started successfully!${NC}"
echo -e "${YELLOW}Network status:${NC}"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo -e "${YELLOW}Next step: Run ./deploy-chaincodes.sh to deploy smart contracts${NC}"