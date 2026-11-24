import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import pluginReactHooks from "eslint-plugin-react-hooks";
import boundaries from "eslint-plugin-boundaries";


const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  js.configs.recommended,
  eslintConfigPrettier,
  // ...tseslint.configs.recommended,
  // pluginReactHooks.configs.flat.recommended,
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      globals: {
        React: "readonly",
      },
    },
  },
  {
    settings: { react: { version: "detect" } },

    files: ["**/*.{ts,tsx}"],
    rules: {
      ...pluginReactHooks.configs.recommended.rules,
      // React best practices
      "react/jsx-boolean-value": ["error", "never"],
      "react/jsx-curly-brace-presence": ["error", "never"],
      "react/self-closing-comp": "error",
      "react/jsx-fragments": ["error", "syntax"],

      "react/prop-types": "off",
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-debugger": "error",
      "no-undef": "off", // TypeScript handles type checking
      "no-unused-vars": "off", // TypeScript handles this
      "@typescript-eslint/no-unused-vars": [
        "error", // Changed from "warn" to "error"
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      // Best practices
      eqeqeq: ["error", "always", { null: "ignore" }],
      "no-var": "error",
      "prefer-const": "error",
      curly: ["error", "all"],
      // Style consistency (what Prettier doesn't handle)
      "object-shorthand": ["error", "always"],
      "prefer-template": "error",
      // Quote consistency (aligned with Prettier)
      quotes: ["error", "double", { avoidEscape: true }],
      // #60 完了: src/lib は撤廃済み。共通コードは shared/lib・shared/api・entities/* へ
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/lib", "@/lib/*"],
              message:
                "src/lib は #60 で撤廃済みです。shared/lib・shared/api・entities/* を使用してください。",
            },
          ],
        },
      ],
    },
  },
  // FSDレイヤー境界の強制（CLAUDE.md「依存関係ルール」参照）
  // app → views → widgets → features → entities → shared
  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: { boundaries },
    settings: {
      "import/resolver": {
        typescript: { alwaysTryTypes: true },
        node: true,
      },
      "boundaries/elements": [
        { type: "app", pattern: "src/app" },
        { type: "views", pattern: "src/views/*", capture: ["slice"] },
        { type: "widgets", pattern: "src/widgets/*", capture: ["slice"] },
        { type: "features", pattern: "src/features/*", capture: ["slice"] },
        { type: "entities", pattern: "src/entities/*", capture: ["slice"] },
        { type: "shared", pattern: "src/shared" },
        { type: "types", pattern: "src/types" },
      ],
    },
    rules: {
      "boundaries/dependencies": [
        "error",
        {
          default: "disallow",
          policies: [
            {
              from: { element: { types: "app" } },
              allow: {
                to: {
                  element: {
                    types: {
                      anyOf: [
                        "views",
                        "widgets",
                        "features",
                        "entities",
                        "shared",
                        "types",
                      ],
                    },
                  },
                },
              },
            },
            {
              from: { element: { types: "views" } },
              allow: {
                to: {
                  element: {
                    types: {
                      anyOf: [
                        "widgets",
                        "features",
                        "entities",
                        "shared",
                        "types",
                      ],
                    },
                  },
                },
              },
            },
            {
              from: { element: { types: "widgets" } },
              allow: {
                to: {
                  element: {
                    types: {
                      anyOf: [
                        "features",
                        "entities",
                        "shared",
                        "types",
                      ],
                    },
                  },
                },
              },
            },
            {
              from: { element: { types: "features" } },
              allow: {
                to: {
                  element: {
                    types: {
                      anyOf: ["entities", "shared", "types"],
                    },
                  },
                },
              },
            },
            {
              from: { element: { types: "entities" } },
              allow: {
                to: {
                  element: {
                    types: { anyOf: ["shared", "types"] },
                  },
                },
              },
            },
            {
              from: { element: { types: "shared" } },
              allow: {
                to: {
                  element: { types: { anyOf: ["types"] } },
                },
              },
            },
          ],
        },
      ],
    },
  },
  {
    files: ["**/*.cjs"],
    languageOptions: {
      sourceType: "commonjs",
      globals: {
        require: "readonly",
        module: "readonly",
        exports: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
      },
    },
    rules: {
      "@typescript-eslint/no-require-imports": "off",
      "no-undef": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "coverage/**",
    "node_modules/**",
    // Additional ignores:
    "dist/**",
  ]),
]);

export default eslintConfig;
