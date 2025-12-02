/**
 * RENDERIZADOR DE EXTREMIDADES HUMANAS (Manos y Pies Detallados)
 * Dibuja dedos de forma procedural con corrección de perspectiva frontal.
 */

import { seededRandom } from './utils.js';

export const HumanLimbs = {
    
    drawHandDetailed: (ctx, bone, config, isLeft) => {
        const { widthStart, length, globalStart, globalEnd } = bone;
        const handWidth = widthStart;
        const handLength = length;
        const skinColor = config.customSkinBase;
        const shadowColor = config.customSkinDetail;
        
        ctx.save();
        ctx.translate(globalStart.x, globalStart.y);
        const dx = globalEnd.x - globalStart.x;
        const dy = globalEnd.y - globalStart.y;
        const boneAngle = Math.atan2(dy, dx);
        ctx.rotate(boneAngle);

        ctx.fillStyle = skinColor;
        ctx.strokeStyle = shadowColor;
        ctx.lineCap = 'round';

        // Palma
        ctx.beginPath();
        ctx.moveTo(0, -handWidth * 0.4);
        ctx.lineTo(handLength * 0.6, -handWidth * 0.5); 
        ctx.lineTo(handLength * 0.6, handWidth * 0.5);
        ctx.lineTo(0, handWidth * 0.4); 
        ctx.fill();

        // Dedos
        const fingerBaseX = handLength * 0.6;
        const numFingers = 4;
        for (let i = 0; i < numFingers; i++) {
            const t = i / (numFingers - 1); 
            const fingerY = (-handWidth * 0.4) + t * (handWidth * 0.8);
            let fingerLen = handLength * 0.5;
            if (i === 1 || i === 2) fingerLen *= 1.15; 
            if (i === 3) fingerLen *= 0.7; 

            const fingerWidth = handWidth * 0.22;
            ctx.lineWidth = fingerWidth;
            ctx.strokeStyle = skinColor;
            ctx.beginPath();
            ctx.moveTo(fingerBaseX, fingerY);
            ctx.quadraticCurveTo(fingerBaseX + fingerLen*0.5, fingerY + seededRandom()*2, fingerBaseX + fingerLen, fingerY + seededRandom()*2);
            ctx.stroke();
        }

        // Pulgar
        const thumbY = isLeft ? -handWidth * 0.4 : handWidth * 0.4;
        ctx.lineWidth = handWidth * 0.25;
        ctx.beginPath();
        ctx.moveTo(handLength * 0.2, thumbY);
        ctx.lineTo(handLength * 0.6, thumbY + (isLeft ? -handWidth*0.4 : handWidth*0.4));
        ctx.stroke();

        ctx.restore();
    },

    drawFootDetailed: (ctx, bone, config, isLeft) => {
        const { widthStart, length, globalStart, globalEnd } = bone;
        const footW = widthStart;
        const footL = length;
        const skinColor = config.customSkinBase;
        
        ctx.save();
        ctx.translate(globalStart.x, globalStart.y);
        const dx = globalEnd.x - globalStart.x;
        const dy = globalEnd.y - globalStart.y;
        const boneAngle = Math.atan2(dy, dx);
        
        // 1. Rotar al ángulo del hueso (que es lateral)
        ctx.rotate(boneAngle);
        // 2. CORRECCIÓN CRÍTICA: Rotar -90 grados para que el dibujo mire "al frente" (abajo en pantalla)
        ctx.rotate(-Math.PI / 2);

        ctx.fillStyle = skinColor;
        ctx.lineCap = 'round';

        // Empeine (Visto de frente)
        ctx.beginPath();
        ctx.moveTo(-footW*0.25, 0); 
        ctx.lineTo(footL*0.8, -footW*0.4); // Ancho dedos
        ctx.lineTo(footL*0.8, footW*0.4);
        ctx.lineTo(-footW*0.25, 0);
        ctx.fill();

        // Dedos del pie (Vistos de frente)
        const toeBaseX = footL * 0.8;
        const numToes = 5;
        
        ctx.strokeStyle = skinColor;
        for(let i=0; i<numToes; i++) {
            const t = i / (numToes -1);
            
            // CORRECCIÓN: Invertimos la lógica para que el dedo gordo (i=0) quede al INTERIOR.
            // Antes: isLeft ? (positivo -> negativo) : (negativo -> positivo)
            // Ahora: isLeft ? (negativo -> positivo) : (positivo -> negativo)
            let yPos = isLeft 
                ? (-footW*0.35 + t*footW*0.7) 
                : (footW*0.35 - t*footW*0.7);
            
            // Dedos muy cortos por perspectiva frontal
            let toeLen = footL * 0.15 * (1.0 - t*0.3); 
            let toeWidth = footW * 0.22;
            
            if (i === 0) { toeLen *= 1.3; toeWidth *= 1.3; } // Dedo gordo más grande

            ctx.lineWidth = toeWidth;
            ctx.beginPath();
            ctx.moveTo(toeBaseX, yPos);
            // Dibujamos el dedo como un pequeño óvalo/línea hacia "abajo"
            ctx.lineTo(toeBaseX + toeLen, yPos);
            ctx.stroke();
        }

        ctx.restore();
    }
};