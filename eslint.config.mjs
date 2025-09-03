import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
  {
    rules: {
      // 사용하지 않는 변수 경고 비활성화
      "@typescript-eslint/no-unused-vars": "off",
      // any 타입 사용 경고 비활성화
      "@typescript-eslint/no-explicit-any": "off",
      // 추가로 자주 발생하는 규칙들도 비활성화
      "react-hooks/exhaustive-deps": "off",
      "@next/next/no-img-element": "off",
    },
  },
];

export default eslintConfig;
