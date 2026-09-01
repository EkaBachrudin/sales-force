# Sales Force - Deployment Guide

## 📁 Project Structure

```
sales-force/
├── docker-compose.yml           # Base docker compose configuration
├── docker-compose.dev.yml       # Development override
├── docker-compose.prod.yml      # Production override
├── .env.example                 # Environment variables template
├── .env.dev                     # Development environment (gitignored)
├── .env                         # Production environment (gitignored)
├── Makefile                     # Command shortcuts
├── docker/
│   ├── init-db.sql             # Database initialization
│   ├── nginx/
│   │   ├── nginx.conf          # Main nginx configuration
│   │   ├── conf.d/
│   │   │   └── default.conf    # Site configuration
│   │   └── ssl/                # SSL certificates (production)
│   └── logs/nginx/             # Nginx logs
├── sales-force-be/              # Backend (express)
│   ├── Dockerfile
│   └── src/
└── sales-force-fe-react/         # Frontend (React + Vite)
    ├── Dockerfile
    ├── nginx.conf
    └── src/
```

---

## 🚀 Quick Start

### Prerequisites
- Docker 20.10+
- Docker Compose 2.0+
- Make (optional, for shortcuts)

### Development Mode

```bash
# Using Make (recommended)
make dev

# Or using docker compose directly
docker compose --env-file .env.dev -f docker-compose.yml -f docker-compose.dev.yml up
```

**Access:**
- Frontend: http://localhost:3000
- Backend: http://localhost:4000
- Database: localhost:5432

### Development with Nginx

```bash
make dev-nginx
```

**Access:**
- Application: http://localhost:8080

---

## 🖥️ Production Deployment

### 1. Prepare Environment

```bash
# Copy environment template
cp .env.example .env

# Edit with production values
nano .env
```

### 2. Configure SSL (Optional but Recommended)

```bash
# Generate self-signed certificate (for testing)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout docker/nginx/ssl/key.pem \
  -out docker/nginx/ssl/cert.pem

# OR use Let's Encrypt (recommended for production)
certbot certonly --standalone -d your-domain.com
```

### 3. Deploy to VPS

```bash
# Build and start production containers
make prod-build
make prod

# Or in one command
docker compose --env-file .env -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

### 4. Verify Deployment

```bash
# Check all services
docker compose ps

# Check logs
make logs

# Health check
curl http://localhost/health
```

---

## 🛠️ Management Commands

### Using Make

```bash
make help          # Show all available commands
make up            # Start all services
make down          # Stop all services
make restart       # Restart all services
make logs          # Show logs from all services
make logs-fe       # Show frontend logs
make logs-be       # Show backend logs
make logs-db       # Show database logs
make logs-nginx    # Show nginx logs
```

### Using Docker Compose

```bash
# View logs
docker compose logs -f                    # All services
docker compose logs -f frontend          # Frontend only
docker compose logs -f backend           # Backend only
docker compose logs -f postgres          # Database only

# Restart service
docker compose restart backend

# Rebuild service
docker compose up -d --build frontend

# Execute command in container
docker compose exec backend sh
docker compose exec postgres psql -U postgres -d salesforce
```

---

## 🗄️ Database Management

### Connect to Database

```bash
# Using Make
make db-connect

# Using docker compose
docker compose exec postgres psql -U postgres -d salesforce
```

### Reset Database

```bash
# WARNING: Deletes all data
make db-reset
```

### Database Backup

```bash
# Backup
docker compose exec postgres pg_dump -U postgres salesforce > backup.sql

# Restore
docker compose exec -T postgres psql -U postgres salesforce < backup.sql
```

---

## 🔍 Troubleshooting

### Check Service Health

```bash
# All services
docker compose ps

# Specific service logs
docker compose logs frontend
docker compose logs backend
docker compose logs postgres
docker compose logs nginx
```

### Common Issues

1. **Port already in use**
   ```bash
   # Change ports in .env file
   FRONTEND_PORT=3001
   BACKEND_PORT=4001
   ```

2. **Database connection failed**
   ```bash
   # Check if database is healthy
   docker compose ps postgres
   docker compose logs postgres
   ```

3. **Frontend build failed**
   ```bash
   # Rebuild without cache
   docker compose build --no-cache frontend
   ```

4. **Permission denied on nginx logs**
   ```bash
   sudo mkdir -p docker/logs/nginx
   sudo chown -R $USER:$USER docker/logs/nginx
   ```

---

## 🔄 Development Workflow

### Local Development with Hot Reload

```bash
# Start development mode
make dev

# Your changes are automatically reflected:
# - Frontend: Vite hot reload
# - Backend: Nodemon watches for changes
# - Database: Data persists in volume
```

### Running Tests

```bash
# Backend tests
docker compose exec backend npm test

# Frontend tests
docker compose exec frontend npm test
```

---

## 🔐 Security Best Practices

1. **Environment Variables**
   - Never commit `.env` files
   - Use strong passwords in production
   - Generate secure `JWT_SECRET`

2. **SSL/TLS**
   - Always use HTTPS in production
   - Use Let's Encrypt for free SSL certificates
   - Keep certificates up to date

3. **Database**
   - Don't expose port 5432 in production
   - Use strong password
   - Regular backups

4. **Updates**
   ```bash
   # Pull latest changes
   git pull

   # Rebuild and restart
   docker compose down
   docker compose build --no-cache
   docker compose up -d
   ```

---

## 📊 Monitoring

### View Resource Usage

```bash
docker stats
```

### View Logs

```bash
# All logs
docker compose logs -f

# Specific service
docker compose logs -f backend

# Last 100 lines
docker compose logs --tail=100 backend
```

---

## 🧹 Cleanup

### Remove All Containers and Volumes

```bash
make clean
```

### Remove Unused Images

```bash
docker image prune -a
```

### Remove Unused Volumes

```bash
docker volume prune
```

---

## 📝 Environment Variables Reference

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `FRONTEND_PORT` | Frontend port (dev) | `3000` |
| `BACKEND_PORT` | Backend port (dev) | `4000` |
| `DB_PORT` | Database port (dev) | `5432` |
| `NGINX_HTTP_PORT` | HTTP port | `80` |
| `NGINX_HTTPS_PORT` | HTTPS port | `443` |
| `VITE_API_URL` | API URL for frontend | `http://localhost/api` |
| `JWT_SECRET` | JWT signing key | - |
| `JWT_EXPIRES_IN` | JWT expiration time | `24h` |
| `DB_NAME` | Database name | `salesforce` |
| `DB_USER` | Database user | `postgres` |
| `DB_PASSWORD` | Database password | - |

---

## 🆘 Support

For issues or questions:
1. Check logs: `make logs`
2. Check service status: `docker compose ps`
3. Review configuration files
