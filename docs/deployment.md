# Deployment Guide

## Prerequisites

- Docker & Docker Compose
- Node.js 20+
- npm 9+

---

## Local Development

### 1. Start Infrastructure

```bash
docker-compose up -d postgres redis
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Build Shared Package

```bash
npm run build:shared
```

### 4. Setup Database

```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed database
npm run db:seed
```

### 5. Start Development Servers

```bash
# Start both frontend and backend
npm run dev

# Or individually:
npm run dev:backend   # NestJS on :4000
npm run dev:frontend  # Next.js on :3000
```

---

## Production Deployment

### Using Docker Compose (Full Stack)

```bash
# Build and start all services
docker-compose up -d --build

# Run migrations
docker-compose exec backend npx prisma migrate deploy

# Seed database (first time only)
docker-compose exec backend npx prisma db seed
```

### Manual Deployment

#### Backend (NestJS)

```bash
cd apps/backend
npm ci
npm run build
NODE_ENV=production npm run start:prod
```

#### Frontend (Next.js)

```bash
cd apps/frontend
npm ci
npm run build
NODE_ENV=production npm start
```

---

## Environment Variables

### Backend (`apps/backend/.env`)

| Variable                 | Description               | Default                          |
|--------------------------|---------------------------|----------------------------------|
| `NODE_ENV`               | Environment mode          | `development`                    |
| `PORT`                   | Backend port              | `4000`                           |
| `DATABASE_URL`           | PostgreSQL connection     | `postgresql://ipl_user:ipl_password@localhost:5432/ipl_betting` |
| `JWT_SECRET`             | JWT signing secret        | (change in production)           |
| `JWT_REFRESH_SECRET`     | Refresh token secret      | (change in production)           |
| `JWT_EXPIRATION`         | Access token TTL          | `15m`                            |
| `JWT_REFRESH_EXPIRATION` | Refresh token TTL         | `7d`                             |
| `REDIS_HOST`             | Redis host                | `localhost`                      |
| `REDIS_PORT`             | Redis port                | `6379`                           |
| `BCRYPT_SALT_ROUNDS`     | Password hash rounds      | `12`                             |
| `REFERRAL_BONUS_AMOUNT`  | Referral bonus            | `10`                             |
| `REFERRAL_BONUS_PERCENTAGE` | Referral commission    | `5`                              |

### Frontend (`apps/frontend/.env`)

| Variable                | Description      | Default                              |
|-------------------------|------------------|--------------------------------------|
| `NEXT_PUBLIC_API_URL`   | Backend API URL  | `http://localhost:4000/api/v1`       |
| `NEXT_PUBLIC_APP_NAME`  | Application name | `IPL Betting`                        |
| `NEXT_PUBLIC_APP_URL`   | Frontend URL     | `http://localhost:3000`              |

---

## Docker Commands

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Rebuild a service
docker-compose up -d --build backend

# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v

# Run DB migration
docker-compose exec backend npx prisma migrate deploy

# Seed DB
docker-compose exec backend npx prisma db seed

# Access Postgres
docker-compose exec postgres psql -U ipl_user -d ipl_betting

# Access Redis
docker-compose exec redis redis-cli
```

---

## API Documentation

Once running, Swagger docs are available at:

```
http://localhost:4000/api/docs
```

---

## Default Credentials (Development)

| Role   | Email            | Password      |
|--------|------------------|---------------|
| Admin  | admin@ipl.com    | admin123      |
| User   | user@demo.com    | password123   |

---

## Monitoring

Health check endpoint:

```
GET /api/v1/health
```

---

## Security Checklist

- [ ] Change JWT secrets in production
- [ ] Enable HTTPS
- [ ] Set strong database password
- [ ] Configure rate limiting
- [ ] Enable audit logging
- [ ] Set proper CORS origins
- [ ] Run security audit (`npm audit`)
