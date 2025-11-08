import { Game } from "./game";
import { PacketType, type InputPacket, type JoinPacket, type SpectatorJoinPacket } from "../../common/src/packets";
import { DefaultServerConfig } from "../../common/src/config";

const game = new Game();
game.start();

// Connection tracking for rate limiting
interface ConnectionData {
    playerId: number;
    spectatorId: number;
    isSpectator: boolean;
    ip: string;
    connectedAt: number;
}

const connectionsByIP = new Map<string, number>();
const config = DefaultServerConfig;

// CORS headers for cross-origin requests
const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
};

const server = Bun.serve<ConnectionData>({
    hostname: config.hostname,
    port: config.port,

    fetch(req, server) {
        const url = new URL(req.url);

        // Handle CORS preflight requests
        if (req.method === "OPTIONS") {
            return new Response(null, {
                status: 204,
                headers: corsHeaders
            });
        }

        if (url.pathname === "/") {
            return new Response("Suroi Simplified Server Running", {
                headers: {
                    "Content-Type": "text/plain",
                    ...corsHeaders
                }
            });
        }

        if (url.pathname === "/api/status") {
            const status = {
                online: true,
                players: game.players.size,
                uptime: process.uptime(),
                timestamp: Date.now()
            };
            return new Response(JSON.stringify(status), {
                headers: {
                    "Content-Type": "application/json",
                    ...corsHeaders
                }
            });
        }

        if (url.pathname === "/play") {
            // Get client IP address
            const ip = server.requestIP(req)?.address || "unknown";

            // Rate limiting check
            if (config.enableRateLimiting) {
                const currentConnections = connectionsByIP.get(ip) || 0;
                if (currentConnections >= config.maxConnectionsPerIP) {
                    console.log(`[Server] Connection rejected from ${ip}: Too many connections (${currentConnections})`);
                    return new Response("Too many connections from this IP", {
                        status: 429,
                        headers: corsHeaders
                    });
                }
            }

            const upgraded = server.upgrade(req, {
                data: {
                    playerId: -1,
                    spectatorId: -1,
                    isSpectator: false,
                    ip: ip,
                    connectedAt: Date.now()
                }
            });

            if (!upgraded) {
                return new Response("WebSocket upgrade failed", {
                    status: 500,
                    headers: corsHeaders
                });
            }
            return undefined;
        }

        return new Response("Not Found", {
            status: 404,
            headers: corsHeaders
        });
    },

    websocket: {
        open(ws) {
            const { ip } = ws.data;

            // Increment connection count for this IP
            const currentCount = connectionsByIP.get(ip) || 0;
            connectionsByIP.set(ip, currentCount + 1);

            console.log(`[Server] WebSocket connection opened from ${ip} (${connectionsByIP.get(ip)} connections)`);
        },

        message(ws, message) {
            try {
                const data = JSON.parse(message.toString());

                switch (data.type) {
                    case PacketType.Join: {
                        const joinPacket = data as JoinPacket;
                        const player = game.addPlayer(ws, joinPacket.playerName);
                        ws.data.playerId = player.id;
                        ws.data.isSpectator = false;
                        console.log(`[Server] Player '${joinPacket.playerName}' (ID: ${player.id}) joined from ${ws.data.ip}`);
                        break;
                    }

                    case PacketType.SpectatorJoin: {
                        const spectatorPacket = data as SpectatorJoinPacket;
                        const spectator = game.addSpectator(ws, spectatorPacket.spectatorName);
                        ws.data.spectatorId = spectator.id;
                        ws.data.isSpectator = true;
                        console.log(`[Server] Spectator '${spectatorPacket.spectatorName}' (ID: ${spectator.id}) joined from ${ws.data.ip}`);
                        break;
                    }

                    case PacketType.Input: {
                        const inputPacket = data as InputPacket;
                        // Only process input from players, not spectators
                        if (ws.data && ws.data.playerId !== -1 && !ws.data.isSpectator) {
                            game.handleInput(ws.data.playerId, inputPacket);
                        }
                        break;
                    }
                }
            } catch (error) {
                console.error("[Server] Error processing message:", error);
            }
        },

        close(ws) {
            const { playerId, spectatorId, isSpectator, ip } = ws.data;

            // Remove player or spectator from game
            if (isSpectator && spectatorId !== -1) {
                game.removeSpectator(spectatorId);
                console.log(`[Server] Spectator ${spectatorId} disconnected from ${ip}`);
            } else if (playerId !== -1) {
                game.removePlayer(playerId);
                console.log(`[Server] Player ${playerId} disconnected from ${ip}`);
            }

            // Decrement connection count for this IP
            const currentCount = connectionsByIP.get(ip) || 1;
            if (currentCount <= 1) {
                connectionsByIP.delete(ip);
            } else {
                connectionsByIP.set(ip, currentCount - 1);
            }

            console.log(`[Server] WebSocket connection closed from ${ip}`);
        }
    }
});

const networkInterfaces = require("os").networkInterfaces();
const localIPs: string[] = [];

for (const [name, interfaces] of Object.entries(networkInterfaces)) {
    if (interfaces) {
        for (const iface of interfaces as any[]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                localIPs.push(iface.address);
            }
        }
    }
}

console.log(`\n${"=".repeat(60)}`);
console.log(`[Server] Suroi Simplified Server Started`);
console.log(`${"=".repeat(60)}`);
console.log(`Hostname: ${config.hostname}`);
console.log(`Port: ${server.port}`);
console.log(`Max Connections Per IP: ${config.maxConnectionsPerIP}`);
console.log(`Rate Limiting: ${config.enableRateLimiting ? "Enabled" : "Disabled"}`);
console.log(`\nConnect to server using one of these addresses:`);
console.log(`  - Localhost: ws://localhost:${server.port}/play`);
if (localIPs.length > 0) {
    localIPs.forEach(ip => {
        console.log(`  - LAN: ws://${ip}:${server.port}/play`);
    });
}
console.log(`\nServer API Status: http://localhost:${server.port}/api/status`);
console.log(`${"=".repeat(60)}\n`);
