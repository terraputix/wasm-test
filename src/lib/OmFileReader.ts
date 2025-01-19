import { OmDataType, TypedArray } from "./types";
import { getWasmModule } from "./wasm";

export class OmFileReader {
  private reader: number = 0;

  /// Callbacks are passed to the WASM module and stored in a map.
  /// We only need one callback for now, so we use a constant ID.
  private static readonly CALLBACK_ID = 1;
  /// the getBytes callback that is passed to the WASM module
  private getBytes: ((offset: bigint, count: bigint) => Uint8Array) | null = null;

  public async createReader(
    getBytesCallback: (offset: bigint, count: bigint) => Uint8Array,
    totalSize: number
  ): Promise<void> {
    const module = getWasmModule();

    // Store the callback
    this.getBytes = getBytesCallback;

    // Register callback in Module
    if (!module.callbacks) {
      module.callbacks = {};
    }

    module.callbacks[OmFileReader.CALLBACK_ID] = (offset: bigint, count: bigint) => {
      if (!this.getBytes) throw new Error("Callback not initialized");
      return this.getBytes(offset, count);
    };

    // Create the reader
    this.reader = module._create_reader_from_js(OmFileReader.CALLBACK_ID, totalSize);
    if (this.reader === 0) {
      throw new Error("Failed to create reader");
    }
  }

  public decode<T extends TypedArray>(
    output: T,
    dataType: OmDataType,
    dimReadStart: BigInt64Array,
    dimReadEnd: BigInt64Array,
    intoCubeOffset: BigInt64Array,
    intoCubeDimension: BigInt64Array,
    ioSizeMax: BigInt = BigInt(65536),
    ioSizeMerge: BigInt = BigInt(512)
  ): void {
    // Check if reader is initialized
    if (this.reader === 0) {
      throw new Error("Reader not initialized");
    }

    // Check that output array is large enough
    const totalSize = dimReadEnd.reduce((acc, end, i) => {
      return acc * (end - dimReadStart[i]);
    }, 1n);

    if (totalSize > BigInt(output.length)) {
      throw new Error("Output array too small");
    }

    // TODO: Check data type compatibility with output array

    const module = getWasmModule();
    // Convert TypedArray to raw bytes
    const outputBytes = new Uint8Array(output.buffer);
    // Create output buffer in WASM memory
    const outputPtr = module._malloc(outputBytes.length);
    if (outputPtr === 0) {
      throw new Error("Failed to allocate memory for output");
    }

    // Allocate memory for arrays
    const dimCount = dimReadStart.length;

    // Allocate memory for arrays with proper alignment
    const startPtr = module._malloc(dimCount * 8);
    const endPtr = module._malloc(dimCount * 8);
    const offsetPtr = module._malloc(dimCount * 8);
    const dimensionPtr = module._malloc(dimCount * 8);

    // Verify memory alignment for 64-bit values
    if (startPtr % 8 !== 0 || endPtr % 8 !== 0 || offsetPtr % 8 !== 0 || dimensionPtr % 8 !== 0) {
      throw new Error("Memory not properly aligned for 64-bit values");
    }

    // Create separate views for each memory region
    const startView = new BigInt64Array(module.HEAPU8.buffer, startPtr, dimCount);
    const endView = new BigInt64Array(module.HEAPU8.buffer, endPtr, dimCount);
    const offsetView = new BigInt64Array(module.HEAPU8.buffer, offsetPtr, dimCount);
    const dimensionView = new BigInt64Array(module.HEAPU8.buffer, dimensionPtr, dimCount);

    // Copy arrays to their respective memory regions
    startView.set(dimReadStart);
    endView.set(dimReadEnd);
    offsetView.set(intoCubeOffset);
    dimensionView.set(intoCubeDimension);

    try {
      const result = module._decode_with_reader(
        this.reader,
        outputPtr,
        output.length,
        dataType,
        startPtr,
        endPtr,
        offsetPtr,
        dimensionPtr,
        BigInt(dimCount),
        ioSizeMax,
        ioSizeMerge
      );

      // Copy result back to output array
      // OM_FILE_ERROR_OK
      if (result === 0) {
        const outputView = new Uint8Array(module.HEAPU8.buffer, outputPtr, output.length);
        outputBytes.set(outputView);
      } else {
        throw new Error("Error decoding data. Error code: " + result);
      }
    } finally {
      // Clean up allocated memory
      module._free(startPtr);
      module._free(endPtr);
      module._free(offsetPtr);
      module._free(dimensionPtr);
      module._free(outputPtr);
    }
  }

  public destroy(): void {
    if (this.reader !== 0) {
      const module = getWasmModule();
      module._destroy_reader(this.reader);
      this.reader = 0;

      // Clean up callbacks
      if (module.callbacks) {
        delete module.callbacks[OmFileReader.CALLBACK_ID];
      }
      this.getBytes = null;
    }
  }
}
