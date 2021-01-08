import { Client, ClientChannel } from 'ssh2';
import { createServer, Socket } from 'net';
import { SFTPClient } from './SFTPClient';
import { SSHForward } from './SSHForward';

export class SSHConnection {
  private _connection: Client;
  private _parent?: SSHConnection;
  private _tunnel: Set<SSHForward> = new Set();

  public constructor(connection: Client)
  public constructor(connection: Client, parent: SSHConnection)
  public constructor(connection: Client, parent?: SSHConnection) {
    this._connection = connection;
    this._parent = parent;
  }

  public async close(): Promise<void> {

    const tunnels = [...this._tunnel].map(async el => el.close());

    await Promise.all(tunnels);

    this._connection.end();

    if (this._parent) {
      await this._parent.close();
    }
  }

  public async sftp(): Promise<SFTPClient> {
    return new Promise((resolve, reject) => {
      this._connection.sftp((error, sftpWrapper) => {
        if (error) {
          reject(error);

          return;
        }

        resolve(new SFTPClient(sftpWrapper));
      });
    });
  }

  // TODO: add port check
  // TODO: add incomming and dynamic
  public async forwardPort(localPort: number, remoteAdress: string, remotePort: number): Promise<SSHForward> {
    return new Promise((resolve, reject) => {
      const connections: Array<Socket> = [];
      const server = createServer(serverStream => {
        this.forwardSocket(remoteAdress, remotePort).then(sshStream => {

          serverStream.pipe(sshStream).pipe(serverStream);

          // TODO: find a way without key
          // eslint-disable-next-line @typescript-eslint/no-magic-numbers
          const key = connections.push(serverStream) - 1;

          sshStream.on('close', () => {
            // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
            delete connections[key];
          });
        })
          .catch(reject);
      }).listen(localPort);

      const forward = new SSHForward(server, connections);

      server.on('close', () => {
        this._tunnel.delete(forward);
      });
      this._tunnel.add(forward);
      resolve(forward);
    });
  }

  public async forwardSocket(dstIP: string, dstPort: number): Promise<ClientChannel> {
    return new Promise((resolve, reject) => {
      this._connection.forwardOut(
        '', 0, dstIP, dstPort, (error, socket) => {
          if (error) {
            reject(error);

            return;
          }

          resolve(socket);
        }
      );
    });
  }
}
