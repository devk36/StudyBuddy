import { shopItems } from '../content/shop';
import { buyItem, equippedList, toggleEquip } from '../lib/actions';
import { emit } from '../lib/events';
import { useNow } from '../lib/hooks';
import { profileOf, useApp } from '../lib/store';
import { Companion } from '../components/Companion';

export function PetShop() {
  const s = useApp();
  const now = useNow(1000);
  const prof = profileOf(s);
  const worn = equippedList(s.pet.equipped);
  return (
    <div className="shop">
      <div className="page-head">
        <div>
          <h1>Pet Shop 🐾</h1>
          <p className="sub">dress up {prof.petName} with your hard-earned paw coins</p>
        </div>
        <span className="coins" style={{ fontSize: '1.1rem' }}>🪙 {s.pet.coins} paw coins</span>
      </div>

      <div className="shop-grid">
        <div className="card card--blush shop-stage tape">
          <Companion timer={s.timer} now={now} size={240} showActions />
          <p className="tiny muted" style={{ textAlign: 'center', marginTop: 10 }}>
            Tap an accessory on {prof.petName} to see what they think of it.
          </p>
        </div>

        <div className="stack">
          <div className="card card--butter">
            <h2>How to earn paw coins</h2>
            <ul className="earn">
              <li>📚 Finish a study session <strong>+10</strong></li>
              <li>🎯 Reach your daily goal <strong>+25</strong></li>
              <li>🏆 Unlock an achievement <strong>+5</strong></li>
              <li>🎲 Complete a tiny challenge <strong>+5</strong></li>
            </ul>
          </div>
          <div className="items">
            {shopItems.map((it) => {
              const owned = s.pet.owned.includes(it.id);
              const on = worn.includes(it.id);
              const afford = s.pet.coins >= it.cost;
              return (
                <div key={it.id} className={`item card ${on ? 'is-on' : ''}`}>
                  <div className="item__emoji" aria-hidden>{it.emoji}</div>
                  <div className="item__info">
                    <h3>{it.name}</h3>
                    <p className="tiny muted">{it.blurb}</p>
                  </div>
                  {owned ? (
                    <button className={`btn btn--sm ${on ? 'btn--sage' : ''}`} aria-pressed={on} onClick={() => toggleEquip(it)}>
                      {on ? '✓ Wearing' : 'Wear'}
                    </button>
                  ) : (
                    <button
                      className="btn btn--sm btn--butter"
                      disabled={!afford}
                      onClick={() => {
                        if (!buyItem(it)) emit('toast', { kind: 'info', title: 'Not enough paw coins yet', emoji: '🪙' });
                      }}
                      aria-label={`Buy ${it.name} for ${it.cost} coins`}
                    >
                      🪙 {it.cost}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          <p className="tiny" style={{ color: 'var(--page-ink-soft)' }}>Items in the same spot (like hats) swap automatically. Your friend’s pet in a shared room shows their own outfit.</p>
        </div>
      </div>
    </div>
  );
}
