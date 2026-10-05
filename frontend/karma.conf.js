import fs from 'fs'

const posiblesRutas = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  `C:\\Users\\${process.env.USERNAME}\\AppData\\Local\\Programs\\Opera\\opera.exe`,
  'C:\\Program Files\\Opera\\opera.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  `C:\\Users\\${process.env.USERNAME}\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe`
]

for (const ruta of posiblesRutas) {
  if (fs.existsSync(ruta)) {
    process.env.CHROME_BIN = ruta
    break
  }
}

export default function (config) {
  config.set({
    frameworks: ['jasmine'],
    files: [
      { pattern: 'src/**/*.js', type: 'module' }
    ],
    browsers: ['ChromeHeadless'],
    singleRun: true,
    reporters: ['progress']
  })
}