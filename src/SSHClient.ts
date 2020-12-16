import { Client, ConnectConfig } from 'ssh2';
import { SSHConnection } from './SSHConnection';


export class SSHClient {
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
