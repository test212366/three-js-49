import * as THREE from 'three'
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls'
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader' 
import GUI from 'lil-gui'
import gsap from 'gsap'
import fragmentShader from './shaders/fragment.glsl'
import vertexShader from './shaders/vertexParticles.glsl'
 
import {EffectComposer} from 'three/examples/jsm/postprocessing/EffectComposer'
import {UnrealBloomPass} from 'three/examples/jsm/postprocessing/UnrealBloomPass'

import {RenderPass} from 'three/examples/jsm/postprocessing/RenderPass'
import {ShaderPass} from 'three/examples/jsm/postprocessing/ShaderPass'
import {GlitchPass} from 'three/examples/jsm/postprocessing/GlitchPass'


import t from './one.jpg'
import t1 from './download.jpg'



export default class Sketch {
	constructor(options) {
		
		this.scene = new THREE.Scene()
		
		this.container = options.dom
		
		this.width = this.container.offsetWidth
		this.height = this.container.offsetHeight
		
		
		// // for renderer { antialias: true }
		this.renderer = new THREE.WebGLRenderer({ antialias: true })
		this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
		this.renderTarget = new THREE.WebGLRenderTarget(this.width, this.height)
		this.renderer.setSize(this.width ,this.height )
		this.renderer.setClearColor(0x000000, 1)
		this.renderer.useLegacyLights = true
		// this.renderer.outputEncoding = THREE.sRGBEncoding
 

		 
		this.renderer.setSize( window.innerWidth, window.innerHeight )

		this.container.appendChild(this.renderer.domElement)
 


		this.camera = new THREE.PerspectiveCamera( 70,
			 this.width / this.height,
			 0.001,
			 5000
		)
 
		this.camera.position.set(0, 0, 1500) 
		this.controls = new OrbitControls(this.camera, this.renderer.domElement)
		this.time = 0


		this.dracoLoader = new DRACOLoader()
		this.dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/')
		this.gltf = new GLTFLoader()
		this.gltf.setDRACOLoader(this.dracoLoader)

		this.isPlaying = true

		this.video = document.getElementById('video1')
		console.log(this.video);
	  

		this.addPost()

		this.addObjects()		 
		this.resize()
		this.render()
		this.setupResize()
		this.settings()
 
		this.video.addEventListener('ended', () => {
			gsap.to(this.video, {
				duration:0.1,
				opacity: 0 
			})
			gsap.to(this.material.uniforms.distortion, {
				duration: 2,
				value: 3,
				ease: 'power2.inOut'
			})

			gsap.to(this.material.uniforms.progress, {
				duration: 1,
				value: 1,
				delay: 1.5,
				// ease: 'power2.inOut'
			})



			gsap.to(this.bloomPass, {
				duration: 2,
				strength: 7,
				ease: 'power2.in'
			})
			gsap.to(this.material.uniforms.distortion, {
				duration: 2,
				value: 0,
				delay: 2,
				ease: 'power2.inOut'
			})
			gsap.to(this.bloomPass, {
				duration: 2,
				strength: 0,
				delay: 2,
				ease: 'power2.out',
				onComplete: () => {
					
					this.video.currentTime = 0
					this.video.play()
					gsap.to(this.video, {
						duration:0.1,
						opacity: 0 
					})
				}
			})
		})
	}

	addPost() {
		this.renderScene = new RenderPass(this.scene, this.camera)
		this.bloomPass = new UnrealBloomPass(new THREE.Vector2(
			this.width, this.height
		), 1.5, 0.4, 0.85)
		this.bloomPass.threshold = this.settings.bloomThreshold
		this.bloomPass.strength = this.settings.bloomStrength
		this.bloomPass.radius = this.settings.bloomRadius

		this.composer = new EffectComposer(this.renderer)
		this.composer.addPass(this.renderScene)
		this.composer.addPass(this.bloomPass)

	}


	settings() {
		let that = this
		this.settings = {
			bloomStrength: 0,
			distortion: 0,

		}
		this.gui = new GUI()
		this.gui.add(this.settings, 'bloomStrength', 0, 10, 0.01)
		this.gui.add(this.settings, 'distortion', 0, 3, 0.01)

	}

	setupResize() {
		window.addEventListener('resize', this.resize.bind(this))
	}

	resize() {
		this.width = this.container.offsetWidth
		this.height = this.container.offsetHeight
		this.renderer.setSize(this.width, this.height)
		this.composer.setSize(this.width, this.height)

		this.camera.aspect = this.width / this.height
 

		this.camera.updateProjectionMatrix()



	}


	addObjects() {
		let that = this
		this.material = new THREE.ShaderMaterial({
			extensions: {
				derivatives: '#extension GL_OES_standard_derivatives : enable'
			},
			side: THREE.DoubleSide,
			uniforms: {
				time: {value: 0},
				progress: {value: 0},

				t: {value: new THREE.TextureLoader().load(t)},
				t1: {value: new THREE.TextureLoader().load(t1)},

				distortion: {value: 0},

				resolution: {value: new THREE.Vector4()}
			},
			vertexShader,
			fragmentShader,
		})

		// this.material = new THREE.PointsMaterial({color: 0x888888})
		
		this.geometry = new THREE.PlaneGeometry(480 * 1.745,820 * 1.745,480,820)
		this.plane = new THREE.Points(this.geometry, this.material)
		console.log(this.plane);
 
		this.scene.add(this.plane)
 
	}



	addLights() {
		const light1 = new THREE.AmbientLight(0xeeeeee, 0.5)
		this.scene.add(light1)
	
	
		const light2 = new THREE.DirectionalLight(0xeeeeee, 0.5)
		light2.position.set(0.5,0,0.866)
		this.scene.add(light2)
	}

	stop() {
		this.isPlaying = false
	}

	play() {
		if(!this.isPlaying) {
			this.isPlaying = true
			this.render()
		}
	}

	render() {
		if(!this.isPlaying) return
		this.time += 0.05
		this.material.uniforms.time.value = this.time
		// this.material.uniforms.distortion.value = this.settings.distortion
		// this.bloomPass.strength = this.settings.bloomStrength
		//this.renderer.setRenderTarget(this.renderTarget)
		// this.renderer.render(this.scene, this.camera)
		//this.renderer.setRenderTarget(null)

		this.composer.render()
 
		requestAnimationFrame(this.render.bind(this))
	}
 
}
new Sketch({
	dom: document.getElementById('container')
})
 