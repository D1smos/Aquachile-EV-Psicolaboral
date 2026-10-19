export default function configurar(config) {
  config.set({
    frameworks: ['jasmine'],
    files: [
      { pattern: 'src/utils/validaciones.spec.js', type: 'module' },
      { pattern: 'src/utils/evaluacionUtils.spec.js', type: 'module' },
      { pattern: 'src/utils/validaciones.js', included: false, type: 'module' },
      { pattern: 'src/utils/evaluacionUtils.js', included: false, type: 'module' },
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
