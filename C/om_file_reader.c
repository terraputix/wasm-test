#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <stdbool.h>
#include <string.h>
#include "om_file_format.h"
#include <emscripten.h>

typedef enum OmFileError {
    OM_FILE_ERROR_OK = 0,
    OM_FILE_ERROR_OUT_OF_MEMORY,
    OM_FILE_ERROR_NOT_AN_OM_FILE,
    OM_FILE_ERROR_IO,
    OM_FILE_ERROR_DECODER,
    OM_FILE_ERROR_INVALID_ARGUMENT
} OmFileError;

// Helper function to convert OmError_t to OmFileError
OmFileError convert_om_error(OmError_t error) {
    switch (error) {
        case ERROR_OK:
            return OM_FILE_ERROR_OK;
        default:
            printf("FOUND ERROR: %d\n", error);
            return OM_FILE_ERROR_DECODER;
    }
}

// Structure to hold JavaScript callback information
typedef struct {
    int get_bytes_callback;
    size_t total_size;
} JsBackend;

// Backend interface
typedef struct {
    // Function pointer for getting bytes from the backend
    OmFileError (*get_bytes)(void* backend_data, uint64_t offset, uint64_t count, uint8_t* buffer);
    // The actual backend data (could be a file handle, etc.)
    void* backend_data;
    // Total size of the data
    size_t total_size;
} OmFileBackend;

// Reader structure
typedef struct {
    OmFileBackend* backend;
    uint8_t* variable_data;
    size_t variable_data_size;
    const OmVariable_t* variable;
} OmFileReader;

// Forward declarations
static OmFileError js_get_bytes(void* backend_data, uint64_t offset, uint64_t count, uint8_t* buffer);
OmFileError om_file_reader_new(const OmFileBackend* backend, OmFileReader** reader);
void om_file_reader_free(OmFileReader* reader);
OmFileError om_file_reader_decode(const OmFileReader* reader, OmDecoder_t* decoder,
                                 void* output, uint8_t* chunk_buffer);


// Helper function to handle the JavaScript callback
static OmFileError js_get_bytes(void* backend_data, uint64_t offset, uint64_t count, uint8_t* buffer) {
    JsBackend* js_backend = (JsBackend*)backend_data;

    printf("js_get_bytes called with offset: %llu, count: %llu\n", offset, count);
    printf("total_size: %zu\n", js_backend->total_size);

    // Validate parameters
    if (offset + count > js_backend->total_size) {
        return OM_FILE_ERROR_INVALID_ARGUMENT;
    }

    if (!buffer) {
        return OM_FILE_ERROR_INVALID_ARGUMENT;
    }

    int result = EM_ASM_INT({
        try {
            const callback = Module.callbacks[$0];
            const offset = $1;
            const count = $2;
            const buffer = $3;

            const result = callback(offset, count);

            // Validate returned data
            if (!(result instanceof Uint8Array)) {
                console.error('Invalid return type from callback');
                return 3; // OM_FILE_ERROR_IO
            }

            if (result.length !== Number(count)) {
                console.error('count:', count, 'result.length:', result.length);
                console.error('Callback returned wrong number of bytes');
                return 3; // OM_FILE_ERROR_IO
            }

            HEAPU8.set(result, buffer);
            return 0; // OM_FILE_ERROR_OK
        } catch (error) {
            console.error('Error in get_bytes:', error);
            return 3; // OM_FILE_ERROR_IO
        }
    }, js_backend->get_bytes_callback,
        offset,
        count,
        buffer
    );

    return (OmFileError)result;
}

EMSCRIPTEN_KEEPALIVE
OmFileReader* create_reader_from_js(int callback_index, size_t total_size) {
    JsBackend* js_backend = malloc(sizeof(JsBackend));
    if (!js_backend) return NULL;

    js_backend->get_bytes_callback = callback_index;
    js_backend->total_size = total_size;

    OmFileBackend* backend = malloc(sizeof(OmFileBackend));
    if (!backend) {
        free(js_backend);
        return NULL;
    }

    backend->get_bytes = js_get_bytes;
    backend->backend_data = js_backend;
    backend->total_size = total_size;

    OmFileReader* reader = NULL;
    OmFileError error = om_file_reader_new(backend, &reader);

    printf("Reader created with error: %d\n", error);

    if (error != OM_FILE_ERROR_OK) {
        free(js_backend);
        free(backend);
        return NULL;
    }

    return reader;
}

EMSCRIPTEN_KEEPALIVE
OmFileError decode_with_reader(
    OmFileReader* reader,
    uint8_t* output,
    size_t output_size,
    const uint64_t* dim_read_start,  // Array of start positions
    const uint64_t* dim_read_end,    // Array of end positions
    const uint64_t* into_cube_offset,
    const uint64_t* into_cube_dimension,
    uint64_t dimension_count,
    uint64_t io_size_max,     // Optional, will use default if 0
    uint64_t io_size_merge    // Optional, will use default if 0
) {

    // Debug input parameters
    printf("Decoding with parameters:\n");
    printf("  reader: %p\n", (void*)reader);
    printf("  output: %p\n", (void*)output);
    printf("  output_size: %zu\n", output_size);
    printf("  dim_read_start: %p\n", (void*)dim_read_start);
    printf("  dim_read_end: %p\n", (void*)dim_read_end);
    printf("  into_cube_offset: %p\n", (void*)into_cube_offset);
    printf("  into_cube_dimension: %p\n", (void*)into_cube_dimension);
    printf("  dimension_count: %llu\n", dimension_count);
    printf("  io_size_max: %llu\n", io_size_max);
    printf("  io_size_merge: %llu\n", io_size_merge);

    if (!reader || !output || !dim_read_start || !dim_read_end ||
        !into_cube_offset || !into_cube_dimension) {
        return OM_FILE_ERROR_INVALID_ARGUMENT;
    }

    // Use defaults if not specified
    if (io_size_max == 0) io_size_max = 65536;
    if (io_size_merge == 0) io_size_merge = 512;

    // Verify data type (you'll need to implement this based on your needs)
    // if (data_type != reader->variable->data_type) {
    //     return OM_FILE_ERROR_INVALID_ARGUMENT;
    // }

    printf("Preparing to decode with reader\n");

    // Prepare read parameters
    uint64_t* read_offset = malloc(dimension_count * sizeof(uint64_t));
    uint64_t* read_count = malloc(dimension_count * sizeof(uint64_t));

    printf("Allocated read_offset and read_count\n");

    if (!read_offset || !read_count) {
        free(read_offset);
        free(read_count);
        return OM_FILE_ERROR_OUT_OF_MEMORY;
    }

    printf("Calculate read_count from start and end positions\n");

    printf("Looping from 0 to %llu\n", dimension_count);
    // Add bounds check
    if (dimension_count > 1000) { // or some reasonable maximum
        printf("Warning: Suspicious dimension_count value\n");
        return OM_FILE_ERROR_INVALID_ARGUMENT;
    }

    // Calculate read_count from start and end positions
    for (uint64_t i = 0; i < dimension_count; i++) {
        printf("Loop iteration %llu\n", i);
        read_offset[i] = dim_read_start[i];
        read_count[i] = dim_read_end[i] - dim_read_start[i];
    }

    printf("Initialize decoder\n");

    // Initialize decoder
    OmDecoder_t decoder;
    OmError_t init_error = om_decoder_init(
        &decoder,
        reader->variable,
        dimension_count,
        read_offset,
        read_count,
        into_cube_offset,
        into_cube_dimension,
        io_size_merge,
        io_size_max
    );

    printf("Decoder initialized with error: %d\n", init_error);

    // Free arrays that are no longer needed
    // free(read_offset);
    // free(read_count);

    if (init_error != ERROR_OK) {
        return convert_om_error(init_error);
    }

    // Allocate chunk buffer with proper size
    uint64_t chunk_buffer_size = om_decoder_read_buffer_size(&decoder);
    printf("CHUNK_BUFFER_SIZE: %llu\n", chunk_buffer_size);
    uint8_t* chunk_buffer = malloc(chunk_buffer_size);
    if (!chunk_buffer) {
        return OM_FILE_ERROR_OUT_OF_MEMORY;
    }

    printf("Before decoding chunks - first few output values: %d %d %d\n",
           output[0], output[1], output[2]);
    // Perform decoding
    OmFileError error = om_file_reader_decode(reader, &decoder, output, chunk_buffer);

    printf("After decoding chunks - first few output values: %d %d %d\n",
           output[0], output[1], output[2]);

    free(chunk_buffer);
    return error;
}

EMSCRIPTEN_KEEPALIVE
void destroy_reader(OmFileReader* reader) {
    if (reader) {
        if (reader->backend) {
            if (reader->backend->backend_data) {
                free(reader->backend->backend_data);
            }
            free(reader->backend);
        }
        om_file_reader_free(reader);
    }
}

static void cleanup_and_free(uint8_t* data1, uint8_t* data2, OmFileReader* reader) {
    free(data1);
    free(data2);
    free(reader);
}

static OmFileError read_variable_data(const OmFileBackend* backend,
                                    uint64_t offset, uint64_t size,
                                    uint8_t** out_data) {
    if (size == 0 || offset + size > backend->total_size) {
        return OM_FILE_ERROR_INVALID_ARGUMENT;
    }

    *out_data = malloc(size);
    if (!*out_data) {
        return OM_FILE_ERROR_OUT_OF_MEMORY;
    }

    return backend->get_bytes(backend->backend_data, offset, size, *out_data);
}

// Create new reader
OmFileError om_file_reader_new(const OmFileBackend* backend, OmFileReader** reader) {
    if (!backend || !reader || !backend->get_bytes || backend->total_size == 0) {
        return OM_FILE_ERROR_INVALID_ARGUMENT;
    }

    OmFileReader* new_reader = malloc(sizeof(OmFileReader));
    if (!new_reader) return OM_FILE_ERROR_OUT_OF_MEMORY;

    uint64_t header_size = om_header_size();
    uint8_t* header_data = NULL;

    OmFileError error = read_variable_data(backend, 0, header_size, &header_data);
    if (error != OM_FILE_ERROR_OK) {
        free(new_reader);
        return error;
    }

    OmHeaderType_t header_type = om_header_type(header_data);

    printf("Header type: %d\n", header_type);

    if (header_type == OM_HEADER_INVALID) {
        cleanup_and_free(header_data, NULL, new_reader);
        return OM_FILE_ERROR_NOT_AN_OM_FILE;
    }

    uint8_t* variable_data = NULL;
    size_t variable_data_size = 0;

    if (header_type == OM_HEADER_LEGACY) {
        variable_data = header_data;
        variable_data_size = header_size;
    } else if (header_type == OM_HEADER_READ_TRAILER) {
        uint64_t trailer_size = om_trailer_size();
        uint64_t trailer_offset = backend->total_size - trailer_size;

        uint8_t* trailer_data = NULL;
        error = read_variable_data(backend, trailer_offset, trailer_size, &trailer_data);
        if (error != OM_FILE_ERROR_OK) {
            cleanup_and_free(header_data, NULL, new_reader);
            return error;
        }

        uint64_t var_offset = 0, var_size = 0;
        if (!om_trailer_read(trailer_data, &var_offset, &var_size)) {
            cleanup_and_free(header_data, trailer_data, new_reader);
            return OM_FILE_ERROR_NOT_AN_OM_FILE;
        }

        free(trailer_data);
        error = read_variable_data(backend, var_offset, var_size, &variable_data);
        if (error != OM_FILE_ERROR_OK) {
            cleanup_and_free(header_data, NULL, new_reader);
            return error;
        }

        variable_data_size = var_size;
        free(header_data);
    }

    new_reader->backend = (OmFileBackend*)backend;
    new_reader->variable_data = variable_data;
    new_reader->variable_data_size = variable_data_size;
    new_reader->variable = om_variable_init(variable_data);

    *reader = new_reader;
    return OM_FILE_ERROR_OK;
}

// Main decode function
OmFileError om_file_reader_decode(const OmFileReader* reader, OmDecoder_t* decoder,
                                void* output, uint8_t* chunk_buffer) {
    if (!reader || !decoder || !output || !chunk_buffer) {
        return OM_FILE_ERROR_INVALID_ARGUMENT;
    }

    printf("Main decode loop \n");

    OmError_t om_error = ERROR_OK;
    OmDecoder_indexRead_t index_read;

    om_decoder_init_index_read(decoder, &index_read);

    printf("blub\n");

    printf("Decoder state:\n");
    printf("  dimensions_count: %llu\n", decoder->dimensions_count);
    printf("  io_size_merge: %llu\n", decoder->io_size_merge);
    printf("  io_size_max: %llu\n", decoder->io_size_max);
    printf("  lut_chunk_length: %llu\n", decoder->lut_chunk_length);
    printf("  lut_start: %llu\n", decoder->lut_start);
    printf("  number_of_chunks: %llu\n", decoder->number_of_chunks);

    printf("  dimensions:\n");
    for (uint64_t i = 0; i < decoder->dimensions_count; i++) {
        printf("    [%llu]: %llu\n", i, decoder->dimensions[i]);
    }

    printf("  chunks:\n");
    for (uint64_t i = 0; i < decoder->dimensions_count; i++) {
        printf("    [%llu]: %llu\n", i, decoder->chunks[i]);
    }

    printf("  read_offset:\n");
    for (uint64_t i = 0; i < decoder->dimensions_count; i++) {
        printf("    [%llu]: %llu\n", i, decoder->read_offset[i]);
    }

    printf("  read_count:\n");
    for (uint64_t i = 0; i < decoder->dimensions_count; i++) {
        printf("    [%llu]: %llu\n", i, decoder->read_count[i]);
    }

    printf("  cube_dimensions:\n");
    for (uint64_t i = 0; i < decoder->dimensions_count; i++) {
        printf("    [%llu]: %llu\n", i, decoder->cube_dimensions[i]);
    }

    printf("  cube_offset:\n");
    for (uint64_t i = 0; i < decoder->dimensions_count; i++) {
        printf("    [%llu]: %llu\n", i, decoder->cube_offset[i]);
    }

    printf("  scale_factor: %f\n", decoder->scale_factor);
    printf("  add_offset: %f\n", decoder->add_offset);


    printf("Location of om_decoder_next_index_read: %p\n", (void*)om_decoder_next_index_read);

    while (om_decoder_next_index_read(decoder, &index_read)) {
        uint8_t* index_data = malloc(index_read.count);
        if (!index_data) return OM_FILE_ERROR_OUT_OF_MEMORY;

        printf("index_read.offset %llu \n", index_read.offset);
        printf("index_read.count %llu \n", index_read.count);

        OmFileError error = reader->backend->get_bytes(
            reader->backend->backend_data,
            index_read.offset,
            index_read.count,
            index_data
        );

        if (error != OM_FILE_ERROR_OK) {
            free(index_data);
            printf("error: %d \n", error);
            return error;
        }

        OmDecoder_dataRead_t data_read;
        om_decoder_init_data_read(&data_read, &index_read);

        while (om_decoder_next_data_read(decoder, &data_read,
                                       index_data, index_read.count, &om_error)) {
            uint8_t* data = malloc(data_read.count);
            if (!data) {
                free(index_data);
                return OM_FILE_ERROR_OUT_OF_MEMORY;
            }

            printf("Trying to get bytes\n");

            error = reader->backend->get_bytes(
                reader->backend->backend_data,
                data_read.offset,
                data_read.count,
                data
            );

            printf("Got bytes\n");
            printf("Data at ptr: ");
            for (int i = 0; i < data_read.count; i++) {
                printf("%d ", data[i]);
            }
            printf("\n");
            printf("Error: %d\n", error);

            if (error != OM_FILE_ERROR_OK) {
                // free(data);
                free(index_data);
                return error;
            }

            printf("Trying to decode chunks\n");
            printf("Calling om_decoder_decode_chunks with:\n");
            printf("  decoder: %p\n", (void*)decoder);
            printf("  data: %p\n", (void*)data);
            printf("  count: %llu\n", data_read.count);
            printf("  output: %p\n", output);
            printf("  chunk_buffer: %p\n", (void*)chunk_buffer);

            if (!om_decoder_decode_chunks(
                decoder,
                data_read.chunkIndex,
                (const void*)data,
                data_read.count,
                (void*)output,
                (void*)chunk_buffer,
                &om_error
            )) {
                printf("Error in om_decoder_decode_chunks\n");
                // free(data);
                // printf("Freed data\n");
                free(index_data);
                printf("Freed index_data\n");
                return convert_om_error(om_error);
            }
            free(data);
        }
        free(index_data);

        if (om_error != ERROR_OK) {
            return convert_om_error(om_error);
        }
    }

    return OM_FILE_ERROR_OK;
}

void om_file_reader_free(OmFileReader* reader) {
    if (reader) {
        free(reader->variable_data);
        free(reader);
    }
}
