export default {
  entry: ["src/index.ts", "src/graphql/index.ts", "src/react/index.ts"],
  project: ["src/**/*.{ts,tsx}"],
  ignore: ["build/**"],
  ignoreDependencies: [
    "happy-dom",
    "@envelop/types",
    "@escape.tech/graphql-armor",
    "@tanstack/query-core",
    "graphile-export",
    "postgraphile",
    "react",
  ],
};
