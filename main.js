import * as THREE from 'https://cdn.skypack.dev/three@0.133.1/build/three.module'

/* =========================
   Flower System (原本)
========================= */

const canvasEl = document.querySelector('#canvas')
const cleanBtn = document.querySelector('.clean-btn')

const pointer = {
	x: 0.66,
	y: 0.3,
	clicked: true,
}

window.setTimeout(() => {
	pointer.x = 0.75
	pointer.y = 0.5
	pointer.clicked = true
}, 700)

let basicMaterial, shaderMaterial
let renderer = new THREE.WebGLRenderer({
	canvas: canvasEl,
	alpha: true,
})
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
	resizeDust()
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
	setTimeout(() => {
		pointer.vanishCanvas = false
	}, 50)
}

function createPlane() {
	shaderMaterial = new THREE.ShaderMaterial({
		uniforms: {
			u_stop_time: { value: 0 },
			u_stop_randomizer: {
				value: new THREE.Vector2(Math.random(), Math.random()),
			},
			u_cursor: { value: new THREE.Vector2(pointer.x, pointer.y) },
			u_ratio: { value: window.innerWidth / window.innerHeight },
			u_texture: { value: null },
			u_clean: { value: 1 },
		},
		vertexShader: document.getElementById('vertexShader').textContent,
		fragmentShader: document.getElementById('fragmentShader').textContent,
	})
	basicMaterial = new THREE.MeshBasicMaterial()
	const planeGeometry = new THREE.PlaneGeometry(2, 2)
	const planeBasic = new THREE.Mesh(planeGeometry, basicMaterial)
	const planeShader = new THREE.Mesh(planeGeometry, shaderMaterial)
	sceneBasic.add(planeBasic)
	sceneShader.add(planeShader)
}

function render() {
	shaderMaterial.uniforms.u_clean.value = pointer.vanishCanvas ? 0 : 1
	shaderMaterial.uniforms.u_texture.value = renderTargets[0].texture

	if (pointer.clicked) {
		shaderMaterial.uniforms.u_cursor.value.set(
			pointer.x,
			1 - pointer.y
		)
		shaderMaterial.uniforms.u_stop_randomizer.value.set(
			Math.random(),
			Math.random()
		)
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
   Dust Background (新增)
========================= */

const dustCanvas = document.getElementById('dust')
const dustCtx = dustCanvas.getContext('2d', { alpha: true })

const dust = {
  w: 0,
  h: 0,
  particles: [],
  count: 220,
}

function resizeDust() {
  dust.w = dustCanvas.width = window.innerWidth
  dust.h = dustCanvas.height = window.innerHeight
}

resizeDust()

function rand(min, max) {
  return min + Math.random() * (max - min)
}

function initDust() {
  dust.particles.length = 0
  for (let i = 0; i < dust.count; i++) {
    const layer = Math.random()
    dust.particles.push({
      x: rand(0, dust.w),
      y: rand(0, dust.h),
      r: rand(0.6, 2.2) * (0.35 + layer),
      a: rand(0.03, 0.12) * (0.35 + layer),
      vx: rand(-0.12, 0.12) * (0.2 + layer),
      vy: rand(-0.18, -0.03) * (0.2 + layer),
      wob: rand(0.002, 0.012),
      t: rand(0, 1000),
    })
  }
}

initDust()

function drawDust() {
  dustCtx.clearRect(0, 0, dust.w, dust.h)

  for (const p of dust.particles) {
    p.t += 1
    p.x += p.vx + Math.sin(p.t * p.wob) * 0.15
    p.y += p.vy + Math.cos(p.t * p.wob) * 0.1

    if (p.y < -10) { p.y = dust.h + 10; p.x = rand(0, dust.w) }
    if (p.x < -10) { p.x = dust.w + 10 }
    if (p.x > dust.w + 10) { p.x = -10 }

    dustCtx.beginPath()
    dustCtx.fillStyle = `rgba(235,235,235,${p.a})`
    dustCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
    dustCtx.fill()
  }

  requestAnimationFrame(drawDust)
}

drawDust()
