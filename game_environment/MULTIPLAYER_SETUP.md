# Multiplayer Setup Guide

This guide explains how to set up the game for multiplayer across different computers and networks.

## Quick Start (Local Development)

The game works out of the box for localhost testing:

```bash
bun dev
```

Open `http://localhost:3000` in your browser and you can play locally.

---

## LAN Play (Same Network)

Play with friends on the same WiFi/network:

### 1. Find Your Server's IP Address

**On Linux/Mac:**
```bash
ip addr show | grep "inet " | grep -v 127.0.0.1
# or
ifconfig | grep "inet " | grep -v 127.0.0.1
```

**On Windows:**
```powershell
ipconfig
# Look for IPv4 Address under your active network adapter
```

Example output: `192.168.1.100`

### 2. Start the Server

```bash
bun dev:server
```

The server will automatically display all available connection addresses:

```
============================================================
[Server] Suroi Simplified Server Started
============================================================
Hostname: 0.0.0.0
Port: 8000
Max Connections Per IP: 5
Rate Limiting: Enabled

Connect to server using one of these addresses:
  - Localhost: ws://localhost:8000/play
  - LAN: ws://192.168.1.100:8000/play

Server API Status: http://localhost:8000/api/status
============================================================
```

### 3. Configure Client (Optional - Auto-Detection Works Too)

**Option A: Environment Variable (Recommended)**

Create `.env` file in the project root:

```env
VITE_SERVER_HOST=192.168.1.100
VITE_SERVER_PORT=8000
VITE_USE_WSS=false
```

**Option B: Let Auto-Detection Work**

The client automatically detects if it's running on localhost or not. If you serve the client from the server's IP, it will automatically connect to that IP.

### 4. Start the Client

```bash
bun dev:client
```

### 5. Connect from Other Computers

On other computers on the same network:

1. Make sure the server computer's firewall allows port 8000
2. Open browser to `http://192.168.1.100:3000` (replace with your server's IP)
3. The client will auto-detect and connect to the WebSocket server

---

## Internet Play (Different Networks)

Play with friends over the internet:

### Requirements

- Server with public IP address (or port forwarding on router)
- Port 8000 accessible from internet
- Optional: Domain name

### 1. Configure Router Port Forwarding

Forward port 8000 TCP to your server machine:

- Log into your router (usually `192.168.1.1` or `192.168.0.1`)
- Find "Port Forwarding" or "NAT" settings
- Add rule: External Port 8000 → Internal IP (your server) Port 8000
- Protocol: TCP

### 2. Find Your Public IP

```bash
curl ifconfig.me
# or visit https://whatismyipaddress.com/
```

Example: `203.0.113.45`

### 3. Update Client Configuration

Create `.env` file:

```env
VITE_SERVER_HOST=203.0.113.45
VITE_SERVER_PORT=8000
VITE_USE_WSS=false
```

Or use a domain name if you have one:

```env
VITE_SERVER_HOST=game.yourdomain.com
VITE_SERVER_PORT=8000
VITE_USE_WSS=false
```

### 4. Start Server and Client

```bash
bun dev
```

### 5. Share URL with Friends

Give your friends the client URL: `http://203.0.113.45:3000`

⚠️ **Security Note:** This setup uses HTTP/WS (not secure). For production, use HTTPS/WSS with SSL certificates.

---

## Production Deployment

For a production-ready deployment with SSL:

### 1. Get a VPS/Cloud Server

Providers: DigitalOcean, AWS, Google Cloud, Linode, Vultr

### 2. Install Dependencies

```bash
curl -fsSL https://bun.sh/install | bash
git clone <your-repo>
cd simplified_game_env
bun install
```

### 3. Build Client for Production

```bash
cd client
bun run build
```

This creates optimized files in `client/dist/`

### 4. Configure Nginx (Optional but Recommended)

Create `/etc/nginx/sites-available/game`:

```nginx
server {
    listen 80;
    server_name game.yourdomain.com;

    # Serve static client files
    location / {
        root /path/to/simplified_game_env/client/dist;
        try_files $uri $uri/ /index.html;
    }

    # Proxy WebSocket to game server
    location /play {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Proxy API endpoints
    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Enable and restart:

```bash
sudo ln -s /etc/nginx/sites-available/game /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 5. Get SSL Certificate (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d game.yourdomain.com
```

This automatically configures HTTPS and WSS.

### 6. Run Server with Process Manager

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'suroi-game-server',
    script: 'bun',
    args: 'run server/src/index.ts',
    cwd: '/path/to/simplified_game_env',
    instances: 1,
    autorestart: true,
    watch: false,
    env: {
      NODE_ENV: 'production'
    }
  }]
};
```

Start with PM2:

```bash
npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 7. Update Client Config

Since you're using HTTPS, enable WSS:

```env
VITE_SERVER_HOST=game.yourdomain.com
VITE_SERVER_PORT=443
VITE_USE_WSS=true
```

Rebuild client:

```bash
cd client
bun run build
```

---

## Firewall Configuration

### Ubuntu/Debian (UFW)

```bash
sudo ufw allow 8000/tcp
sudo ufw allow 3000/tcp  # For client dev server
sudo ufw status
```

### CentOS/RHEL (firewalld)

```bash
sudo firewall-cmd --permanent --add-port=8000/tcp
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --reload
```

### Windows Firewall

```powershell
New-NetFirewallRule -DisplayName "Suroi Game Server" -Direction Inbound -Protocol TCP -LocalPort 8000 -Action Allow
New-NetFirewallRule -DisplayName "Suroi Game Client" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow
```

---

## Testing Connection

### Check Server Status

```bash
curl http://localhost:8000/api/status
```

Expected response:

```json
{
  "online": true,
  "players": 0,
  "uptime": 123.45,
  "timestamp": 1234567890123
}
```

### Test WebSocket Connection

Install `wscat`:

```bash
npm install -g wscat
```

Test connection:

```bash
wscat -c ws://localhost:8000/play
```

You should see connection established. Type a join packet:

```json
{"type":0,"playerName":"TestPlayer"}
```

### Test from External Machine

From another computer:

```bash
curl http://YOUR_SERVER_IP:8000/api/status
wscat -c ws://YOUR_SERVER_IP:8000/play
```

---

## Troubleshooting

### "Connection refused" or "Failed to connect"

**Cause:** Server not running or firewall blocking

**Solution:**
1. Check server is running: `curl http://localhost:8000/`
2. Check firewall rules (see Firewall Configuration above)
3. If using router, verify port forwarding is configured

### "Too many connections from this IP"

**Cause:** Rate limiting (default: 5 connections per IP)

**Solution:** Wait a moment or adjust `maxConnectionsPerIP` in `common/src/config.ts`

### Client connects but immediately disconnects

**Cause:** CORS issues or server crashing

**Solution:**
1. Check server logs for errors
2. Verify CORS headers are present (check browser console)
3. Ensure server is running on correct IP/port

### Players can't see each other

**Cause:** Multiple game instances or client not receiving updates

**Solution:**
1. Ensure all clients connect to same server IP
2. Check browser console for WebSocket errors
3. Verify server is broadcasting updates (check server logs)

### High latency/lag

**Causes:**
- Network distance between players and server
- Server hardware limitations
- Too many players for server capacity

**Solutions:**
1. Host server geographically closer to players
2. Reduce tick rate in `common/src/constants.ts` (trade-off: less smooth)
3. Upgrade server hardware
4. Limit max players

---

## Configuration Reference

### Server Config (`common/src/config.ts`)

```typescript
export const DefaultServerConfig: ServerConfig = {
    hostname: "0.0.0.0",           // Bind to all interfaces
    port: 8000,                     // Server port
    maxConnectionsPerIP: 5,         // Max connections per IP
    enableRateLimiting: true        // Enable/disable rate limiting
};
```

### Client Config (Environment Variables)

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_SERVER_HOST` | Server hostname or IP | Auto-detected |
| `VITE_SERVER_PORT` | Server port | `8000` |
| `VITE_USE_WSS` | Use secure WebSocket | Auto-detected |

### Game Constants (`common/src/constants.ts`)

```typescript
export const GameConstants = {
    TPS: 40,                    // Server tick rate (updates per second)
    MAP_WIDTH: 512,            // Map width in units
    MAP_HEIGHT: 512,           // Map height in units
    PLAYER_RADIUS: 2.25,       // Player collision radius
    PLAYER_SPEED: 0.08,        // Player movement speed
    PLAYER_MAX_HEALTH: 100,    // Maximum player health
    PICKUP_RADIUS: 5,          // Item pickup range
    GRID_CELL_SIZE: 32         // Spatial grid optimization
};
```

---

## Advanced: Docker Deployment

Create `Dockerfile`:

```dockerfile
FROM oven/bun:latest

WORKDIR /app

COPY package.json bun.lockb ./
RUN bun install

COPY . .

# Build client
WORKDIR /app/client
RUN bun run build

WORKDIR /app

EXPOSE 8000

CMD ["bun", "run", "server/src/index.ts"]
```

Build and run:

```bash
docker build -t suroi-game .
docker run -p 8000:8000 -p 3000:3000 suroi-game
```

---

## Support

- Check server logs for detailed error messages
- Monitor server status: `http://YOUR_SERVER:8000/api/status`
- Review browser console for client-side errors
- Ensure all players use the same client version

---

## Security Considerations

✅ **Implemented:**
- Rate limiting (5 connections per IP)
- IP tracking and logging
- CORS headers for cross-origin requests
- Input validation on server

⚠️ **Consider Adding:**
- Authentication system
- Ban/kick functionality
- DDoS protection (Cloudflare, fail2ban)
- SSL/TLS for production (HTTPS/WSS)
- Input sanitization for usernames
- Anti-cheat mechanisms

---

## Performance Tips

1. **Server Hardware:**
   - Minimum: 1 CPU core, 512MB RAM
   - Recommended: 2+ cores, 1GB+ RAM for 20+ players

2. **Network:**
   - Bandwidth: ~100-200 KB/s per player
   - Latency: <100ms recommended for smooth gameplay

3. **Optimization:**
   - Reduce tick rate if CPU limited (TPS in constants.ts)
   - Limit max players if bandwidth limited
   - Use dedicated server (not shared hosting)
   - Enable spatial grid (already enabled by default)

---

## Next Steps

After setting up multiplayer:

1. ✅ Test with friends on LAN
2. ✅ Verify multiple players can connect simultaneously
3. ✅ Check server performance under load
4. ✅ Configure production deployment if needed
5. ✅ Add authentication if required
6. ✅ Implement monitoring/logging
7. ✅ Set up backups and recovery

Enjoy your multiplayer battle royale! 🎮
