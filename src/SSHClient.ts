/* eslint-disable no-underscore-dangle */
import { Client, ClientChannel, ConnectConfig } from 'ssh2';
import { SSHForward } from './SSHForward';

const LOCAL_FORWARD_PORT = 0;

export interface IConnectConfigHop extends ConnectConfig {
  through?: IConnectConfigHop | SSHClient;
  host: string;
  port: number;
  tunnels?: Array<{
    remotePort: number;
    remoteHost: string;
    localPort: number;
  }>;
}

export class SSHClient extends Client {

  private _tunnels: Set<SSHForward> = new Set<SSHForward>();
  private _parent?: SSHClient;
  private _childs: Set<SSHClient> = new Set<SSHClient>();
  private _justHop = false;

  public constructor() {
    super();

    this.on('close', this._internalOnClose);
  }

  // TODO: allow connect through socket
  public connect(config: IConnectConfigHop): void {

    const { tunnels } = config;

    if (tunnels) {
      this.on('ready', () => {
        tunnels.forEach(({ localPort, remoteHost, remotePort }) => {
          this.forwardPort(localPort, remoteHost, remotePort);
        });
      });
    }

    if (!config.through) {
      super.connect(config);

      return;
    }

    if (config.through instanceof SSHClient) {
      this._connectThrough(config.through, config);
    } else {
      const parent = new SSHClient();

      parent._justHop = true;
      parent.connect(config.through);
      parent.on('ready', () => {
        this._connectThrough(parent, config);
      });
    }
  }

  public releaseParent(): false | SSHClient {
    if (!this._parent) {
      return false;
    }
    this._parent._justHop = false;

    return this._parent;
  }

  public forwardPort(
      localPort: number,
      remoteAdress: string,
      remotePort: number
  ): SSHForward {
    return new SSHForward(this, this._tunnels, {
      localPort,
      remoteAdress,
      remotePort
    });
  }

  public getPortForwards(): Array<SSHForward> {
    return [...this._tunnels];
  }

  private _connectThrough(parent: SSHClient, config: IConnectConfigHop): void {
    parent.forwardOut(
      '127.0.0.1',
      LOCAL_FORWARD_PORT,
      config.host,
      config.port,
      (error, channel) => {
        if (error) {
          throw error;
        }
        config.sock = channel;
        this._parent = parent;
        super.connect(config);
        this.on('ready', () => {
          parent._childs.add(this);
        });
      }
    );
  }

  private _internalOnClose(): void {
    // close childs
    this._childs.forEach(child => {
      console.log('closing childs');
      child.end();
    });

    if (this._parent) {
      // remove from parent
      this._parent._childs.delete(this);

      // close parent if this was the last child and the parent is just a hop parent
      if (!this._parent._childs.size && this._parent._justHop) {
        this._parent.end();
      }
    }
  }
}
