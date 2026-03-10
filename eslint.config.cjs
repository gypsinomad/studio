// eslint.config.cjs
const tseslint = require("typescript-eslint");

/** @type {import("eslint").Linter.FlatConfig[]} */
module.exports = tseslint.config(
  ...tseslint.configs.recommended,

  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: __dirname,
        sourceType: "module",
      },
    },
    rules: {
      // So you can keep using `any` while refactoring
      "@typescript-eslint/no-explicit-any": "off",

      // Keep unused-vars, but ignore imported components/icons for now
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^(COLORS|LEAD_PRIORITIES)$",
        },
      ],

      // Allow console in this app while you still rely on it
      "no-console": "off",

      // Allow require() in your few legacy spots
      "@typescript-eslint/no-require-imports": "off",
    },
  },

  {
    files: ["*.cjs", "*.js"],
    rules: {
      "@typescript-eslint/await-thenable": "off",
    },
  },

  {
    ignores: [".next/**", "node_modules/**"],
  }
);
