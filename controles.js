/**
 * CONTROLES DEL JUGADOR V18 - MOUSE & TOUCH UNIFICADOS
 * - Click Izquierdo / Un dedo: Joystick virtual de movimiento (Mover).
 * - Click Derecho / Dos dedos: Rotación de cámara.
 * - Rueda del ratón: Zoom.
 * - Teclado (WASD): Movimiento clásico.
 */
import * as THREE from 'three';
import { TerrainHeight } from './mapa_relieve.js';

export class PlayerController {
    constructor(playerGroup, skeleton, camera, domElement) {
        this.player = playerGroup;
        this.skeleton = skeleton;
        this.camera = camera;
        this.domElement = domElement;
        
        // --- CONFIGURACIÓN FÍSICA ---
        this.playerHeight = 16;     
        this.modelOffset = 0.5;

        // Movimiento
        this.speed = 5.0;
        this.runSpeed = 12.0;       
        this.rotateSpeed = 0.003;   
        this.touchRotateSpeed = 0.005; 
        
        // Gravedad y Saltos
        this.gravity = 4.0;         
        this.terminalVelocity = -100;
        this.maxStepHeight = 10.0;

        // --- SISTEMA RAYCASTER (SUELO) ---
        this.raycaster = new THREE.Raycaster();
        this.raycaster.far = 500;
        this.terrainMeshes = [];
        this.downVector = new THREE.Vector3(0, -1, 0);

        // --- ESTADO ---
        this.position = new THREE.Vector3(0, 150, 0); 
        this.velocity = new THREE.Vector3(0, 0, 0); 
        this.onGround = false;

        // --- CÁMARA ---
        this.zoomDistance = 100;
        this.minZoom = 20; 
        this.maxZoom = 250;
        this.currentCameraAngle = 0;
        this.cameraSmoothing = 0.15;

        // --- INPUTS ---
        this.keys = { w: false, a: false, s: false, d: false, shift: false, space: false };
        this._moveDir = new THREE.Vector3();
        
        // Estado Ratón
        this.mouseState = {
            leftDown: false,
            rightDown: false,
            x: 0,
            y: 0,
            prevX: 0
        };

        // Estado Táctil
        this.touchState = {
            active: false,
            moving: false, // Un dedo
            rotating: false, // Dos dedos
            touchX: 0,
            touchY: 0,
            prevTouchX: 0
        };
        
        this.initEvents();
    }

    initEvents() {
        // --- TECLADO ---
        window.addEventListener('keydown', (e) => this.onKey(e, true));
        window.addEventListener('keyup', (e) => this.onKey(e, false));
        
        // --- RATÓN ---
        this.domElement.addEventListener('mousedown', (e) => this.onMouseDown(e));
        window.addEventListener('mouseup', (e) => this.onMouseUp(e));
        window.addEventListener('mousemove', (e) => this.onMouseMove(e));
        
        this.domElement.addEventListener('wheel', (e) => {
            e.preventDefault();
            this.zoomDistance = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoomDistance + e.deltaY * 0.1));
        }, { passive: false });
        
        this.domElement.addEventListener('contextmenu', e => e.preventDefault());

        // --- TÁCTIL ---
        this.domElement.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: false });
        this.domElement.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: false });
        this.domElement.addEventListener('touchend', (e) => this.onTouchEnd(e), { passive: false });
    }

    // --- MANEJADORES DE RATÓN ---
    onMouseDown(e) {
        if (e.button === 0) { // Izquierdo (Mover)
            this.mouseState.leftDown = true;
            this.mouseState.x = e.clientX;
            this.mouseState.y = e.clientY;
        }
        if (e.button === 2) { // Derecho (Rotar)
            this.mouseState.rightDown = true;
            this.mouseState.prevX = e.clientX;
        }
    }

    onMouseMove(e) {
        if (this.mouseState.leftDown) {
            this.mouseState.x = e.clientX;
            this.mouseState.y = e.clientY;
        }
        if (this.mouseState.rightDown) {
            const delta = e.clientX - this.mouseState.prevX;
            this.currentCameraAngle -= delta * this.rotateSpeed;
            this.mouseState.prevX = e.clientX;
        }
    }

    onMouseUp(e) {
        if (e.button === 0) this.mouseState.leftDown = false;
        if (e.button === 2) this.mouseState.rightDown = false;
    }

    // --- MANEJADORES TÁCTILES ---
    onTouchStart(e) {
        e.preventDefault();
        this.touchState.active = true;

        if (e.touches.length === 1) {
            this.touchState.moving = true;
            this.touchState.rotating = false;
            this.touchState.touchX = e.touches[0].clientX;
            this.touchState.touchY = e.touches[0].clientY;
        } else if (e.touches.length === 2) {
            this.touchState.moving = false;
            this.touchState.rotating = true;
            this.touchState.prevTouchX = e.touches[0].clientX;
        }
    }

    onTouchMove(e) {
        e.preventDefault();
        if (this.touchState.moving && e.touches.length === 1) {
            this.touchState.touchX = e.touches[0].clientX;
            this.touchState.touchY = e.touches[0].clientY;
        } else if (this.touchState.rotating && e.touches.length === 2) {
            const currentX = e.touches[0].clientX;
            const delta = currentX - this.touchState.prevTouchX;
            this.currentCameraAngle -= delta * this.touchRotateSpeed;
            this.touchState.prevTouchX = currentX;
        }
    }

    onTouchEnd(e) {
        e.preventDefault();
        if (e.touches.length === 0) {
            this.touchState.active = false;
            this.touchState.moving = false;
            this.touchState.rotating = false;
        } else if (e.touches.length === 1) {
            this.touchState.moving = true;
            this.touchState.rotating = false;
            this.touchState.touchX = e.touches[0].clientX;
            this.touchState.touchY = e.touches[0].clientY;
        }
    }

    onKey(e, pressed) {
        switch(e.key.toLowerCase()) {
            case 'w': this.keys.w = pressed; break;
            case 's': this.keys.s = pressed; break;
            case 'a': this.keys.a = pressed; break;
            case 'd': this.keys.d = pressed; break;
            case 'shift': this.keys.shift = pressed; break;
            case ' ': if (pressed) this.jump(); break;
        }
    }

    jump() {
        if (this.onGround) {
            this.velocity.y = 45; 
            this.onGround = false;
            this.position.y += 1.0; 
        }
    }

    updateTerrainColliders(meshes) {
        this.terrainMeshes = meshes.filter(m => m && m.isMesh);
    }

    getGroundHeight(x, z) {
        if (this.terrainMeshes.length > 0) {
            const rayOrigin = new THREE.Vector3(x, this.position.y + 100, z);
            this.raycaster.set(rayOrigin, this.downVector);
            const intersects = this.raycaster.intersectObjects(this.terrainMeshes, false);
            if (intersects.length > 0) return intersects[0].point.y;
        }
        return TerrainHeight.get(x, z);
    }

    update(time) {
        // Vectores de dirección
        const forward = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.currentCameraAngle);
        const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.currentCameraAngle);
        
        this._moveDir.set(0, 0, 0);

        // 1. INPUT DE TECLADO
        if (this.keys.w) this._moveDir.sub(forward); 
        if (this.keys.s) this._moveDir.add(forward);
        if (this.keys.a) this._moveDir.sub(right);
        if (this.keys.d) this._moveDir.add(right);

        // 2. INPUT DE PUNTERO (MOUSE O TÁCTIL)
        let ptrX = 0, ptrY = 0;
        let hasPointerInput = false;

        if (this.touchState.moving) {
            ptrX = this.touchState.touchX;
            ptrY = this.touchState.touchY;
            hasPointerInput = true;
        } else if (this.mouseState.leftDown) {
            ptrX = this.mouseState.x;
            ptrY = this.mouseState.y;
            hasPointerInput = true;
        }

        if (hasPointerInput) {
            const cx = window.innerWidth / 2;
            const cy = window.innerHeight / 2;
            
            // Vector desde el centro a la posición del puntero
            const dx = (ptrX - cx) / cx; 
            const dy = (ptrY - cy) / cy; 
            
            // Zona muerta
            if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
                // dy negativo (arriba) = avanzar (forward negativo)
                // dx positivo (derecha) = derecha (right positivo)
                this._moveDir.add(forward.clone().multiplyScalar(dy));
                this._moveDir.add(right.clone().multiplyScalar(dx));
            }
        }

        const isMoving = this._moveDir.lengthSq() > 0.1;
        const currentSpeed = (this.keys.shift || hasPointerInput) ? this.runSpeed : this.speed;

        if (isMoving) {
            this._moveDir.normalize();
            
            const nextX = this.position.x + this._moveDir.x * currentSpeed;
            const nextZ = this.position.z + this._moveDir.z * currentSpeed;
            
            const currentH = this.getGroundHeight(this.position.x, this.position.z);
            const nextH = this.getGroundHeight(nextX, nextZ);
            
            if ((nextH - currentH) < this.maxStepHeight) {
                this.position.x = nextX;
                this.position.z = nextZ;
                this.smoothRotate(Math.atan2(this._moveDir.x, this._moveDir.z));
            } else {
                const hX = this.getGroundHeight(nextX, this.position.z);
                if ((hX - currentH) < this.maxStepHeight) this.position.x = nextX;
                else {
                    const hZ = this.getGroundHeight(this.position.x, nextZ);
                    if ((hZ - currentH) < this.maxStepHeight) this.position.z = nextZ;
                }
            }
        }

        // --- FÍSICA VERTICAL ---
        const groundH = this.getGroundHeight(this.position.x, this.position.z);
        
        this.velocity.y -= this.gravity;
        if (this.velocity.y < this.terminalVelocity) this.velocity.y = this.terminalVelocity;
        
        let nextY = this.position.y + this.velocity.y;

        if (nextY <= groundH) {
            this.position.y = groundH;
            this.velocity.y = 0;
            this.onGround = true;
        } else if (this.onGround && (nextY - groundH) < this.maxStepHeight * 2 && this.velocity.y <= 0) {
            this.position.y = groundH;
            this.velocity.y = 0;
        } else {
            this.position.y = nextY;
            this.onGround = false;
        }

        if (this.position.y < -300) {
            this.position.set(0, 200, 0);
            this.velocity.set(0, 0, 0);
        }

        this.player.position.copy(this.position);
        this.player.position.y += this.modelOffset; 

        this.updateCamera();

        if (this.skeleton) {
            const animTimeScale = isMoving ? (this.keys.shift ? 0.08 : 0.04) : 0.02;
            this.skeleton.update(0, 0, time * 0.1, animTimeScale, isMoving);
        }
    }

    updateCamera() {
        const angleRad = this.currentCameraAngle;
        const offsetX = Math.sin(angleRad) * this.zoomDistance;
        const offsetZ = Math.cos(angleRad) * this.zoomDistance;
        const offsetY = this.zoomDistance * 1.0; // Vista elevada

        const lookTarget = new THREE.Vector3(
            this.player.position.x, 
            this.player.position.y + this.playerHeight, 
            this.player.position.z
        );

        const desiredPos = new THREE.Vector3(
            this.player.position.x + offsetX,
            this.player.position.y + offsetY + this.playerHeight,
            this.player.position.z + offsetZ
        );

        this.camera.position.lerp(desiredPos, this.cameraSmoothing);
        this.camera.lookAt(lookTarget);
    }

    smoothRotate(targetRotation) {
        let rotDiff = targetRotation - this.player.rotation.y;
        while (rotDiff > Math.PI) rotDiff -= Math.PI * 2;
        while (rotDiff < -Math.PI) rotDiff += Math.PI * 2;
        this.player.rotation.y += rotDiff * 0.2;
    }
}