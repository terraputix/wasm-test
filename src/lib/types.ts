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

export type DataTypeToArray = {
  [OmDataType.DATA_TYPE_INT8]: Int8Array;
  [OmDataType.DATA_TYPE_UINT8]: Uint8Array;
  [OmDataType.DATA_TYPE_INT16]: Int16Array;
  [OmDataType.DATA_TYPE_UINT16]: Uint16Array;
  [OmDataType.DATA_TYPE_INT32]: Int32Array;
  [OmDataType.DATA_TYPE_UINT32]: Uint32Array;
  [OmDataType.DATA_TYPE_INT64]: BigInt64Array;
  [OmDataType.DATA_TYPE_UINT64]: BigUint64Array;
  [OmDataType.DATA_TYPE_FLOAT]: Float32Array;
  [OmDataType.DATA_TYPE_DOUBLE]: Float64Array;
  [OmDataType.DATA_TYPE_INT8_ARRAY]: Int8Array;
  [OmDataType.DATA_TYPE_UINT8_ARRAY]: Uint8Array;
  [OmDataType.DATA_TYPE_INT16_ARRAY]: Int16Array;
  [OmDataType.DATA_TYPE_UINT16_ARRAY]: Uint16Array;
  [OmDataType.DATA_TYPE_INT32_ARRAY]: Int32Array;
  [OmDataType.DATA_TYPE_UINT32_ARRAY]: Uint32Array;
  [OmDataType.DATA_TYPE_INT64_ARRAY]: BigInt64Array;
  [OmDataType.DATA_TYPE_UINT64_ARRAY]: BigUint64Array;
  [OmDataType.DATA_TYPE_FLOAT_ARRAY]: Float32Array;
  [OmDataType.DATA_TYPE_DOUBLE_ARRAY]: Float64Array;
};

export type ValidDataTypes = keyof DataTypeToArray;

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

/**
 * Creates a new TypedArray of the appropriate type with the specified length
 */
export function createArray(dataType: OmDataType, length: number): TypedArray {
  switch (dataType) {
    case OmDataType.DATA_TYPE_INT8:
    case OmDataType.DATA_TYPE_INT8_ARRAY:
      return new Int8Array(length);

    case OmDataType.DATA_TYPE_UINT8:
    case OmDataType.DATA_TYPE_UINT8_ARRAY:
      return new Uint8Array(length);

    case OmDataType.DATA_TYPE_INT16:
    case OmDataType.DATA_TYPE_INT16_ARRAY:
      return new Int16Array(length);

    case OmDataType.DATA_TYPE_UINT16:
    case OmDataType.DATA_TYPE_UINT16_ARRAY:
      return new Uint16Array(length);

    case OmDataType.DATA_TYPE_INT32:
    case OmDataType.DATA_TYPE_INT32_ARRAY:
      return new Int32Array(length);

    case OmDataType.DATA_TYPE_UINT32:
    case OmDataType.DATA_TYPE_UINT32_ARRAY:
      return new Uint32Array(length);

    case OmDataType.DATA_TYPE_INT64:
    case OmDataType.DATA_TYPE_INT64_ARRAY:
      return new BigInt64Array(length);

    case OmDataType.DATA_TYPE_UINT64:
    case OmDataType.DATA_TYPE_UINT64_ARRAY:
      return new BigUint64Array(length);

    case OmDataType.DATA_TYPE_FLOAT:
    case OmDataType.DATA_TYPE_FLOAT_ARRAY:
      return new Float32Array(length);

    case OmDataType.DATA_TYPE_DOUBLE:
    case OmDataType.DATA_TYPE_DOUBLE_ARRAY:
      return new Float64Array(length);

    case OmDataType.DATA_TYPE_NONE:
    case OmDataType.DATA_TYPE_STRING:
    case OmDataType.DATA_TYPE_STRING_ARRAY:
      throw new Error("Cannot create TypedArray for string or none type");

    default:
      throw new Error(`Unknown data type: ${dataType}`);
  }
}
