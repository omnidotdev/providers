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

// Patch the main bundle so it works in both Node/Bun and Vite browser
// builds. Bun's bundler injects CJS interop (`createRequire`) and
// leaves top-level `import … from "node:*"` for built-in modules.
// Both break Vite when it resolves this file for the client bundle.
//
// Fix: replace `createRequire` with a runtime-safe `require` fallback,
// and convert static `node:*` imports to lazy `__require` calls that
// only execute at runtime (in Node/Bun) and never in the browser.
const mainBundle = "./build/index.js";
let patched = await Bun.file(mainBundle).text();

// 1. Replace createRequire with runtime-safe fallback
patched = patched
  .replace('import { createRequire } from "node:module";\n', "")
  .replace(
    "var __require = /* @__PURE__ */ createRequire(import.meta.url);\n",
    'var __require = typeof require !== "undefined" ? require : (id) => { throw new Error(`require() not available for "${id}"`) };\n',
  );

// 2. Convert `import { X, Y } from "node:*"` to `var { X, Y } = __require("node:*")`
//    so Vite doesn't try to resolve Node built-ins for the browser bundle
patched = patched.replace(
  /^import \{([^}]+)\} from "(node:[^"]+)";$/gm,
  (_match, names, mod) =>
    `var {${names}} = __require("${mod}");`,
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
