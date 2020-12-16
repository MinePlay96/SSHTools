import { Client } from 'ssh2';
import { createServer, Socket } from 'net';
import { SFTPClient } from './SFTPClient';
import { SSHForward } from './SSHForward';

export class SSHConnection {
  private _connection: Client;

  public constructor(connection: Client) {
    this._connection = connection;
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
  public async forward(localPort: number, remoteAdress: string, remotePort: number): Promise<SSHForward> {
    return new Promise((resolve, reject) => {
      const connections: Array<Socket> = [];
      const server = createServer(serverStream => {
        // TODO: check if 0.0.0.0 can be used
        this._connection.forwardOut(
          '127.0.0.1', localPort, remoteAdress, remotePort, (error, sshStream) => {
            if (error) {
              reject(error);

              return;
            }

            serverStream.pipe(sshStream).pipe(serverStream);

            // TODO: find a way without key
            // eslint-disable-next-line @typescript-eslint/no-magic-numbers
            const key = connections.push(serverStream) - 1;

            sshStream.on('close', () => {
              // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
              delete connections[key];
            });
          }
        );
      }).listen(localPort);

      resolve(new SSHForward(server, connections));
    });
  }
}
