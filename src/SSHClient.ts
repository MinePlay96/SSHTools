/* eslint-disable no-underscore-dangle */
import { Client, ConnectConfig } from 'ssh2';

const LOCAL_FORWARD_PORT = 0;

export interface IConnectConfigHop extends ConnectConfig {
  through: IConnectConfigHop | ConnectConfig | SSHClient;
  host: string;
  port: number;
}

export class SSHClient extends Client {

  private _parent?: SSHClient;
  private _childs: Set<SSHClient> = new Set<SSHClient>();
  private _justHop = false;

  public constructor() {
    super();

    this.on('close', this._internalOnClose);
  }

  public connect(config: IConnectConfigHop | ConnectConfig): void {

    if (!('through' in config)) {
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

  private _connectThrough(parent: SSHClient, config: IConnectConfigHop): void {
    parent.forwardOut(
      '127.0.0.1', LOCAL_FORWARD_PORT, config.host, config.port, (error, channel) => {
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
