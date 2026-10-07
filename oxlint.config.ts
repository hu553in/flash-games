import { defineConfig } from "oxlint";
import core from "ultracite/oxlint/core";

export default defineConfig({
  extends: [core],
  rules: {
    "func-style": "off",
    "promise/avoid-new": "off",
    "promise/prefer-await-to-callbacks": "off",
    // ServiceWorker#postMessage has no targetOrigin parameter.
    "unicorn/require-post-message-target-origin": "off",
  },
});
