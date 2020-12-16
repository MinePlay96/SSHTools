import { Client, ConnectConfig } from 'ssh2';
import { ISSHConnectConfig } from './ISSHConnectConfig';
import { SSHConnection } from './SSHConnection';

export class SSHClient {
  private _config: ISSHConnectConfig;

  public constructor(config: ISSHConnectConfig) {
    this._config = config;
  }

  public async connect(): Promise<SSHConnection>;
  public async connect(parent: SSHConnection): Promise<SSHConnection>;
  public async connect(parent?: SSHConnection): Promise<SSHConnection> {

    const client = new Client();
    const clientConfig: ConnectConfig = { ...this._config };

    // create the hop connection and call the this function with the connection
    if (this._config.hop && !parent) {
      const temp = new SSHClient(this._config.hop);

      return this.connect(await temp.connect());
    }

    if (parent) {
      clientConfig.sock = await parent.forwardSocket(this._config.host, this._config.port);
      delete clientConfig.host;
      delete clientConfig.port;
    }

    return new Promise((resolve, reject) => {
      client.connect(clientConfig);
      client.on('ready', () => {
        if (parent) {
          resolve(new SSHConnection(client, parent));
        } else {
          resolve(new SSHConnection(client));
        }
      });
      client.on('error', reject);
    });
  }
}
