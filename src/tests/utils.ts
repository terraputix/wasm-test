export function createTestData(size: number): Uint16Array {
  const data = new Uint16Array(size);
  for (let i = 0; i < data.length; i++) {
    data[i] = i % 65536;
  }
  return data;
}

export function verifyData(original: Uint16Array, decompressed: Uint16Array): boolean {
  if (original.length !== decompressed.length) return false;
  for (let i = 0; i < original.length; i++) {
    if (original[i] !== decompressed[i]) return false;
  }
  return true;
}
