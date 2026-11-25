/**
 * 🐱🐶🐰 The companion, drawn entirely in SVG.
 * Presentational only: give it a species, mood, activity and accessories.
 * (Behaviour — clicks, moods, messages — lives in Companion.tsx.)
 *
 * Adding a species: add a palette entry + ear/tail branches below and
 * extend `Species` in src/lib/types.ts.
 */
import type { MouseEvent } from 'react';
import type { Activity, Mood, Species } from '../lib/types';
import './pet.css';

const LINE = '#5A4250';

const palettes: Record<Species, { body: string; belly: string; inner: string; accent: string }> = {
  cat: { body: '#F9D7B0', belly: '#FFF1E2', inner: '#F6AFC0', accent: '#E9A36B' },
  dog: { body: '#F4E2C8', belly: '#FFF6EA', inner: '#F6AFC0', accent: '#BE8B63' },
  bunny: { body: '#FFFBF8', belly: '#FFFFFF', inner: '#F7BACB', accent: '#EFE2DE' },
};

type Eyes = 'open' | 'happy' | 'closed' | 'sleepy' | 'sparkle' | 'annoyed' | 'confused' | 'teary' | 'focused' | 'up';
type Mouth = 'w' | 'smile' | 'open' | 'o' | 'flat' | 'wavy' | 'tongue';

const faces: Record<Mood, { eyes: Eyes; mouth: Mouth; blush?: number }> = {
  happy: { eyes: 'open', mouth: 'w' },
  purr: { eyes: 'happy', mouth: 'w', blush: 0.8 },
  sleepy: { eyes: 'sleepy', mouth: 'o' },
  focused: { eyes: 'focused', mouth: 'flat' },
  excited: { eyes: 'sparkle', mouth: 'open' },
  hungry: { eyes: 'up', mouth: 'o' },
  proud: { eyes: 'happy', mouth: 'smile', blush: 0.7 },
  lazy: { eyes: 'sleepy', mouth: 'flat' },
  confused: { eyes: 'confused', mouth: 'wavy' },
  motivational: { eyes: 'sparkle', mouth: 'smile' },
  disappointed: { eyes: 'teary', mouth: 'wavy' },
  annoyed: { eyes: 'annoyed', mouth: 'flat' },
  blush: { eyes: 'happy', mouth: 'w', blush: 1 },
};

function Eye({ cx, cy, kind, side, look }: { cx: number; cy: number; kind: Eyes; side: -1 | 1; look: number }) {
  const y = cy + look;
  const stroke = { stroke: LINE, strokeWidth: 3.6, strokeLinecap: 'round' as const, fill: 'none' };
  switch (kind) {
    case 'happy':
      return <path d={`M${cx - 8} ${cy + 2} Q${cx} ${cy - 9} ${cx + 8} ${cy + 2}`} {...stroke} />;
    case 'closed':
      return <path d={`M${cx - 8} ${cy} Q${cx} ${cy + 7} ${cx + 8} ${cy}`} {...stroke} />;
    case 'sleepy':
      return (
        <g>
          <ellipse cx={cx} cy={cy + 3} rx={7.5} ry={3.4} fill={LINE} />
          <path d={`M${cx - 9.5} ${cy + 0.5} L${cx + 9.5} ${cy + 0.5}`} {...stroke} />
        </g>
      );
    case 'annoyed':
      return (
        <g>
          <path d={`M${cx - 8} ${cy} A8 8 0 0 0 ${cx + 8} ${cy} Z`} fill={LINE} />
          <path d={`M${cx - 10} ${cy - 0.5} L${cx + 10} ${cy - 0.5}`} {...stroke} />
        </g>
      );
    case 'sparkle':
      return (
        <g>
          <circle cx={cx} cy={y} r={9.5} fill={LINE} />
          <circle cx={cx + 3} cy={y - 3.5} r={3.8} fill="#fff" />
          <circle cx={cx - 3.2} cy={y + 3.2} r={1.9} fill="#fff" />
          <path d={`M${cx + 4} ${y + 1} l1 2.2 l2.2 1 l-2.2 1 l-1 2.2 l-1 -2.2 l-2.2 -1 l2.2 -1 z`} fill="#fff" opacity={0.9} />
        </g>
      );
    case 'confused':
      if (side === 1) return <circle cx={cx} cy={y} r={4.6} fill={LINE} />;
      return (
        <g>
          <circle cx={cx} cy={y} r={8.5} fill={LINE} />
          <circle cx={cx + 2.6} cy={y - 3} r={2.8} fill="#fff" />
        </g>
      );
    case 'teary': {
      const tx = cx + side * 3;
      return (
        <g>
          <circle cx={cx} cy={y} r={8.8} fill={LINE} />
          <circle cx={cx + 2.6} cy={y - 3.2} r={3.4} fill="#fff" />
          <circle cx={cx - 3} cy={y + 2.8} r={2} fill="#fff" />
          <path className="pet-tear" d={`M${tx} ${cy + 9} Q${tx - 4.5} ${cy + 17} ${tx} ${cy + 19.5} Q${tx + 4.5} ${cy + 17} ${tx} ${cy + 9} Z`} fill="#9CCBF0" stroke={LINE} strokeWidth={1.5} />
          <path d={side === -1 ? `M${cx - 10} ${cy - 11} L${cx + 7} ${cy - 15}` : `M${cx + 10} ${cy - 11} L${cx - 7} ${cy - 15}`} {...stroke} strokeWidth={3} />
        </g>
      );
    }
    case 'focused':
      return (
        <g>
          <circle cx={cx} cy={y} r={7.5} fill={LINE} />
          <circle cx={cx + 2.4} cy={y - 2.6} r={2.5} fill="#fff" />
          <path d={side === -1 ? `M${cx - 10} ${cy - 15} L${cx + 8} ${cy - 11}` : `M${cx + 10} ${cy - 15} L${cx - 8} ${cy - 11}`} {...stroke} strokeWidth={3} />
        </g>
      );
    case 'up':
      return (
        <g>
          <circle cx={cx} cy={cy - 1} r={8.5} fill={LINE} />
          <circle cx={cx + 1.5} cy={cy - 5} r={3.2} fill="#fff" />
          <circle cx={cx - 2.5} cy={cy + 1.5} r={1.4} fill="#fff" />
        </g>
      );
    default:
      return (
        <g>
          <circle cx={cx} cy={y} r={8.2} fill={LINE} />
          <circle cx={cx + 2.6} cy={y - 3} r={2.9} fill="#fff" />
          <circle cx={cx - 2.6} cy={y + 2.6} r={1.3} fill="#fff" />
        </g>
      );
  }
}

function MouthShape({ kind, species }: { kind: Mouth; species: Species }) {
  const s = { stroke: LINE, strokeWidth: 3, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };
  if (kind === 'w' && species === 'dog') kind = 'tongue';
  switch (kind) {
    case 'smile':
      return <path d="M90 116 Q100 127 110 116" {...s} />;
    case 'open':
      return (
        <g>
          <path d="M90 115 Q100 134 110 115 Z" fill="#7A3F4F" stroke={LINE} strokeWidth={3} strokeLinejoin="round" />
          <ellipse cx={100} cy={124.5} rx={5} ry={3.4} fill="#F48FA6" />
        </g>
      );
    case 'o':
      return <ellipse className="pet-mouth-o" cx={100} cy={120} rx={3.8} ry={4.6} fill="#7A3F4F" stroke={LINE} strokeWidth={2.4} />;
    case 'flat':
      return <path d="M93 119 L107 119" {...s} />;
    case 'wavy':
      return <path d="M88 121 Q92 115.5 96 121 Q100 126.5 104 121 Q108 115.5 112 120" {...s} />;
    case 'tongue':
      return (
        <g>
          <path d="M96 119 Q96 130 100 130 Q104 130 104 119" fill="#F48FA6" stroke={LINE} strokeWidth={2.2} />
          <path d="M89 116 Q94.5 122 100 116 Q105.5 122 111 116" {...s} />
        </g>
      );
    default:
      return <path d="M89 116 Q94.5 122 100 116 Q105.5 122 111 116" {...s} />;
  }
}

function Ears({ species, p, back }: { species: Species; p: (typeof palettes)[Species]; back: boolean }) {
  const st = { stroke: LINE, strokeWidth: 3.4, strokeLinejoin: 'round' as const };
  if (species === 'cat' && back)
    return (
      <g className="pet-ears">
        <path d="M50 82 L58 28 L96 56 Z" fill={p.body} {...st} />
        <path d="M59 66 L63 41 L83 57 Z" fill={p.inner} />
        <path d="M150 82 L142 28 L104 56 Z" fill={p.body} {...st} />
        <path d="M141 66 L137 41 L117 57 Z" fill={p.inner} />
      </g>
    );
  if (species === 'bunny' && back)
    return (
      <g className="pet-ears pet-ears--bunny">
        <g transform="rotate(-12 78 52)">
          <ellipse cx={78} cy={12} rx={15} ry={42} fill={p.body} {...st} />
          <ellipse cx={78} cy={16} rx={7.5} ry={31} fill={p.inner} />
        </g>
        <g transform="rotate(12 122 52)">
          <ellipse cx={122} cy={12} rx={15} ry={42} fill={p.body} {...st} />
          <ellipse cx={122} cy={16} rx={7.5} ry={31} fill={p.inner} />
        </g>
      </g>
    );
  if (species === 'dog' && !back)
    return (
      <g className="pet-ears pet-ears--dog">
        <path d="M50 58 C 28 64, 22 112, 38 128 C 50 138, 64 114, 66 80 Z" fill={p.accent} {...st} />
        <path d="M150 58 C 172 64, 178 112, 162 128 C 150 138, 136 114, 134 80 Z" fill={p.accent} {...st} />
      </g>
    );
  return null;
}

function Accessory({ id, onClick }: { id: string; onClick?: (id: string, e: MouseEvent) => void }) {
  const st = { stroke: LINE, strokeWidth: 3, strokeLinejoin: 'round' as const };
  const handle = onClick
    ? {
        onClick: (e: MouseEvent) => {
          e.stopPropagation();
          onClick(id, e);
        },
        style: { cursor: 'pointer' },
      }
    : {};
  const cls = `pet-acc pet-acc--${id}`;
  switch (id) {
    case 'glasses':
      return (
        <g className={cls} {...handle}>
          <circle cx={78} cy={100} r={14.5} fill="rgba(255,255,255,.28)" {...st} />
          <circle cx={122} cy={100} r={14.5} fill="rgba(255,255,255,.28)" {...st} />
          <path d="M92.5 98 Q100 93 107.5 98" fill="none" {...st} />
          <path d="M63.5 96 L50 90 M136.5 96 L150 90" fill="none" {...st} strokeLinecap="round" />
        </g>
      );
    case 'bow':
      return (
        <g className={cls} {...handle} transform="rotate(14 140 50)">
          <path d="M140 50 L118 36 Q112 50 118 64 Z" fill="#F48FB1" {...st} />
          <path d="M140 50 L162 36 Q168 50 162 64 Z" fill="#F48FB1" {...st} />
          <circle cx={140} cy={50} r={6.5} fill="#F7B9CF" {...st} />
        </g>
      );
    case 'flower':
      return (
        <g className={cls} {...handle}>
          {[0, 72, 144, 216, 288].map((a) => (
            <circle key={a} cx={62 + 9 * Math.cos((a * Math.PI) / 180)} cy={52 + 9 * Math.sin((a * Math.PI) / 180)} r={7.5} fill="#fff" {...st} strokeWidth={2.4} />
          ))}
          <circle cx={62} cy={52} r={5.5} fill="#FFD66B" {...st} strokeWidth={2.4} />
        </g>
      );
    case 'cap':
      return (
        <g className={cls} {...handle}>
          <path d="M74 50 L74 62 Q100 73 126 62 L126 50" fill="#4E4161" {...st} />
          <path d="M56 46 L100 28 L144 46 L100 63 Z" fill="#5E5075" {...st} />
          <path d="M100 45 L134 52 L136 70" fill="none" stroke="#FFD66B" strokeWidth={3} strokeLinecap="round" />
          <ellipse cx={136} cy={73} rx={3.5} ry={5} fill="#FFD66B" stroke={LINE} strokeWidth={1.6} />
          <circle cx={100} cy={45} r={3} fill="#FFD66B" />
        </g>
      );
    case 'headphones':
      return (
        <g className={cls} {...handle}>
          <path d="M40 104 Q38 30 100 28 Q162 30 160 104" fill="none" stroke={LINE} strokeWidth={12} strokeLinecap="round" />
          <path d="M40 104 Q38 30 100 28 Q162 30 160 104" fill="none" stroke="#C3B3EE" strokeWidth={6.5} strokeLinecap="round" />
          <rect x={28} y={86} width={20} height={36} rx={9} fill="#F7C6CF" {...st} />
          <rect x={152} y={86} width={20} height={36} rx={9} fill="#F7C6CF" {...st} />
        </g>
      );
    case 'scarf':
      return (
        <g className={cls} {...handle}>
          <path d="M52 138 Q100 162 148 138 L150 152 Q100 178 50 152 Z" fill="#E98B8B" {...st} />
          <path d="M70 147 L72 160 M90 152 L91 166 M110 152 L109 166 M130 147 L128 160" stroke="#FFF1E2" strokeWidth={3} strokeLinecap="round" />
          <path d="M118 158 L128 190 L112 192 L106 162 Z" fill="#E98B8B" {...st} />
        </g>
      );
    case 'backpack':
      return (
        <g className={cls} {...handle}>
          <path d="M66 130 Q72 154 68 178" fill="none" stroke={LINE} strokeWidth={8} strokeLinecap="round" />
          <path d="M66 130 Q72 154 68 178" fill="none" stroke="#8FB6E3" strokeWidth={4.5} strokeLinecap="round" />
          <path d="M134 130 Q128 154 132 178" fill="none" stroke={LINE} strokeWidth={8} strokeLinecap="round" />
          <path d="M134 130 Q128 154 132 178" fill="none" stroke="#8FB6E3" strokeWidth={4.5} strokeLinecap="round" />
        </g>
      );
    default:
      return null;
  }
}

export interface PetProps {
  species: Species;
  mood: Mood;
  activity?: Activity;
  accessories?: string[];
  anim?: string | null;
  size?: number | string;
  title?: string;
  snack?: string;
  onAccessoryClick?: (id: string, e: MouseEvent) => void;
  className?: string;
  /** turn off idle motion (e.g. meme thumbnails) */
  still?: boolean;
}

export function Pet({ species, mood, activity = 'idle', accessories = [], anim, size = 200, title, snack, onAccessoryClick, className = '', still }: PetProps) {
  const p = palettes[species];
  const sleeping = activity === 'sleeping';
  const face = faces[mood] ?? faces.happy;
  const eyes: Eyes = sleeping ? 'closed' : face.eyes;
  const mouth: Mouth = sleeping ? 'o' : activity === 'eating' ? 'o' : face.mouth;
  const look = activity === 'reading' ? 3 : 0;
  const blush = face.blush ?? 0.45;
  const has = (id: string) => accessories.includes(id);
  const headAcc = has('cap') || has('bow') || has('flower');
  const st = { stroke: LINE, strokeWidth: 3.4, strokeLinejoin: 'round' as const };
  const celebrate = activity === 'celebrating';

  return (
    <svg
      className={`pet pet--${species} mood-${mood} act-${activity} ${anim ? `anim-${anim}` : ''} ${still ? 'pet--still' : ''} ${className}`}
      viewBox="0 -38 200 248"
      width={size}
      height={size}
      role="img"
      aria-label={title ?? `${species} looking ${mood}`}
    >
      <ellipse cx={100} cy={200} rx={62} ry={8} fill="rgba(90,66,80,.13)" className="pet-shadow" />
      <g className="pet-bodywrap">
        {has('backpack') && (
          <g>
            <rect x={126} y={120} width={44} height={56} rx={13} fill="#8FB6E3" {...st} />
            <path d="M130 136 Q148 128 166 136" fill="none" {...st} strokeWidth={2.6} />
          </g>
        )}
        {/* tail */}
        {species === 'bunny' ? (
          <circle cx={150} cy={178} r={13} fill={p.body} {...st} />
        ) : (
          <g className="pet-tail">
            <path d={species === 'cat' ? 'M144 176 C 180 172, 186 134, 166 118' : 'M146 172 Q 172 160 168 138'} fill="none" stroke={LINE} strokeWidth={species === 'cat' ? 16 : 15} strokeLinecap="round" />
            <path d={species === 'cat' ? 'M144 176 C 180 172, 186 134, 166 118' : 'M146 172 Q 172 160 168 138'} fill="none" stroke={species === 'cat' ? p.body : p.accent} strokeWidth={species === 'cat' ? 9.5 : 8.5} strokeLinecap="round" />
          </g>
        )}
        {/* body */}
        <g className="pet-breathe">
          <ellipse cx={100} cy={162} rx={52} ry={36} fill={p.body} {...st} />
          <ellipse cx={100} cy={170} rx={30} ry={22} fill={p.belly} />
          <ellipse cx={77} cy={195} rx={14} ry={8.5} fill={p.body} {...st} />
          <ellipse cx={123} cy={195} rx={14} ry={8.5} fill={p.body} {...st} />
        </g>

        {/* head */}
        <g className="pet-head">
          <Ears species={species} p={p} back />
          <ellipse cx={100} cy={96} rx={62} ry={54} fill={p.body} {...st} />
          {species === 'cat' && (
            <g stroke={p.accent} strokeWidth={4} strokeLinecap="round">
              <path d="M100 45 L100 56" />
              <path d="M87 47 L90 57" />
              <path d="M113 47 L110 57" />
            </g>
          )}
          {species === 'dog' && <ellipse cx={124} cy={94} rx={19} ry={17} fill="#EBCFA9" />}
          <Ears species={species} p={p} back={false} />
          <ellipse cx={66} cy={114} rx={10.5} ry={6.2} fill="#F6A3B6" opacity={blush} className="pet-blush" />
          <ellipse cx={134} cy={114} rx={10.5} ry={6.2} fill="#F6A3B6" opacity={blush} className="pet-blush" />
          <g className={sleeping || eyes === 'happy' ? '' : 'pet-eyes'}>
            <Eye cx={78} cy={100} kind={eyes} side={-1} look={look} />
            <Eye cx={122} cy={100} kind={eyes} side={1} look={look} />
          </g>
          {species === 'dog' ? (
            <g>
              <ellipse cx={100} cy={110} rx={7.5} ry={5.2} fill={LINE} />
              <ellipse cx={98} cy={108.5} rx={2.2} ry={1.3} fill="#fff" opacity={0.8} />
            </g>
          ) : (
            <path d="M95.5 108 L104.5 108 L100 113 Z" fill="#F08AA2" stroke={LINE} strokeWidth={2} strokeLinejoin="round" />
          )}
          <MouthShape kind={mouth} species={species} />
          {species === 'cat' && (
            <g stroke={LINE} strokeWidth={2} strokeLinecap="round" opacity={0.55}>
              <path d="M44 106 L60 108 M44 116 L60 114" />
              <path d="M156 106 L140 108 M156 116 L140 114" />
            </g>
          )}
          {accessories
            .filter((a) => a !== 'backpack' && a !== 'scarf')
            .map((a) => (
              <Accessory key={a} id={a} onClick={onAccessoryClick} />
            ))}
          {celebrate && !headAcc && (
            <g className="pet-partyhat" transform="rotate(-14 100 46)">
              <path d="M82 48 L100 2 L118 48 Z" fill="#B9A6EE" {...st} />
              <path d="M88 33 L112 33 M93 19 L107 19" stroke="#FFF1E2" strokeWidth={4} strokeLinecap="round" />
              <circle cx={100} cy={2} r={6} fill="#FFD66B" {...st} strokeWidth={2.4} />
            </g>
          )}
        </g>
        {has('scarf') && <Accessory id="scarf" onClick={onAccessoryClick} />}
        {has('backpack') && <Accessory id="backpack" onClick={onAccessoryClick} />}

        {/* activity props */}
        {activity === 'reading' && (
          <g className="pet-book">
            <path d="M54 142 L100 151 L146 142 L148 186 L100 194 L52 186 Z" fill="#B5A3E6" {...st} />
            <path d="M100 152 L60 144 L58 180 L100 188 Z" fill="#FFFDF8" {...st} strokeWidth={2.6} />
            <path d="M100 152 L140 144 L142 180 L100 188 Z" fill="#FFFDF8" {...st} strokeWidth={2.6} />
            <path className="pet-booklines" d="M68 155 L92 159 M67 163 L91 167 M67 171 L86 174 M108 159 L132 155 M108 167 L133 163 M108 175 L126 172" stroke="#C9B9D9" strokeWidth={2.2} strokeLinecap="round" />
            <ellipse cx={58} cy={164} rx={9} ry={8} fill={p.body} {...st} />
            <ellipse cx={142} cy={164} rx={9} ry={8} fill={p.body} {...st} />
          </g>
        )}
        {activity === 'coffee' && (
          <g className="pet-mug">
            <g className="pet-steam" stroke="#C9B6C2" strokeWidth={3} fill="none" strokeLinecap="round">
              <path d="M94 136 Q90 128 95 121 Q99 114 95 107" />
              <path d="M106 136 Q102 128 107 121 Q111 114 107 107" />
            </g>
            <path d="M116 150 Q130 150 130 160 Q130 170 116 168" fill="none" {...st} />
            <rect x={84} y={140} width={34} height={34} rx={7} fill="#F4E1C1" {...st} />
            <path d="M92 152 Q101 145 110 152 Q101 162 92 152 Z" fill="#F6A3B6" />
            <ellipse cx={82} cy={160} rx={8.5} ry={7.5} fill={p.body} {...st} />
            <ellipse cx={120} cy={160} rx={8.5} ry={7.5} fill={p.body} {...st} />
          </g>
        )}
        {activity === 'celebrating' && (
          <g>
            <ellipse cx={40} cy={124} rx={11} ry={10} fill={p.body} {...st} className="pet-paw-up pet-paw-up--l" />
            <ellipse cx={160} cy={124} rx={11} ry={10} fill={p.body} {...st} className="pet-paw-up pet-paw-up--r" />
            <g className="pet-confetti">
              {[
                [30, 40, '#F48FB1'],
                [170, 30, '#B5A3E6'],
                [20, 90, '#FFD66B'],
                [182, 84, '#9CCBF0'],
                [50, 10, '#A9D3A3'],
                [150, 4, '#F6A07A'],
              ].map(([x, y, c], i) => (
                <rect key={i} x={x as number} y={y as number} width={8} height={5} rx={1.5} fill={c as string} transform={`rotate(${i * 37} ${x} ${y})`} style={{ animationDelay: `${i * 0.18}s` }} />
              ))}
            </g>
          </g>
        )}
        {activity === 'eating' && snack && (
          <text x={100} y={150} fontSize={30} textAnchor="middle" className="pet-snack">
            {snack}
          </text>
        )}
        {(activity === 'idle' || activity === 'sleeping') && (
          <g>
            <ellipse cx={84} cy={186} rx={10.5} ry={8} fill={p.body} {...st} />
            <ellipse cx={116} cy={186} rx={10.5} ry={8} fill={p.body} {...st} />
          </g>
        )}
      </g>

      {/* mood effects */}
      {sleeping && (
        <g className="pet-zzz" fill={LINE} fontFamily="Fredoka, sans-serif" fontWeight={600}>
          <text x={150} y={36} fontSize={18}>z</text>
          <text x={162} y={18} fontSize={24}>z</text>
          <text x={176} y={-2} fontSize={30}>Z</text>
        </g>
      )}
      {!sleeping && mood === 'confused' && (
        <text x={160} y={30} fontSize={38} fontWeight={700} fill="#9B87D8" fontFamily="Fredoka, sans-serif" className="pet-float">?</text>
      )}
      {!sleeping && (mood === 'motivational' || mood === 'excited') && (
        <g className="pet-sparkles" fill="#FFC94D" stroke={LINE} strokeWidth={1.6}>
          <path d="M28 40 l4 9 l9 4 l-9 4 l-4 9 l-4 -9 l-9 -4 l9 -4 z" />
          <path d="M168 22 l3 7 l7 3 l-7 3 l-3 7 l-3 -7 l-7 -3 l7 -3 z" />
        </g>
      )}
      {!sleeping && mood === 'annoyed' && (
        <path className="pet-float" d="M152 40 l6 6 m0 -6 l-6 6 M164 36 l8 0 M168 32 l0 8" stroke="#E46F8C" strokeWidth={3.4} strokeLinecap="round" />
      )}
      {!sleeping && mood === 'hungry' && (
        <g className="pet-float">
          <circle cx={150} cy={44} r={4} fill="#fff" stroke={LINE} strokeWidth={2} />
          <circle cx={160} cy={30} r={6} fill="#fff" stroke={LINE} strokeWidth={2} />
          <ellipse cx={180} cy={6} rx={20} ry={17} fill="#fff" stroke={LINE} strokeWidth={2.4} />
          <text x={180} y={14} fontSize={20} textAnchor="middle">🍪</text>
        </g>
      )}
      {!sleeping && (mood === 'blush' || mood === 'purr' || mood === 'proud') && (
        <g className="pet-hearts" fill="#F48FB1" stroke={LINE} strokeWidth={1.6}>
          <path d="M30 50 c-6 -8 -18 -2 -12 8 l12 11 l12 -11 c6 -10 -6 -16 -12 -8 z" />
          <path d="M170 34 c-4 -6 -13 -1.5 -9 6 l9 8 l9 -8 c4 -7.5 -5 -12 -9 -6 z" />
        </g>
      )}
    </svg>
  );
}

/** Small round head-only avatar for presence lists. */
export function PetAvatar({ species, size = 44, mood = 'happy' }: { species: Species; size?: number; mood?: Mood }) {
  return (
    <span className="pet-avatar" style={{ width: size, height: size }}>
      <Pet species={species} mood={mood} size={size * 1.55} still title={`${species} avatar`} />
    </span>
  );
}
