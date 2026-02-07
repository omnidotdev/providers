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
    external: [],
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
  });

  if (!result.success) {
    console.error(`Build failed for ${entrypoint}:`);

    for (const log of result.logs) {
      console.error(log);
    }

    process.exit(1);
  }
}

// Emit type declarations
const tsc = Bun.spawn(["tsc", "--emitDeclarationOnly"], {
  stdio: ["inherit", "inherit", "inherit"],
});

const exitCode = await tsc.exited;

if (exitCode !== 0) process.exit(exitCode);
