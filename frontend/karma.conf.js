import fs from 'node:fs';

const posiblesRutas = [
  process.env.CHROME_BIN,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  `C:\\Users\\${process.env.USERNAME}\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe`,
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  `C:\\Users\\${process.env.USERNAME}\\AppData\\Local\\Programs\\Opera\\opera.exe`,
  'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
].filter(Boolean);

for (const ruta of posiblesRutas) {
  if (fs.existsSync(ruta)) {
    process.env.CHROME_BIN = ruta;
    break;
  }
}

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
