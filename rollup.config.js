import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import { readFileSync } from "fs";
import cleanup from "rollup-plugin-cleanup";

// Read the version from package.json
const pkg = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf-8"));

/**
 * Custom plugin that strips the export statement for GAS
 * Without it, `clasp push` fails
 *
 * @returns {import("rollup").Plugin}
 */
const removeExports = () => {
  return {
    name: "remove-exports",
    generateBundle(_, bundle) {
      Object.keys(bundle).forEach((fileName) => {
        const chunk = bundle[fileName];
        if (chunk.type === "chunk") {
          // Strip the export statement
          chunk.code = chunk.code.replace(/^export\s*\{[^}]*\};\s*$/m, "");
        }
      });
    },
  };
};

export default {
  input: "src/main.ts",
  output: {
    file: "dist/main.js",
    format: "es",
    banner: `// Google Apps Script - ${pkg.name}@${pkg.version}`,
  },
  external: () => false,
  plugins: [
    resolve({
      browser: true,
      preferBuiltins: false,
    }),
    commonjs(),
    typescript({
      tsconfig: "./tsconfig.json",
      compilerOptions: {
        module: "ES2020",
        target: "ES2020",
      },
    }),
    cleanup({
      comments: "all",
      extensions: ["js", "ts"],
    }),
    removeExports(), // Plugin that strips the export statement
  ],
};
