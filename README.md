# SIGE Backend

Clean, modular NestJS + Prisma + Better Auth backend starter for SIGE platform hackathon.

## Features

- **Framework**: NestJS v11
- **Database ORM**: Prisma 7 with Postgres Adapter (`@prisma/adapter-pg`)
- **Authentication**: Better Auth with admin and user roles, sessions, and cookies
- **Documentation**: Scalar OpenAPI UI at `/docs`
- **Validation**: Zod + `nestjs-zod` for type-safe environment & DTO validation
- **Logging**: Pino structured logging
- **Docker**: Pre-configured `docker-compose.yml` for PostgreSQL 16
- **Package Manager**: npm

## Getting Started

### 1. Start Database (PostgreSQL)

```bash
docker compose up -d
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run Prisma Migration & Generate Client

```bash
npm run prisma:generate
npm run prisma:migrate:dev --name init
```

### 4. Run Development Server

```bash
npm run start:dev
```

- **API Base URL**: `http://localhost:3000`
- **API Documentation (Scalar)**: `http://localhost:3000/docs`
- **Health Check**: `http://localhost:3000/health/liveness`
- **Prisma Studio**: `npm run prisma:studio`
