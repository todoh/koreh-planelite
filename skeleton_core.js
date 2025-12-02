/**
 * NÚCLEO DEL ESQUELETO (K -> Cinemática y H -> Estructura 3D-Lite)
 * Calcula posiciones absolutas con soporte de profundidad (Z) y rotación frontal (X).
 */

export class Skeleton {
    constructor(config) {
        this.bones = [];
        this.buildHierarchy(config.structure);
    }

    buildHierarchy(structureData) {
        const boneMap = {};

        structureData.forEach(data => {
            const bone = {
                id: data.name,
                type: data.type || 'bone',
                length: data.len,
                widthStart: data.width,
                widthEnd: data.widthEnd || data.width * 0.7,
                
                // Ángulos Base
                baseAngle: data.angle, // Rotación Z (Plano 2D)
                baseRotX: 0,           // Rotación X (Profundidad 3D) - Nuevo
                
                animType: data.anim,
                parent: data.parent ? boneMap[data.parent] : null,
                attachRatio: data.attachRatio !== undefined ? data.attachRatio : 1.0,

                // Estado Calculado (Global)
                globalStart: { x: 0, y: 0, z: 0 }, // Ahora incluye Z
                globalEnd: { x: 0, y: 0, z: 0 },
                globalAngle: 0, // Z-Rotation global
                globalRotX: 0   // X-Rotation global
            };

            boneMap[bone.id] = bone;
            this.bones.push(bone);
        });
    }

    /**
     * Actualiza la física (K - Camino)
     * @param {boolean} isMoving - Controla si se activan las animaciones de marcha
     */
    update(centerX, centerY, time, speed, isMoving = true) {
        const t = time * speed; 

        this.bones.forEach(bone => {
            // --- 1. CÁLCULO DE ANIMACIÓN LOCAL ---
            let animZ = 0; // Rotación en el plano (Lado a lado)
            let animX = 0; // Rotación en profundidad (Adelante/Atrás) - CRUCIAL PARA CAMINAR

            const isLeft = bone.id.includes('L') && !bone.id.includes('R');
            const phase = isLeft ? 0 : Math.PI; // Desfase para alternar piernas
            const animType = bone.animType ? bone.animType.toLowerCase() : 'none';

            switch (animType) {
                // --- LOCOMOCIÓN PIERNAS (Movimiento amplio) ---
                case 'walk':
                    if (isMoving) animX = Math.sin(t + phase) * 0.8; 
                    break;
                case 'walk_opp':
                    if (isMoving) animX = Math.sin(t + phase + Math.PI) * 0.8;
                    break;

                // --- LOCOMOCIÓN BRAZOS (Movimiento pendular suave) ---
                // Se reduce la amplitud (0.5 vs 0.8) para evitar que "suban" demasiado visualmente
                case 'walk_arm':
                    if (isMoving) {
                        animX = Math.sin(t + phase) * 0.5; 
                        animZ = Math.cos(t + phase) * 0.05; // Ligero movimiento lateral natural
                    }
                    break;
                case 'walk_arm_opp':
                    if (isMoving) {
                        animX = Math.sin(t + phase + Math.PI) * 0.5;
                        animZ = Math.cos(t + phase + Math.PI) * 0.05;
                    } 
                    break;

                case 'knee_back':
                    if (isMoving) {
                        const cycle = Math.sin(t + phase + Math.PI); 
                        animX = Math.max(0, cycle) * 1.5; // Doblar rodilla atrás
                    }
                    break;
                
                case 'knee_fwd':
                    if (isMoving) animX = -Math.max(0, Math.sin(t + phase)) * 1.5;
                    break;

                // --- MOVIMIENTOS AMBIENTALES (Usan Z o Y) ---
                case 'bob': 
                    if (!bone.parent) {
                        // REBOTE REDUCIDO: Antes era 3, ahora 1.2 para que sea más estable
                        const bobAmount = isMoving ? 1.2 : 0.5; 
                        const bobFreq = isMoving ? 2 : 1;
                        centerY += Math.cos(t * bobFreq) * bobAmount;
                    }
                    break; 

                case 'look': 
                    animZ = Math.sin(t * 0.3) * 0.15; 
                    break;
                
                case 'look_subtle':
                    animZ = Math.sin(t * 0.2) * 0.05;
                    break;

                case 'ear': 
                    animZ = Math.sin(t * 0.5 + phase) * 0.15; 
                    break;
                
                case 'tail':
                    animZ = Math.sin(t * 5) * 0.2; 
                    break;

                // --- RESPIRACIÓN (Sutil) ---
                case 'breathe_chest':
                    animX = Math.sin(t * 2.0) * 0.05; // Expansión torácica
                    if (!bone.parent) centerY += Math.sin(t * 2.0) * 1.0;
                    break;
                
                case 'breathe_arm':
                    animZ = Math.sin(t * 2.0) * 0.03; 
                    break;
                case 'breathe_arm_opp':
                    animZ = Math.sin(t * 2.0) * -0.03;
                    break;
                case 'breathe_neck': // Nueva sutil para el cuello
                     animX = Math.sin(t * 2.0) * 0.02;
                     break;
            }

            // --- 2. INTEGRACIÓN JERÁRQUICA ---
            const localAngleZ = (bone.baseAngle * Math.PI / 180) + animZ;
            const localAngleX = bone.baseRotX + animX;

            if (!bone.parent) {
                bone.globalStart = { x: centerX, y: centerY, z: 0 };
                bone.globalAngle = localAngleZ;
                bone.globalRotX = localAngleX;
            } else {
                bone.globalAngle = bone.parent.globalAngle + localAngleZ;
                bone.globalRotX = bone.parent.globalRotX + localAngleX;

                // Conectar al final del padre
                bone.globalStart = { ...bone.parent.globalEnd };
                
                if (bone.attachRatio < 1.0) {
                    const pdx = bone.parent.globalEnd.x - bone.parent.globalStart.x;
                    const pdy = bone.parent.globalEnd.y - bone.parent.globalStart.y;
                    const pdz = bone.parent.globalEnd.z - bone.parent.globalStart.z;
                    bone.globalStart.x = bone.parent.globalStart.x + pdx * bone.attachRatio;
                    bone.globalStart.y = bone.parent.globalStart.y + pdy * bone.attachRatio;
                    bone.globalStart.z = bone.parent.globalStart.z + pdz * bone.attachRatio;
                }
            }

            // --- 3. PROYECCIÓN 3D (Z -> Profundidad) ---
            const projectedLength = bone.length * Math.cos(bone.globalRotX);
            const depthChange = bone.length * Math.sin(bone.globalRotX); 

            const dx = Math.cos(bone.globalAngle) * projectedLength;
            const dy = Math.sin(bone.globalAngle) * projectedLength;
            
            bone.globalEnd = {
                x: bone.globalStart.x + dx,
                y: bone.globalStart.y + dy,
                z: bone.globalStart.z + depthChange
            };
        });
    }
}