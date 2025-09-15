#!/bin/bash
#
# Stop Yatra Suraksha Hyperledger Fabric Network

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Stopping Yatra Suraksha Fabric Network...${NC}"

# Navigate to fabric-network directory
cd "$(dirname "$0")/.."

# Stop the network
echo -e "${YELLOW}Stopping Docker containers...${NC}"
docker-compose -f docker-compose-dev.yml down

# Clean up volumes (optional - uncomment if you want to remove all data)
# echo -e "${YELLOW}Removing volumes...${NC}"
# docker volume prune -f

echo -e "${GREEN}Network stopped successfully!${NC}"

# Show remaining containers
echo -e "${YELLOW}Remaining containers:${NC}"
docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"