# Define the compiler and flags
EMCC = emcc
CFLAGS = -I/src/OmFileFormatC/include \
		 -msimd128 \
		 -mssse3 \
		 -O3 \
		 -s EXPORTED_FUNCTIONS="['_test_round_trip_p4n', '_benchmark_p4nzenc128v16', '_malloc', '_free']" \
		 -s EXTRA_EXPORTED_RUNTIME_METHODS='["ccall", "cwrap"]' \
		 -s INITIAL_MEMORY=33554432 \
		 -s MAXIMUM_MEMORY=67108864

# Define the source files
SRC_FILES = /src/p4n_test.c \
			/src/OmFileFormatC/src/om_decoder.c \
			/src/OmFileFormatC/src/om_encoder.c \
			/src/OmFileFormatC/src/vp4c.c \
			/src/OmFileFormatC/src/vp4d.c \
			/src/OmFileFormatC/src/vp4d_sse.c \
			/src/OmFileFormatC/src/vp4d_def.c \
			/src/OmFileFormatC/src/vp4d_avx2.c \
			/src/OmFileFormatC/src/vp4c_sse.c \
			/src/OmFileFormatC/src/vp4c_def.c \
			/src/OmFileFormatC/src/vp4c_avx2.c \
			/src/OmFileFormatC/src/vint.c \
			/src/OmFileFormatC/src/fp.c \
			/src/OmFileFormatC/src/delta2d.c \
			/src/OmFileFormatC/src/bitutil.c \
			/src/OmFileFormatC/src/bitunpack.c \
			/src/OmFileFormatC/src/bitunpack_sse.c \
			/src/OmFileFormatC/src/bitunpack_def.c \
			/src/OmFileFormatC/src/bitunpack_avx2.c \
			/src/OmFileFormatC/src/bitpack.c \
			/src/OmFileFormatC/src/bitpack_sse.c \
			/src/OmFileFormatC/src/bitpack_def.c \
			/src/OmFileFormatC/src/bitpack_avx2.c

# Define the output files
OUT_JS = /src/p4n_test.js

# Default target
all: $(OUT_JS)

# Rule to build the output
$(OUT_JS): $(SRC_FILES) Makefile
	$(EMCC) $(SRC_FILES) $(CFLAGS) -o $(OUT_JS)

# Clean target
clean:
	rm -f $(OUT_JS) /src/p4n_test.wasm
