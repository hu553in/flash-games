import { defineConfig } from "oxfmt";
import ultracite from "ultracite/oxfmt";

export default defineConfig({
  ...ultracite,
  ignorePatterns: [...(ultracite.ignorePatterns ?? []), "**/vendor"],
  overrides: [
    ...(ultracite.overrides ?? []),
    {
      files: ["**/*.md", "**/*.yml", "**/*.yaml"],
      options: {
        printWidth: 100,
        proseWrap: "always",
        singleQuote: true,
      },
    },
  ],
});
