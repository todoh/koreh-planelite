/**
 * MOTOR 3D CORE - INTEGRACIÓN TOTAL (Humanos, Fauna y Flora)
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Skeleton } from './skeleton_core.js';
import { setSeed, seededRandomRange } from './utils.js';

import { Feline3D } from './motor_felinos.js';
import { Canine3D } from './motor_caninos.js';
import { Flora3D } from './motor_flora.js';
import { Human3D } from './motor_humanos.js'; 
import { SimianEngine } from './motor_simios.js'; 

export const Genesis3D = {
    scene: null,
    camera: null,
    renderer: null,
    controls: null,
    
    currentSkeleton: null,
    meshMap: new Map(),
    mainGroup: null,

    init(canvas) {
        if (this.renderer && this.renderer.domElement === canvas) return;

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color('#050505');
        this.scene.fog = new THREE.FogExp2('#050505', 0.0004);

        this.camera = new THREE.PerspectiveCamera(45, canvas.width / canvas.height, 1.0, 8000);
        this.camera.position.set(0, 100, 400);

        this.renderer = new THREE.WebGLRenderer({ 
            canvas, 
            antialias: true, 
            alpha: true,
            logarithmicDepthBuffer: true 
        });
        
        const parent = canvas.parentElement;
        if (parent) {
            this.renderer.setSize(parent.clientWidth, parent.clientHeight);
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        }
        this.renderer.shadowMap.enabled = true;

        this.controls = new OrbitControls(this.camera, canvas);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 250;
        this.controls.maxDistance = 520;
        this.controls.target.set(0, 50, 0); 
        
        const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
        dirLight.position.set(100, 300, 100);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;
        this.scene.add(dirLight);
        
        const hemiLight = new THREE.HemisphereLight(0xffffff, 0x222222, 0.6);
        this.scene.add(hemiLight);
        
        const plane = new THREE.Mesh(
            new THREE.PlaneGeometry(10000, 10000), 
            new THREE.MeshStandardMaterial({ color: 0x080808, roughness: 0.8, metalness: 0.2 })
        );
        plane.rotation.x = -Math.PI / 2;
        plane.receiveShadow = true;
        this.scene.add(plane);

        window.addEventListener('resize', () => this.onWindowResize());
    },

    buildEntity(type, config, seed) {
        this.cleanScene();
        this.resetCamera(type, config);
        setSeed(seed * 1000);
        
        this.currentSkeleton = null; 
        const mainGroup = new THREE.Group();
        this.mainGroup = mainGroup;
        mainGroup.userData.config = config; 
        mainGroup.userData.type = type;

        this.scene.add(mainGroup);

        try {
            if (config.isHuman || type === 'human') {
                this.currentSkeleton = new Skeleton(config);
                this.meshMap = Human3D.build(mainGroup, config, seed);
            }
            else if (type === 'feline' || (config.species && config.species.includes('cat')) || (config.species && config.species.includes('lion')) || (config.species && config.species.includes('tiger')) || (config.species && config.species.includes('panther'))) {
                this.currentSkeleton = new Skeleton(config);
                this.meshMap = Feline3D.build(mainGroup, config, seed);
            }
            else if (type === 'canine' || (config.species && config.species.includes('wolf')) || (config.species && config.species.includes('dog'))) {
                this.currentSkeleton = new Skeleton(config);
                this.meshMap = Canine3D.build(mainGroup, config, seed);
            }
            else if (type === 'tree') {
                Flora3D.build(mainGroup, config, seed);
            }
            // --- NUEVO: SOPORTE PARA FLORES 3D ---
            else if (type === 'flower') {
                Flora3D.buildFlower(mainGroup, config, seed);
            }
            else if (['vertebrate', 'simian'].includes(type) && config.structure) {
                this.buildSkeletonCreature(mainGroup, config);
            }
            else {
                this.buildPlaceholder(mainGroup, type);
            }
        } catch (e) {
            console.error("Error Crítico en Construcción 3D:", e);
        }
    },

    render(time) {
        if (!this.renderer || !this.scene || !this.camera) return;

        // A. ANIMACIÓN ESQUELETO
        if (this.currentSkeleton && this.meshMap.size > 0) {
            
            // Si es el visor (no controlado por jugador), forzamos isMoving=true para verlo andar
            if (!this.mainGroup.userData.isPlayerControlled) {
                this.currentSkeleton.update(0, 0, time, 0.005, true);
            }
            
            const isHuman = this.mainGroup?.userData?.config?.isHuman;
            const yOffset = isHuman ? 105 : 130; 

            this.currentSkeleton.bones.forEach(bone => {
                const meshGroup = this.meshMap.get(bone.id);
                if (meshGroup) {
                    meshGroup.position.set(
                        bone.globalStart.x, 
                        -bone.globalStart.y + yOffset, 
                        bone.globalStart.z 
                    );
                    
                    meshGroup.rotation.order = 'ZXY'; 
                    meshGroup.rotation.z = -bone.globalAngle;
                    meshGroup.rotation.x = -bone.globalRotX;
                }
            });
        } 
        // B. ANIMACIÓN FLORA (Árboles y Flores)
        else if (this.mainGroup && this.mainGroup.userData.floraEngine) {
            this.mainGroup.userData.floraEngine.update(time);
        }

        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    },

    resetCamera(type, config) {
        if (!this.controls) return;
        this.controls.reset();
        
        let targetY = 50;
        let dist = 400;

        if (config && config.isHuman) { 
            targetY = 95;
            dist = 380; 
        } else if (type === 'tree') {
            targetY = 100;
            dist = 450;
        } else if (type === 'flower') { // Cámara más cercana para flores
            targetY = 60;
            dist = 200;
        } else if (type === 'feline' || type === 'canine' || type === 'vertebrate') {
            targetY = 40;
            dist = 300; 
        }

        this.camera.position.set(0, targetY + 20, dist); 
        this.controls.target.set(0, targetY, 0);   
        this.controls.update();
    },

    cleanScene() {
        this.meshMap.clear();
        this.currentSkeleton = null;
        this.mainGroup = null;
        
        for(let i = this.scene.children.length - 1; i >= 0; i--) {
            const obj = this.scene.children[i];
            if(obj.type === 'Group' || (obj.isMesh && obj.geometry.type !== 'PlaneGeometry')) {
                this.scene.remove(obj);
                if (obj.geometry) obj.geometry.dispose();
                if (obj.material) {
                    if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
                    else obj.material.dispose();
                }
            }
        }
    },
    
    buildSkeletonCreature(group, config) {
        this.currentSkeleton = new Skeleton(config);
        const hue = seededRandomRange(config.colorSkin ? config.colorSkin[0] : 0, config.colorSkin ? config.colorSkin[1] : 20);
        const skinMat = new THREE.MeshStandardMaterial({ color: `hsl(${hue}, 40%, 40%)`, roughness: 0.7 });
        
        this.currentSkeleton.bones.forEach(bone => {
            const boneGroup = new THREE.Group();
            const wStart = bone.widthStart || 5;
            const wEnd = bone.widthEnd || wStart * 0.7;
            const len = bone.length || 10;
            
            const geometry = new THREE.CylinderGeometry(wEnd * 0.5, wStart * 0.5, len, 8);
            geometry.translate(0, len / 2, 0); 
            geometry.rotateZ(-Math.PI / 2); 
            
            const mesh = new THREE.Mesh(geometry, skinMat);
            mesh.castShadow = true; 
            
            boneGroup.add(mesh); 
            group.add(boneGroup);
            this.meshMap.set(bone.id, boneGroup);
        });
    },

    buildPlaceholder(group, type) {
        const geo = new THREE.BoxGeometry(40, 40, 40);
        const mat = new THREE.MeshNormalMaterial({ wireframe: true });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.y = 50;
        group.add(mesh);
    },
    
    onWindowResize() {
        if (!this.camera || !this.renderer) return;
        const parent = this.renderer.domElement.parentElement;
        if(parent && parent.clientWidth > 0) {
            this.camera.aspect = parent.clientWidth / parent.clientHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(parent.clientWidth, parent.clientHeight);
        }
    }
};