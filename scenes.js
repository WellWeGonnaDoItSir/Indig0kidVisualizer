// Original procedural scenes. Coordinates are centered in a 500-unit-high viewport.
export const SCENES = [
  { id: 'orbit', name: 'Indigo orbit', category: 'cosmic', mood: 'COSMIC & FLUID' },
  { id: 'wave', name: 'Silk waves', category: 'fluid', mood: 'SOFT & IMMERSIVE' },
  { id: 'spectrum', name: 'After hours', category: 'electric', mood: 'SHARP & ELECTRIC' },
  { id: 'tunnel', name: 'Hyperdrive', category: 'cosmic', mood: 'INFINITE NEON TUNNEL' },
  { id: 'eclipse', name: 'Solar eclipse', category: 'cosmic', mood: 'DARK SUN / BRIGHT CORONA' },
  { id: 'liquid', name: 'Liquid chrome', category: 'fluid', mood: 'MOLTEN & ORGANIC' },
  { id: 'ribbons', name: 'Satin ribbons', category: 'fluid', mood: 'FLOATING LIGHT SCULPTURE' },
  { id: 'vortex', name: 'Spiral motion', category: 'fluid', mood: 'HYPNOTIC & ROTATING' },
  { id: 'radial', name: 'Bass crown', category: 'electric', mood: 'RADIAL FREQUENCY BARS' },
  { id: 'nebula', name: 'Stardust', category: 'cosmic', mood: 'PARTICLE CONSTELLATION' },
  { id: 'grid', name: 'Cyber grid', category: 'geometry', mood: 'SYNTHWAVE / PERSPECTIVE' },
  { id: 'terrain', name: 'Frequency hills', category: 'geometry', mood: 'LIVING WIREFRAME LANDSCAPE' },
  { id: 'helix', name: 'Double helix', category: 'geometry', mood: 'TWISTING LIGHT STRUCTURE' },
  { id: 'shards', name: 'Prism break', category: 'geometry', mood: 'EXPLODING CRYSTAL FACETS' },
  { id: 'mandala', name: 'Sacred geometry', category: 'geometry', mood: 'KALEIDOSCOPIC SYMMETRY' },
  { id: 'aurora', name: 'Northern lights', category: 'fluid', mood: 'LUMINOUS COLOR CURTAINS' },
  { id: 'heartbeat', name: 'Pulse line', category: 'electric', mood: 'REAL AUDIO WAVEFORM' },
  { id: 'glitch', name: 'Signal error', category: 'electric', mood: 'SCANLINES & DIGITAL DISTORTION' },
  { id: 'blackhole', name: 'Event horizon', category: 'cosmic', mood: 'GRAVITY & ACCRETION DISK' },
  { id: 'rain', name: 'Neon rain', category: 'electric', mood: 'FALLING AUDIO LIGHTS' }
];

export function renderScene(ctx, id, s) {
  const { time: t, intensity: energy, impact: hit, complexity: detail, phase, bins, samples } = s;
  const color = s.color || [167, 132, 255];
  const width = s.width || 890;
  const rgba = (a, boost = 0) => `rgba(${color.map(v => Math.min(255, v + boost)).join(',')},${Math.max(0, Math.min(1, a))})`;
  const stroke = (alpha = 0.5, thickness = 1, boost = 0) => { ctx.strokeStyle = rgba(alpha, boost); ctx.lineWidth = thickness; ctx.stroke(); };
  const ring = (r, alpha, thickness = 1) => { ctx.beginPath(); ctx.arc(0, 0, Math.max(1, r), 0, Math.PI * 2); stroke(alpha, thickness); };
  const freq = i => bins ? (bins[Math.max(0, Math.min(bins.length - 1, i))] || 0) / 255 : 0;
  const seed = n => { const x = Math.sin(n * 127.1 + 19.7) * 43758.5453; return x - Math.floor(x); };
  const point = (x, y, i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
  if (id === 'orbit') {
    const radius = Math.min(180, 94 + energy * 42 + hit * 26);
    for (let layer = 0; layer < 24; layer++) {
      ctx.beginPath(); const rotation = t * 0.12 + layer * 0.055;
      for (let i = 0; i <= 240; i++) {
        const a = i / 240 * Math.PI * 2;
        const ripple = Math.sin(a * 5 + t * 0.8 + layer * 0.21) * (3 + energy * 12) + Math.sin(a * 13 - t + layer * 0.15) * (1.5 + detail * 14) + Math.sin(a * 27 + phase + layer * 0.22) * (energy * 6 + hit * 7);
        const r = radius + ripple + Math.sin(layer * 0.5 + a * 3 + t * 0.4) * 5;
        const x = Math.cos(a) * r, y = Math.sin(a) * r * (0.82 + Math.sin(layer * 0.13 + t * 0.2) * 0.12);
        point(x * Math.cos(rotation) - y * Math.sin(rotation), x * Math.sin(rotation) + y * Math.cos(rotation), i);
      }
      ctx.closePath(); stroke(0.16 + (layer % 5) * 0.055 + energy * 0.2 + hit * 0.2, layer % 7 === 0 ? 1.3 + hit : 0.7);
    }
  } else if (id === 'wave') {
    for (let layer = 0; layer < 36; layer++) {
      ctx.beginPath();
      for (let i = 0; i <= 235; i++) {
        const x = (i / 235 - 0.5) * width * 1.05, envelope = Math.exp(-x * x / 80000);
        point(x, (layer - 18) * 5 + Math.sin(x * 0.014 + t * 0.6 + layer * 0.09) * (25 + energy * 80 + hit * 40) * envelope + Math.cos(x * 0.09 - phase) * (detail * 25 + hit * 15) * envelope, i);
      } stroke(0.12 + layer / 100 + energy * 0.15, 0.8);
    }
  } else if (id === 'spectrum') {
    for (let i = 0; i < 80; i++) {
      const f = freq(Math.floor((i / 80) ** 2 * 450) + 1);
      const bar = 5 + f * (35 + detail * 180) + (energy * 110 + hit * 80) * Math.exp(-(((i - 40) / 25) ** 2));
      ctx.fillStyle = rgba(0.35 + f * 0.6); ctx.fillRect((i - 40) * width / 105, -bar / 2, width / 300, bar);
    }
  } else if (id === 'tunnel') {
    for (let layer = 0; layer < 25; layer++) {
      const depth = ((layer / 25 + t * 0.16) % 1), r = 12 + depth ** 2 * 460 + energy * depth * 25;
      ctx.beginPath();
      for (let i = 0; i <= 8; i++) {
        const a = i / 8 * Math.PI * 2 + t * 0.1 + (1 - depth) * (0.7 + energy * 0.4);
        point(Math.cos(a) * r * 1.4, Math.sin(a) * r + Math.sin(t * 0.7) * (1 - depth) * 30, i);
      } stroke(0.08 + depth * 0.45 + hit * 0.15, 0.6 + depth * 1.2);
    }
  } else if (id === 'eclipse') {
    const r = 90 + energy * 25 + hit * 18;
    for (let i = 0; i < 150; i++) {
      const a = i / 150 * Math.PI * 2 + t * 0.08, flare = 5 + seed(i) * 30 + freq(i + 1) * 25 + hit * seed(i + 99) * 55;
      ctx.beginPath(); ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r); ctx.lineTo(Math.cos(a) * (r + flare), Math.sin(a) * (r + flare)); stroke(0.15 + seed(i) * 0.5, 0.7);
    }
    for (let i = 0; i < 9; i++) ring(r + i * 1.5, 0.6 * (1 - i / 9) + hit * 0.1, 1);
    const halo = ctx.createRadialGradient(0, 0, r * 0.8, 0, 0, r * 1.5); halo.addColorStop(0, '#05060c'); halo.addColorStop(0.66, rgba(0.07)); halo.addColorStop(1, rgba(0)); ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(0, 0, r * 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#05060c'; ctx.beginPath(); ctx.arc(0, 0, r - 1, 0, Math.PI * 2); ctx.fill(); ring(r, 0.85, 1.8);
  } else if (id === 'liquid') {
    for (let layer = 0; layer < 30; layer++) {
      ctx.beginPath();
      for (let i = 0; i <= 140; i++) {
        const a = i / 140 * Math.PI * 2, r = 62 + layer * 3 + energy * 22 + Math.sin(a * 3 + t + layer * 0.12) * (22 + hit * 20) + Math.cos(a * 2 - t * 0.6) * 17;
        point(Math.cos(a) * r * 1.1, Math.sin(a) * r * 0.85, i);
      } ctx.closePath(); ctx.fillStyle = rgba(0.018); ctx.fill(); stroke(0.14 + (Math.sin(layer * 0.8 + t) + 1) * 0.24, 0.8, layer % 5 === 0 ? 50 : 0);
    }
  } else if (id === 'ribbons') {
    for (let band = 0; band < 8; band++) {
      for (let edge = 0; edge < 4; edge++) {
        ctx.beginPath();
        for (let i = 0; i <= 130; i++) {
          const x = (i / 130 - 0.5) * width * 0.85, a = x * 0.008 + t * 0.4 + band * 0.28;
          const y = Math.sin(a) * (75 + energy * 60) + Math.sin(a * 2.1 + band) * (20 + hit * 18) + (band - 4) * 9 + edge * 2 * Math.cos(a);
          point(x, y, i);
        } stroke(0.12 + edge * 0.08 + band * 0.025, edge === 3 ? 1.2 : 0.7);
      }
    }
  } else if (id === 'vortex') {
    for (let arm = 0; arm < 9; arm++) {
      ctx.beginPath();
      for (let i = 0; i <= 240; i++) {
        const p = i / 240, a = p * 9 + arm * Math.PI * 2 / 9 + t * 0.6 + energy * 0.4, r = p * (180 + energy * 25) + Math.sin(p * 30 + phase) * hit * 5;
        point(Math.cos(a) * r, Math.sin(a) * r, i);
      } stroke(0.25 + arm * 0.035 + hit * 0.18, 1 + energy * 0.6);
    }
  } else if (id === 'radial') {
    const r = 60 + energy * 20;
    for (let i = 0; i < 120; i++) {
      const a = i / 120 * Math.PI * 2 - Math.PI / 2, f = freq(1 + Math.floor((i < 60 ? i : 120 - i) ** 1.5));
      const length = 4 + f * 70 + energy * 25 + hit * (15 + seed(i) * 30);
      ctx.beginPath(); ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r); ctx.lineTo(Math.cos(a) * (r + length), Math.sin(a) * (r + length)); stroke(0.4 + f * 0.5, 2.1);
    } ring(r - 6, 0.6, 1); ring(r - 10, 0.2, 0.5);
  } else if (id === 'nebula') {
    const spin = t * 0.1;
    for (let i = 0; i < 420; i++) {
      const a = i * 2.39996 + spin, r = Math.sqrt(i / 420) * (140 + energy * 35) + Math.sin(i * 0.7 + t) * hit * 18;
      const x = Math.cos(a) * r * 1.4, y = Math.sin(a) * r * 0.75 + Math.sin(a * 2 + t) * 20;
      ctx.fillStyle = rgba(0.2 + seed(i) * 0.5 + hit * 0.2); ctx.beginPath(); ctx.arc(x, y, 0.5 + seed(i + 77) * 1.5 + energy * 0.4, 0, Math.PI * 2); ctx.fill();
      if (i % 13 === 0) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x * 0.92, y * 0.92); stroke(0.15, 0.5); }
    }
  } else if (id === 'grid') {
    const horizon = -70 - hit * 12;
    for (let i = -14; i <= 14; i++) { ctx.beginPath(); ctx.moveTo(i * 8, horizon); ctx.lineTo(i * 55, 250); stroke(0.12 + energy * 0.18, 0.8); }
    for (let i = 0; i < 24; i++) {
      const z = ((i / 24 + t * 0.12) % 1), y = horizon + z ** 3 * (250 - horizon);
      ctx.beginPath(); ctx.moveTo(-width / 2, y); ctx.lineTo(width / 2, y); stroke(0.06 + z * 0.45 + hit * 0.12, 0.8);
    }
    ctx.save(); ctx.translate(0, horizon - 15); ring(58 + energy * 13, 0.65, 1.3); ctx.restore();
    for (let i = 0; i < 11; i++) { const y = horizon - 65 + i * 8; ctx.beginPath();ctx.moveTo(-Math.sqrt(Math.max(0, 58 ** 2 - (y - horizon + 15) ** 2)), y);ctx.lineTo(Math.sqrt(Math.max(0, 58 ** 2 - (y - horizon + 15) ** 2)), y);stroke(0.22,0.8); }
  } else if (id === 'terrain') {
    const project = (x, z) => {
      const distance = 1.8 + z * 0.55, perspective = 1.8 / distance, f = freq(Math.floor(Math.abs(x) * 14 + z * 5));
      const peak = Math.sin(x * 0.6 + t * 0.7 + z * 0.8) * Math.cos(z * 0.7 - t * 0.5) * (20 + energy * 65) + f * 45 + hit * Math.cos(x * 2) * 22;
      return [x * width * 0.038 * perspective, 160 - z * 28 - peak * perspective];
    };
    for (let z = 0; z < 22; z++) { ctx.beginPath(); for (let i = 0; i <= 50; i++) { const p = project((i - 25) * 0.5, z * 0.35);point(...p,i); }stroke(0.5 - z * 0.017 + hit * 0.08,0.75); }
    for (let x = -12; x <= 12; x++) { ctx.beginPath();for (let i = 0; i < 22; i++) { const p = project(x, i * 0.35);point(...p,i); }stroke(0.18,0.5); }
  } else if (id === 'helix') {
    const amp = 65 + energy * 30 + hit * 18;
    for (let strand = 0; strand < 2; strand++) {
      ctx.beginPath();for (let i = 0; i <= 150; i++) { const y=(i/150-0.5)*330, a=y*0.026+t*0.8+strand*Math.PI;point(Math.sin(a)*amp,y,i); }stroke(0.65,1.5);
    }
    for (let i = 0; i < 38; i++) { const y=(i/38-0.5)*330,a=y*0.026+t*0.8,x=Math.sin(a)*amp;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(-x,y);stroke(0.1+Math.abs(Math.cos(a))*0.4,0.9);ctx.fillStyle=rgba(0.7);ctx.beginPath();ctx.arc(x,y,2+hit,0,Math.PI*2);ctx.fill(); }
  } else if (id === 'shards') {
    for (let i=0;i<42;i++) {
      const a=seed(i)*Math.PI*2+t*0.08,r=35+seed(i+41)*105+energy*25+hit*seed(i+9)*70;
      const x=Math.cos(a)*r*1.2,y=Math.sin(a)*r,size=8+seed(i+97)*22;
      ctx.save();ctx.translate(x,y);ctx.rotate(a+t*(seed(i)-0.5)*0.3);ctx.beginPath();ctx.moveTo(-size,-size*0.7);ctx.lineTo(size,size*0.1);ctx.lineTo(-size*0.2,size);ctx.closePath();ctx.fillStyle=rgba(0.03+hit*0.04);ctx.fill();stroke(0.2+seed(i)*0.45,0.8);ctx.beginPath();ctx.moveTo(-size,-size*0.7);ctx.lineTo(0,0);ctx.lineTo(-size*0.2,size);stroke(0.18,0.5);ctx.restore();
    }
  } else if (id === 'mandala') {
    ctx.save();ctx.rotate(t*0.08);
    for(let layer=0;layer<9;layer++) {
      ctx.beginPath();for(let i=0;i<=240;i++){const a=i/240*Math.PI*2,r=45+layer*13+(12+energy*15+hit*10)*Math.cos(a*8+t*0.3+layer*0.35);point(Math.cos(a)*r,Math.sin(a)*r,i);}ctx.closePath();stroke(0.18+layer*0.045+hit*0.15,0.85);
    }
    for(let i=0;i<12;i++){ctx.save();ctx.rotate(i*Math.PI/6);ctx.beginPath();ctx.ellipse(65+energy*13,0,65+hit*12,18+energy*8,0,0,Math.PI*2);stroke(0.3,0.7);ctx.restore();}ctx.restore();
  } else if (id === 'aurora') {
    for(let layer=0;layer<55;layer++) {
      ctx.beginPath();for(let i=0;i<=110;i++){const x=(i/110-0.5)*width*0.95,u=x*0.009+t*0.24,y=Math.sin(u)*55+Math.sin(u*2.7+layer*0.03)*24+(layer-27)*2.6+Math.sin(x*0.03+t+layer*0.1)*energy*18-hit*Math.cos(u)*18;point(x,y,i);}stroke(0.03+Math.sin(layer/55*Math.PI)*0.22,1.4,layer%3===0?20:0);
    }
  } else if (id === 'heartbeat') {
    const span=width*0.8;
    ctx.beginPath();ctx.moveTo(-span/2,0);ctx.lineTo(span/2,0);stroke(0.12+energy*0.08,0.5);
    for(let layer=0;layer<3;layer++) {
      ctx.beginPath();for(let i=0;i<=400;i++){const x=(i/400-0.5)*span,index=samples?Math.min(samples.length-1,Math.floor(i/400*(samples.length-1))):0;const amplitude=samples?samples[index]:0;point(x,amplitude*(100+energy*100+hit*35)+(layer-1)*3,i);}stroke(layer===1?0.85:0.18,layer===1?1.4:0.7,layer===1?40:0);
    }
    // A beat marker accompanies the unmodified waveform samples.
    ctx.fillStyle=rgba(0.4+hit*0.3);ctx.beginPath();ctx.arc(0,0,2+energy*2+hit*3,0,Math.PI*2);ctx.fill();
  } else if (id === 'glitch') {
    for(let i=0;i<70;i++) {
      const tick=Math.floor(t*12),f=freq(i*3+1),y=(i-35)*4,offset=(seed(i+tick*0.17)-0.5)*(5+hit*95);
      const length=15+f*170+energy*45+(i%7===0?hit*150:0);
      ctx.fillStyle=rgba(i%7===0?0.65:0.12+f*0.45);ctx.fillRect(-length/2+offset,y,length, i%7===0?3:1);
      if(i%9===0){ctx.fillStyle=rgba(0.12);ctx.fillRect(-width*0.35+offset,y,width*0.7,0.6);}
    }
    ctx.font='9px monospace';ctx.fillStyle=rgba(0.45);ctx.fillText(`SIGNAL / ${String(Math.floor(energy*100)).padStart(3,'0')}`, -width*0.3,165);
  } else if (id === 'blackhole') {
    const core=40+energy*12;
    ctx.save();ctx.rotate(-0.25);
    for(let layer=0;layer<25;layer++) {
      ctx.beginPath();for(let i=0;i<=180;i++){const a=i/180*Math.PI*2,r=core+30+layer*3+Math.sin(a*4+t+layer*0.2)*(2+hit*7);point(Math.cos(a)*r*1.45,Math.sin(a)*r*0.3,i);}stroke(0.08+layer/110+hit*0.12,0.65);
    }ctx.restore();
    ctx.fillStyle='#04050a';ctx.beginPath();ctx.arc(0,0,core,0,Math.PI*2);ctx.fill();ring(core+2,0.8,1.6);ring(core+7,0.25,0.8);
    for(let i=0;i<8;i++){ctx.beginPath();ctx.arc(0,0,core+10+i*2,t*0.3+i*0.3,t*0.3+i*0.3+Math.PI*1.3);stroke(0.08+(7-i)*0.035,0.6);}
  } else if (id === 'rain') {
    for(let i=0;i<100;i++) {
      const x=(seed(i)-0.5)*width*0.85,speed=35+seed(i+31)*80,y=((seed(i+72)*500+t*speed)%500)-250;
      const f=freq(1+Math.floor(seed(i)*200)),length=5+f*20+energy*14+hit*seed(i)*35;
      const grad=ctx.createLinearGradient(x,y-length,x,y);grad.addColorStop(0,rgba(0));grad.addColorStop(1,rgba(0.15+f*0.6+hit*0.18));ctx.fillStyle=grad;ctx.fillRect(x,y-length,1+seed(i+20),length);
    }
  }
}
