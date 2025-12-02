/**
 * MOTOR FELINOS V2.2 (F -> Forma Tridimensional / Z -> Profundidad)
 * - Paws: Geometría orgánica (almohadillas y dedos).
 * - Head: Añadidos bigotes (Whiskers).
 * - Physics: Offset Z dinámico para evitar colisión de patas.
 */
import * as THREE from 'three';
import { seededRandomRange } from './utils.js';

// ==========================================
// 1. MOTOR 2D (Sin Cambios)
// ==========================================
export const FelineEngine = {
    render: (ctx, width, height, time, seed, config) => {
        // ... (Lógica 2D intacta si se requiere)
    },
};

// ==========================================
// 2. MOTOR 3D OPTIMIZADO
// ==========================================
export const Feline3D = {
    build: (group, config, seed) => {
        const { colorSkin, structure, id, species } = config;
        const speciesType = getSpeciesType(species || id || 'cat');
        
        // Materiales
        const hue = seededRandomRange(colorSkin[0], colorSkin[1]);
        const sat = speciesType === 'panther' ? 20 : 60;
        const lit = speciesType === 'panther' ? 20 : 50;
        
        const skinMat = new THREE.MeshStandardMaterial({ color: `hsl(${hue}, ${sat}%, ${lit}%)`, roughness: 0.8 });
        const bellyMat = new THREE.MeshStandardMaterial({ color: `hsl(${hue}, ${sat-10}%, ${lit+20}%)`, roughness: 0.9 });
        const noseMat = new THREE.MeshStandardMaterial({ color: speciesType === 'panther' ? 0x222222 : 0xffaaaa, roughness: 0.4 });
        
        // Material para garras/almohadillas (ligeramente más oscuro)
        const pawMat = new THREE.MeshStandardMaterial({ color: `hsl(${hue}, ${sat}%, ${lit-15}%)`, roughness: 1.0 });

        // Encontrar ancho de referencia para el esqueleto
        const torsoBone = structure.find(b => b.name === 'torso');
        const torsoWidth = torsoBone ? torsoBone.width : 30;

        const boneMap = new Map();

        structure.forEach(data => {
            const boneGroup = new THREE.Group();
            
            // --- 1. CÁLCULO DE OFFSET Z (CORRECCIÓN DE COLISIONES) ---
            let zOffset = 0;
            const isLeft = data.name.includes('L');
            const isRight = data.name.includes('R');
            const isHind = data.name.includes('legB'); // Patas traseras (Back)

            if (isLeft || isRight) {
                // Base offset
                let widthMod = torsoWidth * 0.4;
                
                // AJUSTE ANATÓMICO: Caderas más estrechas que hombros (o viceversa)
                // Hacemos que las patas traseras (Hind) estén un 15% más adentro (estrechas)
                // para que al caminar pasen "por dentro" de la línea de las delanteras.
                if (isHind) widthMod *= 0.85;

                zOffset = isLeft ? widthMod : -widthMod;
            }
            
            // Huesos centrales forzados a 0
            if (['head', 'neck', 'tail', 'spine', 'torso', 'mane'].some(k => data.name.includes(k))) {
                zOffset = 0;
            }

            // --- 2. CONSTRUIR MESH ---
            let mesh;
            if (data.name === 'head') mesh = buildDetailedHead(data, skinMat, noseMat, speciesType);
            else if (data.name.includes('tail')) mesh = buildSinuousTail(data.len, skinMat);
            else if (data.name.includes('torso')) mesh = buildTorso(data, skinMat, bellyMat);
            else if (data.name.includes('leg') || data.name.includes('arm')) mesh = buildLimbSegment(data, skinMat);
            else if (data.name.includes('paw')) {
                // Usamos el nuevo material de patas y la nueva función
                mesh = buildPaw(data.width || 8, skinMat, pawMat, speciesType); 
                // Ajuste de rotación para que la pata apoye plana
                mesh.rotation.z = Math.PI / 2; 
            }
            else if (data.name === 'mane') {
                // Soporte específico para melena si viene como hueso separado
                const s = data.width || 40;
                const maneGeo = new THREE.TorusGeometry(s * 0.6, s * 0.3, 8, 16);
                mesh = new THREE.Mesh(maneGeo, new THREE.MeshStandardMaterial({ color: 0x553311, roughness: 1.0 }));
                mesh.rotation.y = Math.PI / 2;
            }
            else mesh = buildGenericBone(data, skinMat);

            // --- 3. POSICIONAMIENTO ---
            mesh.position.z = zOffset;
            mesh.castShadow = true;
            boneGroup.add(mesh);

            // 4. ARTICULACIONES VISUALES
            if (data.name.endsWith('_A')) {
                const joint = new THREE.Mesh(new THREE.SphereGeometry(data.width*0.6, 8, 8), skinMat);
                joint.position.z = zOffset;
                boneGroup.add(joint);
            }

            boneMap.set(data.name, boneGroup);
            group.add(boneGroup);
        });

        return boneMap;
    }
};

// --- HELPERS ---

function getSpeciesType(val) {
    if (!val || typeof val !== 'string') return 'cat';
    if (val.includes('tiger')) return 'tiger';
    if (val.includes('lion')) return 'lion';
    if (val.includes('panther')) return 'panther';
    return 'cat'; 
}
 
function buildDetailedHead(data, skinMat, noseMat, type) {
    const headMeshContainer = new THREE.Group();

    // --- HELPER OJO ---
    function createCatEye(size, colorHex, speciesType) {
        const eyeGroup = new THREE.Group();
        const irisMat = new THREE.MeshStandardMaterial({
            color: colorHex, roughness: 0.1, metalness: 0.0,
            emissive: colorHex, emissiveIntensity: 0.2
        });
        const ballGeo = new THREE.SphereGeometry(size, 16, 12);
        ballGeo.scale(1.0, 1.0, 0.8);
        eyeGroup.add(new THREE.Mesh(ballGeo, irisMat));

        const pupilMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
        let pupilGeo;
        if (speciesType === 'cat' || speciesType === 'panther') {
            pupilGeo = new THREE.SphereGeometry(size * 0.5, 8, 8);
            pupilGeo.scale(0.25, 1.1, 0.1); 
        } else {
            pupilGeo = new THREE.SphereGeometry(size * 0.4, 8, 8);
            pupilGeo.scale(1, 1, 0.1);
        }
        const pupil = new THREE.Mesh(pupilGeo, pupilMat);
        pupil.position.z = size * 0.82;
        eyeGroup.add(pupil);
        eyeGroup.rotation.y = Math.PI / 2;
        return eyeGroup;
    }

    // --- HELPER BIGOTES (NUEVO) ---
    function createWhiskers(width) {
        const whiskersGroup = new THREE.Group();
        // Material muy fino, blanco semitransparente
        const wMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 });
        
        // 3 bigotes por lado
        for(let side of [-1, 1]) {
            for(let i=0; i<3; i++) {
                const points = [];
                points.push(new THREE.Vector3(0, 0, 0)); // Origen en hocico
                // Salen hacia los lados (Z) y un poco abajo/atrás
                const len = width * 1.5;
                const spreadY = (i - 1) * 0.2; // Variación altura
                const spreadX = (i - 1) * 0.1; // Variación ángulo
                
                points.push(new THREE.Vector3(
                    len * 0.2, // Poco avance en X
                    len * spreadY, 
                    side * len // Mucho avance en Z (lado)
                ));
                
                const geo = new THREE.BufferGeometry().setFromPoints(points);
                const line = new THREE.Line(geo, wMat);
                // Posicionar en el lateral del hocico
                line.position.set(width * 0.8, -width * 0.1, side * width * 0.35);
                whiskersGroup.add(line);
            }
        }
        return whiskersGroup;
    }

    const s = data.width * 0.6; 
    
    // A. Cráneo
    const cranium = new THREE.Mesh(new THREE.SphereGeometry(s, 16, 16), skinMat);
    cranium.scale.set(1.15, 0.9, 1.0); 
    headMeshContainer.add(cranium);

    // B. Hocico
    const snoutGeo = new THREE.BoxGeometry(s * 0.9, s * 0.65, s * 0.85);
    const snout = new THREE.Mesh(snoutGeo, skinMat);
    snout.position.set(s * 1.0, -s * 0.15, 0); 
    headMeshContainer.add(snout);

    // C. Nariz
    const nose = new THREE.Mesh(new THREE.SphereGeometry(s * 0.2, 8, 8), noseMat);
    nose.position.set(s * 1.45, -s * 0.15, 0);
    nose.scale.set(1, 0.6, 1.5);
    headMeshContainer.add(nose);

    // D. Orejas
    const earShape = new THREE.Shape();
    earShape.moveTo(0, 0); earShape.lineTo(s * 0.4, s * 1.0); earShape.lineTo(s * 0.8, 0); 
    const earGeo = new THREE.ExtrudeGeometry(earShape, { depth: s * 0.15, bevelEnabled: false });
    earGeo.translate(-s * 0.4, 0, 0); 
    const earL = new THREE.Mesh(earGeo, skinMat);
    earL.position.set(-s * 0.3, s * 0.6, s * 0.5); 
    earL.rotation.set(0, Math.PI / 2 - 0.3, -0.2);
    headMeshContainer.add(earL);
    const earR = new THREE.Mesh(earGeo, skinMat);
    earR.position.set(-s * 0.3, s * 0.6, -s * 0.5); 
    earR.rotation.set(0, -Math.PI / 2 + 0.3, 0.2);
    headMeshContainer.add(earR);

    // E. Ojos
    const irisColor = type === 'panther' ? 0xffd700 : 0xaadd33;
    const eyeSize = s * 0.25;
    const catEyeL = createCatEye(eyeSize, irisColor, type);
    catEyeL.position.set(s * 0.8, s * 0.25, s * 0.5);
    catEyeL.rotation.z = 0.1; 
    headMeshContainer.add(catEyeL);
    const catEyeR = createCatEye(eyeSize, irisColor, type);
    catEyeR.position.set(s * 0.8, s * 0.25, -s * 0.5);
    catEyeR.rotation.z = -0.1;
    headMeshContainer.add(catEyeR);

    // F. Melena (Leones)
    if (type === 'lion') {
        const maneGeo = new THREE.TorusGeometry(s * 1.5, s * 0.6, 8, 20);
        const maneMat = new THREE.MeshStandardMaterial({ color: 0x553311, roughness: 1.0 });
        const mane = new THREE.Mesh(maneGeo, maneMat);
        mane.rotation.y = Math.PI / 2;
        mane.position.x = -s * 0.6;
        headMeshContainer.add(mane);
    }

    // G. BIGOTES (Whiskers)
    const whiskers = createWhiskers(s);
    headMeshContainer.add(whiskers);

    headMeshContainer.rotation.z = -Math.PI / 3.5; 
    const headGroup = new THREE.Group();
    headGroup.add(headMeshContainer);
    return headGroup;
}

function buildTorso(data, skinMat, bellyMat) {
    const g = new THREE.Group();
    const r = data.width/2;
    const geo = new THREE.CapsuleGeometry(r, data.len - r*2, 8, 16);
    geo.translate(0, data.len/2, 0); geo.rotateZ(-Math.PI/2);
    g.add(new THREE.Mesh(geo, skinMat));
    return g;
}

function buildLimbSegment(data, mat) {
    const r = (data.width + (data.widthEnd||data.width*0.7))/4;
    const geo = new THREE.CapsuleGeometry(r, data.len - r*2, 4, 8);
    geo.translate(0, data.len/2, 0); geo.rotateZ(-Math.PI/2);
    return new THREE.Mesh(geo, mat);
}

function buildGenericBone(data, mat) {
    const geo = new THREE.CylinderGeometry((data.widthEnd||data.width)/2, data.width/2, data.len, 6);
    geo.translate(0, data.len/2, 0); geo.rotateZ(-Math.PI/2);
    return new THREE.Mesh(geo, mat);
}

function buildSinuousTail(len, mat) {
    const pts = [];
    for(let i=0; i<=10; i++) pts.push(new THREE.Vector3(i*(len/10), Math.sin(i*0.5)*5, 0));
    return new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 10, 2, 8, false), mat);
}

// --- FUNCIÓN REESCRITA PARA PATAS ORGÁNICAS ---
function buildPaw(w, mainMat, padMat, type) {
    const g = new THREE.Group();
    
    // 1. Palma Principal (Redondeada, no cubo)
    // Usamos una esfera aplastada o cápsula corta
    const palmGeo = new THREE.SphereGeometry(w * 0.6, 8, 8);
    palmGeo.scale(1.2, 0.6, 1.0); // Ancha, plana y profunda
    const palm = new THREE.Mesh(palmGeo, mainMat);
    palm.castShadow = true;
    g.add(palm);

    // 2. Dedos (4 dedos principales)
    const toeGeo = new THREE.SphereGeometry(w * 0.25, 8, 6);
    // Ligeramente alargados
    toeGeo.scale(1.0, 0.8, 1.2); 
    
    // Posicionamiento en arco
    const toeOffsets = [
        { x: w*0.5, z: -w*0.35 }, // Exterior der
        { x: w*0.6, z: -w*0.12 }, // Medio der
        { x: w*0.6, z: w*0.12 },  // Medio izq
        { x: w*0.5, z: w*0.35 }   // Exterior izq
    ];

    toeOffsets.forEach(pos => {
        const toe = new THREE.Mesh(toeGeo, padMat); // Usamos material de almohadilla/garra
        toe.position.set(pos.x, -w*0.1, pos.z);
        g.add(toe);
    });

    return g;
}