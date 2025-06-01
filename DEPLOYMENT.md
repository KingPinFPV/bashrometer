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

## 🎯 Production Deployment

### Option 1: Full Docker Stack (Recommended)

```bash
# Build and start production environment with nginx
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop services
docker-compose -f docker-compose.prod.yml down
```

**Access URLs:**
- Website: https://yourdomain.com (via nginx)
- Direct Frontend: http://yourserver:3001 (for debugging)
- Direct API: http://yourserver:3000 (for debugging)

### Option 2: Standalone Deployment

If deploying to platforms like Render, Vercel, or direct VPS:

**Frontend:**
```bash
npm run build
npm run start:standalone  # Uses HOSTNAME=0.0.0.0
```

**Start Commands by Platform:**
- **Render**: `npm run start:standalone`
- **Vercel**: Automatic (uses Next.js built-in)
- **Docker**: `node .next/standalone/server.js` (with HOSTNAME=0.0.0.0)
- **PM2**: `pm2 start .next/standalone/server.js --name frontend`

### Environment Variables for Production

```env
# Frontend (.env.local)
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
HOSTNAME=0.0.0.0

# API (.env)
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:pass@host:5432/db
JWT_SECRET=your-64-char-secret
ALLOWED_ORIGINS=https://yourdomain.com
```

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

בשמחה! הנה מדריך הפריסה של Bashrometer בתרגום מלא לעברית, מותאם לסגנון הישראלי:

---

# 🚀 מדריך פריסה — Bashrometer

## 📋 דרישות מקדימות

* התקנת Docker ו-Docker Compose
* התקנת Git
* שם דומיין (לסביבת פרודקשן)
* תעודות SSL (לאתרים מאובטחים/HTTPS)

## 🛠️ הכנת סביבת העבודה

1. **שכפול הריפוזיטורי (Clone):**

   ```bash
   git clone <your-repo-url>
   cd bashrometer-fullstack
   ```

2. **יצירת קובץ משתני סביבה:**

   ```bash
   cp .env.example .env
   # ערוך את .env עם הערכים שלך
   ```

3. **יצירת JWT Secret:**

   ```bash
   openssl rand -base64 64
   # העתק את הפלט למשתנה JWT_SECRET בקובץ .env
   ```

## 🐳 פריסה לסביבת פיתוח

```bash
# הרצת הסביבה בפיתוח
docker-compose -f docker-compose.dev.yml up -d

# צפייה בלוגים
docker-compose -f docker-compose.dev.yml logs -f

# עצירת השירותים
docker-compose -f docker-compose.dev.yml down
```

**כתובות גישה:**

* פרונטנד: [http://localhost:3001](http://localhost:3001)
* API: [http://localhost:3000](http://localhost:3000)
* מסד נתונים: localhost:5432
* Redis: localhost:6379

## 🎯 פריסה לסביבת Production

1. **הכנת משתני סביבה לפרודקשן:**

   ```bash
   # הגדר משתנים לסביבת ייצור
   export NODE_ENV=production
   export DB_PASSWORD="$(openssl rand -base64 32)"
   export JWT_SECRET="$(openssl rand -base64 64)"
   export REDIS_PASSWORD="$(openssl rand -base64 32)"
   ```

2. **פריסה עם docker-compose:**

   ```bash
   # בנייה והרצת השירותים בפרודקשן
   docker-compose -f docker-compose.prod.yml up -d --build

   # בדיקת סטטוס השירותים
   docker-compose -f docker-compose.prod.yml ps
   docker-compose -f docker-compose.prod.yml logs
   ```

3. **הגדרת SSL (אופציונלי אך מומלץ):**

   ```bash
   # התקנת Let's Encrypt עם Certbot
   sudo apt-get install certbot python3-certbot-nginx
   sudo certbot --nginx -d yourdomain.com

   # או העתק את תעודות ה-SSL שלך לתיקייה nginx/ssl/
   mkdir -p nginx/ssl
   cp your-cert.pem nginx/ssl/
   cp your-key.pem nginx/ssl/
   ```

## 🔧 בדיקות בריאות (Health Checks)

```bash
# בדיקת מצב ה-API
curl http://localhost:3000/api/health

# בדיקת הפרונטנד
curl http://localhost:3001/

# בדיקת כל השירותים
docker-compose -f docker-compose.prod.yml exec api npm run health
```

## 📊 ניטור (Monitoring) — אופציונלי

אפשר להפעיל ניטור עם Prometheus & Grafana:

```bash
# הרצת ניטור
docker-compose -f docker-compose.prod.yml --profile monitoring up -d

# גישה לניטור
# Prometheus: http://localhost:9090
# Grafana: http://localhost:3003 (admin/your_grafana_password)
```

## 🗄️ ניהול מסד נתונים

```bash
# גיבוי מסד הנתונים
docker-compose exec db pg_dump -U bashrometer bashrometer > backup.sql

# שחזור מסד נתונים
docker-compose exec -T db psql -U bashrometer bashrometer < backup.sql

# גישה ל-shell של מסד הנתונים
docker-compose exec db psql -U bashrometer bashrometer
```

## 🔄 אינטגרציה רציפה (CI/CD) עם GitHub Actions

הריפוזיטורי כולל Workflows ל-GitHub Actions עבור:

* **בדיקות אוטומטיות** בעת Pull Request
* **סריקות אבטחה** עם Trivy
* **בנייה ודחיפת דוקר** ל-Registry
* **בדיקות אינטגרציה** עם docker-compose

### הגדרת GitHub Actions:

1. **אפשר Actions** בהגדרות הריפו

2. **הגדר משתני סביבה (Secrets) בריפו:**

   * `JWT_SECRET`: מפתח ה-JWT שלך
   * `DB_PASSWORD`: סיסמת מסד נתונים
   * `REDIS_PASSWORD`: סיסמת רדיס

3. **בצע Push ל-main** כדי להפעיל את הצנרת

## 🛡️ שיקולי אבטחה

### צ'קליסט לפרודקשן:

* [ ] השתמש בסיסמאות חזקות לכל השירותים
* [ ] הפעל SSL/HTTPS
* [ ] הגדר חוקים לחומת אש
* [ ] הפעל סבב לוגים אוטומטי (log rotation)
* [ ] הפעל גיבויים אוטומטיים
* [ ] נטר שימוש במשאבים
* [ ] הגדר התרעות לנפילות שירותים

### כותרות אבטחה:

האפליקציה כוללת את הכותרות:

* X-Frame-Options: DENY
* X-Content-Type-Options: nosniff
* X-XSS-Protection: 1; mode=block
* Referrer-Policy: origin-when-cross-origin

## 📝 פתרון בעיות (Troubleshooting)

### תקלות נפוצות:

1. **השירותים לא עולים:**

   ```bash
   # בדוק לוגים
   docker-compose logs [service-name]

   # בדוק שימוש במשאבים
   docker stats
   ```

2. **שגיאות חיבור למסד נתונים:**

   ```bash
   # בדוק שה-DB רץ
   docker-compose exec db pg_isready -U bashrometer

   # איפוס מסד נתונים
   docker-compose down -v
   docker-compose up -d
   ```

3. **בדיקת בריאות ל-API נכשלת:**

   ```bash
   # בדוק לוגי API
   docker-compose logs api

   # בדוק את ה-API ישירות
   curl -v http://localhost:3000/api/health
   ```

4. **שגיאות בבניית הפרונטנד:**

   ```bash
   # בדוק לוגים של הפרונטנד
   docker-compose logs frontend

   # הרץ בנייה מחדש
   docker-compose build frontend
   ```

## 📈 שיפור ביצועים (Performance)

### טיפים לפרודקשן:

1. **הגבלת משאבים:** הגדר memory/CPU ב-docker-compose.prod.yml
2. **כוונון מסד נתונים:** התאם הגדרות PostgreSQL לעומסים שלך
3. **קאשינג:** הפעל Redis ל-caching של תשובות API
4. **CDN:** השתמש ב-CDN למשאבים סטטיים
5. **איזון עומסים:** הפעל מספר אינסטנסים במקביל

## 🔧 תחזוקה שוטפת

### משימות קבועות:

```bash
# עדכון תלויות
npm audit fix

# עדכון דוקר אימג'ים
docker-compose pull
docker-compose up -d

# ניקוי משאבים לא בשימוש
docker system prune -a

# תחזוקת DB
docker-compose exec db psql -U bashrometer -c "VACUUM ANALYZE;"
```

## 📞 תמיכה

לבעיות בפריסה:

1. בדוק לוגים: `docker-compose logs`
2. וודא משתני סביבה נכונים
3. בדוק נקודות health
4. עיין ב-GitHub Issues לבעיות מוכרות

---

**פריסה מוצלחת! 🎉**

---

## Additional Deployment Information (from README-DEPLOYMENT.md)

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

## 🔄 Advanced Maintenance

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

## 🆘 Advanced Troubleshooting

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

## 🔮 Next Steps

After successful deployment:

1. **Configure monitoring and alerting**
2. **Set up automated backups**
3. **Implement CI/CD pipeline**
4. **Add performance monitoring**
5. **Plan scaling strategy**
