interface ClientToServerEvents {
clientactivename: (userName: string) => void;
clientactivesession: (room: string) => void;
clientjoin: (userName: string) => void;
clientmessage: (message: string) => void;
clientmove: (position: string, orientation: number) => void;
clientpublish: (asset: object) => void;
clientrejoin: (message: object) => void;
clientsessions: (sessions: object[]) => void;
x3d_clientactivesession: (room: string) => void;
x3d_clientjoin: (userName: string) => void;
x3d_clientmove: (position: string, orientation: number) => void;
x3d_clientsessions: (sessions: object[]) => void;
}
