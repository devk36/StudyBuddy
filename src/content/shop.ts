/**
 * 🐾 Pet shop accessories. Paw coins are earned by studying:
 *   +10 per study session, +25 for reaching the daily goal, +5 per challenge.
 * The drawing for each accessory lives in src/components/Pet.tsx (Accessory()).
 */
import type { Slot } from '../lib/types';

export interface ShopItem {
  id: 'glasses' | 'bow' | 'flower' | 'headphones' | 'scarf' | 'backpack' | 'cap';
  name: string;
  emoji: string;
  slot: Slot;
  cost: number;
  blurb: string;
  reaction: string;
}

export const shopItems: ShopItem[] = [
  { id: 'glasses', name: 'Tiny Glasses', emoji: '👓', slot: 'face', cost: 20, blurb: '+10 intelligence (visually).', reaction: 'I look smart now, right? Right??' },
  { id: 'bow', name: 'Pink Bow', emoji: '🎀', slot: 'head', cost: 30, blurb: 'Cuteness, but make it academic.', reaction: '*twirls* Do you like my bow?' },
  { id: 'flower', name: 'Daisy Clip', emoji: '🌼', slot: 'head', cost: 30, blurb: 'Freshly picked from the spring garden.', reaction: 'It smells like sunshine 🌼' },
  { id: 'headphones', name: 'Lo-fi Headphones', emoji: '🎧', slot: 'ears', cost: 50, blurb: 'Plays lo-fi beats to study/relax to.', reaction: '🎶 *bobs head to lo-fi* 🎶' },
  { id: 'scarf', name: 'Cozy Scarf', emoji: '🧣', slot: 'neck', cost: 60, blurb: 'For rainy library evenings.', reaction: 'So warm. So cozy. So focused.' },
  { id: 'backpack', name: 'Tiny Backpack', emoji: '🎒', slot: 'back', cost: 80, blurb: 'Contains: snacks, more snacks, one pen.', reaction: 'Packed my snacks! I mean… books.' },
  { id: 'cap', name: 'Graduation Cap', emoji: '🎓', slot: 'head', cost: 120, blurb: 'For the academic weapon in your life.', reaction: 'Dr. Paws, PhD in Napping, reporting for duty.' },
];

export const snacks = {
  cat: { emoji: '🐟', name: 'fishy treat' },
  dog: { emoji: '🦴', name: 'bone biscuit' },
  bunny: { emoji: '🥕', name: 'baby carrot' },
} as const;
