const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..')
const sourceDir = path.join(root, 'packages', 'lira-support')
const distDir = path.join(root, 'dist', 'sdk')

fs.mkdirSync(distDir, { recursive: true })

const pkg = JSON.parse(fs.readFileSync(path.join(sourceDir, 'package.json'), 'utf8'))
fs.writeFileSync(path.join(distDir, 'package.json'), `${JSON.stringify(pkg, null, 2)}\n`)

// Copy single files referenced by package.json `files:`.
for (const f of ['README.md', 'LICENSE', 'cli.cjs']) {
  const src = path.join(sourceDir, f)
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(distDir, f))
  }
}

// Recursively copy directories referenced by package.json `files:` (templates, skills).
function copyDir(src, dest) {
  if (!fs.existsSync(src)) return
  fs.mkdirSync(dest, { recursive: true })
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)
    if (entry.isDirectory()) copyDir(srcPath, destPath)
    else fs.copyFileSync(srcPath, destPath)
  }
}
for (const dir of ['templates', 'skills']) {
  copyDir(path.join(sourceDir, dir), path.join(distDir, dir))
}

// CLI must be executable (npm preserves the executable bit from source).
const cliDest = path.join(distDir, 'cli.cjs')
if (fs.existsSync(cliDest)) fs.chmodSync(cliDest, 0o755)
