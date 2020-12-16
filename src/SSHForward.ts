import { Server, Socket } from 'net';


export class SSHForward {
  private _server: Server;
  private _connections: Array<Socket>;

  public constructor(server: Server, connections: Array<Socket>) {
    this._server = server;
    this._connections = connections;
  }

  public async close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this._server.close(error => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });

      // end open connections
      this._connections.forEach(connection => connection.end());
    });
  }
}
