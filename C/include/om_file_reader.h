#ifndef OM_FILE_READER_H
#define OM_FILE_READER_H

#include <stdint.h>
#include "om_file_format.h"
#include <emscripten.h>

typedef enum OmFileError {
    OM_FILE_ERROR_OK = 0,
    OM_FILE_ERROR_OUT_OF_MEMORY,
    OM_FILE_ERROR_NOT_AN_OM_FILE,
    OM_FILE_ERROR_IO,
    OM_FILE_ERROR_DECODER,
    OM_FILE_ERROR_INVALID_ARGUMENT,
    OM_FILE_ERROR_DATA_TYPE_MISMATCH,
} OmFileError;

/// Structure to hold JavaScript callback information
typedef struct {
    int get_bytes_callback;
    size_t total_size;
} JsBackend;

/**
 * Backend interface for handling raw data access in the OM file format.
 *
 * This structure provides an abstraction layer for reading bytes from different
 * data sources like files, memory buffers, or JavaScript callbacks.
 *
 * @field get_bytes Function pointer for reading bytes from the data source.
 *                  Takes backend data, offset, count and buffer parameters.
 *                  Returns OmFileError indicating success or failure.
 * @field backend_data Opaque pointer to backend-specific data (e.g., file handle).
 *                    Passed as first parameter to get_bytes function.
 * @field total_size Total size of the accessible data in bytes.
 */
typedef struct {
    OmFileError (*get_bytes)(void* backend_data, uint64_t offset, uint64_t count, uint8_t* buffer);
    void* backend_data;
    size_t total_size;
} OmFileBackend;

/**
 * Structure representing a reader for OM file format
 *
 * @field backend Pointer to the backend interface handling raw data access
 * @field variable_data Buffer containing the variable metadata
 * @field variable_data_size Size of the variable metadata buffer in bytes
 * @field variable Pointer to the initialized variable structure
 */
typedef struct {
    OmFileBackend* backend;
    uint8_t* variable_data;
    size_t variable_data_size;
    const OmVariable_t* variable;
} OmFileReader;

/**
 * Creates an OmFileReader instance that interfaces with JavaScript.
 *
 * This function sets up the necessary backend structures to allow reading data
 * from JavaScript through a callback mechanism. It creates a bridge between
 * the C/WASM code and JavaScript code for file reading operations.
 *
 * @param callback_index The index of the JavaScript callback function to use for reading bytes
 * @param total_size The total size of the data to be read in bytes
 * @return OmFileReader* Pointer to the created reader, or NULL if creation fails
 *
 * The function performs the following steps:
 * 1. Creates a JavaScript backend structure with the callback info
 * 2. Creates an OmFileBackend structure linking to the JS backend
 * 3. Initializes an OmFileReader with the backend
 *
 * Memory is automatically freed on error conditions.
 */
OmFileReader* create_reader_from_js(int callback_index, size_t total_size);

// Helper function to handle the JavaScript callback
static OmFileError js_get_bytes(void* backend_data, uint64_t offset, uint64_t count, uint8_t* buffer);

// Initialize a new reader for the OM file format
OmFileError om_file_reader_new(const OmFileBackend* backend, OmFileReader** reader);

// Free the memory allocated for the reader
void om_file_reader_free(OmFileReader* reader);

// Decode a variable from the OM file format -> main decode function
OmFileError om_file_reader_decode(const OmFileReader* reader, OmDecoder_t* decoder,
                                void* output, uint8_t* chunk_buffer);

#endif // OM_FILE_READER_H
