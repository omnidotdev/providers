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
    // Externalize peer deps to avoid bundling CJS modules (e.g. @iggy.rs/sdk)
    // which inject `createRequire` and break Vite browser builds
    external: [
      "@iggy.rs/sdk",
      "@tanstack/query-core",
      "unleash-client",
      "resend",
      "@aws-sdk/client-s3",
      "@aws-sdk/s3-request-presigner",
    ],
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

// Strip dead `createRequire` CJS interop injected by Bun's bundler.
// It's never called but breaks Vite browser builds that resolve the main entry.
const mainBundle = "./build/index.js";
const content = await Bun.file(mainBundle).text();
const stripped = content
  .replace('import { createRequire } from "node:module";\n', "")
  .replace(
    "var __require = /* @__PURE__ */ createRequire(import.meta.url);\n",
    "",
  );

if (stripped !== content) {
  await Bun.write(mainBundle, stripped);
}

// Emit type declarations
const tsc = Bun.spawn(["tsc", "--emitDeclarationOnly"], {
  stdio: ["inherit", "inherit", "inherit"],
});

const exitCode = await tsc.exited;

if (exitCode !== 0) process.exit(exitCode);
