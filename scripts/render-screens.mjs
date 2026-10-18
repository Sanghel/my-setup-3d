// Genera el contenido de las pantallas con textos REALES del repo (público): un editor estilo VS Code
// en el ultrawide y una terminal en el monitor vertical. Edge/Chrome en modo headless las fotografía.
// Uso: npm run textures:screens
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const BROWSERS = [
  process.env.CHROME_PATH,
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
].filter(Boolean)
const browser = BROWSERS.find((path) => existsSync(path))
if (!browser) throw new Error('No encontré Edge/Chrome/Brave; define CHROME_PATH')

const outDir = 'blender/textures/photos'
const work = join(tmpdir(), 'my-setup-3d-screens')
mkdirSync(work, { recursive: true })

// --- Resaltado de sintaxis mínimo (tema oscuro tipo One Dark) -------------------------------
const KEYWORDS = new Set(
  'def return for in if else elif import from as class with None True False lambda raise ' +
    'export function const let import from return if else new type interface default'.split(' '),
)
const escape = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

function highlight(line) {
  const token = /(#.*$|\/\/.*$|"""[^"]*"""|"[^"]*"|'[^']*'|`[^`]*`|\b\d+(?:\.\d+)?\b|\b[A-Za-z_]\w*\b(?=\()|\b[A-Za-z_]\w*\b)/g
  let html = ''
  let last = 0
  for (const match of line.matchAll(token)) {
    html += escape(line.slice(last, match.index))
    const text = match[0]
    let cls = ''
    if (text.startsWith('#') || text.startsWith('//')) cls = 'c'
    else if (/^["'`]/.test(text)) cls = 's'
    else if (/^\d/.test(text)) cls = 'n'
    else if (KEYWORDS.has(text)) cls = 'k'
    else if (line[match.index + text.length] === '(') cls = 'f'
    html += cls ? `<span class="${cls}">${escape(text)}</span>` : escape(text)
    last = match.index + text.length
  }
  return html + escape(line.slice(last))
}

const code = (path, from, count) =>
  readFileSync(path, 'utf8')
    .split('\n')
    .slice(from - 1, from - 1 + count)
    .map((line, i) => `<div><i>${from + i}</i>${highlight(line) || ' '}</div>`)
    .join('')

const sh = (cmd, args) => execFileSync(cmd, args, { encoding: 'utf8' }).trim()

const STYLE = `
  * { margin: 0; box-sizing: border-box }
  body { background: #1e2127; color: #abb2bf; font: 26px/1.5 'SF Mono', Menlo, monospace; overflow: hidden }
  .k { color: #c678dd } .s { color: #98c379 } .n { color: #d19a66 } .f { color: #61afef } .c { color: #5c6370; font-style: italic }
  i { display: inline-block; width: 3.2em; color: #4b5263; font-style: normal; text-align: right; margin-right: 1.4em }
  .bar { background: #21252b; color: #9da5b4; padding: 10px 24px; border-bottom: 1px solid #181a1f }
  .tab { display: inline-block; padding: 10px 28px; background: #282c34; color: #d7dae0; border-top: 3px solid #528bff }
  .ok { color: #98c379 } .dim { color: #5c6370 } .y { color: #e5c07b } .b { color: #61afef }
`

// --- Ultrawide: editor con dos columnas + explorador + terminal -----------------------------
const tree = ['blender', '  scripts', '    lib', '      geometry.py', '      materials.py', '      room.py', '      setup.py', '    build_room.py', '  measurements.json', 'public/models', '  room.glb', 'scripts', 'src', '  scene', '    Room.tsx', '  App.tsx', 'tests/assets', 'package.json']
const ultrawide = `<!doctype html><html><head><meta charset="utf-8"><style>${STYLE}
  .app { display: grid; grid-template-columns: 70px 420px 1fr 1fr; grid-template-rows: 64px 1fr 360px 40px; height: 1440px }
  .act { grid-row: 1 / 4; background: #21252b; border-right: 1px solid #181a1f }
  .exp { grid-row: 1 / 4; background: #21252b; padding: 18px 20px; font-size: 24px; color: #9da5b4; white-space: pre }
  .exp b { display: block; color: #d7dae0; margin-bottom: 14px; font-weight: 600 }
  .sel { background: #2c313a; color: #d7dae0 }
  .ed { padding: 14px 0; white-space: pre; overflow: hidden; border-right: 1px solid #181a1f }
  .term { grid-column: 3 / 5; background: #1b1d23; border-top: 1px solid #181a1f; padding: 14px 28px; white-space: pre; font-size: 24px }
  .status { grid-column: 1 / 5; background: #528bff; color: #fff; padding: 4px 24px; font-size: 22px }
</style></head><body><div class="app">
  <div class="act"></div>
  <div class="exp"><b>MY-SETUP-3D</b>${tree.map((f) => `<div${f.endsWith('setup.py') ? ' class="sel"' : ''}>${escape(f)}</div>`).join('')}</div>
  <div class="bar"><span class="tab">setup.py</span></div>
  <div class="bar"><span class="tab">App.tsx</span></div>
  <div class="ed">${code('blender/scripts/lib/setup.py', 30, 46)}</div>
  <div class="ed">${code('src/App.tsx', 1, 40)}</div>
  <div class="term"><span class="b">~/my-setup-3d</span> <span class="y">grupo-6/objetos-del-setup</span> ❯ npm run assets
<span class="dim">&gt; blender --background --factory-startup --python blender/scripts/build_room.py</span>
[build_room] medidas: measured · .glb: public/models/room.raw.glb
<span class="dim">&gt; gltf-transform optimize … --compress meshopt --texture-compress webp</span>
<span class="ok">[assets] room.raw.glb: 15093.1 KB → room.glb: 2812.0 KB (−81 %)</span></div>
  <div class="status">⎇ grupo-6/objetos-del-setup   ✓ 14 tests   Python   UTF-8</div>
</div></body></html>`

// --- Vertical: terminal con git log y tests -------------------------------------------------
const log = sh('git', ['log', '--oneline', '-22']).split('\n')
const vertical = `<!doctype html><html><head><meta charset="utf-8"><style>${STYLE}
  body { padding: 40px 36px; white-space: pre-wrap; font-size: 27px; line-height: 1.55 }
  .h { color: #e5c07b }
</style></head><body><span class="b">~/my-setup-3d</span> ❯ git log --oneline
${log.map((l) => `<span class="h">${escape(l.slice(0, 7))}</span>${escape(l.slice(7, 62))}`).join('\n')}

<span class="b">~/my-setup-3d</span> ❯ npm test
<span class="dim"> RUN  v5 ~/my-setup-3d</span>
 <span class="ok">✓</span> tests/assets/roomModel.test.ts <span class="dim">(14 tests)</span>

 Test Files  <span class="ok">1 passed</span> (1)
      Tests  <span class="ok">14 passed</span> (14)

<span class="b">~/my-setup-3d</span> ❯ <span class="dim">█</span></body></html>`

function shoot(name, html, [w, h], [outW, outH]) {
  const page = join(work, `${name}.html`)
  const png = join(work, `${name}.png`)
  writeFileSync(page, html)
  rmSync(png, { force: true })
  execFileSync(browser, ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--window-size=${w},${h}`, `--screenshot=${png}`, `file://${resolve(page)}`], { stdio: 'ignore' })
  const out = join(outDir, `${name}.jpg`)
  execFileSync('magick', [png, '-resize', `${outW}x${outH}!`, '-quality', '92', out])
  console.log(`[screens] ${out} (${outW}×${outH})`)
}

shoot('screen_ultrawide', ultrawide, [3440, 1440], [2048, 858])
shoot('screen_vertical', vertical, [1080, 1920], [1024, 1832])
