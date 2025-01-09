# Define the compiler and flags
EMCC = emcc

EXPORTED_FUNCS = [ '_P4NCompressor_compress', '_P4NCompressor_decompress', '_P4NCompressor_create', '_P4NCompressor_get_compressed_data', '_malloc', '_free']
RUNTIME_METHODS = ['ccall', 'cwrap']

CFLAGS = -I/src/om-file-format/c/include \
			-msimd128 \
			-mssse3 \
			-O3 \
			-s EXPORTED_FUNCTIONS="$(EXPORTED_FUNCS)" \
			-s EXPORTED_RUNTIME_METHODS='$(RUNTIME_METHODS)' \
			-s INITIAL_MEMORY=33554432 \
			-s MAXIMUM_MEMORY=67108864


# Define the source files
SRC_FILES = /src/p4n_test.c \
			$(wildcard /src/om-file-format/c/src/*.c)

DIST_DIR = dist
WASM_DIR = $(DIST_DIR)/wasm
OUT_JS = $(WASM_DIR)/p4n_test.js

# Default target
all: $(OUT_JS)

$(OUT_JS): p4n_test.c
	mkdir -p $(WASM_DIR)
	$(EMCC) $(SRC_FILES) $(CFLAGS) -o $(OUT_JS)


# Clean target
clean:
	rm -f $(OUT_JS) /src/p4n_test.wasm
