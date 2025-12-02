/**
 * RENDERIZADOR DE PIEL Y CUERPO (M -> Material)
 * Integra dimorfismo sexual en el torso.
 */
import { OrganFactory } from './organ_factory.js';
import { HumanFeatures } from './human_face_hair.js';
import { HumanLimbs } from './human_limbs.js';
import { seededRandomRange } from './utils.js';

export const SkinRenderer = {
    render: (ctx, skeleton, config, seed) => {
        const { colorSkin, colorDetail, hasFur, isHuman, customSkinBase, customSkinDetail, genderVal, ageVal } = config;

        // Determinar colores base
        let skinColor, detailColor;
        if (isHuman && customSkinBase) {
            skinColor = customSkinBase;
            detailColor = customSkinDetail;
        } else {
            const baseHue = seededRandomRange(colorSkin[0], colorSkin[1]);
            skinColor = `hsl(${baseHue}, 45%, 45%)`;
            detailColor = `hsl(${seededRandomRange(colorDetail[0], colorDetail[1])}, 50%, 80%)`;
        }

        // 1. DIBUJAR HUESOS (Torso con lógica especial)
        skeleton.bones.forEach(bone => {
            if (bone.type !== 'antler' && 
                bone.type !== 'human_head' && 
                !bone.type.startsWith('human_hand') && 
                !bone.type.startsWith('human_foot')) {
                
                // Lógica especial para el pecho femenino
                if (isHuman && bone.id === 'chest_top' && genderVal > 0.5 && ageVal > 0.25) {
                    SkinRenderer.drawFemaleChest(ctx, bone, skinColor, detailColor, genderVal);
                } else {
                    SkinRenderer.drawBoneSegment(ctx, bone, skinColor, detailColor);
                }
            }
        });

        // 2. ARTICULACIONES (Animales)
        if (!isHuman) {
            skeleton.bones.forEach(bone => {
                if (bone.type !== 'antler' && bone.type !== 'hoof' && !bone.type.includes('head')) {
                    ctx.fillStyle = skinColor;
                    ctx.beginPath();
                    ctx.arc(bone.globalStart.x, bone.globalStart.y, bone.widthStart * 0.45, 0, Math.PI * 2);
                    ctx.fill();
                }
            });
        }

        // 3. FUR (Animales)
        if (hasFur && !isHuman) {
            const furColor = skinColor.replace('45%)', '40%)');
            skeleton.bones.forEach(bone => {
               if(bone.type !== 'antler') SkinRenderer.drawFur(ctx, bone, furColor, seed);
            });
        }

        // 4. PARTES ESPECIALES
        skeleton.bones.forEach(bone => {
            switch (bone.type) {
                case 'human_head':
                    HumanFeatures.drawHeadDetailed(ctx, bone, config, seed);
                    break;
                case 'human_hand_l':
                    HumanLimbs.drawHandDetailed(ctx, bone, config, true);
                    break;
                case 'human_hand_r':
                    HumanLimbs.drawHandDetailed(ctx, bone, config, false);
                    break;
                case 'human_foot_l':
                    HumanLimbs.drawFootDetailed(ctx, bone, config, true);
                    break;
                case 'human_foot_r':
                    HumanLimbs.drawFootDetailed(ctx, bone, config, false);
                    break;
                case 'head_cranial':
                    const eyeX = bone.globalStart.x + (bone.globalEnd.x - bone.globalStart.x) * 0.55;
                    const eyeY = bone.globalStart.y + (bone.globalEnd.y - bone.globalStart.y) * 0.55 - (bone.widthStart * 0.2);
                    OrganFactory.drawEye(ctx, eyeX, eyeY, bone.widthStart * 0.35, 0.2, 0, 'herbivore');
                    break;
                case 'head_snout':
                    OrganFactory.drawSnout(ctx, bone.globalEnd.x, bone.globalEnd.y, bone.widthEnd * 0.8);
                    break;
                case 'hoof':
                    OrganFactory.drawHoof(ctx, bone.globalStart.x, bone.globalStart.y, bone.globalAngle, bone.widthStart, '#111');
                    break;
                case 'antler':
                    ctx.save(); ctx.translate(5, -5); 
                    SkinRenderer.drawAntlerStructure(ctx, bone, '#aa9', 0.9);
                    ctx.restore();
                    SkinRenderer.drawAntlerStructure(ctx, bone, '#eec', 1.0);
                    break;
            }
        });
    },

    drawFemaleChest: (ctx, bone, colorMain, colorLight, genderVal) => {
        const dx = bone.globalEnd.x - bone.globalStart.x;
        const dy = bone.globalEnd.y - bone.globalStart.y;
        const wStart = bone.widthStart / 2;
        const wEnd = bone.widthEnd / 2;
        const nx = -dy / Math.sqrt(dx*dx + dy*dy);
        const ny = dx / Math.sqrt(dx*dx + dy*dy);

        // 1. Dibujar base del torso (Trapezoide normal)
        ctx.fillStyle = colorMain;
        ctx.beginPath();
        ctx.moveTo(bone.globalStart.x + nx * wStart, bone.globalStart.y + ny * wStart);
        ctx.lineTo(bone.globalEnd.x + nx * wEnd, bone.globalEnd.y + ny * wEnd);
        ctx.lineTo(bone.globalEnd.x - nx * wEnd, bone.globalEnd.y - ny * wEnd);
        ctx.lineTo(bone.globalStart.x - nx * wStart, bone.globalStart.y - ny * wStart);
        ctx.fill();

        // 2. Dibujar curva suave del busto (F -> Forma sutil)
        // Usamos un color ligeramente más oscuro/saturado para dar volumen sin delinear
        // Ajustamos la posición para que esté anatómicamente en el pecho
        const chestY = bone.globalStart.y + (dy * 0.4); 
        const curveSize = (wEnd * 0.6) * genderVal; 

        ctx.fillStyle = colorLight; 
        ctx.globalAlpha = 0.15; // Sombra sutil
        
        // Izquierda
        ctx.beginPath();
        ctx.arc(bone.globalStart.x + nx * (wStart*0.4) + (dx*0.5), chestY + (dy*0.1), curveSize, 0, Math.PI*2);
        ctx.fill();
        // Derecha
        ctx.beginPath();
        ctx.arc(bone.globalStart.x - nx * (wStart*0.4) + (dx*0.5), chestY + (dy*0.1), curveSize, 0, Math.PI*2);
        ctx.fill();
        
        ctx.globalAlpha = 1.0;
    },

    drawBoneSegment: (ctx, bone, colorMain, colorLight) => {
        if (bone.type === 'invisible' || bone.type === 'hoof') return;
        const dx = bone.globalEnd.x - bone.globalStart.x;
        const dy = bone.globalEnd.y - bone.globalStart.y;
        const len = Math.sqrt(dx*dx + dy*dy);
        if (len < 1) return;
        
        const nx = -dy / len;
        const ny = dx / len;
        const wStart = bone.widthStart / 2;
        const wEnd = bone.widthEnd / 2;

        ctx.fillStyle = colorMain;
        ctx.beginPath();
        
        // Si es el abdomen (spine) y es humano, hacemos la cintura curva
        if (bone.id === 'spine') {
            ctx.moveTo(bone.globalStart.x + nx * wStart, bone.globalStart.y + ny * wStart);
            // Curva hacia adentro (Cintura)
            ctx.quadraticCurveTo(
                bone.globalStart.x + (dx*0.5) + nx * (wStart*0.7), 
                bone.globalStart.y + (dy*0.5) + ny * (wStart*0.7),
                bone.globalEnd.x + nx * wEnd, 
                bone.globalEnd.y + ny * wEnd
            );
            ctx.lineTo(bone.globalEnd.x - nx * wEnd, bone.globalEnd.y - ny * wEnd);
            // Curva hacia adentro opuesta
            ctx.quadraticCurveTo(
                bone.globalStart.x + (dx*0.5) - nx * (wStart*0.7), 
                bone.globalStart.y + (dy*0.5) - ny * (wStart*0.7),
                bone.globalStart.x - nx * wStart, 
                bone.globalStart.y - ny * wStart
            );
        } else {
            // Hueso recto estándar
            ctx.moveTo(bone.globalStart.x + nx * wStart, bone.globalStart.y + ny * wStart);
            ctx.lineTo(bone.globalEnd.x + nx * wEnd, bone.globalEnd.y + ny * wEnd);
            ctx.lineTo(bone.globalEnd.x - nx * wEnd, bone.globalEnd.y - ny * wEnd);
            ctx.lineTo(bone.globalStart.x - nx * wStart, bone.globalStart.y - ny * wStart);
        }
        ctx.closePath();
        ctx.fill();

        // Sombreado de volumen cilíndrico
        if (bone.id.includes('torso') || bone.id.includes('neck') || bone.id.includes('leg') || bone.id.includes('arm') || bone.id.includes('spine')) {
            ctx.fillStyle = colorLight; 
            ctx.globalAlpha = 0.3;
            ctx.beginPath();
            ctx.moveTo(bone.globalStart.x + nx * (wStart*0.6), bone.globalStart.y + ny * (wStart*0.6));
            ctx.lineTo(bone.globalEnd.x + nx * (wEnd*0.6), bone.globalEnd.y + ny * (wEnd*0.6));
            ctx.lineTo(bone.globalEnd.x - nx * (wEnd*0.2), bone.globalEnd.y - ny * (wEnd*0.2)); // Luz desplazada
            ctx.lineTo(bone.globalStart.x - nx * (wStart*0.2), bone.globalStart.y - ny * (wStart*0.2));
            ctx.fill();
            ctx.globalAlpha = 1.0;
        }
    },

    drawAntlerStructure: (ctx, bone, color, scaleMod) => {
        const startX = bone.globalStart.x;
        const startY = bone.globalStart.y;
        const mainAngle = Math.atan2(bone.globalEnd.y - startY, bone.globalEnd.x - startX);
        const length = Math.sqrt(Math.pow(bone.globalEnd.x - startX, 2) + Math.pow(bone.globalEnd.y - startY, 2)) * scaleMod;
        
        ctx.strokeStyle = color;
        ctx.lineCap = "round";

        const drawBranch = (x, y, len, ang, wid, depth) => {
            if (depth > 3 || len < 4) return;
            const endX = x + Math.cos(ang) * len;
            const endY = y + Math.sin(ang) * len;

            ctx.lineWidth = wid;
            ctx.beginPath();
            ctx.moveTo(x, y);
            if (depth === 0) {
                 ctx.quadraticCurveTo(x + Math.cos(ang - 0.2) * (len * 0.5), y + Math.sin(ang - 0.2) * (len * 0.5), endX, endY);
            } else {
                 ctx.lineTo(endX, endY);
            }
            ctx.stroke();

            drawBranch(x + Math.cos(ang) * (len * 0.4), y + Math.sin(ang) * (len * 0.4), len * 0.5, ang - 0.6 - (depth * 0.1), wid * 0.7, depth + 1);
            drawBranch(endX, endY, len * 0.6, ang + 0.15, wid * 0.7, depth + 1);
        };
        drawBranch(startX, startY, length, mainAngle, bone.widthStart, 0);
    },

    drawFur: (ctx, bone, color, seed) => {
        if (bone.type === 'hoof' || bone.type === 'invisible' || bone.type.includes('head')) return;
        const dx = bone.globalEnd.x - bone.globalStart.x;
        const dy = bone.globalEnd.y - bone.globalStart.y;
        const angle = Math.atan2(dy, dx);
        const len = Math.sqrt(dx*dx + dy*dy);

        ctx.save();
        ctx.translate(bone.globalStart.x, bone.globalStart.y);
        ctx.rotate(angle);
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.6;
        const density = 6;
        const steps = len / density;
        const boneSeed = bone.id.length * seed; 
        for (let i = 0; i < steps; i++) {
            const xPos = i * density;
            const yPos = -bone.widthStart * 0.5;
            const furLen = (Math.sin(boneSeed + i) * 3) + 4;
            const furAngle = (Math.cos(boneSeed * i) * 0.5) - 0.8;
            ctx.beginPath();
            ctx.moveTo(xPos, yPos);
            ctx.lineTo(xPos + Math.cos(furAngle)*furLen, yPos + Math.sin(furAngle)*furLen);
            ctx.stroke();
        }
        ctx.restore();
    }
};