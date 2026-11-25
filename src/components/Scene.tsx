/**
 * 🏡 The study room illustration (pure SVG, 5 themes).
 * Children are rendered on top (the pet sits on the desk).
 */
import { memo, type ReactNode } from 'react';
import type { ThemeId } from '../lib/types';
import './scene.css';

const L = '#5A4250';

const T: Record<ThemeId, { wall: string; wall2: string; sky: [string, string]; curtain: string; wood: string; woodDark: string; glow: string; dim: number }> = {
  bedroom: { wall: '#FBE1D3', wall2: '#F8D5C4', sky: ['#FFC9A9', '#F7AFC4'], curtain: '#F7C6CF', wood: '#DDAA7F', woodDark: '#C48E64', glow: '#FFE3A3', dim: 0.06 },
  rainy: { wall: '#DCE5EF', wall2: '#D0DCE8', sky: ['#8FA5BC', '#C3CFDC'], curtain: '#C6E0F5', wood: '#C9A07C', woodDark: '#AE8662', glow: '#FFE0A0', dim: 0.1 },
  library: { wall: '#EBDCC6', wall2: '#E2D0B6', sky: ['#CDE5F6', '#EEF6FB'], curtain: '#CDE3C4', wood: '#B98A62', woodDark: '#9A6F4B', glow: '#FFE6B0', dim: 0.04 },
  night: { wall: '#3B3868', wall2: '#35325F', sky: ['#17153A', '#3A3672'], curtain: '#8C7CC4', wood: '#8A6C78', woodDark: '#6E5560', glow: '#FFD88A', dim: 0.42 },
  spring: { wall: '#E7F3DF', wall2: '#DCEDD2', sky: ['#AEDCF6', '#E4F5FF'], curtain: '#FFE8A6', wood: '#E0B48A', woodDark: '#C7976D', glow: '#FFF0B8', dim: 0 },
};

function Window({ theme }: { theme: ThemeId }) {
  const c = T[theme];
  const arched = theme === 'library';
  const x = arched ? 640 : 600;
  const w = arched ? 230 : 290;
  const y = arched ? 40 : 64;
  const h = arched ? 300 : 250;
  const inner = arched
    ? `M${x} ${y + 115} A${w / 2} ${w / 2} 0 0 1 ${x + w} ${y + 115} L${x + w} ${y + h} L${x} ${y + h} Z`
    : `M${x} ${y} H${x + w} V${y + h} H${x} Z`;
  return (
    <g>
      <defs>
        <linearGradient id={`sky-${theme}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={c.sky[0]} />
          <stop offset="1" stopColor={c.sky[1]} />
        </linearGradient>
        <clipPath id={`win-${theme}`}>
          <path d={inner} />
        </clipPath>
      </defs>
      <path d={inner} fill={`url(#sky-${theme})`} />
      <g clipPath={`url(#win-${theme})`}>
        {theme === 'bedroom' && (
          <g>
            <circle cx={760} cy={250} r={46} fill="#FFE7A8" opacity={0.95} />
            <g className="scene-cloud" fill="#FFF3EA" opacity={0.9}>
              <ellipse cx={660} cy={130} rx={46} ry={16} />
              <ellipse cx={690} cy={120} rx={30} ry={16} />
            </g>
            <g className="scene-cloud scene-cloud--slow" fill="#FFF3EA" opacity={0.8}>
              <ellipse cx={830} cy={170} rx={40} ry={13} />
            </g>
            <path d="M600 280 Q680 250 760 276 T900 268 V320 H600 Z" fill="#E59BAE" opacity={0.55} />
          </g>
        )}
        {theme === 'rainy' && (
          <g>
            <g fill="#7D90A6" opacity={0.75}>
              <ellipse cx={660} cy={100} rx={70} ry={26} />
              <ellipse cx={720} cy={86} rx={50} ry={26} />
              <ellipse cx={840} cy={118} rx={70} ry={24} />
            </g>
            <path d="M600 290 L650 250 L690 270 L740 230 L800 268 L850 246 L890 270 V320 H600 Z" fill="#8296AC" opacity={0.6} />
            <g className="scene-rain" stroke="#EEF4FA" strokeWidth={2.2} strokeLinecap="round" opacity={0.8}>
              {Array.from({ length: 34 }, (_, i) => {
                const rx = 600 + ((i * 53) % 300);
                const ry = 40 + ((i * 97) % 280);
                return <path key={i} d={`M${rx} ${ry} l-6 18`} style={{ animationDelay: `${(i % 7) * -0.13}s` }} />;
              })}
            </g>
            <g className="scene-drops" fill="#F3F7FB" opacity={0.7}>
              <circle cx={640} cy={200} r={3} />
              <circle cx={705} cy={150} r={2.4} />
              <circle cx={820} cy={230} r={3.4} />
              <circle cx={860} cy={120} r={2.2} />
            </g>
          </g>
        )}
        {theme === 'library' && (
          <g>
            <g className="scene-cloud" fill="#fff" opacity={0.9}>
              <ellipse cx={700} cy={150} rx={40} ry={14} />
              <ellipse cx={724} cy={140} rx={24} ry={14} />
            </g>
            <path d="M640 300 Q700 260 760 290 T870 280 V340 H640 Z" fill="#B9D7A8" />
            <path d="M640 320 Q720 300 870 316 V340 H640 Z" fill="#9CC48C" />
          </g>
        )}
        {theme === 'night' && (
          <g>
            <circle cx={800} cy={130} r={36} fill="#FFF4C9" />
            <circle cx={818} cy={118} r={32} fill={c.sky[0]} opacity={0.97} />
            <g className="scene-stars" fill="#FFF7D6">
              {[
                [640, 100, 2.4], [690, 170, 1.8], [730, 90, 2.8], [880, 220, 2], [660, 250, 1.6], [750, 220, 2.2], [870, 70, 1.8], [620, 190, 1.4],
              ].map(([sx, sy, r], i) => (
                <circle key={i} cx={sx} cy={sy} r={r} style={{ animationDelay: `${i * 0.37}s` }} />
              ))}
              <path d="M710 140 l3 7 l7 3 l-7 3 l-3 7 l-3 -7 l-7 -3 l7 -3 z" />
            </g>
            <path d="M600 300 L640 270 L660 285 L700 250 L740 280 L780 260 L830 288 L890 262 V320 H600 Z" fill="#26234D" />
            <g fill="#FFE59A">
              <rect x={648} y={290} width={5} height={6} />
              <rect x={712} y={276} width={5} height={6} />
              <rect x={796} y={282} width={5} height={6} />
            </g>
          </g>
        )}
        {theme === 'spring' && (
          <g>
            <circle cx={680} cy={120} r={34} fill="#FFE27A" className="scene-sun" />
            <g className="scene-cloud" fill="#fff">
              <ellipse cx={820} cy={110} rx={46} ry={16} />
              <ellipse cx={846} cy={98} rx={28} ry={16} />
            </g>
            <path d="M600 260 Q690 220 780 252 T900 240 V320 H600 Z" fill="#B7DFA0" />
            <path d="M600 290 Q700 268 900 286 V320 H600 Z" fill="#94CC82" />
            {[630, 680, 735, 790, 850].map((fx, i) => (
              <g key={fx} transform={`translate(${fx} ${296 - (i % 2) * 8})`}>
                <circle r={6} fill={['#F7A8BE', '#FFE07A', '#C9B6F2', '#FFB59A', '#F7A8BE'][i]} />
                <circle r={2.5} fill="#FFF5D0" />
              </g>
            ))}
            <g className="scene-bird" fill="none" stroke={L} strokeWidth={2.4} strokeLinecap="round">
              <path d="M740 170 q6 -6 12 0 q6 -6 12 0" />
            </g>
          </g>
        )}
      </g>
      {/* frame */}
      <path d={inner} fill="none" stroke={L} strokeWidth={6} strokeLinejoin="round" />
      <path d={inner} fill="none" stroke="#FFFDF8" strokeWidth={2.5} strokeLinejoin="round" opacity={0.6} transform={`translate(0 0)`} />
      <path d={`M${x + w / 2} ${arched ? y : y} V${y + h} M${x} ${y + h * (arched ? 0.62 : 0.5)} H${x + w}`} stroke={L} strokeWidth={5} />
      <rect x={x - 22} y={y + h} width={w + 44} height={16} rx={6} fill="#FFFDF8" stroke={L} strokeWidth={4} />
      {theme !== 'library' && (
        <g className="scene-curtains">
          <path d={`M${x - 44} ${y - 26} Q${x + 20} ${y + 120} ${x - 10} ${y + h + 30} L${x - 54} ${y + h + 30} Z`} fill={c.curtain} stroke={L} strokeWidth={4} strokeLinejoin="round" />
          <path d={`M${x + w + 44} ${y - 26} Q${x + w - 20} ${y + 120} ${x + w + 10} ${y + h + 30} L${x + w + 54} ${y + h + 30} Z`} fill={c.curtain} stroke={L} strokeWidth={4} strokeLinejoin="round" />
          <rect x={x - 70} y={y - 34} width={w + 140} height={12} rx={6} fill="#C9A27F" stroke={L} strokeWidth={4} />
        </g>
      )}
      {theme === 'spring' && (
        <g>
          <path d={`M${x - 30} ${y - 20} Q${x + 60} ${y + 30} ${x + 120} ${y - 10} Q${x + 200} ${y + 40} ${x + w + 30} ${y - 16}`} fill="none" stroke="#7DB36A" strokeWidth={4} />
          {[40, 100, 170, 230, 280].map((dx, i) => (
            <ellipse key={dx} cx={x + dx - 20} cy={y + (i % 2 ? 6 : 14)} rx={9} ry={5} fill="#94CC82" stroke={L} strokeWidth={2} transform={`rotate(${i * 40} ${x + dx - 20} ${y + 10})`} />
          ))}
        </g>
      )}
    </g>
  );
}

function Corkboard() {
  return (
    <g>
      <rect x={330} y={92} width={210} height={150} rx={10} fill="#E3BE92" stroke={L} strokeWidth={5} />
      <rect x={342} y={104} width={186} height={126} rx={5} fill="#D6A877" opacity={0.5} />
      <g transform="rotate(-6 380 150)">
        <rect x={352} y={116} width={64} height={70} fill="#fff" stroke={L} strokeWidth={3} />
        <rect x={358} y={122} width={52} height={44} fill="#C6E0F5" />
        <circle cx={384} cy={148} r={11} fill="#F7C6CF" />
        <rect x={370} y={108} width={30} height={12} fill="#D9CCF5" opacity={0.9} />
      </g>
      <g transform="rotate(5 470 140)">
        <rect x={436} y={114} width={70} height={60} fill="#FFE8A6" stroke={L} strokeWidth={3} />
        <text x={471} y={142} textAnchor="middle" fontFamily="Caveat, cursive" fontSize={18} fontWeight={700} fill={L}>you got</text>
        <text x={471} y={162} textAnchor="middle" fontFamily="Caveat, cursive" fontSize={18} fontWeight={700} fill={L}>this ♡</text>
      </g>
      <g transform="rotate(-3 440 210)">
        <rect x={410} y={188} width={86} height={34} fill="#CDE3C4" stroke={L} strokeWidth={3} />
        <text x={453} y={211} textAnchor="middle" fontFamily="Caveat, cursive" fontSize={17} fontWeight={700} fill={L}>1 page at a time</text>
      </g>
      <circle cx={384} cy={112} r={5} fill="#E46F8C" stroke={L} strokeWidth={2} />
      <circle cx={472} cy={116} r={5} fill="#7B9FD8" stroke={L} strokeWidth={2} />
    </g>
  );
}

function LeftDecor({ theme }: { theme: ThemeId }) {
  if (theme === 'library') {
    const colors = ['#F7C6CF', '#D9CCF5', '#CDE3C4', '#C6E0F5', '#FFD8C0', '#FFE8A6', '#E9A0A0', '#B9A6EE'];
    return (
      <g>
        <rect x={10} y={10} width={300} height={440} fill="#A8784F" stroke={L} strokeWidth={5} />
        {[0, 1, 2, 3].map((row) => (
          <g key={row}>
            <rect x={22} y={24 + row * 104} width={276} height={92} fill="#8A5F3C" />
            {Array.from({ length: 13 }, (_, i) => {
              const bw = 14 + ((i * 7 + row * 5) % 9);
              const bh = 62 + ((i * 13 + row * 3) % 26);
              const bx = 26 + i * 21;
              return bx + bw < 296 ? (
                <rect key={i} x={bx} y={24 + row * 104 + (92 - bh)} width={bw} height={bh} rx={2} fill={colors[(i + row * 3) % colors.length]} stroke={L} strokeWidth={2.2} transform={i % 6 === 5 ? `rotate(-8 ${bx} ${24 + row * 104 + 92})` : undefined} />
              ) : null;
            })}
            <rect x={14} y={112 + row * 104} width={292} height={10} fill="#C0905F" stroke={L} strokeWidth={3} />
          </g>
        ))}
        <g stroke={L} strokeWidth={5} strokeLinecap="round">
          <path d="M260 40 L300 450" />
          <path d="M300 40 L340 450" />
          {[100, 180, 260, 340, 420].map((yy) => (
            <path key={yy} d={`M${266 + (yy - 40) * 0.098} ${yy} H${306 + (yy - 40) * 0.098}`} />
          ))}
        </g>
        <g transform="translate(380 70)">
          <circle r={40} fill="#FFFDF8" stroke={L} strokeWidth={5} />
          <path d="M0 0 V-24 M0 0 L16 8" stroke={L} strokeWidth={4} strokeLinecap="round" />
          <circle r={3.5} fill={L} />
        </g>
      </g>
    );
  }
  if (theme === 'bedroom') {
    return (
      <g>
        <rect x={-10} y={250} width={260} height={50} rx={22} fill="#E9B4A4" stroke={L} strokeWidth={5} />
        <rect x={-10} y={290} width={300} height={160} rx={16} fill="#FCEBEF" stroke={L} strokeWidth={5} />
        <ellipse cx={80} cy={300} rx={62} ry={26} fill="#fff" stroke={L} strokeWidth={4} />
        <ellipse cx={190} cy={306} rx={50} ry={22} fill="#D9CCF5" stroke={L} strokeWidth={4} />
        <path d="M-10 340 Q140 316 290 344 L290 450 L-10 450 Z" fill="#F7C6CF" stroke={L} strokeWidth={4} />
        <g fill="#fff" opacity={0.7}>
          {[30, 90, 150, 210, 260].map((hx, i) => <circle key={hx} cx={hx} cy={370 + (i % 2) * 30} r={6} />)}
        </g>
        {/* sleepy kitty on the bed */}
        <g transform="translate(210 330)">
          <ellipse cx={0} cy={0} rx={36} ry={20} fill="#C9C1D6" stroke={L} strokeWidth={3.5} />
          <circle cx={-26} cy={-8} r={16} fill="#C9C1D6" stroke={L} strokeWidth={3.5} />
          <path d="M-38 -18 L-36 -32 L-26 -22 M-22 -22 L-14 -32 L-12 -18" fill="#C9C1D6" stroke={L} strokeWidth={3} strokeLinejoin="round" />
          <path d="M-32 -8 q3 3 6 0 M-22 -8 q3 3 6 0" stroke={L} strokeWidth={2.2} fill="none" strokeLinecap="round" />
          <path d="M30 6 Q52 10 40 -8" stroke={L} strokeWidth={8} fill="none" strokeLinecap="round" />
          <path d="M30 6 Q52 10 40 -8" stroke="#C9C1D6" strokeWidth={4} fill="none" strokeLinecap="round" />
          <text className="scene-zzz" x={-30} y={-34} fontFamily="Fredoka" fontWeight={600} fontSize={16} fill={L}>z z</text>
        </g>
        <StringLights x1={20} x2={560} y={34} />
      </g>
    );
  }
  if (theme === 'night') {
    return (
      <g>
        <StringLights x1={10} x2={980} y={22} />
        <g transform="translate(110 150)">
          <rect x={-70} y={-80} width={140} height={170} rx={8} fill="#26234D" stroke={L} strokeWidth={5} />
          <circle cx={0} cy={-10} r={40} fill="#FFF4C9" />
          <circle cx={14} cy={-22} r={10} fill="#F1E3A8" />
          <circle cx={-14} cy={6} r={7} fill="#F1E3A8" />
          <text x={0} y={70} textAnchor="middle" fontFamily="Caveat" fontSize={22} fontWeight={700} fill="#FFF4C9">goodnight, brain</text>
        </g>
      </g>
    );
  }
  if (theme === 'rainy') {
    return (
      <g>
        <g transform="translate(110 120)">
          <rect x={-72} y={-56} width={144} height={112} rx={8} fill="#fff" stroke={L} strokeWidth={5} />
          <ellipse cx={-10} cy={-6} rx={34} ry={20} fill="#C6E0F5" />
          <ellipse cx={18} cy={-12} rx={26} ry={18} fill="#C6E0F5" />
          <path d="M-20 22 l-4 10 M0 22 l-4 10 M20 22 l-4 10" stroke="#7B9FD8" strokeWidth={4} strokeLinecap="round" />
        </g>
        <g transform="translate(240 230)">
          <path d="M0 0 V200" stroke="#C48E64" strokeWidth={8} strokeLinecap="round" />
          <path d="M-40 70 Q0 10 40 70 Z" fill="#F7C6CF" stroke={L} strokeWidth={4} strokeLinejoin="round" />
          <path d="M0 70 V130 q0 12 -12 12" stroke={L} strokeWidth={4} fill="none" strokeLinecap="round" />
          <circle cx={0} cy={0} r={8} fill="#C48E64" stroke={L} strokeWidth={3} />
        </g>
      </g>
    );
  }
  // spring
  return (
    <g>
      <g transform="translate(130 0)" className="scene-sway">
        <path d="M0 0 V90" stroke={L} strokeWidth={3} />
        <path d="M-36 90 L36 90 L28 136 L-28 136 Z" fill="#F7A8BE" stroke={L} strokeWidth={4} strokeLinejoin="round" />
        {[-30, -14, 4, 22, 34].map((vx, i) => (
          <path key={vx} d={`M${vx} 96 Q${vx - 10} ${150 + i * 14} ${vx + 4} ${190 + i * 18}`} stroke="#7DB36A" strokeWidth={4} fill="none" strokeLinecap="round" />
        ))}
        {[-34, -18, 2, 20, 36].map((vx, i) => (
          <ellipse key={vx} cx={vx} cy={160 + i * 16} rx={8} ry={5} fill="#94CC82" stroke={L} strokeWidth={2} />
        ))}
      </g>
      <g transform="translate(110 300)">
        <rect x={-62} y={-60} width={124} height={96} rx={8} fill="#fff" stroke={L} strokeWidth={5} />
        {[-30, 0, 30].map((fx, i) => (
          <g key={fx} transform={`translate(${fx} ${-8 + (i % 2) * 10})`}>
            <path d="M0 0 V32" stroke="#7DB36A" strokeWidth={3} />
            {[0, 72, 144, 216, 288].map((a) => (
              <circle key={a} cx={7 * Math.cos((a * Math.PI) / 180)} cy={7 * Math.sin((a * Math.PI) / 180)} r={6} fill={['#F7A8BE', '#FFE07A', '#C9B6F2'][i]} />
            ))}
            <circle r={4} fill="#FFF5D0" />
          </g>
        ))}
      </g>
    </g>
  );
}

function StringLights({ x1, x2, y }: { x1: number; x2: number; y: number }) {
  const n = Math.floor((x2 - x1) / 46);
  const colors = ['#FFE07A', '#F7A8BE', '#C9B6F2', '#A9D9F2', '#B7E3A0'];
  return (
    <g className="scene-lights">
      <path d={`M${x1} ${y} Q${(x1 + x2) / 2} ${y + 50} ${x2} ${y}`} fill="none" stroke={L} strokeWidth={2.5} />
      {Array.from({ length: n }, (_, i) => {
        const t = (i + 0.5) / n;
        const lx = x1 + (x2 - x1) * t;
        const ly = y + 4 * 50 * t * (1 - t) * 0.5 * 2;
        return (
          <g key={i}>
            <rect x={lx - 3} y={ly - 1} width={6} height={6} fill={L} />
            <ellipse cx={lx} cy={ly + 11} rx={6} ry={9} fill={colors[i % colors.length]} stroke={L} strokeWidth={2} style={{ animationDelay: `${(i % 5) * 0.4}s` }} />
          </g>
        );
      })}
    </g>
  );
}

function Desk({ theme }: { theme: ThemeId }) {
  const c = T[theme];
  return (
    <g>
      {/* lamp light cone */}
      <defs>
        <radialGradient id={`glow-${theme}`} cx="0.5" cy="0" r="1">
          <stop offset="0" stopColor={c.glow} stopOpacity={theme === 'night' ? 0.75 : 0.5} />
          <stop offset="1" stopColor={c.glow} stopOpacity={0} />
        </radialGradient>
      </defs>
      <path d="M112 196 L40 440 L330 440 L188 196 Z" fill={`url(#glow-${theme})`} className="scene-lampglow" />
      {/* desk */}
      <rect x={-20} y={432} width={1040} height={30} rx={8} fill={c.wood} stroke={L} strokeWidth={5} />
      <rect x={-20} y={458} width={1040} height={160} fill={c.woodDark} stroke={L} strokeWidth={5} />
      <path d="M0 500 H1000" stroke={L} strokeWidth={3} opacity={0.25} />
      <rect x={430} y={480} width={140} height={46} rx={10} fill={c.wood} stroke={L} strokeWidth={4} />
      <circle cx={500} cy={503} r={6} fill="#FFFDF8" stroke={L} strokeWidth={3} />

      {/* lamp */}
      <g>
        <ellipse cx={112} cy={432} rx={44} ry={10} fill="#F7C6CF" stroke={L} strokeWidth={4} />
        <path d="M112 428 L100 300 L156 214" fill="none" stroke={L} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
        <path d="M112 428 L100 300 L156 214" fill="none" stroke="#F7C6CF" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={100} cy={300} r={8} fill="#F7C6CF" stroke={L} strokeWidth={3.5} />
        <path d="M118 176 L196 176 L214 228 L102 228 Z" fill="#F7C6CF" stroke={L} strokeWidth={4.5} strokeLinejoin="round" transform="rotate(14 156 202)" />
        <ellipse cx={154} cy={234} rx={20} ry={7} fill={c.glow} transform="rotate(14 156 202)" />
      </g>

      {/* notebook + pen */}
      <g transform="rotate(-4 300 446)">
        <path d="M222 448 L298 438 L376 448 L298 456 Z" fill="#FFFDF8" stroke={L} strokeWidth={3.5} strokeLinejoin="round" />
        <path d="M298 438 L298 456" stroke={L} strokeWidth={2.5} />
        <path d="M244 446 L284 441 M250 450 L286 446 M312 441 L352 446 M312 446 L346 450" stroke="#C9B9D9" strokeWidth={2} />
        <path d="M330 432 L384 446" stroke={L} strokeWidth={8} strokeLinecap="round" />
        <path d="M330 432 L384 446" stroke="#B9A6EE" strokeWidth={4} strokeLinecap="round" />
      </g>

      {/* books */}
      <g>
        <rect x={214} y={398} width={118} height={34} rx={6} fill="#D9CCF5" stroke={L} strokeWidth={4} />
        <rect x={222} y={366} width={104} height={32} rx={6} fill="#F7C6CF" stroke={L} strokeWidth={4} />
        <rect x={230} y={336} width={92} height={30} rx={6} fill="#CDE3C4" stroke={L} strokeWidth={4} />
        <path d="M232 408 H312 M240 376 H306 M246 346 H302" stroke="#FFFDF8" strokeWidth={4} strokeLinecap="round" />
        <rect x={290} y={300} width={20} height={36} rx={3} fill="#FFE8A6" stroke={L} strokeWidth={3} transform="rotate(10 300 336)" />
      </g>

      {/* laptop */}
      <g>
        <path d="M640 300 L800 300 L812 420 L628 420 Z" fill="#E8E1EE" stroke={L} strokeWidth={5} strokeLinejoin="round" />
        <path d="M652 312 L788 312 L798 408 L642 408 Z" fill={theme === 'night' ? '#C8BEF2' : '#C6E0F5'} className="scene-screen" />
        <path d="M668 330 H740 M668 346 H770 M668 362 H720" stroke="#FFFDF8" strokeWidth={5} strokeLinecap="round" opacity={0.85} />
        <path d="M600 420 L840 420 L852 436 L588 436 Z" fill="#D4CBDD" stroke={L} strokeWidth={4.5} strokeLinejoin="round" />
        <circle cx={720} cy={386} r={13} fill="#F7C6CF" stroke={L} strokeWidth={2.6} />
        <path d="M714 383 l12 0 M716 389 q4 3 8 0" stroke={L} strokeWidth={2} strokeLinecap="round" fill="none" />
      </g>

      {/* mug */}
      <g>
        <g className="scene-steam" stroke={theme === 'night' ? '#E9E1F5' : '#C9B6C2'} strokeWidth={4} fill="none" strokeLinecap="round">
          <path d="M868 380 Q860 366 868 352 Q876 338 868 324" />
          <path d="M890 384 Q882 370 890 356 Q898 342 890 328" />
        </g>
        <path d="M912 404 Q936 404 936 418 Q936 432 912 430" fill="none" stroke={L} strokeWidth={5} />
        <rect x={850} y={388} width={66} height={48} rx={10} fill={theme === 'rainy' ? '#C6E0F5' : '#FFFDF8'} stroke={L} strokeWidth={5} />
        <path d="M866 408 c0 -6 10 -6 10 0 c0 -6 10 -6 10 0 c0 6 -10 12 -10 14 c0 -2 -10 -8 -10 -14z" fill="#F48FB1" />
      </g>

      {/* plant */}
      <g className="scene-sway">
        <path d="M968 330 Q940 280 958 240" fill="none" stroke="#6FA35E" strokeWidth={5} strokeLinecap="round" />
        <ellipse cx={952} cy={262} rx={14} ry={24} fill="#94CC82" stroke={L} strokeWidth={3.5} transform="rotate(-20 952 262)" />
        <ellipse cx={990} cy={290} rx={13} ry={24} fill="#A9D693" stroke={L} strokeWidth={3.5} transform="rotate(30 990 290)" />
        <ellipse cx={944} cy={318} rx={12} ry={22} fill="#A9D693" stroke={L} strokeWidth={3.5} transform="rotate(-50 944 318)" />
      </g>
      <path d="M940 360 L1000 360 L992 434 L948 434 Z" fill="#F4B6A0" stroke={L} strokeWidth={5} strokeLinejoin="round" />
      <rect x={934} y={352} width={72} height={16} rx={5} fill="#F7C9B8" stroke={L} strokeWidth={4.5} />
    </g>
  );
}

export const Scene = memo(function Scene({ theme, children, className = '' }: { theme: ThemeId; children?: ReactNode; className?: string }) {
  const c = T[theme];
  return (
    <div className={`scene scene--${theme} ${className}`}>
      <svg className="scene__svg" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">
        <defs>
          <pattern id={`wallp-${theme}`} width="40" height="40" patternUnits="userSpaceOnUse">
            {theme === 'bedroom' || theme === 'spring' ? (
              <rect width="20" height="40" fill={c.wall2} />
            ) : (
              <circle cx="20" cy="20" r="3" fill={c.wall2} />
            )}
          </pattern>
          <radialGradient id={`dim-${theme}`} cx="0.16" cy="0.62" r="0.95">
            <stop offset="0" stopColor="#1A1740" stopOpacity={0} />
            <stop offset="0.35" stopColor="#1A1740" stopOpacity={c.dim * 0.4} />
            <stop offset="1" stopColor="#1A1740" stopOpacity={c.dim} />
          </radialGradient>
        </defs>
        <rect width="1000" height="600" fill={c.wall} />
        <rect width="1000" height="600" fill={`url(#wallp-${theme})`} />
        <LeftDecor theme={theme} />
        {theme !== 'library' && <Corkboard />}
        <Window theme={theme} />
        <Desk theme={theme} />
        {c.dim > 0 && <rect width="1000" height="600" fill={`url(#dim-${theme})`} pointerEvents="none" />}
      </svg>
      <div className="scene__overlay">{children}</div>
    </div>
  );
});
