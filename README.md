# OmFileFormatC WebAssembly Project

This project demonstrates how to compile C code to WebAssembly using Emscripten and run benchmarks for encoding speed.

## Prerequisites

- Docker
- Node.js

## Compiling the Project

We compile the project using the Emscripten Docker container

```sh
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
```

## License

This code depends on [TurboPFor](https://github.com/powturbo/TurboPFor-Integer-Compression) and [open-meteo](https://github.com/open-meteo/open-meteo) code their license restrictions apply.
