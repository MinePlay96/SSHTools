import { SFTPWrapper } from 'ssh2';
import { createWriteStream, createReadStream } from 'fs';
import { File } from './File';


export class SFTPClient {
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
