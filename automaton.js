import * as THREE from '/threejs/build/three.module.js';
import {GLTFLoader} from '/threejs/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from '/threejs/examples/js/controls/OrbitControls.js';
import { EffectComposer } from '/threejs/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from '/threejs/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from '/threejs/examples/jsm/postprocessing/UnrealBloomPass.js'; 
import { FilmPass } from '/threejs/examples/jsm/postprocessing/FilmPass.js';
let scene, camera, renderer, composer;

let objects = [];


function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    const light = new THREE.HemisphereLight( 0x333333, 0x333333, 3 );
    scene.add( light );

    camera = new THREE.PerspectiveCamera(60,window.innerWidth/2 / window.innerHeight,1,1000);
    
    const container = document.getElementById( 'three' );
    document.body.appendChild( container );
    renderer = new THREE.WebGLRenderer({ antialias: true});
    renderer.setPixelRatio(window.devicePixelRatio/2);
    renderer.setSize(window.innerWidth/2,window.innerHeight );
    document.getElementById('container').appendChild(renderer.domElement);         
    
    // const controls = new OrbitControls( camera, renderer.domElement );
    // controls.enableZoom = false;
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

var wallMaterial = new THREE.MeshStandardMaterial( { //material to for disco ball
    metalness: 1,
    roughness: 0.5,
    color: 0x4ba353,
    envMap: cubemap,
    emissive: true
} );
wallMaterial.side = THREE.DoubleSide;

var loader = new GLTFLoader();
loader.load( 'models/diorama.gltf', function ( gltf ) {           
gltf.scene.traverse(function (child) {
    if (child.isMesh) {
        child.material.envMap = cubemap;
        objects.push(child);
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
        cloud.position.set(
        Math.random()*10-10, 
        Math.random()*10-4, //up
        -p -3 //forward
        );
        star.rotation.z = Math.random()*2*Math.PI;
        star.material.opacity = 0.35;
        scene.add(cloud);
    }

});



/**
* Post Processing
**/
composer = new EffectComposer( renderer );
const renderPass = new RenderPass( scene, camera );
composer.addPass( renderPass );

const unrealBloomPass = new UnrealBloomPass();
composer.addPass( unrealBloomPass );
render();

}

function render() {
    composer.render(); //render and post
    requestAnimationFrame(render);
}

init();



/**
 * LISTENERS
 */

window.addEventListener( 'resize', onWindowResize, false );
function onWindowResize(){
    camera.aspect = window.innerWidth / 2 / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth/2, window.innerHeight);
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

  container.addEventListener( 'wheel', onMouseWheel );
  container.addEventListener( 'scroll', onMouseWheel );
        function onMouseWheel( ev ) {
            ev.preventDefault();
            if (ev.deltaY<0){
                if (camera.position.y < 2.8){
                    camera.position.y += 0.01; 
                }
                else if (camera.position.z >0){
                    camera.position.z -= 0.01; 
                }
			 }
            else{
                if (camera.position.y > 0){
                    camera.position.y -= 0.01;       
                }
            }
        }
