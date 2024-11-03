#include <stdint.h>
#include <stddef.h>
#include <stdio.h>
#include <stdlib.h>
#include <time.h>
#include "vp4.h"

#define DATA_SIZE (1024 * 1024 * 10) // 10 MB of data

void test_round_trip_p4n(uint16_t *nums, size_t n, uint8_t *compressed, uint16_t *recovered)
{
    p4nzenc128v16(nums, n, compressed);
    p4nzdec128v16(compressed, n, recovered);
}

void benchmark_p4nzenc128v16()
{
    uint16_t *data = (uint16_t *)malloc(DATA_SIZE * sizeof(uint16_t));
    uint8_t *compressed = (uint8_t *)malloc(DATA_SIZE * sizeof(uint8_t)); // Allocate enough space for compressed data

    // Initialize data with some values
    for (size_t i = 0; i < DATA_SIZE; i++)
    {
        data[i] = (uint16_t)(i % 65536); // Example data
    }

    clock_t start = clock();

    // Perform the encoding
    p4nzenc128v16(data, DATA_SIZE, compressed);

    clock_t end = clock();
    double time_taken = ((double)(end - start)) / CLOCKS_PER_SEC; // Time in seconds

    double mb_per_second = (DATA_SIZE * sizeof(uint16_t)) / (1024.0 * 1024.0) / time_taken;

    printf("Encoding speed: %.2f MB/s\n", mb_per_second);

    free(data);
    free(compressed);
}
