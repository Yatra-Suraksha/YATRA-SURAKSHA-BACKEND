#!/bin/bash
#
# Generate crypto materials for Yatra Suraksha Network

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Generating crypto materials...${NC}"

# Navigate to fabric-network directory
cd "$(dirname "$0")/.."

# Set PATH to include fabric binaries
export PATH=$PWD/bin:$PATH

# Generate crypto materials
echo -e "${YELLOW}Generating certificates and keys...${NC}"
cryptogen generate --config=./crypto-config.yaml

# Generate genesis block
echo -e "${YELLOW}Generating genesis block...${NC}"
mkdir -p channel-artifacts
configtxgen -profile YatraSurakshaOrdererGenesis -channelID system-channel -outputBlock ./channel-artifacts/genesis.block

# Generate channel configuration
echo -e "${YELLOW}Generating channel configuration...${NC}"
configtxgen -profile YatraSurakshaChannel -outputCreateChannelTx ./channel-artifacts/channel.tx -channelID digitalid-channel

# Generate anchor peer updates
echo -e "${YELLOW}Generating anchor peer updates...${NC}"
configtxgen -profile YatraSurakshaChannel -outputAnchorPeersUpdate ./channel-artifacts/TourismDeptMSPanchors.tx -channelID digitalid-channel -asOrg TourismDeptMSP

echo -e "${YELLOW}Generating connection profile from template...${NC}"
# Read certificate files and create connection profile
ORDERER_CA_CERT=$(cat crypto-config/ordererOrganizations/yatrasuraksha.com/ca/ca.yatrasuraksha.com-cert.pem | sed ':a;N;$!ba;s/\n/\\n/g')
TOURISMDEPT_CA_CERT=$(cat crypto-config/peerOrganizations/tourismdept.yatrasuraksha.com/ca/ca.tourismdept.yatrasuraksha.com-cert.pem | sed ':a;N;$!ba;s/\n/\\n/g')
POLICE_CA_CERT=$(cat crypto-config/peerOrganizations/police.yatrasuraksha.com/ca/ca.police.yatrasuraksha.com-cert.pem | sed ':a;N;$!ba;s/\n/\\n/g')
EMERGENCY_CA_CERT=$(cat crypto-config/peerOrganizations/emergency.yatrasuraksha.com/ca/ca.emergency.yatrasuraksha.com-cert.pem | sed ':a;N;$!ba;s/\n/\\n/g')

# Generate connection profile from template
sed -e "s|\${ORDERER_CA_CERT}|${ORDERER_CA_CERT}|g" \
    -e "s|\${TOURISMDEPT_CA_CERT}|${TOURISMDEPT_CA_CERT}|g" \
    -e "s|\${POLICE_CA_CERT}|${POLICE_CA_CERT}|g" \
    -e "s|\${EMERGENCY_CA_CERT}|${EMERGENCY_CA_CERT}|g" \
    connection-profiles/connection-profile.template.json > connection-profiles/connection-profile.json

echo -e "${GREEN}Crypto materials generated successfully!${NC}"
echo -e "${YELLOW}Files created:${NC}"
echo "- crypto-config/ (certificates and keys)"
echo "- channel-artifacts/ (channel configurations)"
echo "- connection-profiles/connection-profile.json (network connection profile)"