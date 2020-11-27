module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es2021: true
  },
  extends: ["eslint:recommended", "plugin:vue/essential"],

  parser: "vue-eslint-parser",
   plugins: ["vue"/*,"jest"*/],
  rules: {
    //Own
    "template-bindings":1,
    "top-level": 1,
    "function-reads-writes":1,
    // //JEST
    // "jest/no-disabled-tests": "warn",
    // "jest/no-focused-tests": "error",
    // "jest/no-identical-title": "error",
    // "jest/prefer-to-have-length": "warn",
    // "jest/valid-expect": "error",
  },
};
