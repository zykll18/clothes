import type { LookSlot, PrimaryColor } from '@/lib/creator-preview';

export interface SystemPreviewItem {
  id: string;
  slot: LookSlot;
  name: string;
  imageUrl: string;
  colorTag: PrimaryColor;
  source: 'system';
  clothType: 'upper' | 'lower' | 'full';
}

export const SYSTEM_PREVIEW_ITEMS: SystemPreviewItem[] = [
  {
    id: 'sys-outer-black-blazer',
    slot: 'outerwear',
    name: 'Black Blazer',
    imageUrl: '/images/presets/outer-black-blazer.svg',
    colorTag: 'black',
    source: 'system',
    clothType: 'upper',
  },
  {
    id: 'sys-inner-white-tee',
    slot: 'innerwear',
    name: 'White Tee',
    imageUrl: '/images/presets/inner-white-tee.svg',
    colorTag: 'white',
    source: 'system',
    clothType: 'upper',
  },
  {
    id: 'sys-pants-indigo-denim',
    slot: 'pants',
    name: 'Indigo Denim',
    imageUrl: '/images/presets/pants-indigo-denim.svg',
    colorTag: 'navy',
    source: 'system',
    clothType: 'lower',
  },
  {
    id: 'sys-accessory-silver-chain',
    slot: 'accessory',
    name: 'Silver Chain',
    imageUrl: '/images/presets/accessory-silver-chain.svg',
    colorTag: 'grey',
    source: 'system',
    clothType: 'full',
  },
  {
    id: 'sys-shoes-white-sneaker',
    slot: 'shoes',
    name: 'White Sneaker',
    imageUrl: '/images/presets/shoes-white-sneaker.svg',
    colorTag: 'white',
    source: 'system',
    clothType: 'lower',
  },
];
