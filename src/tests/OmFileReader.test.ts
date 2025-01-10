import { describe, beforeAll, afterEach, it, expect } from "vitest";
import { initWasm } from "../lib/wasm";
import { OmFileReader } from "../lib/OmFileReader";
import fs from "fs/promises";
import path from "path";

describe("OmFileReader", () => {
  let testFileData: ArrayBuffer;

  const getBytesCallback = (offset: bigint, count: bigint): Uint8Array => {
    // Convert BigInt to Number for slice operation
    const offsetNum = Number(offset);
    const countNum = Number(count);

    // Add safety checks
    if (
      offsetNum > Number.MAX_SAFE_INTEGER ||
      countNum > Number.MAX_SAFE_INTEGER
    ) {
      throw new Error("Offset or count exceeds safe integer range");
    }

    return new Uint8Array(testFileData.slice(offsetNum, offsetNum + countNum));
  };

  // Initialize WASM and load test file before all tests
  beforeAll(async () => {
    await initWasm();

    // Load the test file
    const filePath = path.join(__dirname, "../../test-data/read_test.om");
    const fileBuffer = await fs.readFile(filePath);
    testFileData = fileBuffer.buffer;
  });

  // Create a new reader for each test
  let reader: OmFileReader;

  afterEach(() => {
    if (reader) {
      reader.destroy();
    }
  });

  it("should successfully create a reader", async () => {
    reader = new OmFileReader();
    await expect(
      reader.createReader(getBytesCallback, testFileData.byteLength),
    ).resolves.not.toThrow();
  });

  it("should fail to create reader with invalid callback", async () => {
    reader = new OmFileReader();
    const invalidCallback = (offset: bigint, count: bigint) => {
      throw new Error("Invalid callback");
    };

    await expect(
      reader.createReader(invalidCallback, testFileData.byteLength),
    ).rejects.toThrow();
  });

  it("should successfully decode data", async () => {
    reader = new OmFileReader();

    await reader.createReader(getBytesCallback, testFileData.byteLength);

    // Adjust these values according to your test file's dimensions
    const outputSize = 5000; // Adjust based on your test data
    const output = new Uint8Array(outputSize);
    const dimReadStart = new BigInt64Array([0n, 0n, 0n]);
    const dimReadEnd = new BigInt64Array([10n, 10n, 10n]);
    const intoCubeOffset = new BigInt64Array([0n, 0n, 0n]);
    const intoCubeDimension = new BigInt64Array([10n, 10n, 10n]);

    const result = reader.decode(
      output,
      dimReadStart,
      dimReadEnd,
      intoCubeOffset,
      intoCubeDimension,
    );

    expect(result).toBe(0); // OM_FILE_ERROR_OK
    // Add more specific expectations about the decoded data
    expect(output).not.toEqual(new Uint8Array(outputSize)); // Should not be all zeros

    // Interpret output as float array
    const floatArray = new Float32Array(
      output.buffer,
      output.byteOffset,
      output.length / 4,
    );

    expect(Array.from(floatArray.slice(0, 10))).toEqual(
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
      ]),
    );
  });

  it("should fail with invalid dimensions", async () => {
    reader = new OmFileReader();
    await reader.createReader(getBytesCallback, testFileData.byteLength);

    const output = new Uint8Array(1000);
    const dimReadStart = new BigInt64Array([0n]); // Invalid dimension count
    const dimReadEnd = new BigInt64Array([10n]);
    const intoCubeOffset = new BigInt64Array([0n]);
    const intoCubeDimension = new BigInt64Array([10n]);

    const result = reader.decode(
      output,
      dimReadStart,
      dimReadEnd,
      intoCubeOffset,
      intoCubeDimension,
    );

    expect(result).not.toBe(0); // Should return an error
  });

  // it("should handle out-of-bounds reads", async () => {
  //   reader = new OmFileReader();

  //   await reader.createReader(getBytesCallback, testFileData.byteLength);

  //   const output = new Uint8Array(1000);
  //   const dimReadStart = new BigInt64Array([0n, 0n, 0n]);
  //   const dimReadEnd = new BigInt64Array([1000n, 1000n, 1000n]); // Too large
  //   const intoCubeOffset = new BigInt64Array([0n, 0n, 0n]);
  //   const intoCubeDimension = new BigInt64Array([1000n, 1000n, 1000n]);

  //   const result = reader.decode(
  //     output,
  //     dimReadStart,
  //     dimReadEnd,
  //     intoCubeOffset,
  //     intoCubeDimension,
  //   );

  //   expect(result).not.toBe(0); // Should return an error
  // });

  // // Test memory management
  // it("should properly clean up resources", async () => {
  //   reader = new OmFileReader();

  //   await reader.createReader(getBytesCallback, testFileData.byteLength);
  //   reader.destroy();

  //   // Attempting to use the reader after destruction should throw
  //   const output = new Uint8Array(1000);
  //   const dimReadStart = new BigInt64Array([0n, 0n, 0n]);
  //   const dimReadEnd = new BigInt64Array([10n, 10n, 10n]);
  //   const intoCubeOffset = new BigInt64Array([0n, 0n, 0n]);
  //   const intoCubeDimension = new BigInt64Array([10n, 10n, 10n]);

  //   expect(() =>
  //     reader.decode(
  //       output,
  //       dimReadStart,
  //       dimReadEnd,
  //       intoCubeOffset,
  //       intoCubeDimension,
  //     ),
  //   ).toThrow();
  // });
});
