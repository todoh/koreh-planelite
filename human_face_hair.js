/**
 * RENDERIZADOR FACIAL Y CAPILAR HUMANO EVOLUCIONADO (F -> Forma)
 * Soporte para Edad, Género, Arrugas y Expresión.
 */

import { seededRandom } from './utils.js';

export const HumanFeatures = {
    
    drawHeadDetailed: (ctx, bone, config, seed) => {
        const { widthStart, globalStart, globalEnd } = bone;
        const headSize = widthStart; // Alto total de la cabeza
        const skinColor = config.customSkinBase;
        const shadowColor = config.customSkinDetail;
        
        // Factores Evolutivos
        const age = config.ageVal || 0.3;
        const gender = config.genderVal || 0.5; // 0 Masc, 1 Fem
        
        ctx.save();
        ctx.translate(globalStart.x, globalStart.y);
        
        const dx = globalEnd.x - globalStart.x;
        const dy = globalEnd.y - globalStart.y;
        const boneAngle = Math.atan2(dy, dx);
        
        ctx.rotate(boneAngle + Math.PI / 2);

        // --- FORMA DE LA CARA SEGÚN EDAD/GÉNERO ---
        // Niños: Cara redonda. Hombres: Mandíbula cuadrada. Mujeres: Puntiaguda/Suave. Ancianos: Papada.
        const jawWidth = age < 0.2 ? 0.45 : (0.4 + (1-gender)*0.2); // Niños redondos, Hombres anchos
        const chinY = age > 0.8 ? headSize * 0.3 : 0; // Papada senil

        // 1. Pelo Trasero
        if (config.hairConfig) HumanFeatures.drawHairBack(ctx, 0, -headSize*0.5, headSize, config.hairConfig);

        // 2. Orejas (Crecen con la edad)
        const earSizeMod = 1.0 + (age > 0.7 ? (age-0.7)*0.8 : 0);
        HumanFeatures.drawEars(ctx, 0, -headSize*0.5, headSize * earSizeMod, skinColor, shadowColor);

        // 3. Cabeza Base
        const faceCenterY = -headSize * 0.6;
        ctx.fillStyle = skinColor;
        ctx.beginPath();
        // Cráneo
        ctx.ellipse(0, faceCenterY, headSize * 0.52, headSize * 0.55, 0, Math.PI, 0);
        // Mandíbula dinámica
        ctx.bezierCurveTo(headSize*0.52, faceCenterY + headSize*0.5, headSize*jawWidth, faceCenterY + headSize + chinY, 0, faceCenterY + headSize + chinY);
        ctx.bezierCurveTo(-headSize*jawWidth, faceCenterY + headSize + chinY, -headSize*0.52, faceCenterY + headSize*0.5, -headSize*0.52, faceCenterY);
        ctx.fill();

        // 4. Arrugas y Detalles de Edad (Z -> Conocimiento/Tiempo)
        if (age > 0.5) HumanFeatures.drawWrinkles(ctx, headSize, age, shadowColor);

        // 5. Cara
        const eyeSpacing = headSize * 0.22;
        // Los ojos parecen estar más abajo en niños porque la frente es grande
        const eyeY = faceCenterY + (age < 0.2 ? headSize * 0.1 : 0); 
        const eyeSize = headSize * (age < 0.2 ? 0.11 : 0.085); // Ojos grandes en niños

        HumanFeatures.drawRealisticEye(ctx, -eyeSpacing, eyeY, eyeSize, age);
        HumanFeatures.drawRealisticEye(ctx, eyeSpacing, eyeY, eyeSize, age);

        // Nariz
        ctx.fillStyle = shadowColor;
        ctx.globalAlpha = 0.4;
        const noseLen = headSize * (0.2 + age * 0.1); // Nariz crece con edad
        ctx.beginPath();
        ctx.moveTo(0, eyeY + eyeSize);
        ctx.lineTo(headSize * 0.1, eyeY + noseLen);
        ctx.lineTo(-headSize * 0.1, eyeY + noseLen);
        ctx.fill();
        ctx.globalAlpha = 1.0;

        // Boca
        const mouthY = eyeY + noseLen + headSize * 0.15;
        ctx.strokeStyle = (gender > 0.6 && age > 0.15 && age < 0.7) ? '#c56' : '#a65'; // Labios más rojos en mujeres jóvenes
        ctx.lineWidth = age < 0.2 ? 1.5 : 2.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        const smile = age < 0.2 ? 0.38 : 0.35; // Niños sonríen más por defecto
        ctx.moveTo(-headSize * 0.15, mouthY);
        ctx.quadraticCurveTo(0, mouthY + headSize * (0.02 + (1-age)*0.01), headSize * 0.15, mouthY);
        ctx.stroke();

        // 6. Pelo Frontal
        if (config.hairConfig) HumanFeatures.drawHairFront(ctx, 0, -headSize*1.15, headSize, config.hairConfig, seed);

        ctx.restore();
    },

    drawEars: (ctx, x, y, headSize, color, shadow) => {
        const earX = headSize * 0.5;
        const earH = headSize * 0.22;
        const earW = headSize * 0.12;
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.ellipse(x - earX, y, earW, earH, -0.1, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(x + earX, y, earW, earH, 0.1, 0, Math.PI*2); ctx.fill();
    },

    drawWrinkles: (ctx, headSize, age, color) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.globalAlpha = (age - 0.4) * 0.6; // Opacidad basada en edad

        const yBase = -headSize * 0.6;

        // Frente
        if (age > 0.6) {
            ctx.beginPath(); ctx.moveTo(-10, yBase - 15); ctx.lineTo(10, yBase - 15); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(-15, yBase - 22); ctx.lineTo(15, yBase - 22); ctx.stroke();
        }
        
        // Ojos (Patas de gallo)
        const eyeY = yBase;
        ctx.beginPath(); ctx.moveTo(-25, eyeY); ctx.lineTo(-30, eyeY + 5); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(25, eyeY); ctx.lineTo(30, eyeY + 5); ctx.stroke();

        // Surco nasogeniano (Nariz a boca)
        if (age > 0.5) {
            ctx.beginPath(); ctx.moveTo(-8, eyeY + 25); ctx.quadraticCurveTo(-15, eyeY + 35, -10, eyeY + 45); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(8, eyeY + 25); ctx.quadraticCurveTo(15, eyeY + 35, 10, eyeY + 45); ctx.stroke();
        }
        ctx.globalAlpha = 1.0;
    },

    drawRealisticEye: (ctx, x, y, size, age) => {
        ctx.save();
        ctx.translate(x, y);
        
        // Párpados caídos en ancianos
        const lidDroop = age > 0.7 ? size * 0.3 : 0;

        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.ellipse(0, 0, size * 1.3, size * 0.75, 0, 0, Math.PI*2); ctx.fill();
        
        ctx.fillStyle = '#421';
        ctx.beginPath(); ctx.arc(0, 0, size * 0.55, 0, Math.PI*2); ctx.fill();
        
        ctx.fillStyle = '#000';
        ctx.beginPath(); ctx.arc(0, 0, size * 0.25, 0, Math.PI*2); ctx.fill();
        
        // Brillo (Juventud) - Más pequeño en ancianos
        const shineSize = Math.max(0.1, size * (0.25 - age*0.15));
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(size*0.2, -size*0.2, shineSize, 0, Math.PI*2); ctx.fill();

        // Dibujar párpado superior pesado
        if (lidDroop > 0) {
            ctx.fillStyle = 'rgba(0,0,0,0.1)';
            ctx.beginPath();
            ctx.arc(0, -size + lidDroop, size*1.3, 0, Math.PI, false);
            ctx.fill();
        }

        ctx.restore();
    },

    drawHairBack: (ctx, x, y, headSize, config) => {
        const { length, colorVal, age, gender } = config;
        // Calvicie masculina en madurez
        if (gender < 0.3 && age > 0.5 && length < headSize) return; 

        const color = HumanFeatures.getHairColor(colorVal, age);
        ctx.fillStyle = color;
        ctx.beginPath();
        
        // Forma básica
        ctx.moveTo(-headSize*0.65, y);
        // Pelo largo cae, pelo corto se queda
        const drop = length; 
        ctx.lineTo(-headSize*0.75, y + drop);
        ctx.lineTo(headSize*0.75, y + drop);
        ctx.lineTo(headSize*0.65, y);
        ctx.fill();
    },

    drawHairFront: (ctx, x, y, headSize, config, seed) => {
        const { style, colorVal, age, gender } = config;
        const color = HumanFeatures.getHairColor(colorVal, age);
        ctx.fillStyle = color;
        const topY = y + headSize * 0.5;

        // Lógica de Calvicie (Solo hombres maduros)
        const isBald = (gender < 0.3 && age > 0.45 && style < 3);
        const receding = isBald ? headSize * (age - 0.3) : 0;

        if (style === 0 || (isBald && age > 0.7)) { // Rapado o Muy Calvo
             if (!isBald) {
                 ctx.globalAlpha = 0.2;
                 ctx.beginPath(); ctx.ellipse(0, topY, headSize*0.5, headSize*0.4, 0, Math.PI, 0); ctx.fill();
             }
             return;
        }

        // Base del pelo (recediendo si es calvo)
        ctx.beginPath(); 
        ctx.ellipse(0, topY - receding, headSize*0.55, headSize*(0.5 - receding/headSize), 0, Math.PI, 0); 
        ctx.fill();

        // Estilos específicos
        if (style >= 3) { // Melenas / Pelo Largo
            ctx.beginPath();
            ctx.moveTo(-headSize*0.55, topY); ctx.lineTo(-headSize*0.6, topY + headSize); ctx.lineTo(-headSize*0.4, topY); ctx.fill();
            ctx.beginPath();
            ctx.moveTo(headSize*0.55, topY); ctx.lineTo(headSize*0.6, topY + headSize); ctx.lineTo(headSize*0.4, topY); ctx.fill();
        } else if (style === 2) { // Flequillo / Despeinado
            ctx.beginPath(); ctx.arc(0, topY-receding, headSize*0.5, 0, Math.PI, true); ctx.fill();
        }
    },

    getHairColor: (val, age) => {
        // Encanecimiento progresivo (R -> Resonancia con el tiempo)
        if (age > 0.5) {
            // Factor de canas (0 a 1)
            const greyFactor = Math.min(1, (age - 0.5) * 2.5);
            // Interpolamos hacia blanco/gris
            const baseHue = 40 - val * 20;
            const baseLit = 20 + val * 20;
            const finalSat = 40 * (1 - greyFactor);
            const finalLit = baseLit + ( (90 - baseLit) * greyFactor );
            return `hsl(${baseHue}, ${finalSat}%, ${finalLit}%)`;
        }
        
        const hue = 40 - val * 20; 
        const light = 20 + val * 30; // Más oscuro base
        return `hsl(${hue}, 40%, ${light}%)`;
    }
};