/**
 * Sau khi tạo installer: xóa *-unpacked, mac, mac-* — `release/` gọn trước khi publish.
 */
const fs = require('fs')
const path = require('path')

module.exports = async function afterAllArtifactBuild(buildResult) {
  const outDir = buildResult.outDir
  if (!outDir || !fs.existsSync(outDir)) return

  for (const entry of fs.readdirSync(outDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    const name = entry.name
    const full = path.join(outDir, name)
    if (
      name.endsWith('-unpacked') ||
      name === 'mac' ||
      /^mac-/.test(name)
    ) {
      fs.rmSync(full, { recursive: true, force: true })
      console.log(`[afterAllArtifactBuild] removed ${full}`)
    }
  }
}
