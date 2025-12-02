/**
 * DEFINICIONES HUMANAS AVANZADAS (N -> Número y X -> Variable Evolutiva)
 * Gestiona Ciclo Vital (Edad) y Dimorfismo Sexual (Género)
 */

export const HumanParams = {
    // FACTORES BIOLÓGICOS BASE
    age: { min: 0.0, max: 1.0, val: 0.3, label: "Edad Biológica" }, // 0=Niño, 0.2=Adolescente, 0.5=Adulto, 0.8=Maduro, 1.0=Anciano
    gender: { min: 0.0, max: 1.0, val: 0.5, label: "Género (M-F)" }, // 0=Masculino, 1=Femenino
    
    // FACTORES FÍSICOS
    height: { min: 140, max: 210, val: 175, label: "Altura Base" },
    mass: { min: 0.8, max: 1.6, val: 1.0, label: "Masa Corporal" },
    muscle: { min: 0.8, max: 1.5, val: 1.0, label: "Musculatura" },
    
    // APARIENCIA
    skinMelanin: { min: 0.0, max: 1.0, val: 0.2, label: "Piel: Melanina" },
    skinTone: { min: 0.0, max: 1.0, val: 0.5, label: "Piel: Tono" },
    hairStyle: { min: 0, max: 5, val: 1, label: "Estilo Pelo" }, 
    hairLength: { min: 0.1, max: 2.0, val: 0.5, label: "Largo Pelo" },
    hairColor: { min: 0.0, max: 1.0, val: 0.3, label: "Color Pelo" },
};

// --- LÓGICA DE EVOLUCIÓN ---

const getLifeStageFactors = (age) => {
    if (age < 0.2) { 
        // NIÑEZ (0 - 12 años)
        const t = age / 0.2;
        return { 
            headRatio: 5 + t, 
            heightMod: 0.6 + (t * 0.3), 
            posture: 0, 
            fatDist: 1.2, 
            muscleDef: 0.5
        }; 
    } else if (age < 0.35) {
        // ADOLESCENCIA (13 - 19 años)
        const t = (age - 0.2) / 0.15;
        return { 
            headRatio: 6.5 + t * 0.5, 
            heightMod: 0.9 + (t * 0.1), 
            posture: -2, 
            fatDist: 0.9, 
            muscleDef: 0.9
        };
    } else if (age < 0.75) {
        // ADULTEZ (20 - 60 años)
        return { 
            headRatio: 7.5, 
            heightMod: 1.0, 
            posture: 0, 
            fatDist: 1.0, 
            muscleDef: 1.0 
        };
    } else {
        // VEJEZ (60+ años)
        const t = (age - 0.75) / 0.25;
        return { 
            headRatio: 7.5, 
            heightMod: 1.0 - (t * 0.05),
            posture: 15 * t, 
            fatDist: 1.1, 
            muscleDef: 0.8 - (t * 0.3)
        };
    }
};

const getGenderFactors = (gender) => {
    // Ajustamos factores para permitir cinturas más definidas y cuellos más finos
    return {
        shoulderWidth: 1.0 - (gender * 0.25), // Hombres hombros más anchos
        hipWidth: 0.8 + (gender * 0.6),       // Mujeres caderas más anchas
        waistFactor: 0.9 - (gender * 0.15),   // Cintura más estrecha en mujeres
        chestCurve: gender,                  
        jawWidth: 1.0 - (gender * 0.4),      
        neckWidth: 1.0 - (gender * 0.4)       // Mujeres cuello más fino
    };
};

const getRealisticSkinColor = (melanin, tone, age) => {
    const ageDesat = Math.max(0, (age - 0.6) * 20); 
    const hue = 20 + tone * 15;
    const sat = Math.max(10, (35 + melanin * 20) - ageDesat);
    const light = 85 - melanin * 65 - (age > 0.8 ? 10 : 0);
    return [`hsl(${hue}, ${sat}%, ${light}%)`, `hsl(${hue}, ${sat}%, ${light-10}%)`];
};

export const generateHumanStructure = (params) => {
    // --- BLINDAJE DE CÓDIGO (Safety Check) ---
    const age = params.age ? params.age.val : 0.3;
    const gender = params.gender ? params.gender.val : 0.5;
    
    // Extracción segura del resto
    const pHeight = params.height ? params.height.val : 175;
    const pMass = params.mass ? params.mass.val : 1.0;
    const pMuscle = params.muscle ? params.muscle.val : 1.0;
    const pMelanin = params.skinMelanin ? params.skinMelanin.val : 0.2;
    const pTone = params.skinTone ? params.skinTone.val : 0.5;
    
    // Obtener factores biológicos
    const bio = getLifeStageFactors(age);
    const sex = getGenderFactors(gender);

    const baseHeight = pHeight * bio.heightMod;
    const hScale = baseHeight / 175;
    
    const wMass = pMass * bio.fatDist;
    const wMusc = pMuscle * bio.muscleDef;
    
    const [skinBase, skinDetail] = getRealisticSkinColor(pMelanin, pTone, age);
    
    const headSizeAbs = 24 * (pHeight / 175); 
    const torsoLen = headSizeAbs * (bio.headRatio * 0.38); 
    const legLen = headSizeAbs * (bio.headRatio * 0.48); 
    const armLen = torsoLen * 1.2;

    // --- CÁLCULO DE PROPORCIONES AVANZADAS ---
    const shoulderWidthTotal = 45 * hScale * wMass * wMusc * sex.shoulderWidth; 
    const hipWidthTotal = 35 * hScale * wMass * sex.hipWidth;
    const waistWidthTotal = shoulderWidthTotal * 0.75 * sex.waistFactor * wMass; // Cintura más estrecha
    
    const limbWidth = 13 * hScale * wMass * wMusc;
    // Cuello mucho más fino por defecto (antes era 14 base, ahora 9)
    const neckBaseWidth = 9 * hScale * wMass * sex.neckWidth; 

    const spineAngle = -90 + bio.posture; 

    return {
        id: "human_evolved",
        name: age < 0.2 ? "Infante Humano" : (age > 0.8 ? "Anciano Venerable" : "Adulto Humano"),
        type: "vertebrate",
        seed: Math.random(),
        config: {
            isHuman: true,
            genderVal: gender,
            ageVal: age,
            customSkinBase: skinBase,
            customSkinDetail: skinDetail,
            hairConfig: {
                style: params.hairStyle ? Math.round(params.hairStyle.val) : 1,
                length: (params.hairLength ? params.hairLength.val : 0.5) * headSizeAbs * 1.5,
                colorVal: params.hairColor ? params.hairColor.val : 0.3,
                age: age, 
                gender: gender 
            },
            scale: 1.0,
            speed: 0.002, 
            hasFur: false,
            structure: [
                // PELVIS (Base ancha)
                { name: "pelvis", type: "bone", len: hipWidthTotal, width: hipWidthTotal, widthEnd: hipWidthTotal*0.9, angle: 0, parent: null, anim: "bob" },
                
                // ABDOMEN (Spine) - Conecta Pelvis con Cintura (Tapering)
                { name: "spine", type: "bone", len: torsoLen * 0.45, width: hipWidthTotal*0.85, widthEnd: waistWidthTotal, angle: spineAngle, parent: "pelvis", attachRatio: 0.5, anim: "breathe_chest" },
                
                // PECHO SUPERIOR (Ribcage) - Conecta Cintura con Hombros (V-Shape)
                { name: "chest_top", type: "bone", len: torsoLen * 0.55, width: waistWidthTotal, widthEnd: shoulderWidthTotal, angle: 0, parent: "spine", attachRatio: 1.0, anim: "none" },
                
                // CUELLO (Mucho más fino y cilíndrico)
                { name: "neck", type: "bone", len: headSizeAbs * 0.4, width: neckBaseWidth, widthEnd: neckBaseWidth * 0.9, angle: -bio.posture, parent: "chest_top", attachRatio: 1.0, anim: "breathe_neck" },
                
                // CABEZA
                { name: "head", type: "human_head", len: headSizeAbs, width: headSizeAbs * 0.9, widthEnd: headSizeAbs * 0.7 * sex.jawWidth, angle: 0, parent: "neck", attachRatio: 1.0, anim: "look_subtle" },
                
                // --- POSE DE CAMINATA / IDLE ---
                
                // CLAVÍCULAS (Conectan el centro del pecho con el inicio del brazo)
                { name: "clavicleL", type: "clavicle", len: shoulderWidthTotal * 0.45, width: neckBaseWidth * 0.7, angle: -80, parent: "chest_top", attachRatio: 0.95, anim: "none" },
                
                // BRAZO IZQUIERDO: Usamos 'walk_arm' para un balanceo pendular natural
                { name: "armL_up", type: "bone", len: armLen * 0.45, width: limbWidth*1.2, widthEnd: limbWidth, angle: -85 + (bio.posture * 0.5), parent: "clavicleL", attachRatio: 1.0, anim: "walk_arm" },
                // ANTEBRAZO
                { name: "armL_low", type: "bone", len: armLen * 0.45, width: limbWidth, widthEnd: limbWidth*0.8, angle: 10, parent: "armL_up", attachRatio: 1.0, anim: "none" },
                { name: "handL", type: "human_hand_l", len: armLen * 0.18, width: limbWidth*0.8, widthEnd: limbWidth*0.6, angle: 0, parent: "armL_low", attachRatio: 1.0, anim: "none" },

                // CLAVÍCULA DERECHA
                { name: "clavicleR", type: "clavicle", len: shoulderWidthTotal * 0.45, width: neckBaseWidth * 0.7, angle: 80, parent: "chest_top", attachRatio: 0.95, anim: "none" },
                
                // BRAZO DERECHO: Usamos 'walk_arm_opp' para el balanceo opuesto
                { name: "armR_up", type: "bone", len: armLen * 0.45, width: limbWidth*1.2, widthEnd: limbWidth, angle: 85 - (bio.posture * 0.5), parent: "clavicleR", attachRatio: 1.0, anim: "walk_arm_opp" },
                // ANTEBRAZO
                { name: "armR_low", type: "bone", len: armLen * 0.45, width: limbWidth, widthEnd: limbWidth*0.8, angle: -10, parent: "armR_up", attachRatio: 1.0, anim: "none" },
                { name: "handR", type: "human_hand_r", len: armLen * 0.18, width: limbWidth*0.8, widthEnd: limbWidth*0.6, angle: 0, parent: "armR_low", attachRatio: 1.0, anim: "none" },

                // PIERNAS (Mantienen 'walk' normal para pasos largos)
                // PIERNA IZQUIERDA: Opuesta al brazo izquierdo (walk_opp)
                { name: "legL_up", type: "bone", len: legLen * 0.45, width: limbWidth*1.6, widthEnd: limbWidth*1.2, angle: 87, parent: "pelvis", attachRatio: 0.15, anim: "walk_opp" },
                { name: "legL_low", type: "bone", len: legLen * 0.45, width: limbWidth*1.2, widthEnd: limbWidth, angle: 2, parent: "legL_up", attachRatio: 1.0, anim: "knee_back" },
                { name: "footL", type: "human_foot_l", len: legLen * 0.15, width: limbWidth*1.1, angle: 90, parent: "legL_low", attachRatio: 1.0, anim: "none" },

                // PIERNA DERECHA: Sincronizada con brazo izquierdo (walk) -> Patrón cruzado
                { name: "legR_up", type: "bone", len: legLen * 0.45, width: limbWidth*1.6, widthEnd: limbWidth*1.2, angle: 93, parent: "pelvis", attachRatio: 0.85, anim: "walk" },
                { name: "legR_low", type: "bone", len: legLen * 0.45, width: limbWidth*1.2, widthEnd: limbWidth, angle: -2, parent: "legR_up", attachRatio: 1.0, anim: "knee_back" },
                { name: "footR", type: "human_foot_r", len: legLen * 0.15, width: limbWidth*1.1, angle: 90, parent: "legR_low", attachRatio: 1.0, anim: "none" }
            ]
        }
    };
};