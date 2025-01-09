import { getWasmModule } from "./wasm";

export class P4NCompressor {
  private pointer: number;
  private wasmModule: any;

  constructor(initialSize: number = 1024 * 1024) {
    this.wasmModule = getWasmModule();
    this.pointer = this.wasmModule._P4NCompressor_create(initialSize);
    if (this.pointer === 0) {
      throw new Error("Failed to create compressor");
    }
  }

  setData(data: Uint16Array): boolean {
    const dataPtr = this.wasmModule._malloc(data.length * 2);
    try {
      new Uint16Array(this.wasmModule.HEAPU16.buffer, dataPtr, data.length).set(
        data,
      );

      const result = this.wasmModule._P4NCompressor_set_data(
        this.pointer,
        dataPtr,
        data.length,
      );
      console.log("data length", data.length);
      console.log("result", result);

      return !!result;
    } finally {
      this.wasmModule._free(dataPtr);
    }
  }

  compress(): Uint8Array {
    const compressedSize = this.wasmModule._P4NCompressor_compress(
      this.pointer,
    );
    console.log("compressedSize", compressedSize);
    if (compressedSize === 0) {
      throw new Error("Compression failed");
    }

    const compressedDataPtr =
      this.wasmModule._P4NCompressor_get_compressed_data(this.pointer);
    return new Uint8Array(
      this.wasmModule.HEAPU8.buffer,
      compressedDataPtr,
      compressedSize,
    ).slice();
  }

  decompress(size: number): Uint16Array {
    const outputPtr = this.wasmModule._malloc(size * 2);
    try {
      const success = this.wasmModule._P4NCompressor_decompress(
        this.pointer,
        outputPtr,
      );

      if (!success) {
        throw new Error("Decompression failed");
      }

      return new Uint16Array(
        this.wasmModule.HEAPU16.buffer,
        outputPtr,
        size,
      ).slice();
    } finally {
      this.wasmModule._free(outputPtr);
    }
  }

  dispose(): void {
    if (this.pointer) {
      this.wasmModule._P4NCompressor_destroy(this.pointer);
      this.pointer = 0;
    }
  }
}
