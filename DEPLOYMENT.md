# Deployment Guide - EduTech Compiler (Docker & Piston)

This project runs as a multi-container Docker application powered by **Piston** and **Next.js**, connected to an external production database.

---

## Architecture

- **`rashid18/codepiston`**: Piston Code Execution Engine running on port `2000` (isolated sandboxed execution).
- **`rashid18/codecompiler`**: EduTech Next.js Frontend & API running on port `4000`.
- **External Database**: Connects outbound to your PostgreSQL/MySQL server over port `5432`.

---

## 1. Local Machine: Build & Push Images to Docker Hub

```bash
# 1. Login to Docker Hub
docker login

# 2. Build both images
docker compose build

# 3. Push to Docker Hub
docker compose push
```

---

## 2. Remote Server: Pull & Run

### Prerequisites
- Docker & Docker Compose (`curl -fsSL https://get.docker.com | sh`)

### Run on Server:
```bash
# 1. Clone repository (or place docker-compose.yml and .env)
git clone https://github.com/rashid-jr-18/code-compiler-.git app
cd app

# 2. Create .env with external database URL
cp .env.example .env
nano .env

# 3. Pull images from Docker Hub and start containers
docker compose pull
docker compose up -d
```

### Access Application:
- Web App: `http://<YOUR_SERVER_IP>:4000`
- Piston API: `http://<YOUR_SERVER_IP>:2000`
