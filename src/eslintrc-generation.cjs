module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es2021: true,
  },
  extends: ["eslint:recommended", "plugin:vue/essential"],

  parser: "vue-eslint-parser",
  plugins: ["vue"],
  rules: {
    "template-bindings": 1,
    "top-level-variables": 1,
    methods: 1,
  },
};
