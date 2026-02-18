import * as THREE from 'https://cdn.skypack.dev/three@0.133.1/build/three.module'

/* =========================
   Flower (原本保持)
========================= */

const canvasEl = document.querySelector('#canvas')
const cleanBtn = document.querySelector('.clean-btn')

const pointer = { x: 0.66, y: 0.3, clicked: true }

window.setTimeout(() => {
  pointer.x = 0.75
  pointer.y = 0.5
  pointer.clicked = true
}, 700)

let basicMaterial, shaderMaterial
let renderer = new THREE.WebGLRenderer({ canvas: canvasEl, alpha: true })
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

let sceneShader = new THREE.Scene()
let sceneBasic = new THREE.Scene()
let camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 10)
let clock = new THREE.Clock()

let renderTargets = [
  new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight),
  new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight),
]

createPlane()
updateSize()

window.addEventListener('resize', () => {
  updateSize()
  resizeDandelion()
  cleanCanvas()
})

render()

let isTouchScreen = false

window.addEventListener('click', e => {
  if (!isTouchScreen) {
    pointer.x = e.pageX / window.innerWidth
    pointer.y = e.pageY / window.innerHeight
    pointer.clicked = true
  }
})
window.addEventListener('touchstart', e => {
  isTouchScreen = true
  pointer.x = e.targetTouches[0].pageX / window.innerWidth
  pointer.y = e.targetTouches[0].pageY / window.innerHeight
  pointer.clicked = true
})

cleanBtn.addEventListener('click', cleanCanvas)

function cleanCanvas() {
  pointer.vanishCanvas = true
  setTimeout(() => { pointer.vanishCanvas = false }, 50)
}

function createPlane() {
  shaderMaterial = new THREE.ShaderMaterial({
    uniforms: {
      u_stop_time: { type: 'f', value: 0 },
      u_stop_randomizer: { type: 'v2', value: new THREE.Vector2(Math.random(), Math.random()) },
      u_cursor: { type: 'v2', value: new THREE.Vector2(pointer.x, pointer.y) },
      u_ratio: { type: 'f', value: window.innerWidth / window.innerHeight },
      u_texture: { type: 't', value: null },
      u_clean: { type: 'f', value: 1 },
    },
    vertexShader: document.getElementById('vertexShader').textContent,
    fragmentShader: document.getElementById('fragmentShader').textContent,
  })

  basicMaterial = new THREE.MeshBasicMaterial()
  const planeGeometry = new THREE.PlaneGeometry(2, 2)
  sceneBasic.add(new THREE.Mesh(planeGeometry, basicMaterial))
  sceneShader.add(new THREE.Mesh(planeGeometry, shaderMaterial))
}

function render() {
  shaderMaterial.uniforms.u_clean.value = pointer.vanishCanvas ? 0 : 1
  shaderMaterial.uniforms.u_texture.value = renderTargets[0].texture

  if (pointer.clicked) {
    shaderMaterial.uniforms.u_cursor.value = new THREE.Vector2(pointer.x, 1 - pointer.y)
    shaderMaterial.uniforms.u_stop_randomizer.value = new THREE.Vector2(Math.random(), Math.random())
    shaderMaterial.uniforms.u_stop_time.value = 0
    pointer.clicked = false
  }

  shaderMaterial.uniforms.u_stop_time.value += clock.getDelta()

  renderer.setRenderTarget(renderTargets[1])
  renderer.render(sceneShader, camera)
  basicMaterial.map = renderTargets[1].texture

  renderer.setRenderTarget(null)
  renderer.render(sceneBasic, camera)

  let tmp = renderTargets[0]
  renderTargets[0] = renderTargets[1]
  renderTargets[1] = tmp

  requestAnimationFrame(render)
}

function updateSize() {
  shaderMaterial.uniforms.u_ratio.value = window.innerWidth / window.innerHeight
  renderer.setSize(window.innerWidth, window.innerHeight)
}

/* =========================
   Dandelion Background (一直飄)
========================= */

const dCanvas = document.getElementById('dust')
const dCtx = dCanvas.getContext('2d', { alpha: true })

let dw = 0, dh = 0
function resizeDandelion() {
  dw = dCanvas.width = window.innerWidth
  dh = dCanvas.height = window.innerHeight
}
resizeDandelion()

function rand(min, max) { return min + Math.random() * (max - min) }

const seedCount = 120
const seeds = Array.from({ length: seedCount }, () => ({
  x: rand(0, dw),
  y: rand(0, dh),
  vx: rand(0.12, 0.55),
  vy: rand(-0.15, 0.15),
  size: rand(0.7, 1.6),
  alpha: rand(0.18, 0.38),
  rot: rand(0, Math.PI * 2),
  rotSpd: rand(-0.01, 0.01),
  wob: rand(0.003, 0.012),
  t: rand(0, 1000),
}))

function resetSeed(s) {
  const fromLeft = Math.random() < 0.7
  s.x = fromLeft ? -20 : rand(0, dw)
  s.y = fromLeft ? rand(0, dh) : dh + 20
  s.vx = rand(0.12, 0.55)
  s.vy = rand(-0.15, 0.15)
  s.size = rand(0.7, 1.6)
  s.alpha = rand(0.18, 0.38)
  s.rot = rand(0, Math.PI * 2)
  s.rotSpd = rand(-0.01, 0.01)
  s.wob = rand(0.003, 0.012)
  s.t = rand(0, 1000)
}

function drawSeed(ctx, s) {
  ctx.save()
  ctx.translate(s.x, s.y)
  ctx.rotate(s.rot)

  const coreR = 1.2 * s.size
  const plumeLen = 10 * s.size
  const plumeCount = 9

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
    const a = (-Math.PI / 2) + rand(-0.55, 0.55)
    const len = plumeLen * rand(0.7, 1.05)
    const x2 = Math.cos(a) * len
    const y2 = Math.sin(a) * len

    ctx.beginPath()
    ctx.strokeStyle = `rgba(245,245,245,${s.alpha * 0.35})`
    ctx.moveTo(0, -plumeLen * 0.55)
    ctx.lineTo(x2, y2)
    ctx.stroke()
  }

  ctx.restore()
}

function animateDandelion() {
  dCtx.clearRect(0, 0, dw, dh)

  for (const s of seeds) {
    s.t += 1
    s.x += s.vx + Math.sin(s.t * s.wob) * 0.25
    s.y += s.vy + Math.cos(s.t * s.wob) * 0.18
    s.rot += s.rotSpd

    if (s.x > dw + 40 || s.y < -60 || s.y > dh + 60) resetSeed(s)
    drawSeed(dCtx, s)
  }

  requestAnimationFrame(animateDandelion)
}

animateDandelion()
