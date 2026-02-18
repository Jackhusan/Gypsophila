console.log('DANDELION VERSION LOADED ✅')

const canvas = document.getElementById('dust')
const ctx = canvas.getContext('2d', { alpha: true })

let w = 0, h = 0
function resize() {
  w = canvas.width = window.innerWidth
  h = canvas.height = window.innerHeight
}
resize()
window.addEventListener('resize', resize)

function rand(min, max) {
  return min + Math.random() * (max - min)
}

// 數量可調：80~180
const seedCount = 120

const seeds = Array.from({ length: seedCount }, () => makeSeed(true))

function makeSeed(first = false) {
  return {
    x: first ? rand(0, w) : -20,
    y: first ? rand(0, h) : rand(0, h),
    vx: rand(0.12, 0.55),      // 往右飄
    vy: rand(-0.15, 0.15),     // 上下微漂
    size: rand(0.8, 1.7),
    alpha: rand(0.12, 0.28),   // 越小越淡越像
    rot: rand(0, Math.PI * 2),
    rotSpd: rand(-0.01, 0.01),
    wob: rand(0.003, 0.012),
    t: rand(0, 1000),
  }
}

function resetSeed(s) {
  const fromLeft = Math.random() < 0.8
  s.x = fromLeft ? -30 : rand(0, w)
  s.y = fromLeft ? rand(0, h) : h + 30
  s.vx = rand(0.12, 0.55)
  s.vy = rand(-0.15, 0.15)
  s.size = rand(0.8, 1.7)
  s.alpha = rand(0.12, 0.28)
  s.rot = rand(0, Math.PI * 2)
  s.rotSpd = rand(-0.01, 0.01)
  s.wob = rand(0.003, 0.012)
  s.t = rand(0, 1000)
}

function drawSeed(s) {
  ctx.save()
  ctx.translate(s.x, s.y)
  ctx.rotate(s.rot)

  const coreR = 1.1 * s.size
  const plumeLen = 11 * s.size
  const plumeCount = 10

  // 種子核
  ctx.beginPath()
  ctx.fillStyle = `rgba(245,245,245,${s.alpha})`
  ctx.arc(0, 0, coreR, 0, Math.PI * 2)
  ctx.fill()

  // 細梗
  ctx.beginPath()
  ctx.strokeStyle = `rgba(245,245,245,${s.alpha * 0.55})`
  ctx.lineWidth = 0.8
  ctx.moveTo(0, 0)
  ctx.lineTo(0, -plumeLen * 0.55)
  ctx.stroke()

  // 羽毛絲
  ctx.lineWidth = 0.7
  for (let i = 0; i < plumeCount; i++) {
    const a = (-Math.PI / 2) + rand(-0.6, 0.6)
    const len = plumeLen * rand(0.65, 1.05)
    const x2 = Math.cos(a) * len
    const y2 = Math.sin(a) * len

    ctx.beginPath()
    ctx.strokeStyle = `rgba(245,245,245,${s.alpha * 0.28})`
    ctx.moveTo(0, -plumeLen * 0.55)
    ctx.lineTo(x2, y2)
    ctx.stroke()
  }

  ctx.restore()
}

function tick() {
  ctx.clearRect(0, 0, w, h)

  for (const s of seeds) {
    s.t += 1
    s.x += s.vx + Math.sin(s.t * s.wob) * 0.25
    s.y += s.vy + Math.cos(s.t * s.wob) * 0.18
    s.rot += s.rotSpd

    if (s.x > w + 60 || s.y < -80 || s.y > h + 80) resetSeed(s)
    drawSeed(s)
  }

  requestAnimationFrame(tick)
}

tick()
