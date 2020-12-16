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
