import * as THREE from 'https://cdn.skypack.dev/three@0.133.1/build/three.module'

/* ================= Flower ================= */

const canvasEl = document.querySelector('#canvas')
const cleanBtn = document.querySelector('.clean-btn')

const pointer = { x:0.66, y:0.3, clicked:true }

let renderer = new THREE.WebGLRenderer({ canvas:canvasEl, alpha:true })
renderer.setPixelRatio(Math.min(window.devicePixelRatio,2))

let sceneShader = new THREE.Scene()
let sceneBasic = new THREE.Scene()
let camera = new THREE.OrthographicCamera(-1,1,1,-1,0,10)
let clock = new THREE.Clock()

let shaderMaterial, basicMaterial
let renderTargets = [
  new THREE.WebGLRenderTarget(window.innerWidth,window.innerHeight),
  new THREE.WebGLRenderTarget(window.innerWidth,window.innerHeight)
]

createPlane()
updateSize()
render()

window.addEventListener('resize',()=>{
  updateSize()
  resizeDust()
})

window.addEventListener('click',e=>{
  pointer.x=e.pageX/window.innerWidth
  pointer.y=e.pageY/window.innerHeight
  pointer.clicked=true
})

function createPlane(){
  shaderMaterial=new THREE.ShaderMaterial({
    uniforms:{
      u_stop_time:{value:0},
      u_stop_randomizer:{value:new THREE.Vector2(Math.random(),Math.random())},
      u_cursor:{value:new THREE.Vector2(pointer.x,pointer.y)},
      u_ratio:{value:window.innerWidth/window.innerHeight},
      u_texture:{value:null},
      u_clean:{value:1}
    },
    vertexShader:document.getElementById('vertexShader').textContent,
    fragmentShader:document.getElementById('fragmentShader').textContent
  })

  basicMaterial=new THREE.MeshBasicMaterial()
  const geo=new THREE.PlaneGeometry(2,2)
  sceneBasic.add(new THREE.Mesh(geo,basicMaterial))
  sceneShader.add(new THREE.Mesh(geo,shaderMaterial))
}

function render(){
  shaderMaterial.uniforms.u_texture.value=renderTargets[0].texture

  if(pointer.clicked){
    shaderMaterial.uniforms.u_cursor.value.set(pointer.x,1-pointer.y)
    shaderMaterial.uniforms.u_stop_randomizer.value.set(Math.random(),Math.random())
    shaderMaterial.uniforms.u_stop_time.value=0
    pointer.clicked=false
  }

  shaderMaterial.uniforms.u_stop_time.value+=clock.getDelta()

  renderer.setRenderTarget(renderTargets[1])
  renderer.render(sceneShader,camera)

  basicMaterial.map=renderTargets[1].texture
  renderer.setRenderTarget(null)
  renderer.render(sceneBasic,camera)

  let tmp=renderTargets[0]
  renderTargets[0]=renderTargets[1]
  renderTargets[1]=tmp

  requestAnimationFrame(render)
}

function updateSize(){
  shaderMaterial.uniforms.u_ratio.value=window.innerWidth/window.innerHeight
  renderer.setSize(window.innerWidth,window.innerHeight)
}

/* ================= Dust ================= */

const dustCanvas=document.getElementById('dust')
const dustCtx=dustCanvas.getContext('2d')

let dw, dh
function resizeDust(){
  dw=dustCanvas.width=window.innerWidth
  dh=dustCanvas.height=window.innerHeight
}
resizeDust()

const particles=[]
for(let i=0;i<200;i++){
  particles.push({
    x:Math.random()*dw,
    y:Math.random()*dh,
    r:Math.random()*2,
    a:Math.random()*0.08,
    vy:Math.random()*-0.15-0.02
  })
}

function drawDust(){
  dustCtx.clearRect(0,0,dw,dh)

  for(let p of particles){
    p.y+=p.vy
    if(p.y<0){ p.y=dh; p.x=Math.random()*dw }

    dustCtx.beginPath()
    dustCtx.fillStyle=`rgba(220,220,220,${p.a})`
    dustCtx.arc(p.x,p.y,p.r,0,Math.PI*2)
    dustCtx.fill()
  }

  requestAnimationFrame(drawDust)
}

drawDust()
