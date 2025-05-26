# 🚀 Bashrometer Deployment Guide

## Quick Start

### Development
```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f
```

### Production
```bash
# 1. Configure environment
cp .env.prod.example .env.prod
# Edit .env.prod with your actual values

# 2. Deploy
./scripts/deploy.sh production

# 3. Setup SSL (optional)
./scripts/setup-ssl.sh
```

## 📋 Pre-deployment Checklist

### Required Environment Variables (.env.prod)
- [ ] `DB_PASSWORD` - Strong database password
- [ ] `JWT_SECRET` - Strong JWT secret (64+ characters)
- [ ] `ALLOWED_ORIGINS` - Your domain(s)
- [ ] `NEXT_PUBLIC_API_URL` - Your API URL
- [ ] `DOMAIN` - Your domain name
- [ ] `EMAIL` - Your email for SSL certificates

### Infrastructure Requirements
- [ ] Docker & Docker Compose installed
- [ ] Domain name pointed to your server
- [ ] Ports 80 and 443 open
- [ ] At least 2GB RAM
- [ ] At least 10GB free disk space

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐
│   Nginx         │    │   Frontend       │
│   Reverse Proxy │────│   (Next.js)      │
│   SSL/Load Bal. │    │   Port: 3001     │
└─────────────────┘    └──────────────────┘
         │                       │
         │              ┌──────────────────┐
         └──────────────│   API            │
                        │   (Node.js)      │
                        │   Port: 3000     │
                        └──────────────────┘
                                 │
                    ┌──────────────────┐
                    │   PostgreSQL     │
                    │   Port: 5432     │
                    └──────────────────┘
```

## 🔧 Configuration Files

### Docker Files
- `api/Dockerfile.prod` - Production API container
- `frontend/Dockerfile.prod` - Production frontend container
- `docker-compose.dev.yml` - Development environment
- `docker-compose.prod.yml` - Production environment

### Nginx Configuration
- `nginx/nginx.conf` - Main nginx configuration
- `nginx/conf.d/bashrometer.conf` - Site-specific configuration
- `nginx/proxy_params` - Proxy parameters

### Scripts
- `scripts/deploy.sh` - Main deployment script
- `scripts/setup-ssl.sh` - SSL certificate setup
- `scripts/renew-ssl.sh` - Auto-generated renewal script

## 🚀 Deployment Process

1. **Environment Setup**
   ```bash
   cp .env.prod.example .env.prod
   nano .env.prod  # Configure your values
   ```

2. **Initial Deployment**
   ```bash
   ./scripts/deploy.sh production
   ```

3. **SSL Setup (Optional but Recommended)**
   ```bash
   ./scripts/setup-ssl.sh
   ```

4. **Verify Deployment**
   - Check https://yourdomain.com
   - Check https://yourdomain.com/api/health

## 🔒 Security Features

### Container Security
- Non-root users in all containers
- Resource limits set
- Security headers configured
- Rate limiting enabled

### Network Security
- All services in isolated Docker network
- Database not exposed to host
- HTTPS enforced
- CORS properly configured

### Application Security
- JWT authentication
- Password hashing with bcrypt
- SQL injection protection
- XSS protection headers

## 📊 Monitoring & Logging

### Health Checks
- API: `/api/health`
- Database: Built-in PostgreSQL health check
- Frontend: Built-in Next.js health check

### Logging
- Application logs: JSON format with rotation
- Nginx logs: Access and error logs
- Database logs: PostgreSQL logs

### Optional Monitoring Stack
```bash
# Start with monitoring
docker-compose -f docker-compose.prod.yml --profile monitoring up -d

# Access Grafana
https://yourdomain.com:3003
```

## 🔄 Maintenance

### Database Backup
```bash
# Manual backup
docker-compose -f docker-compose.prod.yml exec db pg_dump -U bashrometer bashrometer > backup.sql

# Restore
docker-compose -f docker-compose.prod.yml exec -T db psql -U bashrometer bashrometer < backup.sql
```

### Log Management
```bash
# View logs
docker-compose -f docker-compose.prod.yml logs -f [service]

# Log rotation is automatic via Docker logging driver
```

### Updates
```bash
# Update application
git pull
./scripts/deploy.sh production

# Update system packages
sudo apt update && sudo apt upgrade -y
```

## 🆘 Troubleshooting

### Common Issues

1. **Health Check Failures**
   ```bash
   # Check container status
   docker-compose -f docker-compose.prod.yml ps
   
   # Check logs
   docker-compose -f docker-compose.prod.yml logs api
   ```

2. **SSL Certificate Issues**
   ```bash
   # Check certificate
   openssl x509 -in nginx/ssl/fullchain.pem -text -noout
   
   # Renew manually
   ./scripts/renew-ssl.sh
   ```

3. **Database Connection Issues**
   ```bash
   # Check database
   docker-compose -f docker-compose.prod.yml exec db psql -U bashrometer -d bashrometer -c "SELECT version();"
   ```

### Performance Tuning

1. **Database Optimization**
   - Monitor query performance
   - Add indexes as needed
   - Regular VACUUM and ANALYZE

2. **Frontend Optimization**
   - Enable image optimization
   - Configure CDN if needed
   - Monitor Core Web Vitals

3. **Server Optimization**
   - Monitor resource usage
   - Scale containers as needed
   - Optimize nginx caching

## 📞 Support

- Check logs first: `docker-compose logs`
- Verify environment variables
- Ensure all prerequisites are met
- Check firewall and DNS settings

## 🔮 Next Steps

After successful deployment:

1. **Configure monitoring and alerting**
2. **Set up automated backups**
3. **Implement CI/CD pipeline**
4. **Add performance monitoring**
5. **Plan scaling strategy**