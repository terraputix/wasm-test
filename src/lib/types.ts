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

export enum OmDataType {
  DATA_TYPE_NONE = 0,
  DATA_TYPE_INT8 = 1,
  DATA_TYPE_UINT8 = 2,
  DATA_TYPE_INT16 = 3,
  DATA_TYPE_UINT16 = 4,
  DATA_TYPE_INT32 = 5,
  DATA_TYPE_UINT32 = 6,
  DATA_TYPE_INT64 = 7,
  DATA_TYPE_UINT64 = 8,
  DATA_TYPE_FLOAT = 9,
  DATA_TYPE_DOUBLE = 10,
  DATA_TYPE_STRING = 11,
  DATA_TYPE_INT8_ARRAY = 12,
  DATA_TYPE_UINT8_ARRAY = 13,
  DATA_TYPE_INT16_ARRAY = 14,
  DATA_TYPE_UINT16_ARRAY = 15,
  DATA_TYPE_INT32_ARRAY = 16,
  DATA_TYPE_UINT32_ARRAY = 17,
  DATA_TYPE_INT64_ARRAY = 18,
  DATA_TYPE_UINT64_ARRAY = 19,
  DATA_TYPE_FLOAT_ARRAY = 20,
  DATA_TYPE_DOUBLE_ARRAY = 21,
  DATA_TYPE_STRING_ARRAY = 22,
}

export type TypedArray =
  | Int8Array
  | Uint8Array
  | Int16Array
  | Uint16Array
  | Int32Array
  | Uint32Array
  | Float32Array
  | Float64Array
  | BigInt64Array
  | BigUint64Array;
