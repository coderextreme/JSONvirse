interface ServerToClientEvents {
	servercapability: () => void;
	servermessage: (msg: string) => void;
	serverscore: (playerNumber: number, score: number) => void;
	serversessions: (sessions: object[]) => void;
	serverupdate: (player: object) => void;
	x3d_serverupdate: (playerNumber: number, position: string, orientation: number, room: string) => void;
}
