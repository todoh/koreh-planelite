/**
 * MOTOR HUMANOS 3D (F -> Forma Antropomórfica / Z -> Profundidad Vital)
 * Renderiza humanos procedurales interpretando la estructura ósea en volúmenes 3D.
 */
import * as THREE from 'three';
import { seededRandomRange } from './utils.js';

export const Human3D = {
    build: (group, config, seed) => {
        const { structure, customSkinBase, customSkinDetail, genderVal, ageVal, hairConfig, mass } = config;
        
        const skinMat = new THREE.MeshStandardMaterial({ 
            color: customSkinBase || 0xffccaa, 
            roughness: 0.8, metalness: 0.1
        });
        const clothingColor = genderVal > 0.5 ? 0x8844aa : 0x4466aa;
        const clothMat = new THREE.MeshStandardMaterial({ color: clothingColor, roughness: 1.0 });

        const boneMap = new Map();

        structure.forEach(data => {
            const boneGroup = new THREE.Group();
            let zOffset = 0;

            const widthStart = data.width || 5;
            const widthEnd = data.widthEnd || (widthStart * 0.7);
            const len = data.len || 10;
            const boneData = { ...data, widthStart, widthEnd, len };

            let mesh;
            // Selectores de partes del cuerpo
            if (data.type === 'human_head') mesh = buildHumanHead(boneData, config, skinMat, seed);
            else if (data.name === 'chest_top' || data.name === 'pelvis' || data.name === 'spine') mesh = buildHumanTorso(boneData, config, skinMat, clothMat);
            else if (data.type === 'clavicle') mesh = buildClavicle(boneData, skinMat); // Nueva clavícula visible
            
            // Lógica de Manos y Pies Detallados
            else if (data.name.includes('hand')) mesh = buildHandDetailed(boneData, skinMat);
            else if (data.name.includes('foot')) mesh = buildFootDetailed(boneData, skinMat);

            else if (data.type !== 'invisible') mesh = buildHumanLimb(boneData, skinMat);

            if (mesh) {
                if (data.name.includes('L')) zOffset = 0.5;
                if (data.name.includes('R')) zOffset = -0.5;
                mesh.position.z = zOffset;
                mesh.castShadow = true; mesh.receiveShadow = true;
                boneGroup.add(mesh);

                // Articulaciones (Spheres) - Evitamos ponerlas en cabeza, torso o clavículas
                if (!data.name.includes('head') && !data.name.includes('torso') && !data.name.includes('pelvis') && !data.name.includes('spine') && !data.type.includes('clavicle')) {
                    const joint = new THREE.Mesh(new THREE.SphereGeometry(widthStart * 0.45, 8, 8), skinMat);
                    joint.position.z = zOffset; 
                    boneGroup.add(joint);
                }
            }
            group.add(boneGroup);
            boneMap.set(data.name, boneGroup);
        });
        return boneMap;
    }
};

// --- CONSTRUCTORES DE PARTES ---

function buildHumanHead(data, config, material, seed) {
    const group = new THREE.Group();
    const s = data.widthStart; 
    const age = config.ageVal || 0.3;
    const gender = config.genderVal || 0.5;

    const jawWidth = 1.0 - (gender * 0.3) + (age * 0.2); 
    const craniumGeo = new THREE.BoxGeometry(s * 0.9, s * 1.1, s * 1.0, 2, 2, 2);
    
    const pos = craniumGeo.attributes.position;
    const vec = new THREE.Vector3();
    for(let i=0; i < pos.count; i++){
        vec.fromBufferAttribute(pos, i);
        if (vec.y < 0) { vec.x *= jawWidth; vec.z *= 0.8; }
        vec.normalize().multiplyScalar(s * 0.55).add(new THREE.Vector3(0, vec.y*0.2, 0));
        pos.setXYZ(i, vec.x, vec.y, vec.z);
    }
    craniumGeo.computeVertexNormals();
    const headMesh = new THREE.Mesh(craniumGeo, material);
    
    headMesh.rotation.z = -Math.PI / 2; 
    headMesh.rotation.y = 0; 

    group.add(headMesh);

    // Pelo
    if (config.hairConfig && config.hairConfig.style > 0) {
        const hConf = config.hairConfig;
        const hairColor = new THREE.Color().setHSL(0.1 + hConf.colorVal * 0.1, 0.6, 0.1 + hConf.colorVal * 0.4);
        const hairMat = new THREE.MeshStandardMaterial({ color: hairColor, roughness: 1.0 });
        const hairGroup = new THREE.Group();
        
        const scalp = new THREE.Mesh(new THREE.SphereGeometry(s * 0.56, 12, 8), hairMat);
        scalp.position.y = s * 0.1;
        scalp.position.z = -s * 0.05; 
        
        hairGroup.rotation.z = -Math.PI / 2; 
        hairGroup.add(scalp);

        if (hConf.style >= 3) { 
            const backHair = new THREE.Mesh(new THREE.BoxGeometry(s, hConf.length, s*0.4), hairMat);
            backHair.position.set(0, -hConf.length/2, -s*0.45); 
            hairGroup.add(backHair);
        } else if (hConf.style === 2) { 
            const bang = new THREE.Mesh(new THREE.BoxGeometry(s*0.9, s*0.4, s*0.2), hairMat);
            bang.position.set(0, s*0.3, s*0.45); 
            bang.rotation.x = -0.2;
            hairGroup.add(bang);
        }
        group.add(hairGroup);
    }

    // Ojos
    const eyeSize = s * 0.12;
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const pupilMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    
    const eyesContainer = new THREE.Group();
    eyesContainer.rotation.z = -Math.PI / 2; 

    for(let dir of [-1, 1]) {
        const eyeG = new THREE.Group();
        eyeG.position.set(dir * s * 0.22, 0, s * 0.45); 
        const white = new THREE.Mesh(new THREE.SphereGeometry(eyeSize, 8, 8), eyeMat);
        white.scale.set(1, 0.7, 0.3); eyeG.add(white);
        const pupil = new THREE.Mesh(new THREE.SphereGeometry(eyeSize * 0.4, 8, 8), pupilMat);
        pupil.position.z = eyeSize * 0.35; eyeG.add(pupil);
        eyesContainer.add(eyeG);
    }
    group.add(eyesContainer);
    
    // Nariz
    const nose = new THREE.Mesh(new THREE.BoxGeometry(s*0.12, s*0.25, s*0.15), material);
    nose.position.set(0, -s*0.15, s*0.55); 
    const noseGroup = new THREE.Group();
    noseGroup.add(nose);
    noseGroup.rotation.z = -Math.PI / 2;
    group.add(noseGroup);
    
    return group;
}

function buildHumanTorso(data, config, skinMat, clothMat) {
    const wStart = data.widthStart;
    const wEnd = data.widthEnd;
    const h = data.len;
    const gender = config.genderVal || 0.5;
    const isChest = data.name === 'chest_top';
    const isPelvis = data.name === 'pelvis';
    
    // Usamos radios diferentes para crear conicidad (V-taper o cintura)
    // El cilindro de ThreeJS toma: radiusTop, radiusBottom, height
    // Como rotamos el cilindro -90 grados, Top es el final del hueso, Bottom es el inicio.
    
    let radTop = wEnd * 0.5;
    let radBot = wStart * 0.5;

    // Ajuste de geometría según parte
    const geo = new THREE.CylinderGeometry(radTop, radBot, h, 12);
    geo.translate(0, h/2, 0); 
    geo.rotateZ(-Math.PI/2); 
    geo.scale(1, 0.7, 1); // Aplana el torso (más ancho que profundo)
    
    let mat = skinMat; 
    if (isPelvis) mat = clothMat;
    
    const mesh = new THREE.Mesh(geo, mat);
    const group = new THREE.Group();
    group.add(mesh);

    // PECHO (SENOS)
    if (isChest && gender > 0.5 && (config.ageVal || 0) > 0.25) {
        const chestSize = wEnd * 0.35 * gender; // Basado en el ancho superior del pecho
        const breastGeo = new THREE.SphereGeometry(chestSize, 12, 12);
        breastGeo.scale(1, 0.8, 0.8);
        for(let dir of [-1, 1]) {
            const breast = new THREE.Mesh(breastGeo, (config.ageVal||0) > 0.1 ? clothMat : skinMat); 
            // Posicionamos en base a la longitud del pecho (h)
            breast.position.set(h * 0.7, dir * wEnd * 0.25, wEnd * 0.25); 
            group.add(breast);
        }
    }
    return group;
}

function buildClavicle(data, mat) {
    // La clavícula es un hueso fino que conecta
    const w = data.widthStart;
    const l = data.len;
    // Creamos un hueso visualmente más definido
    const geo = new THREE.BoxGeometry(l, w * 0.6, w * 0.6);
    geo.translate(l/2, 0, 0); // Pivote en el extremo
    
    // Pequeña rotación o forma orgánica si se desea, por ahora recta
    return new THREE.Mesh(geo, mat);
}

function buildHumanLimb(data, mat) {
    const r = data.widthStart * 0.45;
    const geo = new THREE.CapsuleGeometry(r, data.len - r*2, 4, 8);
    geo.translate(0, data.len/2, 0); geo.rotateZ(-Math.PI/2);
    return new THREE.Mesh(geo, mat);
}

function buildHandDetailed(data, mat) {
    const g = new THREE.Group();
    const w = data.widthStart;
    const l = data.len; 
    const isLeft = data.name.includes('L');

    // Palma
    const palmGeo = new THREE.BoxGeometry(l * 0.6, w * 0.8, w * 0.3);
    palmGeo.translate(l * 0.3, 0, 0); 
    const palm = new THREE.Mesh(palmGeo, mat);
    g.add(palm);

    const thumbZDir = isLeft ? -1 : 1; 
    const thumbRotDir = isLeft ? -1 : 1;

    // Pulgar
    const thumbLen = l * 0.35;
    const thumbWidth = w * 0.25;
    const thumbGroup = new THREE.Group();
    
    thumbGroup.position.set(l * 0.2, 0, w * 0.2 * thumbZDir); 
    thumbGroup.rotation.y = (Math.PI / 4) * thumbRotDir;
    thumbGroup.rotation.z = -Math.PI / 6;

    const thumbMesh = new THREE.Mesh(new THREE.CylinderGeometry(thumbWidth, thumbWidth*0.8, thumbLen, 6), mat);
    thumbMesh.position.x = thumbLen / 2; 
    thumbMesh.rotation.z = -Math.PI / 2;
    thumbGroup.add(thumbMesh);
    g.add(thumbGroup);

    // Dedos
    const fingerLenBase = l * 0.5;
    const fingerWidth = w * 0.2;
    
    for (let i = 0; i < 4; i++) {
        const fGroup = new THREE.Group();
        const zOffset = (i - 1.5) * (fingerWidth * 1.3);
        fGroup.position.set(l * 0.6, 0, zOffset);
        
        const fLen = fingerLenBase * (i === 1 || i === 2 ? 1.0 : 0.85);
        const fingerMesh = new THREE.Mesh(new THREE.CapsuleGeometry(fingerWidth*0.5, fLen, 4, 8), mat);
        
        fingerMesh.rotation.z = -Math.PI / 2;
        fingerMesh.position.x = fLen / 2;
        
        fGroup.add(fingerMesh);
        g.add(fGroup);
    }
    
    return g;
}

function buildFootDetailed(data, mat) {
    const g = new THREE.Group();
    const w = data.widthStart;
    const l = data.len; 
    const footSize = w * 2.5; 
    const isLeft = data.name.includes('L');

    // Empeine
    const footHeight = w * 0.5;
    const footGeo = new THREE.BoxGeometry(w * 0.9, footHeight, footSize * 0.7); 
    footGeo.translate(0, -footHeight * 0.5, footSize * 0.3); 
    const foot = new THREE.Mesh(footGeo, mat);
    g.add(foot);

    // DEDOS DEL PIE
    const toeLen = footSize * 0.25;
    const toeWidth = w * 0.18;
    
    const toesGroup = new THREE.Group();
    toesGroup.position.z = footSize * 0.65; 
    toesGroup.position.y = -footHeight * 0.5;

    const mirrorFactor = isLeft ? -1 : 1; 

    for (let i = 0; i < 5; i++) {
        const xOffset = (2 - i) * (toeWidth * 1.1) * mirrorFactor; 
        
        const tLen = toeLen * (i === 0 ? 1.2 : (1.0 - i * 0.1)); // Dedo gordo más largo
        const toeMesh = new THREE.Mesh(new THREE.CapsuleGeometry(toeWidth * 0.5, tLen, 4, 8), mat);
        
        toeMesh.rotation.x = Math.PI / 2;
        toeMesh.position.set(xOffset, 0, tLen * 0.5);

        toesGroup.add(toeMesh);
    }
    g.add(toesGroup);

    return g;
}