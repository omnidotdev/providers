export default {
  project: ["src/**/*.{ts,tsx}"],
  ignore: ["build/**"],
  ignoreDependencies: [
    "happy-dom",
    "@openfeature/server-sdk",
    "@envelop/types",
    "@escape.tech/graphql-armor",
    "@iggy.rs/sdk",
    "@tanstack/query-core",
    "graphile-export",
    "postgraphile",
    "react",
    "unleash-client",
    "@aws-sdk/client-s3",
    "@aws-sdk/s3-request-presigner",
    "ajv",
  ],
};
