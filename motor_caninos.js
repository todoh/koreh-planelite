/**
 * MOTOR CANINOS HÍBRIDO (2D + 3D)
 * - CanineEngine: Renderizado 2D para miniaturas/galería.
 * - Canine3D: Renderizado volumétrico para el visor.
 */
import * as THREE from 'three';
import { seededRandomRange } from './utils.js';

// ==========================================
// 1. MOTOR 2D (COMPATIBILIDAD GALERÍA)
// ==========================================
export const CanineEngine = {
    render: (ctx, width, height, time, seed, config) => {
        const { colorSkin, scale } = config;
        const cx = width / 2;
        const cy = height / 2 + 20;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(scale || 1, scale || 1);

        // Simple representación 2D para la miniatura
        const hue = seededRandomRange(colorSkin[0], colorSkin[1]);
        
        // Cuerpo
        ctx.fillStyle = `hsl(${hue}, 40%, 40%)`;
        ctx.beginPath();
        ctx.ellipse(0, 0, 30, 50, 0, 0, Math.PI*2);
        ctx.fill();
        
        // Cabeza
        ctx.translate(0, -50);
        ctx.beginPath();
        ctx.ellipse(0, 0, 20, 25, 0, 0, Math.PI*2);
        ctx.fill();
        
        // Orejas
        ctx.beginPath();
        ctx.moveTo(-15, -10); ctx.lineTo(-25, -30); ctx.lineTo(-5, -20);
        ctx.moveTo(15, -10); ctx.lineTo(25, -30); ctx.lineTo(5, -20);
        ctx.fill();
        
        // Hocico
        ctx.fillStyle = `hsl(${hue}, 40%, 60%)`;
        ctx.beginPath();
        ctx.ellipse(0, 5, 10, 8, 0, 0, Math.PI*2);
        ctx.fill();
        ctx.fillStyle = '#111';
        ctx.beginPath(); ctx.arc(0, 2, 4, 0, Math.PI*2); ctx.fill();

        ctx.restore();
    }
};

// ==========================================
// 2. MOTOR 3D (IMPLEMENTACIÓN REAL)
// ==========================================
export const Canine3D = {
    build: (group, config, seed) => {
        const { colorSkin, structure, id, species } = config;
        
        // --- MATERIALES ---
        const hue = seededRandomRange(colorSkin[0], colorSkin[1]);
        
        // Piel base
        const skinMat = new THREE.MeshStandardMaterial({ 
            color: `hsl(${hue}, 25%, 45%)`, 
            roughness: 0.9 
        });
        
        // Vientre/Detalles
        const bellyMat = new THREE.MeshStandardMaterial({ 
            color: `hsl(${hue}, 20%, 70%)`, 
            roughness: 0.9 
        });
        
        // Trufa
        const noseMat = new THREE.MeshStandardMaterial({ 
            color: 0x1a1a1a, 
            roughness: 0.3,
            metalness: 0.1
        });

        // Almohadillas
        const padMat = new THREE.MeshStandardMaterial({
            color: 0x221100,
            roughness: 1.0
        });

        // Referencia
        const torsoBone = structure.find(b => b.name === 'torso');
        const torsoWidth = torsoBone ? torsoBone.width : 30;

        const boneMap = new Map();

        structure.forEach(data => {
            const boneGroup = new THREE.Group();
            
            // --- 1. CÁLCULO DE OFFSET Z (ANTI-COLISIÓN) ---
            let zOffset = 0;
            const isLeft = data.name.includes('L');
            const isRight = data.name.includes('R');
            const isHind = data.name.includes('legB');

            if (isLeft || isRight) {
                let widthMod = torsoWidth * 0.35;
                if (isHind) widthMod *= 0.80; // Caderas más estrechas
                zOffset = isLeft ? widthMod : -widthMod;
            }
            
            if (['head', 'neck', 'tail', 'spine', 'torso', 'snout'].some(k => data.name.includes(k))) {
                zOffset = 0;
            }

            // --- 2. CONSTRUIR GEOMETRÍA ---
            let mesh;
            
            if (data.name === 'head') {
                mesh = buildCanineHead(data, skinMat, noseMat, id);
            }
            else if (data.name.includes('tail')) {
                mesh = buildBushyTail(data.len, skinMat, id);
            }
            else if (data.name.includes('torso')) {
                mesh = buildTorso(data, skinMat, bellyMat);
            }
            else if (data.name.includes('paw')) {
                mesh = buildCaninePaw(data.width || 8, skinMat, padMat);
                mesh.rotation.z = Math.PI / 2;
            }
            else if (data.name.includes('ear')) {
                mesh = buildEarBone(data, skinMat);
            }
            else {
                mesh = buildLimbSegment(data, skinMat);
            }

            // --- 3. POSICIONAMIENTO ---
            mesh.position.z = zOffset;
            mesh.castShadow = true;
            boneGroup.add(mesh);

            if (data.name.endsWith('_A')) {
                const joint = new THREE.Mesh(new THREE.SphereGeometry(data.width*0.55, 8, 8), skinMat);
                joint.position.z = zOffset;
                boneGroup.add(joint);
            }

            boneMap.set(data.name, boneGroup);
            group.add(boneGroup);
        });

        return boneMap;
    }
};

// ==========================================
// HELPERS 3D
// ==========================================

function buildCanineHead(data, skinMat, noseMat, id) {
    const headGroup = new THREE.Group();
    const s = data.width * 0.6; 
    
    const isPitbull = id && id.includes('pitbull');
    const isPoodle = id && id.includes('poodle');
    const isShepherd = id && (id.includes('shepherd') || id.includes('wolf') || id.includes('husky'));

    // 1. CRÁNEO
    const craniumGeo = new THREE.BoxGeometry(s * 1.8, s * 1.6, s * 1.5);
    const positions = craniumGeo.attributes.position;
    for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i);
        const y = positions.getY(i);
        const z = positions.getZ(i);
        positions.setXYZ(i, x * 0.9, y * 0.85, z * 0.8);
    }
    craniumGeo.computeVertexNormals();
    const cranium = new THREE.Mesh(craniumGeo, skinMat);
    headGroup.add(cranium);

    // 2. HOCICO
    let snoutLen = s * 1.2;
    let snoutW = s * 0.9;
    if (isPitbull) { snoutLen = s * 0.8; snoutW = s * 1.2; }
    if (isPoodle) { snoutLen = s * 1.4; snoutW = s * 0.6; }

    const snoutGeo = new THREE.BoxGeometry(snoutLen, snoutW * 0.8, snoutW);
    const snout = new THREE.Mesh(snoutGeo, skinMat);
    snout.position.set(s * 1.0, -s * 0.2, 0); 
    headGroup.add(snout);

    // 3. TRUFA
    const nose = new THREE.Mesh(new THREE.SphereGeometry(s * 0.25, 8, 8), noseMat);
    nose.position.set(s * 1.0 + snoutLen * 0.5, -s * 0.2 + snoutW * 0.1, 0);
    nose.scale.set(1, 0.8, 1.2); 
    headGroup.add(nose);

    // 4. OJOS
    const eyeSize = s * 0.22;
    const eyeColor = isShepherd ? 0xffcc00 : 0x8b4513;
    
    function createDogEye(size, color) {
        const g = new THREE.Group();
        const iris = new THREE.Mesh(new THREE.SphereGeometry(size, 12, 12), new THREE.MeshStandardMaterial({ color: color, roughness: 0.1 }));
        iris.scale.set(1, 1, 0.6);
        g.add(iris);
        const pupil = new THREE.Mesh(new THREE.SphereGeometry(size * 0.5, 8, 8), new THREE.MeshBasicMaterial({ color: 0x000000 }));
        pupil.position.z = size * 0.85;
        g.add(pupil);
        g.rotation.y = Math.PI / 2;
        return g;
    }

    const eyeL = createDogEye(eyeSize, eyeColor);
    eyeL.position.set(s * 0.6, s * 0.3, s * 0.5);
    eyeL.rotation.z = 0.1; 
    headGroup.add(eyeL);

    const eyeR = createDogEye(eyeSize, eyeColor);
    eyeR.position.set(s * 0.6, s * 0.3, -s * 0.5);
    eyeR.rotation.z = -0.1;
    headGroup.add(eyeR);

    // 5. BIGOTES
    const wGroup = new THREE.Group();
    const wMat = new THREE.LineBasicMaterial({ color: 0xcccccc, transparent: true, opacity: 0.5 });
    for(let side of [-1, 1]) {
        for(let i=0; i<3; i++) {
            const pts = [new THREE.Vector3(0,0,0), new THREE.Vector3(0, -s*0.2, side * s * 1.5)];
            const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), wMat);
            line.position.set(s + snoutLen*0.2, -s*0.2, side * snoutW*0.4);
            wGroup.add(line);
        }
    }
    headGroup.add(wGroup);

    headGroup.rotation.z = -Math.PI / 3.5;
    const finalGroup = new THREE.Group();
    finalGroup.add(headGroup);
    return finalGroup;
}

function buildCaninePaw(w, skinMat, padMat) {
    const g = new THREE.Group();
    const palm = new THREE.Mesh(new THREE.SphereGeometry(w * 0.65, 8, 8), skinMat);
    palm.scale.set(1.0, 0.7, 0.9);
    g.add(palm);

    const toeGeo = new THREE.CapsuleGeometry(w * 0.22, w * 0.3, 4, 8);
    const clawGeo = new THREE.ConeGeometry(w * 0.08, w * 0.4, 6);
    const clawMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.5 });

    const positions = [{ x: w*0.5, z: -w*0.3 }, { x: w*0.7, z: -w*0.1 }, { x: w*0.7, z: w*0.1 }, { x: w*0.5, z: w*0.3 }];

    positions.forEach(pos => {
        const toeGroup = new THREE.Group();
        toeGroup.position.set(pos.x, -w*0.1, pos.z);
        const toe = new THREE.Mesh(toeGeo, skinMat);
        toe.rotation.x = Math.PI / 2;
        toeGroup.add(toe);
        const claw = new THREE.Mesh(clawGeo, clawMat);
        claw.rotation.z = -Math.PI / 2;
        claw.position.set(w * 0.3, -w * 0.1, 0);
        toeGroup.add(claw);
        g.add(toeGroup);
    });
    return g;
}

function buildBushyTail(len, mat, id) {
    const isHusky = id && id.includes('husky');
    const points = [];
    if (isHusky) {
        for(let i=0; i<=12; i++) {
            const t = i/12;
            const angle = t * Math.PI * 1.5;
            const r = len * 0.4;
            points.push(new THREE.Vector3(Math.sin(angle)*r*0.5, Math.sin(angle)*r, Math.cos(angle)*r*0.2));
        }
    } else {
        for(let i=0; i<=8; i++) points.push(new THREE.Vector3(i*(len/8), -Math.pow(i, 1.5), 0));
    }
    return new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 8, 4, 8, false), mat);
}

function buildEarBone(data, mat) {
    const s = data.width || 6;
    const shape = new THREE.Shape();
    shape.moveTo(0,0); shape.lineTo(s, s*2); shape.lineTo(s*2, 0); shape.lineTo(0,0);
    const geo = new THREE.ExtrudeGeometry(shape, { depth: 2, bevelEnabled: false });
    geo.translate(-s, 0, 0);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.z = -Math.PI / 2; 
    return mesh;
}

function buildTorso(data, skinMat, bellyMat) {
    const r = data.width/2;
    const geo = new THREE.CapsuleGeometry(r, data.len - r*2, 8, 16);
    geo.translate(0, data.len/2, 0); geo.rotateZ(-Math.PI/2);
    const mesh = new THREE.Mesh(geo, skinMat);
    mesh.scale.set(1.0, 1.3, 0.9);
    const g = new THREE.Group();
    g.add(mesh);
    return g;
}

function buildLimbSegment(data, mat) {
    const r = (data.width + (data.widthEnd||data.width*0.7))/4;
    const geo = new THREE.CapsuleGeometry(r, data.len - r*2, 4, 8);
    geo.translate(0, data.len/2, 0); geo.rotateZ(-Math.PI/2);
    return new THREE.Mesh(geo, mat);
}