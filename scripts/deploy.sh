#!/bin/bash

set -e

echo "🚀 Starting Bashrometer deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-production}
COMPOSE_FILE="docker-compose.${ENVIRONMENT}.yml"

echo -e "${YELLOW}Environment: ${ENVIRONMENT}${NC}"

# Check if docker-compose file exists
if [ ! -f "$COMPOSE_FILE" ]; then
    echo -e "${RED}Error: $COMPOSE_FILE not found${NC}"
    exit 1
fi

# Check if environment file exists
ENV_FILE=".env.${ENVIRONMENT}"
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}Error: $ENV_FILE not found${NC}"
    echo "Please copy .env.prod.example to $ENV_FILE and configure it"
    exit 1
fi

# Load environment variables
set -a
source "$ENV_FILE"
set +a

# Create backup directory if it doesn't exist
mkdir -p ./backups

# Backup database before deployment
echo -e "${BLUE}📦 Creating database backup...${NC}"
timestamp=$(date +%Y%m%d_%H%M%S)
if docker-compose -f $COMPOSE_FILE ps db | grep -q "Up"; then
    docker-compose -f $COMPOSE_FILE exec -T db pg_dump -U ${DB_USER} ${DB_NAME} > "./backups/backup_${timestamp}.sql"
    echo -e "${GREEN}✅ Backup created: backup_${timestamp}.sql${NC}"
else
    echo -e "${YELLOW}⚠️ Database not running, skipping backup${NC}"
fi

# Pull latest images
echo -e "${BLUE}📥 Pulling latest images...${NC}"
docker-compose -f $COMPOSE_FILE pull

# Build services
echo -e "${BLUE}🔨 Building services...${NC}"
docker-compose -f $COMPOSE_FILE build --no-cache

# Stop services gracefully
echo -e "${BLUE}⏹️ Stopping services...${NC}"
docker-compose -f $COMPOSE_FILE down --timeout 30

# Start services
echo -e "${BLUE}🚀 Starting services...${NC}"
docker-compose -f $COMPOSE_FILE up -d

# Wait for services to be ready
echo -e "${BLUE}⏳ Waiting for services to be ready...${NC}"
sleep 30

# Health checks
echo -e "${BLUE}🏥 Running health checks...${NC}"
max_attempts=10
attempt=1

while [ $attempt -le $max_attempts ]; do
    if curl -f -s http://localhost/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Application is healthy!${NC}"
        break
    fi
    
    if [ $attempt -eq $max_attempts ]; then
        echo -e "${RED}❌ Health check failed after $max_attempts attempts${NC}"
        echo -e "${YELLOW}📋 Container logs:${NC}"
        docker-compose -f $COMPOSE_FILE logs --tail=50
        exit 1
    fi
    
    echo "⏳ Attempt $attempt/$max_attempts failed, retrying in 10 seconds..."
    sleep 10
    ((attempt++))
done

# Cleanup old images
echo -e "${BLUE}🧹 Cleaning up old images...${NC}"
docker image prune -f

# Show running containers
echo -e "${BLUE}📊 Running containers:${NC}"
docker-compose -f $COMPOSE_FILE ps

echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo -e "${BLUE}📱 Application URLs:${NC}"
echo "   Frontend: https://${DOMAIN:-localhost}"
echo "   API: https://${DOMAIN:-localhost}/api"
if [[ $COMPOSE_FILE == *"prod"* ]]; then
    echo "   Monitoring: https://${DOMAIN:-localhost}:3003 (if enabled)"
fi