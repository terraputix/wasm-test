#include "vp4.h"
#include <emscripten.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

// Helper function to check if two arrays are equal
int arrays_equal(uint16_t *arr1, uint16_t *arr2, size_t size) {
  return memcmp(arr1, arr2, size * sizeof(uint16_t)) == 0;
}

EMSCRIPTEN_KEEPALIVE
int test_p4nzdec128v16() {
  // Input compressed data
  uint8_t compressed[] = {
      192, 27, 254, 68, 12, 3,   18,  52,  177, 195, 179, 171, 87,  65,  53,
      35,  48, 17,  53, 90, 22,  128, 185, 102, 119, 168, 159, 134, 152, 128,
      134, 65, 40,  51, 67, 211, 173, 14,  64,  18,  78,  47,  163, 1,   165,
      181, 66, 178, 22, 30, 178, 78,  212, 13,  0,   11,  0,   7,   0,   5,
      0,   5,  0,   3,  0,  1,   0,   0,   0,   1,   2,   3,   1,   1,   1,
      1,   3,  3,   1,  1,  67,  0,   1,   3,   4,   5,   48,  49,  61,  62,
      67,  80, 103, 0,  0,  0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
      0,   0,  0,   0,  0,  0,   0,   0,   0,   0,   0,   201, 10,  0,   0,
      0,   0,  0,   0,  0,  0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
      0,   0,  0,   0,  0,  0,   0,   0,   0};

  // Allocate space for uncompressed data
  uint16_t *uncompressed = (uint16_t *)calloc(3016, sizeof(uint16_t));
  if (!uncompressed) {
    return 0; // Memory allocation failed
  }

  // Decompress the data
  size_t size = p4nzdec128v16(compressed, 3016, uncompressed);

  // Check if size matches expected value
  if (size != 116) {
    free(uncompressed);
    return 0;
  }

  // Expected values for the first few elements (you can extend this as needed)
  uint16_t expected[] = {
      65051, 65041, 65059, 65057, 65027, 65018, 65008, 65007, 65012,
      65012, 65010, 65016, 65021, 65023, 65024, 65023
      // ... Add more expected values as needed
  };

  // Check if the first few values match
  if (!arrays_equal(uncompressed, expected,
                    sizeof(expected) / sizeof(expected[0]))) {
    free(uncompressed);
    return 0;
  }

  printf("Array equal\n");

  // Verify that remaining elements are 0
  for (size_t i = size; i < 3016; i++) {
    if (uncompressed[i] != 0) {
      free(uncompressed);
      return 0;
    }
  }

  free(uncompressed);
  return 1; // Test passed
}

// Main function for running the test
int main() {
  int result = test_p4nzdec128v16();
  printf("Test %s\n", result ? "PASSED" : "FAILED");
  return result ? 0 : 1;
}
