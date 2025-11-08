import antfu from '@antfu/eslint-config'

export default antfu({
  formatters: true,
  rules: {
    'node/prefer-global/process': 'off',
  },
  // test 下的 spec.js 忽略
  ignores: ['test/**/*.spec.js', 'template/**'],
})
