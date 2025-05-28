# 🚀 Bashrometer Deployment Guide

## 📋 Prerequisites

- Docker & Docker Compose installed
- Git
- Domain name (for production)
- SSL certificates (for HTTPS)

## 🛠️ Environment Setup

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd bashrometer-fullstack
   ```

2. **Create environment file:**
   ```bash
   cp .env.example .env
   # Edit .env with your values
   ```

3. **Generate JWT Secret:**
   ```bash
   openssl rand -base64 64
   # Copy the output to JWT_SECRET in .env
   ```

## 🐳 Development Deployment

```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop services
docker-compose -f docker-compose.dev.yml down
```

**Access URLs:**
- Frontend: http://localhost:3001
- API: http://localhost:3000
- Database: localhost:5432
- Redis: localhost:6379

## 🎯 Production Deployment

1. **Prepare production environment:**
   ```bash
   # Set production environment variables
   export NODE_ENV=production
   export DB_PASSWORD="$(openssl rand -base64 32)"
   export JWT_SECRET="$(openssl rand -base64 64)"
   export REDIS_PASSWORD="$(openssl rand -base64 32)"
   ```

2. **Deploy with docker-compose:**
   ```bash
   # Build and start production services
   docker-compose -f docker-compose.prod.yml up -d --build

   # Check service health
   docker-compose -f docker-compose.prod.yml ps
   docker-compose -f docker-compose.prod.yml logs
   ```

3. **Setup SSL (Optional but recommended):**
   ```bash
   # Using Let's Encrypt with Certbot
   sudo apt-get install certbot python3-certbot-nginx
   sudo certbot --nginx -d yourdomain.com

   # Or copy your SSL certificates to nginx/ssl/
   mkdir -p nginx/ssl
   cp your-cert.pem nginx/ssl/
   cp your-key.pem nginx/ssl/
   ```

## 🔧 Health Checks

```bash
# Check API health
curl http://localhost:3000/api/health

# Check frontend
curl http://localhost:3001/

# Check all services
docker-compose -f docker-compose.prod.yml exec api npm run health
```

## 📊 Monitoring (Optional)

Enable monitoring with Prometheus & Grafana:

```bash
# Start with monitoring profile
docker-compose -f docker-compose.prod.yml --profile monitoring up -d

# Access monitoring
# Prometheus: http://localhost:9090
# Grafana: http://localhost:3003 (admin/your_grafana_password)
```

## 🗄️ Database Management

```bash
# Backup database
docker-compose exec db pg_dump -U bashrometer bashrometer > backup.sql

# Restore database
docker-compose exec -T db psql -U bashrometer bashrometer < backup.sql

# Access database shell
docker-compose exec db psql -U bashrometer bashrometer
```

## 🔄 CI/CD with GitHub Actions

The repository includes GitHub Actions workflows for:

- **Automated testing** on pull requests
- **Security scanning** with Trivy
- **Docker image building** and pushing to registry
- **Integration tests** with docker-compose

### Setup GitHub Actions:

1. **Enable Actions** in your repository settings
2. **Set repository secrets:**
   - `JWT_SECRET`: Your JWT secret key
   - `DB_PASSWORD`: Database password
   - `REDIS_PASSWORD`: Redis password

3. **Push to main branch** to trigger deployment pipeline

## 🛡️ Security Considerations

### Production Checklist:

- [ ] Use strong passwords for all services
- [ ] Enable SSL/HTTPS
- [ ] Configure firewall rules
- [ ] Set up log rotation
- [ ] Enable automated backups
- [ ] Monitor resource usage
- [ ] Set up alerts for downtime

### Security Headers:
The application includes security headers:
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: origin-when-cross-origin

## 📝 Troubleshooting

### Common Issues:

1. **Services not starting:**
   ```bash
   # Check logs
   docker-compose logs [service-name]
   
   # Check resource usage
   docker stats
   ```

2. **Database connection errors:**
   ```bash
   # Check database is running
   docker-compose exec db pg_isready -U bashrometer
   
   # Reset database
   docker-compose down -v
   docker-compose up -d
   ```

3. **API health check failing:**
   ```bash
   # Check API logs
   docker-compose logs api
   
   # Test API directly
   curl -v http://localhost:3000/api/health
   ```

4. **Frontend build errors:**
   ```bash
   # Check frontend logs
   docker-compose logs frontend
   
   # Rebuild frontend
   docker-compose build frontend
   ```

## 📈 Performance Optimization

### Production Tips:

1. **Resource Limits:** Adjust memory/CPU limits in docker-compose.prod.yml
2. **Database Tuning:** Configure PostgreSQL settings for your workload
3. **Caching:** Enable Redis caching for API responses
4. **CDN:** Use CDN for static assets
5. **Load Balancing:** Scale horizontally with multiple instances

## 🔧 Maintenance

### Regular Tasks:

```bash
# Update dependencies
npm audit fix

# Update Docker images
docker-compose pull
docker-compose up -d

# Clean up unused resources
docker system prune -a

# Database maintenance
docker-compose exec db psql -U bashrometer -c "VACUUM ANALYZE;"
```

## 📞 Support

For deployment issues:
1. Check logs first: `docker-compose logs`
2. Verify environment variables
3. Test health endpoints
4. Check GitHub Issues for known problems

---

**Happy Deploying! 🎉**