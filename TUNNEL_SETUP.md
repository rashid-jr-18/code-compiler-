# Tmole Tunneling Setup for Brightspace Judge0

This document outlines the setup process for tmole tunneling to enable Brightspace callback access to the local Judge0 instance.

## Prerequisites

1. Docker must be installed and running
2. Judge0 service must be running on port 2358 (via docker-compose)

## Setup Steps

### 1. Install tmole globally
```bash
npm i -g tmole
```

### 2. Start Judge0 service
Ensure Judge0 is running via Docker:
```bash
docker-compose up -d
```

This will start Judge0 on port 2358 as configured in `docker-compose.yml`.

### 3. Create tunnel
Run the following command to create a tunnel:
```bash
tmole 2358 as brightspace-judge0.tunnelmole.net
```

**Note:** Custom subdomains (like `brightspace-judge0.tunnelmole.net`) require a tunnelmole subscription. For testing purposes, you can use:
```bash
tmole 2358
```
This will provide a random URL like `https://f38fg.tunnelmole.net`.

### 4. Automation Script
Use the npm script for convenience:
```bash
npm run tunnel
```

### 5. Update Environment Variables
Once the tunnel is running and you have the public URL, update your environment variables:

- Update `NEXT_PUBLIC_JUDGE0_URL` in your `.env.local` file to use the tmole URL
- Update Brightspace settings to use the public tunnel URL for callbacks

## Example URLs

- Local Judge0: `http://localhost:2358`
- Tunnel URL (with subscription): `https://brightspace-judge0.tunnelmole.net`
- Tunnel URL (random): `https://abc123.tunnelmole.net`

## Troubleshooting

1. **Port 2358 not accessible**: Ensure Judge0 Docker container is running
2. **Custom subdomain requires subscription**: Use random URL for testing or purchase subscription at https://dashboard.tunnelmole.com
3. **Docker not found**: Install Docker Desktop and ensure it's running

## Security Notes

- The tunnel exposes your local Judge0 instance to the internet
- Only use this for development/testing purposes
- Consider IP restrictions if available through tunnelmole subscription
