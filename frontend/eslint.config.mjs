import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = defineConfig([
  ...nextVitals,
  {
    files: ["**/*.{js,mjs}"],
    rules: { "no-undef": "error" },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "node_modules/**",
    "venv/**",
    ".venv/**",
    "alembic/**",
  ]),
]);

export default eslintConfig;
