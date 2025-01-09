import { getWasmModule } from "./wasm";

export class OmFileReader {
  private reader: number = 0;
  private callbacks: Map<number, (offset: bigint, count: bigint) => Uint8Array>;
  private static nextCallbackId = 1;

  constructor() {
    this.callbacks = new Map();
  }

  public async createReader(
    getBytesCallback: (offset: bigint, count: bigint) => Uint8Array,
    totalSize: number,
  ): Promise<void> {
    const module = getWasmModule();

    // Store the callback
    const callbackId = OmFileReader.nextCallbackId++;
    this.callbacks.set(callbackId, getBytesCallback);

    // Register callback in Module
    if (!module.callbacks) {
      module.callbacks = {};
    }

    module.callbacks[callbackId] = (offset: bigint, count: bigint) => {
      const callback = this.callbacks.get(callbackId);
      if (!callback) throw new Error("Callback not found");
      return callback(offset, count);
    };

    // Create the reader
    this.reader = module._create_reader_from_js(callbackId, totalSize);
    if (this.reader === 0) {
      throw new Error("Failed to create reader");
    }
  }

  public decode(
    output: Uint8Array,
    dimReadStart: BigInt64Array,
    dimReadEnd: BigInt64Array,
    intoCubeOffset: BigInt64Array,
    intoCubeDimension: BigInt64Array,
    ioSizeMax: BigInt = BigInt(65536),
    ioSizeMerge: BigInt = BigInt(512),
  ): number {
    const module = getWasmModule();

    // Allocate memory for arrays
    const dimCount = dimReadStart.length;

    // Allocate memory for arrays with proper alignment
    const startPtr = module._malloc(dimCount * 8);
    const endPtr = module._malloc(dimCount * 8);
    const offsetPtr = module._malloc(dimCount * 8);
    const dimensionPtr = module._malloc(dimCount * 8);

    // Verify memory alignment for 64-bit values
    if (
      startPtr % 8 !== 0 ||
      endPtr % 8 !== 0 ||
      offsetPtr % 8 !== 0 ||
      dimensionPtr % 8 !== 0
    ) {
      throw new Error("Memory not properly aligned for 64-bit values");
    }

    // Create separate views for each memory region
    const startView = new BigInt64Array(
      module.HEAPU8.buffer,
      startPtr,
      dimCount,
    );
    const endView = new BigInt64Array(module.HEAPU8.buffer, endPtr, dimCount);
    const offsetView = new BigInt64Array(
      module.HEAPU8.buffer,
      offsetPtr,
      dimCount,
    );
    const dimensionView = new BigInt64Array(
      module.HEAPU8.buffer,
      dimensionPtr,
      dimCount,
    );

    // Copy arrays to their respective memory regions
    startView.set(dimReadStart);
    endView.set(dimReadEnd);
    offsetView.set(intoCubeOffset);
    dimensionView.set(intoCubeDimension);

    // Create output buffer in WASM memory
    const outputPtr = module._malloc(output.length);

    try {
      const result = module._decode_with_reader(
        this.reader,
        outputPtr,
        output.length,
        startPtr,
        endPtr,
        offsetPtr,
        dimensionPtr,
        BigInt(dimCount),
        ioSizeMax,
        ioSizeMerge,
      );

      // Copy result back to output array
      // OM_FILE_ERROR_OK
      if (result === 0) {
        console.log("outputPtr", outputPtr);
        const outputView = new Uint8Array(
          module.HEAPU8.buffer,
          outputPtr,
          output.length,
        );
        console.log("outputView", outputView);
        output.set(outputView);
      }

      return result;
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
      this.callbacks.clear();
    }
  }
}
