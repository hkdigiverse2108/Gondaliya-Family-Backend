# Redis Setup Guide

This guide explains how to set up and start Redis on different platforms.

## 1. Using Docker (Recommended for Local Development)

If you have **Docker Desktop** installed on Windows or Docker on Ubuntu, you can use the provided `docker-compose.yml`.

### How to start:
1. Open your terminal in the project root.
2. Run the following command:
   ```bash
   docker-compose up -d
   ```
3. This will start Redis in the background on port `6379`.

---

## 2. Setup on Windows (Native)

Redis does not officially support Windows, but you can use **Memurai** (the best native port) or **WSL2**.

### Option A: Memurai (Easiest)
1. Download Memurai from [memurai.com](https://www.memurai.com/get-memurai).
2. Install the MSI.
3. Redis will start automatically as a Windows service.

### Option B: WSL2 (Ubuntu on Windows)
1. If you have WSL installed, open your Ubuntu terminal.
2. Follow the Ubuntu instructions below.

---

## 3. Setup on Ubuntu Server

Run these commands to install and start Redis:

```bash
# Update package list
sudo apt update

# Install Redis server
sudo apt install redis-server -y

# Enable and Start Redis
sudo systemctl enable redis-server
sudo systemctl start redis-server

# Verify it is running
redis-cli ping
# Should return "PONG"
```

---

## 4. Configuration for this Project

Once Redis is running, ensure your `.env` file has the correct URL:

```env
REDIS_URL=redis://127.0.0.1:6379
```

If you use a password or different port, update the URL accordingly.
