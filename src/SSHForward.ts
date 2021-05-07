import { Server, Socket, createServer } from 'net';
import { SSHClient } from './SSHClient';


export class SSHForward {
  private _siblings: Set<SSHForward>;
  private _owner: SSHClient;
  private _server: Server;
  private _connections: Set<Socket> = new Set();

  public constructor(owner: SSHClient, siblings: Set<SSHForward>, {
    localPort,
    remoteAdress,
    remotePort
  }: {
    localPort: number;
    remoteAdress: string;
    remotePort: number;
  }) {

    this._siblings = siblings;
    this._owner = owner;
    this._server = createServer(serverStream => {
      this._owner.forwardSocket(remoteAdress, remotePort, (err, sshStream) => {
        if (err) {
          throw err;
        }

        serverStream.pipe(sshStream).pipe(serverStream);

        this._connections.add(serverStream);

        sshStream.on('close', () => {
          this._connections.delete(serverStream);
        });
      });
    });

    this._server.listen(localPort);

    this._siblings.add(this);
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
      this._siblings.delete(this);
    });
  }
}
