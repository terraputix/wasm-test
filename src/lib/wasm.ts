let wasmModule: any = null;

export async function initWasm(): Promise<void> {
  if (wasmModule) return;

  try {
    const mod = await import("../../dist/wasm/om_reader_wasm.js");
    wasmModule = mod.default;

    // Wait for the module to be fully initialized
    if (!wasmModule.calledRun) {
      await new Promise<void>((resolve) => {
        wasmModule.onRuntimeInitialized = () => resolve();
      });
    }
  } catch (error) {
    throw new Error(`Failed to initialize WASM module: ${error}`);
  }
}

export function getWasmModule() {
  if (!wasmModule) {
    throw new Error("WASM module not initialized. Call initWasm() first.");
  }
  return wasmModule;
}
