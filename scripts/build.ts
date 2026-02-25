/**
 * Build script for @omnidotdev/providers.
 *
 * Produces three entry points (core, graphql, react) with peer
 * dependencies externalized, then emits type declarations.
 */

const entries = [
  {
    entrypoint: "./src/index.ts",
    outdir: "./build",
    target: "node" as const,
    // Bundle all deps so consumers don't need them installed.
    // Post-build step patches `createRequire` to a runtime-safe
    // fallback that works on Bun/Node and doesn't break Vite.
    external: [] as string[],
  },
  {
    entrypoint: "./src/graphql/index.ts",
    outdir: "./build/graphql",
    target: "node" as const,
    // Only externalize framework packages consumers already have.
    // Bundle implementation deps (graphql-armor, query-core) so
    // consumers don't need them as direct dependencies.
    external: [
      "graphile-export",
      "graphile-export/helpers",
      "postgraphile",
      "postgraphile/grafast",
      "postgraphile/utils",
    ],
  },
  {
    entrypoint: "./src/react/index.ts",
    outdir: "./build/react",
    target: "browser" as const,
    external: ["react"],
  },
];

for (const { entrypoint, outdir, target, external } of entries) {
  const result = await Bun.build({
    entrypoints: [entrypoint],
    outdir,
    format: "esm",
    target,
    external,
    // Use production JSX runtime (react/jsx-runtime, not react/jsx-dev-runtime)
    define: { "process.env.NODE_ENV": '"production"' },
  });

  if (!result.success) {
    console.error(`Build failed for ${entrypoint}:`);

    for (const log of result.logs) {
      console.error(log);
    }

    process.exit(1);
  }
}

// Patch the main bundle so it works in Node ESM (Nitro), Bun, and
// Vite browser builds. Bun's bundler injects CJS interop
// (`createRequire`) and leaves top-level `import … from "node:*"`
// for built-in modules. Static node:* imports break Vite when it
// resolves this file for the client bundle.
//
// Fix: keep `createRequire` for Node ESM compat (where bare `require`
// is undefined), prefer native `require` when available (Bun/CJS),
// and convert static `node:*` imports to lazy `__require` calls that
// only execute at runtime and never in the browser.
const mainBundle = "./build/index.js";
let patched = await Bun.file(mainBundle).text();

// NB: patch order matters — the createRequire import must be removed
// first, otherwise step 2's `import { X } from "node:*"` regex would
// convert it to a `__require("node:module")` call (before __require
// is defined). Step 3 must run after step 1, because step 1 inserts
// `await import("node:module")` which step 3 would incorrectly catch.

// 1. Remove Bun's static `createRequire` import (will be replaced in step 4)
patched = patched.replace(
  'import { createRequire } from "node:module";\n',
  "",
);

// 2. Convert `import { X, Y } from "node:*"` to `var { X, Y } = __require("node:*")`
//    so Vite doesn't try to resolve Node built-ins for the browser bundle
patched = patched.replace(
  /^import \{([^}]+)\} from "(node:[^"]+)";$/gm,
  (_match, names, mod) => `var {${names}} = __require("${mod}");`,
);

// 3. Convert dynamic `await import("node:*")` and `await import("@react-email/*")`
//    to `__require()` calls so Vite/Rollup doesn't try to resolve them.
//    These are optional runtime deps that only execute on the server.
patched = patched.replace(
  /await import\("(node:[^"]+)"\)/g,
  (_match, mod) => `__require("${mod}")`,
);
patched = patched.replace(
  /await import\("(@react-email\/[^"]+)"\)/g,
  (_match, mod) => `__require("${mod}")`,
);

// 4. Replace createRequire with runtime-safe fallback that works in:
//    - CJS / Bun ESM: `require` is defined, use it directly
//    - Node ESM (Nitro): `require` is undefined, use `createRequire`
//    - Vite browser: never reaches this code (server-only entry)
patched = patched.replace(
  "var __require = /* @__PURE__ */ createRequire(import.meta.url);\n",
  `var __require = typeof require !== "undefined" ? require : (await import("node:module")).createRequire(import.meta.url);\n`,
);

if (patched !== (await Bun.file(mainBundle).text())) {
  await Bun.write(mainBundle, patched);
}

// Emit type declarations
const tsc = Bun.spawn(["tsc", "--emitDeclarationOnly"], {
  stdio: ["inherit", "inherit", "inherit"],
});

const exitCode = await tsc.exited;

if (exitCode !== 0) process.exit(exitCode);
