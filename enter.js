import * as THREE from '/threejs/build/three.module.js';
import {GLTFLoader} from '/threejs/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from '/threejs/examples/js/controls/OrbitControls.js';
import { EffectComposer } from '/threejs/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from '/threejs/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from '/threejs/examples/jsm/postprocessing/UnrealBloomPass.js'; 
import { FilmPass } from '/threejs/examples/jsm/postprocessing/FilmPass.js';
		var camera, scene, renderer;
		var mesh;
		var model, model2, model3, model4, model5, computer;
		var LOWESTHEIGHT = 1.75;
		var HIGHESTHEIGHT = 42;
		var ZBOUNDARY = -5;
		var YSPEED = 0.05;
		var CLOUDROTATION = 0.001;

		var WINDOW3LOW = 12;
		var WINDOW3HIGH = 18;
		var WINDOW4LOW = 24;
		var WINDOW4HIGH = 26;

		let cloudParticles = [];
		let cloud;
		let curtainCloudsLeft = [];
		let curtainCloudsRight = [];
        
        init();
        animate();
        
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

			//basics
			camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.25, 200);
			camera.position.set(0,0,0);
            camera.position.z += 15;
			camera.position.y += LOWESTHEIGHT;

			scene = new THREE.Scene();
			scene.background = new THREE.Color(0x0c405c);

			const light = new THREE.HemisphereLight( 0x5c5c94, 0x8d729e, 3 );
 			scene.add( light );

			// create the cubemap
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
				roughness: 0.05,
				color: 0xffffff,
				envMap: cubemap,
			} );
            wallMaterial.side = THREE.DoubleSide;

			//material
			var fenceMaterial = new THREE.MeshStandardMaterial( { //material to for disco ball
				metalness: 1,
				roughness: 0.2,
				color: 0xFFFFFF,
				envMap: cubemap,
				morphTargets: true,
				morphNormals:true,
			} );
            fenceMaterial.side = THREE.DoubleSide;
			
			// model
            var loader = new GLTFLoader(manager);
			loader.load("models/displayboxoptimized.gltf", function (gltf) {
				let home = gltf.scene.getObjectByName("home");
				console.log(home);
				home.material = wallMaterial;
				let fence = gltf.scene.getObjectByName("fence");
				fence.material = fenceMaterial;

				model = gltf.scene.getObjectByName("model");
				model.material = fenceMaterial;
				model.geometry.morphTargets = true;

				model2 = gltf.scene.getObjectByName("model2");
				model2.material = fenceMaterial;
				model2.geometry.morphTargets = true;

				model3 = gltf.scene.getObjectByName("model3");
				model3.material = fenceMaterial;
				model3.geometry.morphTargets = true;

				model4 = gltf.scene.getObjectByName("model4");
				model4.material = fenceMaterial;
				model4.geometry.morphTargets = true;

				model5 = gltf.scene.getObjectByName("model5");
				model5.material = fenceMaterial;
				model5.geometry.morphTargets = true;
	
				scene.add(gltf.scene);

			});

			// renderer and controls
            var container = document.getElementById( 'three' );
			renderer = new THREE.WebGLRenderer({ antialias: true});
			renderer.setPixelRatio(window.devicePixelRatio/2);
			renderer.setSize(window.innerWidth, window.innerHeight);
			container.appendChild(renderer.domElement)
			//controls = new OrbitControls( camera, renderer.domElement );
			//controls.enableZoom = false;

		
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

					//curtains
					if (p<6){
						cloud = new THREE.Mesh(cloudGeo, cloudMaterial);
						cloud.position.set(-3+p, 35, -6 - p );
						cloud.material.opacity = 0.6;
						cloud.rotation.z = Math.random()*2*Math.PI;
						curtainCloudsLeft.push(cloud);
						scene.add(cloud);

						cloud = new THREE.Mesh(cloudGeo, cloudMaterial);
						cloud.position.set(3+p, 35, -6 - 2*p);
						cloud.material.opacity = 0.5;
						curtainCloudsRight.push(cloud);
						cloud.rotation.z = Math.random()*2*Math.PI;
						scene.add(cloud);
					}
				}

			});

			//material
			var normalMaterial = new THREE.MeshStandardMaterial( { //material to for disco ball
				morphTargets: true,
				morphNormals:true,
				metalness: 0.7,
				roughness: 0.1,
				color: 0x555555,
				bumpMap: new THREE.TextureLoader().load("img/threedisco.png"),
				envMap: cubemap,
			} );
			
			// computer model
			loader.load("models/singlemorph3.gltf", function (gltf) {
				gltf.scene.traverse(function (child) {
					if (child.isMesh) {
						console.log(child);
						computer = child;
						computer.geometry.morphTargets = true;
						computer.material = normalMaterial;
						computer.position.set(0, 42, -10);
						scene.add(computer);
					}
				});
			});
		
		}
	
		function animate() {
			requestAnimationFrame(animate);
			renderer.render(scene, camera);
		}

		let cloud1, cloud2;
		function cloudPart(num){
			if(num>0){
				if (camera.position.z>ZBOUNDARY){
					camera.position.z -= 0.1;
					for(let p=0; p<6; p++) {
					cloud1 = curtainCloudsLeft[p];
					cloud1.rotation.z -= CLOUDROTATION;
					cloud1.position.x -= 0.06 * Math.random();

					cloud2 = curtainCloudsRight[p];
					cloud2.rotation.z += CLOUDROTATION;
					cloud2.position.x += 0.08 * Math.random();
				}
				}
				else if (computer.morphTargetInfluences[0]<1){
					computer.morphTargetInfluences[0] += 0.01;
				}
				else {
					computer.rotation.y += YSPEED;
				}
			}
			else{
				if (camera.position.z < 15){
					camera.position.z += 0.1;
					for(let p=0; p<6; p++) {
					cloud1 = curtainCloudsLeft[p];
					cloud1.rotation.z += CLOUDROTATION;
					cloud1.position.x += 0.06 * Math.random();

					cloud2 = curtainCloudsRight[p];
					cloud2.rotation.z -= CLOUDROTATION;
					cloud2.position.x -= 0.08 * Math.random();
				}
				}
				if (computer.morphTargetInfluences[0]>0){
					computer.morphTargetInfluences[0] -= 0.01;
				}
			}
		}
			
		window.addEventListener( 'resize', onWindowResize, false );
			function onWindowResize(){
				camera.aspect = window.innerWidth / window.innerHeight;
				camera.updateProjectionMatrix();
				renderer.setSize( window.innerWidth, window.innerHeight);
		}

		window.addEventListener( 'scroll', onMouseWheel );
		window.addEventListener( 'wheel', onMouseWheel ,{ passive: false });
        
        function onMouseWheel( ev ) {
            ev.preventDefault();
            const amount = ev.deltaY;
            if (amount<0){
				if (camera.position.y <HIGHESTHEIGHT && model.morphTargetInfluences[0]>0.9){
					camera.position.y += YSPEED;
				}
				else if(camera.position.y > 34){
					cloudPart(1);
					return;
				} 
				if(camera.position.y<7 && model.morphTargetInfluences[0]<1){
					model.morphTargetInfluences[0] += 0.01;
				}
				if(camera.position.y>6 && camera.position.y<10 && model2.morphTargetInfluences[0]<1){
					model2.morphTargetInfluences[0] += 0.01;
				}   
				if(camera.position.y>WINDOW3LOW && camera.position.y<WINDOW3HIGH && model3.morphTargetInfluences[0]<1){
					model3.morphTargetInfluences[0] += 0.01;
				} 
				if(camera.position.y>WINDOW4LOW && camera.position.y<WINDOW4HIGH && model4.morphTargetInfluences[0]<1){
					model4.morphTargetInfluences[0] += 0.01;
				} 
				if(camera.position.y>WINDOW4HIGH + 5 && camera.position.y<HIGHESTHEIGHT && model5.morphTargetInfluences[0]<1){
					model5.morphTargetInfluences[0] += 0.01;
				}          
			 }
            else{
				if (camera.position.y > LOWESTHEIGHT){
					camera.position.y -= YSPEED;
				}
				if(camera.position.y > 34){
					cloudPart(0);
					return;
				} 
				if(model.morphTargetInfluences[0]>0 && camera.position.y<7){
					model.morphTargetInfluences[0] -= 0.01;

				}
				if(model2.morphTargetInfluences[0]>0 && camera.position.y>6 && camera.position.y<10){
					model2.morphTargetInfluences[0] -= 0.01;
				}
				if(model3.morphTargetInfluences[0]>0 && camera.position.y<WINDOW3HIGH){
					model3.morphTargetInfluences[0] -= 0.01;
				}  
				if(model4.morphTargetInfluences[0]>0 && camera.position.y<WINDOW4HIGH){
					model4.morphTargetInfluences[0] -= 0.01;
				} 
				if(camera.position.y>WINDOW4HIGH + 3 && camera.position.y<HIGHESTHEIGHT && model5.morphTargetInfluences[0]>0){
					model5.morphTargetInfluences[0] -= 0.01;
				} 
               
            }
        }
