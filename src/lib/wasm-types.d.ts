declare module "*.js" {
  const Module: {
    _Compressor_create(size: number): number;
    _Compressor_destroy(ptr: number): void;
    _Compressor_compress(ptr: number): number;
    _Compressor_decompress(ptr: number): boolean;
    _malloc(size: number): number;
    _free(ptr: number): void;
    HEAPU8: Uint8Array;
    HEAPU16: Uint16Array;
    ccall: (name: string, returnType: string, argTypes: string[], args: any[]) => any;
    cwrap: (name: string, returnType: string, argTypes: string[]) => Function;
  };
  export default Module;
}
