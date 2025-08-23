import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // Base Next.js and TypeScript configs
  ...compat.extends("next/core-web-vitals", "next/typescript"),

  // buenas practicas
  // legacy de mi llama jose luis
  // con esto me aseguro que sigan esta estructura
  // y usen los barrels

  // Global rules
  {
    files: ["**/*.{ts,tsx,js,jsx}"],
    rules: {
      // Enforce using the env bridge in src/config instead of process.env elsewhere
      "no-restricted-properties": [
        "error",
        { object: "process", property: "env", message: "Use '@/config' env bridge instead of process.env" },
      ],
    },
  },

  // Allow process.env usage inside the env bridge implementation
  {
    files: ["src/config/**"],
    rules: {
      "no-restricted-properties": "off",
    },
  },

  // Discourage declaring domain types in page files (allow local utility types in components)
  {
    files: ["src/app/**/page.tsx"],
    rules: {
      "no-restricted-syntax": [
        "error",
        // Ban top-level interfaces
        {
          selector: "Program > TSInterfaceDeclaration",
          message: "Declare domain interfaces in '@/types' and import them instead of defining them in page files",
        },
        // Ban top-level object-shaped type aliases (allow unions/primitives like type Foo = 'a'|'b' or number)
        {
          selector: "Program > TSTypeAliasDeclaration[typeAnnotation.type='TSTypeLiteral']",
          message: "Declare domain object types in '@/types' and import them instead of defining them in page files",
        },
      ],
    },
  },

  // Relax strict 'any' usage in UI layers (pages/components) to warnings while we migrate types
  {
    files: ["src/app/**/*.{ts,tsx}", "src/components/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
];

export default eslintConfig;
