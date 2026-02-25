export default {
  entry: ["src/index.ts", "src/graphql/index.ts", "src/react/index.ts"],
  project: ["src/**/*.{ts,tsx}"],
  ignore: ["build/**"],
  ignoreDependencies: [
    "happy-dom",
    "@envelop/types",
    "@escape.tech/graphql-armor",
    "@iggy.rs/sdk",
    "@tanstack/query-core",
    "graphile-export",
    "postgraphile",
    "react",
    "unleash-client",
    "resend",
    "@aws-sdk/client-s3",
    "@aws-sdk/s3-request-presigner",
  ],
};
