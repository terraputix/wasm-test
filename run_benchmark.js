const fs = require('fs');
const path = require('path');

// Load the generated JavaScript and WebAssembly files
const Module = require('./p4n_test.js');

Module.onRuntimeInitialized = () => {
    // Get the benchmark function from the compiled module
    const benchmark_p4nzenc128v16 = Module.cwrap('benchmark_p4nzenc128v16', null, []);

    // Run the benchmark
    for (let i = 0; i < 10; i++) {
        benchmark_p4nzenc128v16();
    }
};
