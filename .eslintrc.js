/**
 * @type {import('eslint').Linter.Config}
 */
module.exports = {
  plugins: [
    "simple-import-sort", // enable autofix for import sorting
    "unused-imports", // enable autofix for removing unused imports
  ],
  extends: [
    "airbnb", // use airbnb's config as a base
    "airbnb-typescript", // enhance airbnb's config with typescript support
    "airbnb/hooks", // enhance airbnb's config with react hooks support
    "plugin:@typescript-eslint/recommended", // use eslint recomended settings
    "plugin:react/recommended", // use react recommended settings
    "plugin:react/jsx-runtime", // use the new react jsx runtime
    "plugin:unicorn/recommended", // lint for common mistakes
    "plugin:eslint-comments/recommended", // lint eslint directive comments
    "plugin:json/recommended", // lint json files
    "plugin:prettier/recommended", // integrate prettier with eslint
  ],
  parser: "@typescript-eslint/parser", // use typescript parser
  parserOptions: {
    tsconfigRootDir: ".", // project root directory
    project: [
      "./tsconfig.eslint.json", // specify project tsconfig.json
    ],
    extraFileExtensions: [
      ".json", // allow linting json files
      ".html", // allow linting html files
    ],
  },
  ignorePatterns: ["node_modules", "dist"], // ignore node_modules and dist folders
  rules: {
    "import/no-extraneous-dependencies": [
      "error",
      {
        // allow dev dependencies in the following files
        devDependencies: [
          "vite.config.ts",
          "tailwind.config.cjs",
          "src/css.d.ts",
          "tests/setupVitest.ts",
        ],
      },
    ],
    "unicorn/prefer-module": ["off"], // allow modules, often used in config files
    "unicorn/prevent-abbreviations": ["off"], // allow abbreviations
    "simple-import-sort/imports": ["error"], // enable sorting imports
    "simple-import-sort/exports": ["error"], // enable sorting exports
    // allow unused variables that start with an underscore
    "@typescript-eslint/no-unused-vars": "off",
    "unused-imports/no-unused-imports": ["error"], // consider unused imports errors so they are fixed
    // allow unused variables that start with an underscore
    "unused-imports/no-unused-vars": [
      "error",
      {
        vars: "all",
        varsIgnorePattern: "^_",
        args: "after-used",
        argsIgnorePattern: "^_",
      },
    ],
    "eslint-comments/no-unused-disable": "error", // disallow unused eslint disable comments
    "import/prefer-default-export": ["off"], // allow named exports,
    "react/require-default-props": ["off"], // we're using typescript no need for default props
    "unicorn/no-null": ["off"], // useful for simple null checks
    "@typescript-eslint/no-use-before-define": "off", // allow using functions before they are defined
    "react/jsx-props-no-spreading": "off", // allow spreading props
    "react/jsx-filename-extension": [
      "error",
      { extensions: [".jsx", ".mdx", ".tsx"] },
    ],
    "react/button-has-type": "off", // allow buttons without types
    "no-restricted-syntax": [
      "error",
      {
        selector: "ForInStatement",
        message:
          "for..in loops iterate over the entire prototype chain, which is virtually never what you want. Use Object.{keys,values,entries}, and iterate over the resulting array.",
      },
      // allow for of statement
      // {
      //   selector: "ForOfStatement",
      //   message:
      //     "iterators/generators require regenerator-runtime, which is too heavyweight for this guide to allow them. Separately, loops should be avoided in favor of array iterations.",
      // },
      {
        selector: "LabeledStatement",
        message:
          "Labels are a form of GOTO; using them makes code confusing and hard to maintain and understand.",
      },
      {
        selector: "WithStatement",
        message:
          "`with` is disallowed in strict mode because it makes code impossible to predict and optimize.",
      },
      // {
      //   selector:
      //     "ImportDeclaration[source.value='react'] :matches(ImportDefaultSpecifier, ImportNamespaceSpecifier)",
      //   message:
      //     "Default React import not allowed since we use the TypeScript jsx-transform.  If you need a global type that collides with a React named export (such as `MouseEvent`), try using `globalThis.MouseHandler`.",
      // },
    ],
    "react/no-array-index-key": "off",
    // was leading to false positives
    "jsx-a11y/label-has-associated-control": "off",
    // allow undefined return
    "consistent-return": "off",
    // disable prop types
    "react/prop-types": "off",
    "@typescript-eslint/ban-types": [
      "error",
      {
        types: {
          // allow {} as a type
          "{}": false,
        },
        extendDefaults: true,
      },
    ],
    "@typescript-eslint/naming-convention": [
      // allow underscores in unused variables
      "error",
      {
        selector: ["variableLike"],
        leadingUnderscore: "allow",
        modifiers: ["unused"],
        format: ["camelCase", "PascalCase", "UPPER_CASE"],
      },
    ],
    "no-underscore-dangle": "off", // allow underscores
    "unicorn/consistent-function-scoping": [
      "error",
      { checkArrowFunctions: false }, // allow arrow functions to be defined in nested scopes even if they don't use parent scope
    ],
  },
  overrides: [
    {
      files: ["**/**.{js,ts}"],
      rules: {
        // use camel case for (j|t)s files
        "unicorn/filename-case": [
          "error",
          {
            case: "camelCase",
            ignore: ["vite-env.d.ts", "dts-bundle-generator.config.ts"],
          },
        ],
      },
    },
    {
      files: ["**/**.{jsx,tsx}"],
      rules: {
        // use pascal case for (j|t)sx files
        "unicorn/filename-case": [
          "error",
          {
            case: "pascalCase",
            ignore: ["main.tsx"],
          },
        ],
        "import/no-extraneous-dependencies": [
          "error",
          { devDependencies: true },
        ],
        "max-classes-per-file": ["off"],
      },
    },
    {
      files: ["**/**.test.{js,ts,jsx,tsx}"],
      rules: {
        // use camel case for test files
        "unicorn/filename-case": [
          "error",
          {
            case: "camelCase",
          },
        ],
      },
    },
    {
      files: ["**/**.cjs"],
      rules: {
        // allow requires in cjs files
        "@typescript-eslint/no-var-requires": "off",
      },
    },
    {
      files: ["**/**.json"],
      rules: {
        // enforce json linting rules in json files
        "json/*": ["error", { allowComments: true }],
      },
    },
    {
      files: ["examples/**/**.{ts,tsx}"],
      rules: {
        "unused-imports/no-unused-vars": "off", // allow unused variables in examples
      },
    },
  ],
};
