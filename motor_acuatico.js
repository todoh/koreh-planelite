// IMPORTAR DESDE UTILS.JS
import { seededRandomRange } from './utils.js';

export const AquaticEngine = {
    render: (ctx, width, height, time, seed, type, config) => {
        const centerX = width / 2;
        const centerY = height / 2;
        ctx.translate(centerX, centerY);

        // K -> Flujo de movimiento acuático
        const swimOffset = Math.sin(time * config.speed * 500) * 10;
        
        if (type === 'cephalopod') {
            AquaticEngine.drawCephalopod(ctx, time, seed, config);
        } else if (type === 'fish' || type === 'aquatic_mammal') {
            AquaticEngine.drawSwimmer(ctx, time, seed, config, type, swimOffset);
        }
    },

    drawCephalopod: (ctx, time, seed, config) => {
        const { headSize, tentacles, length, colorSkin } = config;
        
        // Cabeza
        ctx.fillStyle = `hsl(${seededRandomRange(colorSkin[0], colorSkin[1])}, 60%, 50%)`;
        ctx.beginPath();
        ctx.ellipse(0, -20, headSize, headSize * 1.5, 0, 0, Math.PI*2);
        ctx.fill();
        
        // Ojos
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(-10, -10, 8, 0, Math.PI*2);
        ctx.arc(10, -10, 8, 0, Math.PI*2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.rect(-14, -12, 8, 4); 
        ctx.rect(6, -12, 8, 4);
        ctx.fill();

        // Tentáculos
        ctx.lineCap = 'round';
        for(let i=0; i<tentacles; i++) {
            const angleBase = (i / tentacles) * Math.PI + Math.PI; 
            const tOffset = i * 0.5;
            
            ctx.beginPath();
            ctx.moveTo(0, 0);
            
            let prevX = 0;
            let prevY = 0;
            
            for(let j=0; j<20; j++) {
                const segLen = length / 20;
                const wave = Math.sin(time * 0.003 + tOffset + j * 0.2) * (j * config.curl);
                const angle = angleBase + (wave * 0.05);
                
                const nx = prevX + Math.cos(angle) * segLen;
                const ny = prevY + Math.sin(angle) * segLen;
                
                ctx.lineTo(nx, ny);
                prevX = nx;
                prevY = ny;
            }
            
            ctx.lineWidth = headSize * 0.4;
            ctx.strokeStyle = ctx.fillStyle;
            ctx.stroke();
            
            if (config.suctionCups) {
                ctx.strokeStyle = 'rgba(255,255,255,0.3)';
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        }
    },

    drawSwimmer: (ctx, time, seed, config, type, swimOffset) => {
        const { length, width, colorSkin, colorScale, tailType } = config;
        const isMammal = type === 'aquatic_mammal';
        
        // Cuerpo
        const hue = isMammal ? seededRandomRange(colorSkin[0], colorSkin[1]) : seededRandomRange(colorScale[0], colorScale[1]);
        ctx.fillStyle = `hsl(${hue}, ${isMammal ? '30%' : '70%'}, ${isMammal ? '40%' : '60%'})`;
        
        ctx.save();
        ctx.rotate(Math.sin(time * config.speed * 200) * 0.05);

        ctx.beginPath();
        ctx.ellipse(0, 0, length, width, 0, 0, Math.PI*2);
        ctx.fill();

        // Aletas
        ctx.beginPath();
        ctx.moveTo(10, 5);
        ctx.lineTo(-10, width + 10);
        ctx.lineTo(20, width);
        ctx.fill();

        // Cola
        const tailX = -length;
        ctx.save();
        ctx.translate(tailX, 0);
        
        const tailWave = Math.sin(time * config.speed * 800) * 0.5;
        ctx.rotate(tailWave);
        
        ctx.beginPath();
        if (tailType === 'fluke') { 
            ctx.moveTo(0, 0);
            ctx.lineTo(-20, -15);
            ctx.lineTo(-25, 0);
            ctx.lineTo(-20, 15);
        } else { 
            ctx.moveTo(0, 0);
            ctx.lineTo(-20, -10);
            ctx.lineTo(-20, 10);
        }
        ctx.fill();
        ctx.restore();

        // Ojo
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(length * 0.6, -width * 0.3, isMammal ? 2 : 4, 0, Math.PI*2);
        ctx.fill();

        ctx.restore();
    }
};