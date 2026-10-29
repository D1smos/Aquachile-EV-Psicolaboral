export default function configurar(config) {
  config.set({
    frameworks: ['vite', 'jasmine'],
    plugins: ['karma-vite', 'karma-jasmine', 'karma-chrome-launcher'],
    files: [
      { pattern: 'src/utils/*.spec.js', type: 'module', watched: false, served: false },
      { pattern: 'src/layouts/AppLayout.test.js', type: 'module', watched: false, served: false },
      { pattern: 'src/components/**/*.test.js', type: 'module', watched: false, served: false },
      { pattern: 'src/pages/**/*.test.js', type: 'module', watched: false, served: false },
    ],
    reporters: ['progress'],
    port: 9876,
    colors: false,
    logLevel: config.LOG_INFO,
    browsers: ['ChromeHeadlessNoSandbox'],
    customLaunchers: {
      ChromeHeadlessNoSandbox: {
        base: 'ChromeHeadless',
        flags: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
      },
    },
    singleRun: true,
    restartOnFileChange: false,
  });
}
