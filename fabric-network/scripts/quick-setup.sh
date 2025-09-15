#!/bin/bash
#
# Quick Setup using existing Fabric installation

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}====================================${NC}"
echo -e "${GREEN} Yatra Suraksha Quick Fabric Setup ${NC}"
echo -e "${GREEN}====================================${NC}"

# Navigate to fabric-network directory
cd "$(dirname "$0")/.."

# Load environment variables from .env file if it exists
if [ -f "../../.env" ]; then
    export $(grep -v '^#' ../../.env | xargs)
    echo -e "${GREEN}✅ Loaded environment variables from .env file${NC}"
elif [ -f ".env" ]; then
    export $(grep -v '^#' .env | xargs)
    echo -e "${GREEN}✅ Loaded environment variables from .env file${NC}"
fi

# Function to auto-detect Fabric installation
auto_detect_fabric() {
    echo -e "${YELLOW}🔍 Auto-detecting Hyperledger Fabric installation...${NC}"
    
    # Common installation paths
    POSSIBLE_PATHS=(
        "/home/$USER/fabric-samples"
        "/opt/fabric-samples"
        "/usr/local/fabric-samples"
        "$HOME/fabric-samples"
        "$HOME/hyperledger/fabric-samples"
        "$HOME/Documents/fabric-samples"
        "$HOME/Documents/Projects/fabric-samples"
        "$HOME/Documents/Projects/BLOCKCHAIN/fabric/fabric-samples"
    )
    
    for path in "${POSSIBLE_PATHS[@]}"; do
        if [ -d "$path" ] && [ -f "$path/bin/peer" ]; then
            echo -e "${GREEN}✅ Found Fabric installation at: $path${NC}"
            FABRIC_SAMPLES_PATH="$path"
            return 0
        fi
    done
    
    echo -e "${RED}❌ Could not auto-detect Fabric installation${NC}"
    echo -e "${YELLOW}📋 Please set HYPERLEDGER_FABRIC_PATH in your .env file${NC}"
    echo "   Example: HYPERLEDGER_FABRIC_PATH=/path/to/your/fabric-samples"
    return 1
}

# Set Fabric samples path
if [ -n "$HYPERLEDGER_FABRIC_PATH" ]; then
    FABRIC_SAMPLES_PATH="$HYPERLEDGER_FABRIC_PATH"
    echo -e "${GREEN}📁 Using Fabric path from environment: $FABRIC_SAMPLES_PATH${NC}"
else
    # Try to auto-detect
    if ! auto_detect_fabric; then
        echo -e "${RED}❌ Fabric installation not found. Please:${NC}"
        echo "   1. Install Hyperledger Fabric following: https://hyperledger-fabric.readthedocs.io/en/latest/install.html"
        echo "   2. Set HYPERLEDGER_FABRIC_PATH in your .env file"
        exit 1
    fi
fi

# Verify Fabric installation
if [ ! -d "$FABRIC_SAMPLES_PATH" ]; then
    echo -e "${RED}❌ Fabric samples directory not found at: $FABRIC_SAMPLES_PATH${NC}"
    echo "   Please check your HYPERLEDGER_FABRIC_PATH configuration"
    exit 1
fi

if [ ! -f "$FABRIC_SAMPLES_PATH/bin/peer" ]; then
    echo -e "${RED}❌ Fabric binaries not found at: $FABRIC_SAMPLES_PATH/bin/${NC}"
    echo "   Please ensure Fabric is properly installed"
    exit 1
fi

echo -e "${GREEN}✅ Using Fabric installation at: $FABRIC_SAMPLES_PATH${NC}"
FABRIC_BIN_PATH="$FABRIC_SAMPLES_PATH/bin"

if [ -d "$FABRIC_BIN_PATH" ]; then
    echo -e "${GREEN}Found existing Fabric installation! 🎉${NC}"
    
    # Create symlinks to existing binaries
    echo -e "${YELLOW}Setting up binaries...${NC}"
    if [ ! -d "bin" ]; then
        ln -s "$FABRIC_BIN_PATH" ./bin
        echo "✅ Linked to existing Fabric binaries"
    fi
    
    if [ ! -d "config" ]; then
        ln -s "$FABRIC_SAMPLES_PATH/config" ./config
        echo "✅ Linked to existing Fabric config"
    fi
    
    # Copy useful reference files
    echo -e "${YELLOW}Copying reference configurations...${NC}"
    
    # Copy docker compose examples
    if [ -d "$FABRIC_SAMPLES_PATH/test-network/compose" ]; then
        mkdir -p reference/docker-compose
        cp -r "$FABRIC_SAMPLES_PATH/test-network/compose/"* reference/docker-compose/
        echo "✅ Copied Docker Compose references"
    fi
    
    # Copy network scripts for reference
    if [ -f "$FABRIC_SAMPLES_PATH/test-network/network.sh" ]; then
        mkdir -p reference/scripts
        cp "$FABRIC_SAMPLES_PATH/test-network/network.sh" reference/scripts/network-reference.sh
        cp "$FABRIC_SAMPLES_PATH/test-network/setOrgEnv.sh" reference/scripts/setOrgEnv-reference.sh
        echo "✅ Copied network script references"
    fi
    
    # Copy configtx examples
    if [ -d "$FABRIC_SAMPLES_PATH/test-network/configtx" ]; then
        mkdir -p reference/configtx
        cp -r "$FABRIC_SAMPLES_PATH/test-network/configtx/"* reference/configtx/
        echo "✅ Copied configtx references"
    fi
    
    export PATH=$PWD/bin:$PATH
    
    echo -e "${GREEN}🚀 Setup complete! Using your existing Fabric installation.${NC}"
    echo -e "${YELLOW}Benefits:${NC}"
    echo "  ✅ No additional downloads needed"
    echo "  ✅ Using tested Fabric binaries" 
    echo "  ✅ Reference configurations available"
    echo "  ✅ Faster setup and development"
    
else
    echo -e "${YELLOW}No existing Fabric installation found. Running standard setup...${NC}"
    ./setup-network.sh
fi

echo -e "${GREEN}Ready for next steps:${NC}"
echo "1. npm run fabric:crypto"
echo "2. npm run fabric:start" 
echo "3. npm run fabric:deploy"