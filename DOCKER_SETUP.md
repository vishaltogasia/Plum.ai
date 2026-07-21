# Docker Deployment Guide

This document provides instructions for building and running Plum.ai using Docker and Docker Compose.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- 4GB RAM minimum (8GB+ recommended)
- 20GB disk space for images and volumes

## Quick Start

### 1. Setup Environment Variables

Create a `.env` file in the project root:

```bash
# Database Configuration
DB_USER=plum_user
DB_PASSWORD=your_secure_password_here
DB_NAME=plum_ai
DB_PORT=5432

# Gemini API
GEMINI_API_KEY=your_gemini_api_key_here

# SMTP Configuration
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password

# Ports
BACKEND_PORT=8000
FRONTEND_PORT=5173

# Environment
ENVIRONMENT=production
```

### 2. Build Images

```bash
# Build all services
docker-compose build

# Build specific service
docker-compose build backend  # or frontend
```

### 3. Start Services

```bash
# Start all services in the background
docker-compose up -d

# View logs
docker-compose logs -f

# Specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

### 4. Access Applications

- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Frontend**: http://localhost:5173

### 5. Run Database Migrations

```bash
# Enter the backend container
docker-compose exec backend bash

# Run Alembic migrations
alembic upgrade head

# Exit container
exit
```

### 6. Stop Services

```bash
# Stop all containers
docker-compose down

# Stop and remove volumes (WARNING: deletes data)
docker-compose down -v
```

## Development Setup

For development with hot reload:

```bash
# Use both compose files for development overrides
docker-compose -f docker-compose.yml -f docker-compose.override.yml up

# This enables:
# - Volume mounting for live code reload
# - Development environment variables
# - Faster build times
```

## Production Deployment

### Building for Production

```bash
# Build with production settings
docker-compose build --no-cache

# Optimize image size
DOCKER_BUILDKIT=1 docker-compose build
```

### Security Checklist

- [ ] Change all default passwords in `.env`
- [ ] Use strong database passwords (20+ characters)
- [ ] Enable HTTPS with reverse proxy (Nginx/Caddy)
- [ ] Set `ENVIRONMENT=production` in `.env`
- [ ] Configure firewall to restrict access
- [ ] Set up proper backup strategy
- [ ] Enable rate limiting on public endpoints
- [ ] Configure proper CORS origins

### Docker Compose Production Template

```yaml
version: '3.9'

services:
  backend:
    restart: always
    environment:
      ENVIRONMENT: production

  frontend:
    restart: always

  postgres:
    restart: always
    environment:
      POSTGRES_INITDB_ARGS: "-c max_connections=200"

  chromadb:
    restart: always

  redis:
    restart: always
```

## Monitoring

### Health Checks

All services include health checks. View status:

```bash
docker-compose ps
```

### View Resource Usage

```bash
docker stats

# Specific container
docker stats plum-ai-backend
```

### Check Logs

```bash
# All logs
docker-compose logs

# Follow logs
docker-compose logs -f backend

# Last 100 lines
docker-compose logs --tail=100 backend

# Specific time range
docker-compose logs --since 5m backend
```

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker-compose logs backend

# Rebuild without cache
docker-compose build --no-cache backend

# Remove and restart
docker-compose down
docker-compose up --build
```

### Database Connection Issues

```bash
# Test database connection
docker-compose exec backend python -c "
import psycopg2
import os
conn = psycopg2.connect(os.environ['DATABASE_URL'])
print('Database connected successfully')
"
```

### Port Already in Use

```bash
# Change ports in .env
BACKEND_PORT=8001
FRONTEND_PORT=5174

# Or find process using port (Linux/Mac)
lsof -i :8000
```

### Out of Disk Space

```bash
# Clean up Docker
docker system prune -a

# Remove specific volume
docker volume rm plum-ai_postgres_data  # WARNING: Deletes data

# Check disk usage
docker system df
```

## Backup and Restore

### Backup Database

```bash
docker-compose exec postgres pg_dump -U plum_user plum_ai > backup.sql
```

### Restore Database

```bash
docker-compose exec -T postgres psql -U plum_user plum_ai < backup.sql
```

### Backup Volumes

```bash
# Backup all volumes
docker run --rm -v plum-ai_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_backup.tar.gz -C /data .

# Restore volumes
docker run --rm -v plum-ai_postgres_data:/data -v $(pwd):/backup alpine tar xzf /backup/postgres_backup.tar.gz -C /data
```

## Scaling

### Run Multiple Backend Instances

```yaml
services:
  backend-1:
    # ... backend config

  backend-2:
    # ... backend config

  nginx:
    image: nginx:alpine
    # Configure as reverse proxy
```

### Increase Resource Limits

Edit `docker-compose.yml`:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

## Cleanup

```bash
# Stop and remove all containers
docker-compose down

# Remove images
docker rmi plum-ai_backend plum-ai_frontend

# Remove all unused Docker resources
docker system prune -a --volumes

# Remove specific volume
docker volume rm plum-ai_postgres_data
```

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)
- [PostgreSQL Docker Image](https://hub.docker.com/_/postgres)
- [Node.js Docker Image](https://hub.docker.com/_/node)
- [Python Docker Image](https://hub.docker.com/_/python)

## Support

For issues related to Docker setup:

1. Check logs: `docker-compose logs [service]`
2. Review `.env` configuration
3. Ensure all ports are available
4. Check Docker daemon is running
5. Review Docker documentation

---

Last Updated: 2024
