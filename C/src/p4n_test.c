#include "vp4.h"
#include <emscripten.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <time.h>

typedef struct Compressor {
  uint16_t *data;
  uint8_t *compressed;
  size_t buffer_size; // Maximum buffer size
  size_t data_size;   // Actual data size
  size_t compressed_size;
  double last_compression_speed;
} Compressor;

EMSCRIPTEN_KEEPALIVE
Compressor *P4NCompressor_create(size_t initial_size) {
  Compressor *comp = (Compressor *)malloc(sizeof(Compressor));
  if (comp) {
    comp->data = (uint16_t *)malloc(initial_size * sizeof(uint16_t));
    comp->compressed = (uint8_t *)malloc(initial_size * sizeof(uint8_t));
    comp->buffer_size = initial_size;
    comp->data_size = 0;
    comp->compressed_size = 0;
    comp->last_compression_speed = 0.0;
  }
  return comp;
}

EMSCRIPTEN_KEEPALIVE
void P4NCompressor_destroy(Compressor *comp) {
  if (comp) {
    free(comp->data);
    free(comp->compressed);
    free(comp);
  }
}

EMSCRIPTEN_KEEPALIVE
bool P4NCompressor_set_data(Compressor *comp, const uint16_t *new_data,
                            size_t n) {
  if (!comp)
    return false;
  if (n > comp->buffer_size) {
    printf("Buffer too small\n");
    return false;
  }

  for (size_t i = 0; i < n; i++) {
    comp->data[i] = new_data[i];
  }

  comp->data_size = n;
  return true;
}

EMSCRIPTEN_KEEPALIVE
size_t P4NCompressor_compress(Compressor *comp) {
  if (!comp)
    return 0;

  clock_t start = clock();
  comp->compressed_size =
      p4nzenc128v16(comp->data, comp->data_size, comp->compressed);
  clock_t end = clock();

  comp->last_compression_speed = ((double)(end - start)) / CLOCKS_PER_SEC;
  return comp->compressed_size;
}

EMSCRIPTEN_KEEPALIVE
uint8_t *P4NCompressor_get_compressed_data(Compressor *comp) {
  return comp ? comp->compressed : NULL;
}

EMSCRIPTEN_KEEPALIVE
bool P4NCompressor_decompress(Compressor *comp, uint16_t *output) {
  if (!comp || !output || comp->compressed_size == 0)
    return false;

  p4nzdec128v16(comp->compressed, comp->data_size, output);
  return true;
}
