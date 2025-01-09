import { describe, it, expect, beforeAll } from "vitest";
import { initWasm, getWasmModule } from "../lib/wasm";
import { createTestData, verifyData } from "./utils";
import { CompressionStats } from "../lib/types";
import { P4NCompressor } from "../lib/compression";

describe("P4N Compression", () => {
  // FIXME: Variable buffer sizes when interfacing with the WASM module??
  const DATA_SIZE = 1024 * 1024; // 1MB of data

  beforeAll(async () => {
    await initWasm();
  });

  it("should initialize WASM module successfully", () => {
    const module = getWasmModule();
    expect(module).toBeDefined();
  });

  it("should compress and decompress data correctly", async () => {
    const module = getWasmModule();
    const compressor = new P4NCompressor();
    const data = createTestData(DATA_SIZE);

    try {
      compressor.setData(data);
      const compressed = compressor.compress();
      const decompressed = compressor.decompress(data.length);

      expect(compressed).toBeDefined();
      expect(decompressed).toBeDefined();

      expect(verifyData(data, decompressed)).toBe(true);
    } finally {
      compressor.dispose();
    }
  });

  // it("should achieve reasonable compression ratios", async () => {
  //   const module = getWasmModule();
  //   const compressor = new P4NCompressor();
  //   const data = createTestData(DATA_SIZE);

  //   try {
  //     compressor.setData(data);
  //     const compressed = compressor.compress();

  //     console.log(data.length);
  //     console.log(compressed.length);

  //     const stats: CompressionStats = {
  //       originalSize: data.length * 2,
  //       compressedSize: compressed.length,
  //       compressionTime: 0,
  //       decompressionTime: 0,
  //       compressionRatio: 0,
  //       speedMBps: 0,
  //       verified: false,
  //     };

  //     stats.compressionRatio =
  //       (stats.compressedSize / stats.originalSize) * 100;

  //     // Assert reasonable compression ratio
  //     expect(stats.compressionRatio).toBeGreaterThan(5);
  //     expect(stats.compressionRatio).toBeLessThan(20);
  //   } finally {
  //     compressor.dispose();
  //   }
  // });

  it("should measure compression performance", async () => {
    const module = getWasmModule();
    const compressor = new P4NCompressor();
    const data = createTestData(DATA_SIZE);

    try {
      const start = performance.now();
      compressor.setData(data);
      const compressed = compressor.compress();
      const end = performance.now();

      const compressionTime = end - start;
      const speedMBps =
        (data.length * 2) / 1024 / 1024 / (compressionTime / 1000);

      // Assert reasonable performance metrics
      expect(compressionTime).toBeGreaterThan(0);
      expect(speedMBps).toBeGreaterThan(300);
    } finally {
      compressor.dispose();
    }
  });

  it("should handle error cases gracefully", async () => {
    const module = getWasmModule();
    const compressor = new P4NCompressor();

    try {
      // Test with invalid data
      // @ts-ignore
      expect(() => compressor.setData(null)).toThrow();

      // Test decompression with invalid size
      expect(() => compressor.decompress(-1)).toThrow();
    } finally {
      compressor.dispose();
    }
  });
});
