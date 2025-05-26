#!/bin/bash

set -e

echo "🔒 Setting up SSL certificates with Let's Encrypt..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check if environment variables are set
if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; then
    echo -e "${RED}Error: DOMAIN and EMAIL environment variables must be set${NC}"
    echo "Please set them in your .env.prod file"
    exit 1
fi

echo -e "${BLUE}Domain: ${DOMAIN}${NC}"
echo -e "${BLUE}Email: ${EMAIL}${NC}"

# Create SSL directory
mkdir -p ./nginx/ssl

# Stop nginx if running
echo -e "${YELLOW}Stopping nginx...${NC}"
docker-compose -f docker-compose.prod.yml stop nginx || true

# Generate initial certificate
echo -e "${BLUE}📜 Generating initial SSL certificate...${NC}"

# Create temporary nginx config for initial certificate
cat > ./nginx/ssl-setup.conf << EOF
server {
    listen 80;
    server_name ${DOMAIN};
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 301 https://\$host\$request_uri;
    }
}
EOF

# Run certbot
docker run --rm \
    -v $(pwd)/nginx/ssl:/etc/letsencrypt \
    -v $(pwd)/nginx/certbot:/var/www/certbot \
    -p 80:80 \
    certbot/certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email ${EMAIL} \
    --agree-tos \
    --no-eff-email \
    -d ${DOMAIN}

# Copy certificates to nginx directory
echo -e "${BLUE}📋 Setting up certificate files...${NC}"
docker run --rm \
    -v $(pwd)/nginx/ssl:/etc/letsencrypt \
    -v $(pwd)/nginx/ssl:/output \
    alpine/openssl sh -c "
        cp /etc/letsencrypt/live/${DOMAIN}/fullchain.pem /output/
        cp /etc/letsencrypt/live/${DOMAIN}/privkey.pem /output/
        chmod 644 /output/fullchain.pem
        chmod 600 /output/privkey.pem
    "

# Create renewal script
echo -e "${BLUE}⚙️ Setting up auto-renewal...${NC}"
cat > ./scripts/renew-ssl.sh << EOF
#!/bin/bash
docker run --rm \\
    -v \$(pwd)/nginx/ssl:/etc/letsencrypt \\
    -v \$(pwd)/nginx/certbot:/var/www/certbot \\
    certbot/certbot renew \\
    --webroot \\
    --webroot-path=/var/www/certbot

# Reload nginx
docker-compose -f docker-compose.prod.yml exec nginx nginx -s reload
EOF

chmod +x ./scripts/renew-ssl.sh

# Create cron job for renewal
echo -e "${BLUE}📅 Setting up cron job for renewal...${NC}"
(crontab -l 2>/dev/null; echo "0 12 * * * $(pwd)/scripts/renew-ssl.sh >> $(pwd)/logs/ssl-renewal.log 2>&1") | crontab -

echo -e "${GREEN}✅ SSL setup completed!${NC}"
echo -e "${YELLOW}🔄 Now restart your application with: ./scripts/deploy.sh production${NC}"