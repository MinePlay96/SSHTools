import { Client, ConnectConfig, SFTPWrapper } from 'ssh2';
import { FileEntry } from 'ssh2-streams';
import { createServer, Server, Socket } from 'net';
import { join } from 'path';
import { createWriteStream, createReadStream } from 'fs';

export enum EFileTypes {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  FIFO = 1,
  characterDevice = 2,
  directory = 4,
  blockDevice = 6,
  regularFile = 10,
  symbolicLink = 12,
  socket = 14
}

// TODO: add context options like move(toPath) etc
class File {

  private _type: EFileTypes;
  private _name: string;
  private _sourceDir: string;

  public constructor(file: FileEntry, sourceDir: string) {
    this._name = file.filename;
    this._sourceDir = sourceDir;

    const octets = Number(file.attrs.mode.toString(8));

    this._type = Math.floor(octets / 10000);
  }

  public isDirectory(): boolean {
    return this._type === EFileTypes.directory;
  }

  public isSymbolicLink(): boolean {
    return this._type === EFileTypes.symbolicLink;
  }

  public isSocket(): boolean {
    return this._type === EFileTypes.socket;
  }

  public getPath(): string {
    return join(this._sourceDir, this._name);
  }
}

class SFTPClient {
  private _wrapper: SFTPWrapper;
  public constructor(wrapper: SFTPWrapper) {
    this._wrapper = wrapper;
  }

  // TODO: add folder object / representator
  public async getFolderContets(remoteDir: string): Promise<Array<File>> {
    return new Promise((resolve, reject) => {
      // TODO: add permitions logic
      this._wrapper.readdir(remoteDir, (error, list) => {
        if (error) {
          reject(error);

          return;
        }

        resolve(list.map(line => new File(line, remoteDir)));
      });
    });
  }

  public async rename(srcPath: string, destPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this._wrapper.rename(srcPath, destPath, (error: unknown) => {
        if (error) {
          reject(error);

          return;
        }
        resolve();
      });
    });
  }

  // TODO: change to path object
  // TODO: add progress callback
  public async download(remoteFile: string, localFile: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const sftpReadStream = this._wrapper.createReadStream(remoteFile);
      const localWriteStream = createWriteStream(localFile);
      sftpReadStream.pipe(localWriteStream);
      sftpReadStream.on('end', resolve);
      sftpReadStream.on('error', reject);
      localWriteStream.on('error', reject);
    });
  }

  // TODO: change to path object
  // TODO: add progress callback
  public async upload(remoteFile: string, localFile: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const sftpWriteStream = this._wrapper.createWriteStream(remoteFile);
      const localReadStream = createReadStream(localFile);
      localReadStream.pipe(sftpWriteStream);
      sftpWriteStream.on('close', resolve);
      localReadStream.on('error', reject);
      sftpWriteStream.on('error', reject);
    });
  }
}

class SSHForward {
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

class SSHConnection {
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

export default class SSHClient {
  private _config: ConnectConfig;

  public constructor(config: ConnectConfig) {
    this._config = config;
  }

  public async connect(): Promise<SSHConnection> {
    const client = new Client();

    return new Promise((resolve, reject) => {
      client.connect(this._config);
      client.on('ready', () => {
        resolve(new SSHConnection(client));
      });
      client.on('error', reject);
    });
  }
}
