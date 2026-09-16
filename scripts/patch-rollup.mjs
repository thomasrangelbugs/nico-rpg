import { copyFileSync, cpSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const rollupNative = join(root, 'node_modules', 'rollup', 'dist', 'native.js');
const wasmSrc = join(root, 'node_modules', '@rollup', 'wasm-node', 'dist', 'wasm-node');
const wasmDest = join(root, 'node_modules', 'rollup', 'dist', 'wasm-node');

if (!existsSync(rollupNative) || !existsSync(wasmSrc)) {
  console.log('patch-rollup: skip (deps missing)');
  process.exit(0);
}

writeFileSync(
  rollupNative,
  `const {
	parse,
	xxhashBase64Url,
	xxhashBase36,
	xxhashBase16
} = require('./wasm-node/bindings_wasm.js');

exports.parse = parse;
exports.parseAsync = async (code, allowReturnOutsideFunction, jsx, _signal) =>
	parse(code, allowReturnOutsideFunction, jsx);
exports.xxhashBase64Url = xxhashBase64Url;
exports.xxhashBase36 = xxhashBase36;
exports.xxhashBase16 = xxhashBase16;
`
);

mkdirSync(wasmDest, { recursive: true });
cpSync(wasmSrc, wasmDest, { recursive: true });
console.log('patch-rollup: using WASM bindings');
