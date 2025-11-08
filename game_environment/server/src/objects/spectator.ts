import type { ServerWebSocket } from "bun";

export class Spectator {
    readonly id: number;
    readonly username: string;
    readonly socket: ServerWebSocket<any>;
    private followingPlayerId: number | null = null;

    constructor(id: number, username: string, socket: ServerWebSocket<any>) {
        this.id = id;
        this.username = username;
        this.socket = socket;
    }

    setFollowingPlayer(playerId: number | null): void {
        this.followingPlayerId = playerId;
    }

    getFollowingPlayerId(): number | null {
        return this.followingPlayerId;
    }
}
