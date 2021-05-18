import * as THREE from '/threejs/build/three.module.js';
import {GLTFLoader} from '/threejs/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from '/threejs/examples/js/controls/OrbitControls.js';
import { EffectComposer } from '/threejs/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from '/threejs/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from '/threejs/examples/jsm/postprocessing/UnrealBloomPass.js'; 
let scene, camera, renderer, composer, material;
let frame, frame3, frame2, disco;

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
    scene.background = new THREE.Color(0x000000);
    const pLight = new THREE.PointLight( 0xab74ad, 1, 100 );
    pLight.position.set( 1, 5, 5 );
    scene.add( pLight );
    const light = new THREE.HemisphereLight( 0x333333, 0x333333, 3 );
    //scene.add( light );

    camera = new THREE.PerspectiveCamera(60,window.innerWidth / window.innerHeight,1,1000);
    
    const container = document.getElementById( 'three' );
    document.body.appendChild( container );
    renderer = new THREE.WebGLRenderer({ antialias: true});
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth,window.innerHeight );
    document.getElementById('container').appendChild(renderer.domElement);         
    
    const controls = new OrbitControls( camera, renderer.domElement );
    controls.enableZoom = false;
      camera.position.z += 3;
     controls.update();

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

    var morphMaterial = new THREE.MeshStandardMaterial( { //material to for disco ball
        metalness: 1,
        roughness: 0.2,
        color: 0xFFFFFF,
        envMap: cubemap,
        morphTargets: true,
        morphNormals:true,
    } );
    morphMaterial.side = THREE.DoubleSide;


    var loader = new GLTFLoader(manager);
    loader.load( 'models/home.gltf', function ( gltf ) {  

        disco = gltf.scene.getObjectByName("Sphere");

        frame2 = gltf.scene.getObjectByName("1frame");
        frame2.material = morphMaterial;
        frame2.geometry.morphTargets = true;
            
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

    let geometry = new THREE.PlaneGeometry(2, 1.5, 30, 30); //
    material = new THREE.ShaderMaterial({
                uniforms: {
                utime: { value: 0.0 },
                width: { value: 2.0 },
                height: { value: 1.5 },
				uTexture: { value: new THREE.TextureLoader().load("img/mecube.png") },
                },
                vertexShader: vertexShader(),
                fragmentShader: clearShader(),
                });
    material.transparent = true;


    let mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
    mesh.position.set(-0,-0,0.08);
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
        float dy = 8. -uv.y * height;
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



    /**
    * Post Processing
    **/
    composer = new EffectComposer( renderer );
    const renderPass = new RenderPass( scene, camera );
    composer.addPass( renderPass );

    const unrealBloomPass = new UnrealBloomPass();
    composer.addPass( unrealBloomPass );
}

function render() {
    requestAnimationFrame(render);
    composer.render(); //render and post
    disco.rotation.y += 0.005;      
    material.uniforms.utime.value += 0.007;           
}

init();
render();



/**
 * LISTENERS
 */

window.addEventListener( 'resize', onWindowResize, false );
function onWindowResize(){
    camera.aspect = window.innerWidth / 2 / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth / 2, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio/1.5);
}

document.addEventListener( 'mousemove', onMouseMove, false );
function onMouseMove(){
}