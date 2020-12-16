import { ConnectConfig } from 'ssh2';

export interface ISSHConnectConfig extends ConnectConfig {
  host: string;
  port: number;
  hop?: ISSHConnectConfig;
  sock: undefined;
}
