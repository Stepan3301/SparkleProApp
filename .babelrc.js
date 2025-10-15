module.exports = {
  presets: ['react-app'],
  env: {
    production: {
      plugins: [
        [
          'transform-remove-console',
          {
            // ✅ Keep error and warn logs for debugging critical issues
            exclude: ['error', 'warn']
          }
        ]
      ]
    }
  }
};

