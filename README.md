# OmFileFormatC WASM Test

POC how to compile OmFileFormatC to wasm and related benchmarks and tests.

## Prerequisites

- Docker
- Node.js

## Compiling the Project

We compile the project using the Emscripten Docker container

```sh
git submodule add https://github.com/open-meteo/om-file-format
docker pull emscripten/emsdk
docker run --rm -v $(pwd):/src emscripten/emsdk make -C /src
```

This command mounts your current directory to /src inside the Docker container and runs the make command in that directory. The Makefile will compile the source files and generate the p4n_test.js and p4n_test.wasm files.

## Running the Tests

```sh
# test p4
node test_round_trip_p4n.js

# benchmark p4
node run_benchmark.js
# prints the following on Intel(R) Core(TM) i7-10510U CPU @ 1.80GHz:
# Encoding speed: 487.80 MB/s
# Encoding speed: 500.00 MB/s
# Encoding speed: 512.82 MB/s
# Encoding speed: 540.54 MB/s
# Encoding speed: 444.44 MB/s
# Encoding speed: 465.12 MB/s
# Encoding speed: 500.00 MB/s
# Encoding speed: 512.82 MB/s
# Encoding speed: 540.54 MB/s
# Encoding speed: 555.56 MB/s
```

## License

This code depends on [TurboPFor](https://github.com/powturbo/TurboPFor-Integer-Compression) and [open-meteo](https://github.com/open-meteo/open-meteo) code their license restrictions apply.
