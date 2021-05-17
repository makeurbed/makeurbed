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

    const light = new THREE.HemisphereLight( 0x333333, 0x333333, 3 );
    scene.add( light );

    camera = new THREE.PerspectiveCamera(60,window.innerWidth/2 / window.innerHeight,1,1000);
    
    const container = document.getElementById( 'three' );
    document.body.appendChild( container );
    renderer = new THREE.WebGLRenderer({ antialias: true});
    renderer.setPixelRatio(window.devicePixelRatio/1.5);
    renderer.setSize(window.innerWidth/2,window.innerHeight );
    document.getElementById('container').appendChild(renderer.domElement);         
    
    //const controls = new OrbitControls( camera, renderer.domElement );
    //controls.enableZoom = false;
     camera.position.z += 4;
    //controls.update();

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
    loader.load( 'models/zine.gltf', function ( gltf ) {  
        frame = gltf.scene.getObjectByName("frame2");
        frame.material = morphMaterial;
        frame.geometry.morphTargets = true;

        frame3 = gltf.scene.getObjectByName("frame4");
        frame3.material = morphMaterial;
        frame3.geometry.morphTargets = true;

        disco = gltf.scene.getObjectByName("disco");

        frame2 = gltf.scene.getObjectByName("frame3");
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
    tloader.load("img/star.png", function(texture){
        const starGeo = new THREE.PlaneBufferGeometry(5,5);
        const starMaterial = new THREE.MeshLambertMaterial({
            map:texture,
            transparent: true
        });
        starMaterial.side = THREE.DoubleSide;

        for(let p=0; p<30; p++) {
            let star = new THREE.Mesh(starGeo, starMaterial);
            star.position.set(
            Math.random()*10-10, 
            Math.random()*10-4, //up
            -p -3 //forward
            );
            star.rotation.z = Math.random()*2*Math.PI;
            star.material.opacity = 0.35;
            scene.add(star);
        }

    });

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

        varying vec3 Normal;
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
    material.uniforms.utime.value +=0.007; 
   // disco.rotation.y += 0.005;                
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
}


// container.addEventListener( 'click', onDocumentMouseDown, false );
// function onDocumentMouseDown( e ) {
//     e.preventDefault();
//     // update the picking ray with the camera and mouse position
//     console.log(mouse);
// 	// calculate objects intersecting the picking ray
// 	const intersects = raycaster.intersectObjects( objects );
// 	for ( let i = 0; i < intersects.length; i ++ ) {
//      var intersection = intersects[ i ],
//       obj = intersection.object;
//       if (obj.parent.name === "computer1"){
//        // moveCamera();
//       }
//       console.log("Intersected object", obj);
// 	}
//   }
// var directionX = 0;
// var directionY = 0;
// container.addEventListener( 'mousemove', onMouseMove );
// function onMouseMove(event){
//     directionX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
//     directionY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;
//     console.log(directionX);
//     if(directionX > 0){
//         camera.rotation.y += 0.001;
//     }else{
//         camera.rotation.y -= 0.001;
//     }
// }
const speed = 0.02;
// to run on each frame
function lerp(position, targetPosition) {
    // update position by 20% of the distance between position and target position
      position.x += (targetPosition.x - position.x)*0.2;
      position.y += (targetPosition.y - position.y)*0.2;
}
container.addEventListener( 'wheel', onMouseWheel );

/**
 * MOBILE CONTROLS
 *  */
container.addEventListener("touchstart", touchStart, false);
container.addEventListener("touchmove", touchMove, false);

var start = {x:0, y:0};
function touchStart(event) {
  start.x = event.touches[0].pageX;
  start.y = event.touches[0].pageY;
}

function touchMove(event) {
  offset = {};
  offset.x = start.x - event.touches[0].pageX;
  offset.y = start.y - event.touches[0].pageY;
  onMouseWheel(ev);
}

container.addEventListener( 'scroll', onMouseWheel );
function onMouseWheel( ev ) {
    ev.preventDefault();
    console.log(ev.deltaY);
    if (ev.deltaY<0){
        if (camera.position.z < 4 && camera.position.y <0){
            camera.position.z += speed; 
            console.log("1");
        }
        else if (camera.position.y < 2.8){
            camera.position.y += speed; 
            disco.rotation.y += 0.005; 
            if(frame3.morphTargetInfluences[0]>0){
                frame3.morphTargetInfluences[0] -= 0.01;
            }  
            
        }
        else if (camera.position.z >0.75){
            camera.position.z -= speed; 
        }
        else if (frame.morphTargetInfluences[0]<1){
            frame.morphTargetInfluences[0] += 0.02;
        }
        else if (frame2.morphTargetInfluences[0]<1){
            frame2.morphTargetInfluences[0] += 0.02;
        }
        }
    else{
        if (camera.position.z < 4 && camera.position.y > 2){
            camera.position.z += speed; 
            if(frame.morphTargetInfluences[0]>0){
                frame.morphTargetInfluences[0] -= 0.01;
            }
            if(frame2.morphTargetInfluences[0]>0){
                frame2.morphTargetInfluences[0] -= 0.01;
            }
        }
        else if (camera.position.y > -3){
            camera.position.y -= speed;
            disco.rotation.y += 0.005; 
            if(frame3.morphTargetInfluences[0]<1){
                frame3.morphTargetInfluences[0] += 0.01;
            }
        }
        else if (camera.position.z >0.75){
            camera.position.z -= speed; 
        }
    }
}
