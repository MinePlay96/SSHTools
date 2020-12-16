import { FileEntry } from 'ssh2-streams';
import { join } from 'path';
import { EFileTypes } from './EFileTypes';

// TODO: add context options like move(toPath) etc

export class File {

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
