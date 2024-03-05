module.exports = {
  extends: ["./node_modules/@balena/lint/config/.eslintrc.js"],
  parserOptions: {
    project: "tsconfig.json",
  },
  root: true,
  rules: {
    // to avoid the `warning  Forbidden non-null assertion  @typescript-eslint/no-non-null-assertion`
    "@typescript-eslint/no-non-null-assertion": "off",
    "@typescript-eslint/no-shadow": "off",
    "no-restricted-imports": [
      "error",
      {
        patterns: ["rendition/dist/.*"],
        paths: [
          "rendition/dist",
          "lodash",
          "lodash/assign",
          "lodash/first",
          "lodash/last",
          "lodash/filter",
          "lodash/map",
          "lodash/padStart",
          "lodash/values",
          "lodash/keys",
          "lodash/some",
          "lodash/toNumber",
          "lodash/includes",
          "lodash/reduce",
          "lodash/every",
          "lodash/truncate",
          "lodash/toInteger",
          "lodash/flatMap",
        ],
      },
    ],
    "require-yield": "off",
  },
};
