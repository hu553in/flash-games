import { defineConfig } from "oxlint";
import core from "ultracite/oxlint/core";

// Extended configs currently take precedence over local rule settings. Merge the
// preset directly until https://github.com/oxc-project/oxc/issues/20067 is fixed.
export default defineConfig({
  ...core,
  ignorePatterns: [...core.ignorePatterns, "**/vendor"],
  rules: {
    ...core.rules,
    "func-style": "off",
    "promise/avoid-new": "off",
    "promise/prefer-await-to-callbacks": "off",
    // ServiceWorker#postMessage has no targetOrigin parameter.
    "unicorn/require-post-message-target-origin": "off",
  },
});
