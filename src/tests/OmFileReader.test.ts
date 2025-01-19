import { describe, beforeAll, afterEach, it, expect, beforeEach } from "vitest";
import { initWasm } from "../lib/wasm";
import { OmFileReader } from "../lib/OmFileReader";
import fs from "fs/promises";
import path from "path";
import { OmDataType } from "../lib/types";

describe("OmFileReader", () => {
  let testFileData: ArrayBuffer;
  // Create a new reader for each test
  let reader: OmFileReader;

  const getBytesCallback = (offset: bigint, count: bigint): Uint8Array => {
    // Convert BigInt to Number for slice operation
    const offsetNum = Number(offset);
    const countNum = Number(count);

    // Add safety checks
    if (offsetNum > Number.MAX_SAFE_INTEGER || countNum > Number.MAX_SAFE_INTEGER) {
      throw new Error("Offset or count exceeds safe integer range");
    }

    return new Uint8Array(testFileData.slice(offsetNum, offsetNum + countNum));
  };

  // Initialize WASM and load test file before all tests
  beforeAll(async () => {
    await initWasm();

    // Load the test file
    // Currently this file is not committed to the repository
    // Thus we skip tests in CI according to the vitest configuration
    const filePath = path.join(__dirname, "../../test-data/read_test.om");
    const fileBuffer = await fs.readFile(filePath);
    testFileData = fileBuffer.buffer;
  });

  beforeEach(() => {
    reader = new OmFileReader();
  });

  afterEach(() => {
    if (reader) {
      reader.destroy();
    }
  });

  it("should successfully create a reader", async () => {
    await expect(reader.createReader(getBytesCallback, testFileData.byteLength)).resolves.not.toThrow();
  });

  it("should fail to create reader with invalid callback", async () => {
    const invalidCallback = (offset: bigint, count: bigint) => {
      throw new Error("Invalid callback");
    };

    await expect(reader.createReader(invalidCallback, testFileData.byteLength)).rejects.toThrow();
  });

  it("should successfully read data", async () => {
    await reader.createReader(getBytesCallback, testFileData.byteLength);

    const dimReadRange: Array<{ start: bigint; end: bigint }> = [
      { start: BigInt(0), end: BigInt(10) },
      { start: BigInt(0), end: BigInt(10) },
      { start: BigInt(0), end: BigInt(10) },
    ];

    const output = reader.read(OmDataType.DATA_TYPE_FLOAT_ARRAY, dimReadRange);
    expect(output).toBeInstanceOf(Float32Array);
    // expect(() => reader.read(OmDataType.DATA_TYPE_FLOAT_ARRAY, dimReadRange)).not.toThrow();

    expect(Array.from(output.slice(0, 10))).toEqual(
      expect.arrayContaining([
        expect.closeTo(-24.25, 0.001),
        expect.closeTo(-24.75, 0.001),
        expect.closeTo(-23.85, 0.001),
        expect.closeTo(-23.95, 0.001),
        expect.closeTo(-25.45, 0.001),
        expect.closeTo(-25.9, 0.001),
        expect.closeTo(-26.4, 0.001),
        expect.closeTo(-26.45, 0.001),
        expect.closeTo(-26.2, 0.001),
        expect.closeTo(-26.2, 0.001),
      ])
    );
  });

  it("should successfully readInto data", async () => {
    await reader.createReader(getBytesCallback, testFileData.byteLength);

    // Adjust these values according to your test file's dimensions
    const outputSize = 5000; // Adjust based on your test data
    const output = new Float32Array(outputSize);
    const dimReadStart = new BigInt64Array([0n, 0n, 0n]);
    const dimReadEnd = new BigInt64Array([10n, 10n, 10n]);
    const intoCubeOffset = new BigInt64Array([0n, 0n, 0n]);
    const intoCubeDimension = new BigInt64Array([10n, 10n, 10n]);

    expect(() =>
      reader.readInto(
        output,
        OmDataType.DATA_TYPE_FLOAT_ARRAY,
        dimReadStart,
        dimReadEnd,
        intoCubeOffset,
        intoCubeDimension
      )
    ).not.toThrow();

    expect(Array.from(output.slice(0, 10))).toEqual(
      expect.arrayContaining([
        expect.closeTo(-24.25, 0.001),
        expect.closeTo(-24.75, 0.001),
        expect.closeTo(-23.85, 0.001),
        expect.closeTo(-23.95, 0.001),
        expect.closeTo(-25.45, 0.001),
        expect.closeTo(-25.9, 0.001),
        expect.closeTo(-26.4, 0.001),
        expect.closeTo(-26.45, 0.001),
        expect.closeTo(-26.2, 0.001),
        expect.closeTo(-26.2, 0.001),
      ])
    );
  });

  it("should fail with invalid dimensions", async () => {
    await reader.createReader(getBytesCallback, testFileData.byteLength);

    const output = new Float32Array(1000);
    const dimReadStart = new BigInt64Array([0n]); // Invalid dimension count
    const dimReadEnd = new BigInt64Array([10n]);
    const intoCubeOffset = new BigInt64Array([0n]);
    const intoCubeDimension = new BigInt64Array([10n]);

    expect(() =>
      reader.readInto(
        output,
        OmDataType.DATA_TYPE_FLOAT_ARRAY,
        dimReadStart,
        dimReadEnd,
        intoCubeOffset,
        intoCubeDimension
      )
    ).toThrow();
  });

  it("should handle out-of-bounds reads", async () => {
    reader = new OmFileReader();

    await reader.createReader(getBytesCallback, testFileData.byteLength);

    const output = new Uint8Array(1000);
    const dimReadStart = new BigInt64Array([0n, 0n, 0n]);
    const dimReadEnd = new BigInt64Array([1000n, 1000n, 1000n]); // Too large for defined output
    const intoCubeOffset = new BigInt64Array([0n, 0n, 0n]);
    const intoCubeDimension = new BigInt64Array([1000n, 1000n, 1000n]);

    expect(() =>
      reader.readInto(
        output,
        OmDataType.DATA_TYPE_FLOAT_ARRAY,
        dimReadStart,
        dimReadEnd,
        intoCubeOffset,
        intoCubeDimension
      )
    ).toThrow();
  });

  it("should properly clean up resources", async () => {
    await reader.createReader(getBytesCallback, testFileData.byteLength);
    reader.destroy();

    // Attempting to use the reader after destruction should throw
    const output = new Uint8Array(1000);
    const dimReadStart = new BigInt64Array([0n, 0n, 0n]);
    const dimReadEnd = new BigInt64Array([10n, 10n, 10n]);
    const intoCubeOffset = new BigInt64Array([0n, 0n, 0n]);
    const intoCubeDimension = new BigInt64Array([10n, 10n, 10n]);

    expect(() =>
      reader.readInto(
        output,
        OmDataType.DATA_TYPE_FLOAT_ARRAY,
        dimReadStart,
        dimReadEnd,
        intoCubeOffset,
        intoCubeDimension
      )
    ).toThrow();
  });
});
