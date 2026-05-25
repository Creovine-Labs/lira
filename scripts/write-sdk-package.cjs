const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..')
const sourceDir = path.join(root, 'packages', 'lira-support')
const distDir = path.join(root, 'dist', 'sdk')

fs.mkdirSync(distDir, { recursive: true })

const pkg = JSON.parse(fs.readFileSync(path.join(sourceDir, 'package.json'), 'utf8'))
fs.writeFileSync(path.join(distDir, 'package.json'), `${JSON.stringify(pkg, null, 2)}\n`)
fs.copyFileSync(path.join(sourceDir, 'README.md'), path.join(distDir, 'README.md'))
