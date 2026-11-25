import type { Meme } from '../content/memes';
import { Pet } from './Pet';
import './meme.css';

export function MemeArt({ meme, size = 'pin' }: { meme: Meme; size?: 'pin' | 'mini' | 'big' }) {
  const petSize = size === 'mini' ? 92 : size === 'big' ? 230 : 150;
  const two = meme.panels.length > 1;
  return (
    <figure className={`meme meme--${meme.bg} meme--${size}`}>
      {meme.top && <figcaption className="meme__top">{meme.top}</figcaption>}
      {meme.image ? (
        <img className="meme__img" src={meme.image} alt={meme.top || meme.bottom || 'meme'} loading="lazy" decoding="async" />
      ) : (
        <div className={`meme__art ${two ? 'meme__art--two' : ''}`}>
          {meme.panels.map((p, i) => (
            <div className="meme__panel" key={i}>
              {p.label && <span className="meme__label">{p.label}</span>}
              <Pet species={p.species} mood={p.mood} activity={p.activity ?? 'idle'} size={two ? petSize * 0.78 : petSize} still={size !== 'big'} title={`${p.species} feeling ${p.mood}`} />
            </div>
          ))}
          {meme.stickers?.map((s, i) => (
            <span key={i} className={`meme__sticker meme__sticker--${i}`} aria-hidden>
              {s}
            </span>
          ))}
        </div>
      )}
      {meme.bottom && <figcaption className="meme__bottom">{meme.bottom}</figcaption>}
      {meme.credit && (
        <a className="meme__credit" href={meme.credit.url} target="_blank" rel="noopener noreferrer">
          {meme.credit.name} · {meme.credit.license}
        </a>
      )}
    </figure>
  );
}
