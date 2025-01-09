export interface CompressionStats {
  originalSize: number;
  compressedSize: number;
  compressionTime: number;
  decompressionTime: number;
  compressionRatio: number;
  speedMBps: number;
  verified: boolean;
}

export enum CompressionType {
  None = 0,
  P4NZEnc128v16 = 1,
}
