const Module = require('./p4n_test.js');

Module.onRuntimeInitialized = () => {
    const n = 3;
    const nums = new Uint16Array([33, 44, 77]);
    const compressed = new Uint8Array(1000);
    const recovered = new Uint16Array(n + 200);

    // Get the function from the compiled module
    const test_round_trip_p4n = Module.cwrap('test_round_trip_p4n', null, ['number', 'number', 'number', 'number']);

    // Allocate memory in the Emscripten heap
    const numsPtr = Module._malloc(nums.length * nums.BYTES_PER_ELEMENT);
    const compressedPtr = Module._malloc(compressed.length * compressed.BYTES_PER_ELEMENT);
    const recoveredPtr = Module._malloc(recovered.length * recovered.BYTES_PER_ELEMENT);

    // Copy data to the Emscripten heap
    Module.HEAPU16.set(nums, numsPtr / nums.BYTES_PER_ELEMENT);
    Module.HEAPU8.set(compressed, compressedPtr);
    Module.HEAPU16.set(recovered, recoveredPtr / recovered.BYTES_PER_ELEMENT);

    // Call the function
    test_round_trip_p4n(numsPtr, n, compressedPtr, recoveredPtr);

    // Copy the recovered data back to JavaScript
    const recoveredResult = new Uint16Array(Module.HEAPU16.buffer, recoveredPtr, n);

    // Check the result
    console.assert(recoveredResult[0] === nums[0], 'Test failed');
    console.assert(recoveredResult[1] === nums[1], 'Test failed');
    console.assert(recoveredResult[2] === nums[2], 'Test failed');

    console.log('Test passed');

    // Free the allocated memory
    Module._free(numsPtr);
    Module._free(compressedPtr);
    Module._free(recoveredPtr);
};
