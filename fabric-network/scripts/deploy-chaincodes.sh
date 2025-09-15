#!/bin/bash
#
# Deploy chaincodes to Yatra Suraksha Network

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Deploying chaincodes...${NC}"

# Navigate to fabric-network directory
cd "$(dirname "$0")/.."

# Set PATH to include fabric binaries
export PATH=$PWD/bin:$PATH

# Package chaincodes
echo -e "${YELLOW}Packaging Digital Tourist ID chaincode...${NC}"
peer lifecycle chaincode package digital-tourist-id.tar.gz \
    --path ./chaincodes/digital-tourist-id.js \
    --lang node \
    --label digital-tourist-id_1.0

echo -e "${YELLOW}Packaging Travel Itinerary Log chaincode...${NC}"
peer lifecycle chaincode package travel-itinerary-log.tar.gz \
    --path ./chaincodes/travel-itinerary-log.js \
    --lang node \
    --label travel-itinerary-log_1.0

echo -e "${YELLOW}Packaging Incident Log chaincode...${NC}"
peer lifecycle chaincode package incident-log.tar.gz \
    --path ./chaincodes/incident-log.js \
    --lang node \
    --label incident-log_1.0

# Install chaincodes on peer
echo -e "${YELLOW}Installing chaincodes on peer...${NC}"

# Set environment for TourismDept peer
export CORE_PEER_TLS_ENABLED=false
export CORE_PEER_LOCALMSPID="TourismDeptMSP"
export CORE_PEER_TLS_ROOTCERT_FILE=$PWD/crypto-config/peerOrganizations/tourismdept.yatrasuraksha.com/peers/peer0.tourismdept.yatrasuraksha.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=$PWD/crypto-config/peerOrganizations/tourismdept.yatrasuraksha.com/users/Admin@tourismdept.yatrasuraksha.com/msp
export CORE_PEER_ADDRESS=localhost:7051

# Install Digital Tourist ID chaincode
docker exec -e CORE_PEER_LOCALMSPID=TourismDeptMSP \
           -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/tourismdept.yatrasuraksha.com/users/Admin@tourismdept.yatrasuraksha.com/msp \
           peer0.tourismdept.yatrasuraksha.com \
           peer lifecycle chaincode install digital-tourist-id.tar.gz

# Get package ID
PACKAGE_ID=$(docker exec peer0.tourismdept.yatrasuraksha.com peer lifecycle chaincode queryinstalled | grep digital-tourist-id_1.0 | cut -d' ' -f3 | cut -d',' -f1)

# Approve chaincode definition
echo -e "${YELLOW}Approving Digital Tourist ID chaincode definition...${NC}"
docker exec -e CORE_PEER_LOCALMSPID=TourismDeptMSP \
           -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/tourismdept.yatrasuraksha.com/users/Admin@tourismdept.yatrasuraksha.com/msp \
           peer0.tourismdept.yatrasuraksha.com \
           peer lifecycle chaincode approveformyorg -o orderer.yatrasuraksha.com:7050 \
           --channelID digitalid-channel --name digital-tourist-id --version 1.0 \
           --package-id $PACKAGE_ID --sequence 1

# Commit chaincode definition
echo -e "${YELLOW}Committing Digital Tourist ID chaincode definition...${NC}"
docker exec -e CORE_PEER_LOCALMSPID=TourismDeptMSP \
           -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/tourismdept.yatrasuraksha.com/users/Admin@tourismdept.yatrasuraksha.com/msp \
           peer0.tourismdept.yatrasuraksha.com \
           peer lifecycle chaincode commit -o orderer.yatrasuraksha.com:7050 \
           --channelID digitalid-channel --name digital-tourist-id --version 1.0 \
           --sequence 1 --peerAddresses peer0.tourismdept.yatrasuraksha.com:7051

echo -e "${GREEN}Chaincodes deployed successfully!${NC}"
echo -e "${YELLOW}Testing chaincode...${NC}"

# Test chaincode
docker exec -e CORE_PEER_LOCALMSPID=TourismDeptMSP \
           -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/tourismdept.yatrasuraksha.com/users/Admin@tourismdept.yatrasuraksha.com/msp \
           peer0.tourismdept.yatrasuraksha.com \
           peer chaincode invoke -o orderer.yatrasuraksha.com:7050 -C digitalid-channel -n digital-tourist-id \
           -c '{"function":"initLedger","Args":[]}'

echo -e "${GREEN}Deployment completed successfully!${NC}"