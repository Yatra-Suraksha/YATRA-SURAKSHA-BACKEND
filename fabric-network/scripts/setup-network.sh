#!/bin/bash
#
# Yatra Suraksha Hyperledger Fabric Network Setup Script
# This script sets up a basic development network for testing

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}====================================${NC}"
echo -e "${GREEN} Yatra Suraksha Fabric Network Setup${NC}"
echo -e "${GREEN}====================================${NC}"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}Error: Docker is not running. Please start Docker first.${NC}"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Error: Docker Compose is not installed.${NC}"
    exit 1
fi

# Navigate to fabric-network directory
cd "$(dirname "$0")/.."

echo -e "${YELLOW}Step 1: Installing Hyperledger Fabric Binaries...${NC}"

# Download Hyperledger Fabric binaries if not present
if [ ! -d "bin" ]; then
    echo "Downloading Fabric binaries..."
    curl -sSL https://bit.ly/2ysbOFE | bash -s -- 2.5.4 1.5.5
    export PATH=$PWD/bin:$PATH
else
    echo "Fabric binaries already installed."
    export PATH=$PWD/bin:$PATH
fi

echo -e "${YELLOW}Step 2: Creating Basic Network Configuration...${NC}"

# Create basic docker-compose for development
cat > docker-compose-dev.yml << EOF
version: '3.7'

networks:
  yatrasuraksha:
    name: yatrasuraksha

services:
  orderer.yatrasuraksha.com:
    container_name: orderer.yatrasuraksha.com
    image: hyperledger/fabric-orderer:2.5.4
    environment:
      - FABRIC_LOGGING_SPEC=INFO
      - ORDERER_GENERAL_LISTENADDRESS=0.0.0.0
      - ORDERER_GENERAL_LISTENPORT=7050
      - ORDERER_GENERAL_LOCALMSPID=OrdererMSP
      - ORDERER_GENERAL_LOCALMSPDIR=/var/hyperledger/orderer/msp
      - ORDERER_GENERAL_TLS_ENABLED=false
      - ORDERER_GENERAL_GENESISMETHOD=file
      - ORDERER_GENERAL_GENESISFILE=/var/hyperledger/orderer/orderer.genesis.block
      - ORDERER_GENERAL_CLUSTER_CLIENTCERTIFICATE=/var/hyperledger/orderer/tls/server.crt
      - ORDERER_GENERAL_CLUSTER_CLIENTPRIVATEKEY=/var/hyperledger/orderer/tls/server.key
      - ORDERER_GENERAL_CLUSTER_ROOTCAS=[/var/hyperledger/orderer/tls/ca.crt]
    working_dir: /opt/gopath/src/github.com/hyperledger/fabric
    command: orderer
    ports:
      - 7050:7050
    networks:
      - yatrasuraksha

  peer0.tourismdept.yatrasuraksha.com:
    container_name: peer0.tourismdept.yatrasuraksha.com
    image: hyperledger/fabric-peer:2.5.4
    environment:
      - CORE_VM_ENDPOINT=unix:///host/var/run/docker.sock
      - CORE_VM_DOCKER_HOSTCONFIG_NETWORKMODE=yatrasuraksha
      - FABRIC_LOGGING_SPEC=INFO
      - CORE_PEER_TLS_ENABLED=false
      - CORE_PEER_PROFILE_ENABLED=false
      - CORE_PEER_TLS_CERT_FILE=/etc/hyperledger/fabric/tls/server.crt
      - CORE_PEER_TLS_KEY_FILE=/etc/hyperledger/fabric/tls/server.key
      - CORE_PEER_TLS_ROOTCERT_FILE=/etc/hyperledger/fabric/tls/ca.crt
      - CORE_PEER_ID=peer0.tourismdept.yatrasuraksha.com
      - CORE_PEER_ADDRESS=peer0.tourismdept.yatrasuraksha.com:7051
      - CORE_PEER_LISTENADDRESS=0.0.0.0:7051
      - CORE_PEER_CHAINCODEADDRESS=peer0.tourismdept.yatrasuraksha.com:7052
      - CORE_PEER_CHAINCODELISTENADDRESS=0.0.0.0:7052
      - CORE_PEER_GOSSIP_BOOTSTRAP=peer0.tourismdept.yatrasuraksha.com:7051
      - CORE_PEER_GOSSIP_EXTERNALENDPOINT=peer0.tourismdept.yatrasuraksha.com:7051
      - CORE_PEER_LOCALMSPID=TourismDeptMSP
      - CORE_OPERATIONS_LISTENADDRESS=peer0.tourismdept.yatrasuraksha.com:9444
      - CORE_METRICS_PROVIDER=prometheus
      - CHAINCODE_AS_A_SERVICE_BUILDER_CONFIG={"peername":"peer0tourismdept"}
      - CORE_CHAINCODE_EXECUTETIMEOUT=300s
    volumes:
      - /var/run/:/host/var/run/
      - ./crypto-config/peerOrganizations/tourismdept.yatrasuraksha.com/peers/peer0.tourismdept.yatrasuraksha.com/msp:/etc/hyperledger/fabric/msp
      - ./crypto-config/peerOrganizations/tourismdept.yatrasuraksha.com/peers/peer0.tourismdept.yatrasuraksha.com/tls:/etc/hyperledger/fabric/tls
      - peer0.tourismdept.yatrasuraksha.com:/var/hyperledger/production
    working_dir: /opt/gopath/src/github.com/hyperledger/fabric/peer
    command: peer node start
    ports:
      - 7051:7051
      - 9444:9444
    networks:
      - yatrasuraksha

volumes:
  peer0.tourismdept.yatrasuraksha.com:
EOF

echo -e "${YELLOW}Step 3: Creating crypto configuration...${NC}"

# Create crypto config for development
cat > crypto-config.yaml << EOF
OrdererOrgs:
  - Name: Orderer
    Domain: yatrasuraksha.com
    Specs:
      - Hostname: orderer

PeerOrgs:
  - Name: TourismDept
    Domain: tourismdept.yatrasuraksha.com
    EnableNodeOUs: true
    Template:
      Count: 1
    Users:
      Count: 1

  - Name: Police
    Domain: police.yatrasuraksha.com
    EnableNodeOUs: true
    Template:
      Count: 1
    Users:
      Count: 1

  - Name: Emergency
    Domain: emergency.yatrasuraksha.com
    EnableNodeOUs: true
    Template:
      Count: 1
    Users:
      Count: 1
EOF

echo -e "${YELLOW}Step 4: Creating configtx.yaml...${NC}"

cat > configtx.yaml << EOF
Organizations:
  - &OrdererOrg
    Name: OrdererOrg
    ID: OrdererMSP
    MSPDir: crypto-config/ordererOrganizations/yatrasuraksha.com/msp
    Policies:
      Readers:
        Type: Signature
        Rule: "OR('OrdererMSP.member')"
      Writers:
        Type: Signature
        Rule: "OR('OrdererMSP.member')"
      Admins:
        Type: Signature
        Rule: "OR('OrdererMSP.admin')"
    OrdererEndpoints:
      - orderer.yatrasuraksha.com:7050

  - &TourismDept
    Name: TourismDeptMSP
    ID: TourismDeptMSP
    MSPDir: crypto-config/peerOrganizations/tourismdept.yatrasuraksha.com/msp
    Policies:
      Readers:
        Type: Signature
        Rule: "OR('TourismDeptMSP.admin', 'TourismDeptMSP.peer', 'TourismDeptMSP.client')"
      Writers:
        Type: Signature
        Rule: "OR('TourismDeptMSP.admin', 'TourismDeptMSP.client')"
      Admins:
        Type: Signature
        Rule: "OR('TourismDeptMSP.admin')"
      Endorsement:
        Type: Signature
        Rule: "OR('TourismDeptMSP.peer')"

Capabilities:
  Channel: &ChannelCapabilities
    V2_0: true
  Orderer: &OrdererCapabilities
    V2_0: true
  Application: &ApplicationCapabilities
    V2_0: true

Application: &ApplicationDefaults
  Organizations:
  Policies:
    Readers:
      Type: ImplicitMeta
      Rule: "ANY Readers"
    Writers:
      Type: ImplicitMeta
      Rule: "ANY Writers"
    Admins:
      Type: ImplicitMeta
      Rule: "MAJORITY Admins"
    LifecycleEndorsement:
      Type: ImplicitMeta
      Rule: "MAJORITY Endorsement"
    Endorsement:
      Type: ImplicitMeta
      Rule: "MAJORITY Endorsement"
  Capabilities:
    <<: *ApplicationCapabilities

Orderer: &OrdererDefaults
  OrdererType: solo
  Addresses:
    - orderer.yatrasuraksha.com:7050
  BatchTimeout: 2s
  BatchSize:
    MaxMessageCount: 10
    AbsoluteMaxBytes: 99 MB
    PreferredMaxBytes: 512 KB
  Organizations:
  Policies:
    Readers:
      Type: ImplicitMeta
      Rule: "ANY Readers"
    Writers:
      Type: ImplicitMeta
      Rule: "ANY Writers"
    Admins:
      Type: ImplicitMeta
      Rule: "MAJORITY Admins"
    BlockValidation:
      Type: ImplicitMeta
      Rule: "ANY Writers"

Channel: &ChannelDefaults
  Policies:
    Readers:
      Type: ImplicitMeta
      Rule: "ANY Readers"
    Writers:
      Type: ImplicitMeta
      Rule: "ANY Writers"
    Admins:
      Type: ImplicitMeta
      Rule: "MAJORITY Admins"
  Capabilities:
    <<: *ChannelCapabilities

Profiles:
  YatraSurakshaOrdererGenesis:
    <<: *ChannelDefaults
    Orderer:
      <<: *OrdererDefaults
      Organizations:
        - *OrdererOrg
      Capabilities:
        <<: *OrdererCapabilities
    Consortiums:
      SampleConsortium:
        Organizations:
          - *TourismDept

  YatraSurakshaChannel:
    Consortium: SampleConsortium
    <<: *ChannelDefaults
    Application:
      <<: *ApplicationDefaults
      Organizations:
        - *TourismDept
      Capabilities:
        <<: *ApplicationCapabilities
EOF

echo -e "${GREEN}Network configuration files created successfully!${NC}"
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Run: ./generate-crypto.sh (to generate crypto materials)"
echo "2. Run: ./start-network.sh (to start the development network)"
echo "3. Run: ./deploy-chaincodes.sh (to deploy smart contracts)"