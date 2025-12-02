// ARCHIVO: Silenos Génesis/motor_alado.js
import { seededRandomRange } from './utils.js';

export const WingedEngine = {
    render: (ctx, width, height, time, seed, type, config) => {
        const centerX = width / 2;
        const centerY = height / 2;
        ctx.translate(centerX, centerY);

        if (type === 'butterfly') {
            WingedEngine.drawButterfly(ctx, time, seed, config);
        } else if (type === 'bird') {
            if (config.colors && config.colors.tail) {
                // Flotación suave aumentada para sensación de peso
                const floatY = Math.sin(time * 0.002) * 15;
                ctx.translate(0, floatY);
                WingedEngine.drawRealisticRaptor(ctx, time, seed, config);
            } else {
                WingedEngine.drawSimpleBird(ctx, time, seed, config);
            }
        }
    },

    // --- COMPATIBILIDAD (Aves de corral) ---
    drawSimpleBird: (ctx, time, seed, config) => {
        const { span, colorFeather, beakType, tailType, crest } = config;
        const hue = seededRandomRange(colorFeather[0], colorFeather[1]);
        ctx.fillStyle = `hsl(${hue}, 40%, 40%)`;
        ctx.beginPath(); ctx.ellipse(0, 10, 15, 25, 0, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(0, -15, 12, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#fb0';
        ctx.beginPath();
        if (beakType === 'hook') { ctx.moveTo(8, -15); ctx.quadraticCurveTo(18, -10, 12, 0); ctx.lineTo(8, -5); } 
        else { ctx.moveTo(8, -15); ctx.lineTo(18, -12); ctx.lineTo(8, -9); }
        ctx.fill();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(4, -18, 4, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(5, -18, 1.5, 0, Math.PI*2); ctx.fill();
        if (crest) { ctx.fillStyle = '#d00'; ctx.beginPath(); ctx.moveTo(-5, -25); ctx.lineTo(0, -35); ctx.lineTo(5, -25); ctx.fill(); }
        const flap = Math.sin(time * 0.01);
        ctx.fillStyle = `hsl(${hue}, 30%, 30%)`;
        for(let dir of [-1, 1]) {
            ctx.save(); ctx.translate(5 * dir, 0); ctx.rotate(flap * 0.5 * dir); 
            ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(span * 0.5 * dir, -20, span * dir, 10); ctx.lineTo(10 * dir, 20); ctx.fill(); ctx.restore();
        }
        ctx.fillStyle = `hsl(${hue}, 35%, 25%)`;
        ctx.beginPath(); if (tailType === 'fan_huge') { ctx.arc(0, 20, 50, Math.PI, 0); } else { ctx.rect(-10, 30, 20, 30); } ctx.fill();
    },

    // --- NUEVO MOTOR DE RAPACES REALISTAS ---
    drawRealisticRaptor: (ctx, time, seed, config) => {
        const { span, bodyScale, colors, wingShape, tailShape, soarEfficiency, flapSpeed } = config;
        const scale = (bodyScale || 1.0) * 1.5; 

        ctx.save();
        ctx.scale(scale, scale);

        // Velocidad de animación ajustada
        const speed = flapSpeed || 0.001; 
        const animTime = time * speed * 40; 
        
        // --- CAMBIO: Aleteo Constante (Bucle infinito) ---
        // Forzamos isFlapping a true para evitar que se quede quieto planeando
        const isFlapping = true; 
        
        let flapAngleRoot = 0;
        let flapAngleWrist = 0;
        let bodyTilt = 0;
        
        if (isFlapping) {
             // Aleteo pesado
             const flapBase = Math.sin(animTime);
             flapAngleRoot = flapBase * 0.35; 
             // La muñeca se retrasa (latigazo)
             flapAngleWrist = Math.sin(animTime - 0.8) * 0.4; 
             bodyTilt = Math.cos(animTime) * 0.08;
        }

        ctx.rotate(bodyTilt);

        // 1. COLA
        if(colors.tail) WingedEngine.RaptorParts.drawTail(ctx, tailShape, colors.tail, seed);

        // 2. ALAS
        for(let dir of [-1, 1]) {
            ctx.save();
            ctx.scale(dir, 1); 
            ctx.translate(12, -8); // Hombro más alto
            ctx.rotate(flapAngleRoot);

            // BRAZO DEL ALA (Base ósea más gruesa)
            ctx.strokeStyle = WingedEngine.RaptorParts.getFeatherColor(ctx, colors.wingCovert, seed, -10);
            ctx.lineWidth = 18; 
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(0,0);
            ctx.lineTo(span * 0.4, 0);
            ctx.stroke();

            // CAPA 3: PRIMARIAS (Puntas)
            ctx.save();
            ctx.translate(span * 0.38, 0); 
            ctx.rotate(flapAngleWrist);
            
            // Brazo distal (mano)
            ctx.lineWidth = 14;
            ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(span * 0.5, 0); ctx.stroke();
            
            WingedEngine.RaptorParts.drawWingFeathers(ctx, span * 0.6, colors.wingPrimary, 'primary', wingShape, seed);
            ctx.restore();

            // CAPA 2: SECUNDARIAS (Medio)
            WingedEngine.RaptorParts.drawWingFeathers(ctx, span * 0.4, colors.wingPrimary, 'secondary', wingShape, seed);

            // CAPA 1: COBERTERAS (Hombro)
            WingedEngine.RaptorParts.drawWingFeathers(ctx, span * 0.25, colors.wingCovert, 'covert', wingShape, seed);

            ctx.restore();
        }

        // 3. TORSO
        WingedEngine.RaptorParts.drawTorsoAndTalons(ctx, colors.torso, colors.talons, isFlapping, time, seed);

        // 4. CABEZA (Ahora con 2 ojos para todos)
        WingedEngine.RaptorParts.drawHead(ctx, config, seed, time);

        ctx.restore();
    },

    // --- MARIPOSAS ---
    drawButterfly: (ctx, time, seed, config) => {
         const { wingSize, colorPri, colorSec, flapSpeed } = config;
         const flap = Math.cos(time * flapSpeed * 100); 
         const flapScale = Math.abs(flap * 0.8) + 0.2; 
         ctx.save(); ctx.scale(flapScale, 1); 
         for(let side of [-1, 1]) {
             ctx.save(); ctx.scale(side, 1);
             const hue1 = seededRandomRange(colorPri[0], colorPri[1]);
             const hue2 = seededRandomRange(colorSec[0], colorSec[1]);
             ctx.beginPath(); ctx.moveTo(2, -5); ctx.bezierCurveTo(20, -wingSize, wingSize, -wingSize*0.5, 2, 5);
             ctx.fillStyle = `hsl(${hue1}, 80%, 60%)`; ctx.fill();
             ctx.lineWidth = 2; ctx.strokeStyle = '#222'; ctx.stroke();
             ctx.fillStyle = `hsl(${hue2}, 70%, 50%)`; ctx.beginPath(); ctx.arc(wingSize*0.5, -wingSize*0.4, wingSize*0.15, 0, Math.PI*2); ctx.fill();
             ctx.beginPath(); ctx.moveTo(2, 5); ctx.bezierCurveTo(25, wingSize, wingSize*0.6, wingSize, 2, 5);
             ctx.fillStyle = `hsl(${hue1}, 70%, 50%)`; ctx.fill(); ctx.stroke();
             ctx.restore();
         }
         ctx.fillStyle = '#111'; ctx.beginPath(); ctx.ellipse(0, 0, 3, 15, 0, 0, Math.PI*2); ctx.fill();
         ctx.strokeStyle = '#111'; ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(-5, -20); ctx.moveTo(0, -10); ctx.lineTo(5, -20); ctx.stroke();
         ctx.restore();
    },

    // --- PARTES ANATÓMICAS ---
    RaptorParts: {
        getFeatherColor: (ctx, hueRange, seed, lightnessMod = 0) => {
            if (!hueRange) return '#555';
            const hue = seededRandomRange(hueRange[0], hueRange[1]);
            const sat = seededRandomRange(25, 45); 
            const light = seededRandomRange(20, 45) + lightnessMod;
            return `hsl(${hue}, ${sat}%, ${light}%)`;
        },

        drawTail: (ctx, shape, colorRange, seed) => {
            ctx.save();
            ctx.translate(0, 20); 
            const featherCount = shape === 'fan_wedge' ? 16 : 12;
            const spread = shape === 'narrow_square' ? 0.4 : 0.9;
            const length = shape === 'round' ? 40 : 55;

            for(let i = 0; i < featherCount; i++) {
                const t = (i / (featherCount - 1)) * 2 - 1;
                const angle = t * spread;
                const currentLen = length - (Math.abs(t) * length * 0.15);

                ctx.save();
                ctx.rotate(angle);
                const featherGrad = ctx.createLinearGradient(0,0, 0, currentLen);
                featherGrad.addColorStop(0, WingedEngine.RaptorParts.getFeatherColor(ctx, colorRange, seed + i, -10));
                featherGrad.addColorStop(1, WingedEngine.RaptorParts.getFeatherColor(ctx, colorRange, seed + i, 5));
                ctx.fillStyle = featherGrad;

                ctx.beginPath();
                ctx.moveTo(0,0);
                ctx.quadraticCurveTo(10, currentLen * 0.6, 7, currentLen);
                ctx.lineTo(-7, currentLen);
                ctx.quadraticCurveTo(-10, currentLen * 0.6, 0, 0);
                ctx.fill();
                
                ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(0, currentLen); 
                ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = 1; ctx.stroke();
                
                ctx.restore();
            }
            ctx.restore();
        },

        drawWingFeathers: (ctx, sectionLen, colorRange, type, shape, seed) => {
            let count, startAngle, fWidth, lenMult;
            
            if (type === 'primary') {
                count = shape === 'pointed_fast' ? 14 : 18; 
                startAngle = 0.0; fWidth = 12; lenMult = 1.0; 
            } else if (type === 'secondary') {
                count = 24; 
                startAngle = 0.2; fWidth = 16; lenMult = 0.7; 
            } else { 
                count = 35; 
                startAngle = 0.1; fWidth = 18; lenMult = 0.35; 
            }
            
            const spacing = sectionLen / count; 

            for (let i = 0; i < count; i++) {
                ctx.save();
                ctx.translate(i * spacing, 0); 
                
                const angleInfo = startAngle + (i / count) * 0.5;
                const spreadMod = type === 'primary' ? (i*i * 0.005) : 0;
                ctx.rotate(angleInfo + spreadMod);

                const fLen = sectionLen * lenMult * seededRandomRange(0.9, 1.1);
                const currentWidth = fWidth * seededRandomRange(0.9, 1.3);

                const featherGrad = ctx.createLinearGradient(0,0, fLen, 0);
                featherGrad.addColorStop(0, WingedEngine.RaptorParts.getFeatherColor(ctx, colorRange, seed + i, 0));
                featherGrad.addColorStop(1, WingedEngine.RaptorParts.getFeatherColor(ctx, colorRange, seed + i, -15));
                ctx.fillStyle = featherGrad;

                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.quadraticCurveTo(fLen * 0.5, -currentWidth * 0.4, fLen, 0);
                ctx.quadraticCurveTo(fLen * 0.5, currentWidth * 0.9, 0, 0);
                ctx.fill();
                
                ctx.strokeStyle = 'rgba(0,0,0,0.2)'; 
                ctx.lineWidth = 1.5; 
                ctx.stroke();

                ctx.restore();
            }
        },

        drawTorsoAndTalons: (ctx, colorRange, talonColor, isFlapping, time, seed) => {
            const torsoGrad = ctx.createRadialGradient(0, 10, 5, 0, 15, 35);
            torsoGrad.addColorStop(0, WingedEngine.RaptorParts.getFeatherColor(ctx, colorRange, seed, 15));
            torsoGrad.addColorStop(1, WingedEngine.RaptorParts.getFeatherColor(ctx, colorRange, seed, -20));
            ctx.fillStyle = torsoGrad;

            ctx.beginPath();
            ctx.ellipse(0, 15, 18, 28, 0, 0, Math.PI*2);
            ctx.fill();
            
            ctx.fillStyle = 'rgba(0,0,0,0.15)';
            for(let i=0; i<30; i++) { 
                const sx = seededRandomRange(-12, 12); 
                const sy = seededRandomRange(0, 32);
                ctx.beginPath(); 
                ctx.moveTo(sx, sy); 
                ctx.lineTo(sx+2, sy+3); 
                ctx.lineTo(sx+4, sy); 
                ctx.fill();
            }

            const talonState = isFlapping ? 0.9 : 0.1; 
            ctx.fillStyle = talonColor || '#222';
            ctx.strokeStyle = talonColor || '#222';
            
            for(let dir of [-1, 1]) {
                ctx.save();
                ctx.translate(10 * dir, 38); 
                const sway = Math.sin(time * 0.003 + dir) * 0.15;
                ctx.rotate(sway * talonState);
                
                ctx.fillStyle = WingedEngine.RaptorParts.getFeatherColor(ctx, colorRange, seed, -5);
                ctx.beginPath(); ctx.ellipse(0, -5, 9, 14, dir*0.2, 0, Math.PI*2); ctx.fill();

                ctx.translate(0, 6);
                ctx.lineWidth = 3.5; ctx.lineCap = 'round'; ctx.strokeStyle = talonColor || '#111';
                
                ctx.beginPath(); 
                ctx.arc(0, 0, 6, 0, Math.PI, false);
                ctx.stroke();
                
                for(let j=-1; j<=1; j++) {
                     ctx.beginPath(); 
                     ctx.moveTo(j*3.5, 2); 
                     ctx.quadraticCurveTo(j*5, 10, j*2, 12); 
                     ctx.stroke();
                }
                ctx.restore();
            }
        },

        drawHead: (ctx, config, seed, time) => {
            const { colors, beakShape, eyeSize, earTufts } = config;
            ctx.save();
            ctx.translate(0, -15); 
            const lookAngle = Math.sin(time * 0.001) * 0.15;
            ctx.rotate(lookAngle);

            // 1. FORMA BASE DE LA CABEZA
            const headGrad = ctx.createRadialGradient(-5, -5, 2, 0, 0, 24); 
            headGrad.addColorStop(0, WingedEngine.RaptorParts.getFeatherColor(ctx, colors.head, seed, 10));
            headGrad.addColorStop(1, WingedEngine.RaptorParts.getFeatherColor(ctx, colors.head, seed, -15));
            ctx.fillStyle = headGrad;

            ctx.beginPath();
            ctx.ellipse(0, -2, 15, 17, 0, 0, Math.PI*2);
            ctx.fill();

            if (earTufts) {
                 ctx.beginPath();
                 ctx.moveTo(-12, -12); ctx.quadraticCurveTo(-22, -30, -8, -20);
                 ctx.moveTo(12, -12); ctx.quadraticCurveTo(22, -30, 8, -20);
                 ctx.fill();
            }

            // 2. PICO 
            ctx.fillStyle = colors.beak || '#333';
            ctx.beginPath();
            ctx.moveTo(-4, 2); 
            if (beakShape === 'hook_heavy' || beakShape === 'hook_sharp') {
                ctx.quadraticCurveTo(0, 14, 4, 2); 
                ctx.lineTo(1.5, 16); 
                ctx.lineTo(-1.5, 16);
            } else { 
                ctx.quadraticCurveTo(0, 10, 4, 2);
                ctx.lineTo(0, 10);
            }
            ctx.fill();

            // 3. OJOS Y CEJAS 
            const isOwl = beakShape === 'hook_buried';
            
            // CAMBIO: Definimos el espaciado para todos (Búhos más separados, Águilas un poco más juntas para enfoque frontal)
            const eyeSpacing = isOwl ? 8 : 6; 
            const eSize = (eyeSize || 1) * 3.8;

            for(let dir of [-1, 1]) {
                // CAMBIO: Eliminada la restricción que impedía dibujar el segundo ojo a las no-búhos
                
                const ex = dir * eyeSpacing; 
                const ey = -5;

                ctx.save();
                ctx.translate(ex, ey);

                // A. Globo Ocular Completo
                ctx.fillStyle = '#fc0'; // Iris
                ctx.beginPath(); ctx.arc(0, 0, eSize, 0, Math.PI*2); ctx.fill();

                // Pupila (Centrada en el globo)
                ctx.fillStyle = '#000';
                ctx.beginPath(); ctx.arc(0, 0, eSize * 0.45, 0, Math.PI*2); ctx.fill();
                
                // Brillo
                ctx.fillStyle = '#fff';
                ctx.beginPath(); ctx.arc(eSize*0.3, -eSize*0.3, eSize * 0.2, 0, Math.PI*2); ctx.fill();

                // B. CEJA (Cresta Supraorbital)
                ctx.fillStyle = WingedEngine.RaptorParts.getFeatherColor(ctx, colors.head, seed, -25); 
                
                ctx.beginPath();
                const browCurve = isOwl ? eSize * 0.2 : eSize * 0.6; 
                const browHeight = isOwl ? -eSize * 1.0 : -eSize * 0.6;

                ctx.moveTo(-eSize * 1.3, -eSize * 1.5); 
                ctx.quadraticCurveTo(0, browHeight + browCurve, eSize * 1.3, -eSize * 1.5); 
                ctx.lineTo(eSize * 1.3, browHeight); 
                ctx.quadraticCurveTo(0, browHeight + browCurve*1.5, -eSize * 1.3, browHeight); 
                ctx.closePath();
                ctx.fill();

                ctx.restore();
            }

            ctx.restore();
        }
    }
};