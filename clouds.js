import * as THREE from '/threejs/build/three.module.js';
import {GLTFLoader} from '/threejs/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from '/threejs/examples/js/controls/OrbitControls.js';
import { EffectComposer } from '/threejs/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from '/threejs/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from '/threejs/examples/jsm/postprocessing/UnrealBloomPass.js'; 
let scene, camera, renderer, composer, material;
let frame, frame3, frame2, disco;
let cloudParticles = [];
let cloud;
let geometry, plane;
const loadingScreen = document.getElementById( 'loading-screen' );
function init() {

    //loader

    let manager = new THREE.LoadingManager();
    manager.onProgress = function (url, itemsLoaded, itemsTotal) {
        console.log( 'Loaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.' );
    };
    manager.onLoad = function () {
        console.log('all items loaded');
        loadingScreen.classList.add( 'fade-out' );
        loadingScreen.remove();
    };
    manager.onError = function () {
        console.log('there has been an error');
    }

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0c405c);

    const light = new THREE.HemisphereLight( 0x5c5c94, 0x8d729e, 3 );
    scene.add( light );

    camera = new THREE.PerspectiveCamera(60,window.innerWidth / window.innerHeight,1,1000);
    
    const container = document.getElementById( 'three' );
    document.body.appendChild( container );
    renderer = new THREE.WebGLRenderer({ antialias: true});
    renderer.setPixelRatio(window.devicePixelRatio/2);
    renderer.setSize(window.innerWidth,window.innerHeight );
    document.getElementById('container').appendChild(renderer.domElement);         
    
    camera.position.z += 10;

    /**
     * MATERIALS
    */
    var cubemap = new THREE.CubeTextureLoader()
    .setPath( 'img/' )
    .load( [
        'mecube.png',
        'mecube.png',
        'mecube.png',
        'mecube.png',
        'mecube.png',
        'mecube.png'
    ] );

    var wallMaterial = new THREE.MeshStandardMaterial( { //material to for disco ball
        bumpMap: new THREE.TextureLoader().load("img/threedisco.png"),
          bumpScale: 0.01,
        metalness: 1,
        roughness: 0.2,
        color: 0xffffff,
        envMap: cubemap,
    } );
    wallMaterial.side = THREE.DoubleSide;


    var loader = new GLTFLoader(manager);
    loader.load( 'models/fence.gltf', function ( gltf ) {  
        let fence = gltf.scene.getObjectByName("fence");
		fence.material = wallMaterial;
        gltf.scene.traverse(function (child) {
            if (child.isMesh) {
                child.material.envMap = cubemap;
            }
        });
        scene.add(gltf.scene);
    }, undefined, function ( error ) {
    console.error( error );
    } );
    let tloader = new THREE.TextureLoader();
				tloader.load("img/smoke.png", function(texture){
				const cloudGeo = new THREE.PlaneBufferGeometry(40,40);
				const cloudMaterial = new THREE.MeshLambertMaterial({
					map:texture,
					transparent: true
				});

				for(let p=0; p<15; p++) {
					cloud = new THREE.Mesh(cloudGeo, cloudMaterial);
					cloud.position.set(
					Math.random()*5-5, 
					Math.random()*10 -4 + p, //up
					-p - 3 //forward
					);
					cloud.rotation.z = Math.random()*2*Math.PI;
					cloud.material.opacity = 0.35;
					cloudParticles.push(cloud);
					scene.add(cloud);
				}

	});
    geometry = new THREE.PlaneGeometry(30, 20, 40, 40); //
    material = new THREE.ShaderMaterial({
                uniforms: {
                utime: { value: 0.0 },
                width: { value: 30.0},
                height: { value: 20.0},
				uTexture: { value: new THREE.TextureLoader().load("img/mecube.png") },
                },
                vertexShader: vertexShader(),
                fragmentShader: clearShader(),
                });
    material.transparent = true;


    plane = new THREE.Mesh(geometry, material);
    scene.add(plane);
    plane.position.set(-0,-0,0.08);
    function vertexShader() {
        return `
        uniform float utime;
        uniform float width;
        uniform float height;

        varying vec2 vUv; //x and y unit vector
        varying float zpos; //this will be z position after transformation

        void main(){
        vUv = uv;   //for use in frag

        float dx = 2. - uv.x + width;   
        float dy = 8. -uv.y + height;
        float freq = sqrt(dx*dx + dy*dy);
        float amp = 0.2;
        float angle = -utime*3.0+freq*8.0;
            
        zpos = sin(angle)*amp;

        vec3 local3 = vec3(uv.x*width, uv.y*height, zpos);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
        }
        `
    }
    function clearShader() {
    return `
        uniform float utime;
        uniform sampler2D uTexture;
        varying vec2 vUv;
        varying float zpos;
       
        void main() {
            vec3 texture = texture2D(uTexture, vUv + zpos).rgb;
            float shadow = clamp(zpos / 1., 0., 1.);
            gl_FragColor = vec4(texture + shadow, 0.1);
            gl_FragColor.a = 0.2;
        }
    `
    }

}

    /**
    * Post Processing
    **/
   

function render() {
    requestAnimationFrame(render);
    renderer.render(scene, camera);
    material.uniforms.utime.value += 0.001;           
}

init();
render();



/**
 * LISTENERS
 */
window.addEventListener( 'resize', onWindowResize, false );
 function onWindowResize(){
     camera.aspect = window.innerWidth / window.innerHeight;
     camera.updateProjectionMatrix();
     plane.scale.set( window.innerWidth/450,  window.innerHeight/450);
     material.uniforms.width.value = window.innerWidth/50;
     material.uniforms.height.value = window.innerHeight/50;
     renderer.setSize( window.innerWidth, window.innerHeight);
}
window.addEventListener("mousemove", onMouseMove, false);
function onMouseMove(){
    material.uniforms.utime.value += 0.007;           
}