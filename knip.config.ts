export default {
  project: ["src/**/*.{ts,tsx}"],
  ignore: ["build/**"],
  ignoreDependencies: [
    "happy-dom",
    // test-only: imported from the better-auth integration harness under
    // test/auth/support, which knip does not trace for dependency usage (it
    // analyzes .test files, not their non-test helper modules)
    "better-auth",
    "@openfeature/server-sdk",
    "@envelop/types",
    "@escape.tech/graphql-armor",
    "@iggy.rs/sdk",
    "@tanstack/query-core",
    "@tanstack/react-start",
    "graphile-export",
    "postgraphile",
    "react",
    "unleash-client",
    "@aws-sdk/client-s3",
    "@aws-sdk/s3-request-presigner",
    "ajv",
  ],
};
