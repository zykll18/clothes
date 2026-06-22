import assert from 'node:assert/strict';
import test from 'node:test';
import {
  isCreatorPreviewSavePayload,
  isOutfitColorPlanComplete,
} from './creator-preview.ts';

const basePayload = {
  personImageUrl: '/images/person.jpg',
  sourceImageUrl: '/images/person.jpg',
  primaryColor: 'black',
  outfitColorPlan: {
    innerwear: 'cream',
    top: 'black',
    pants: 'navy',
    shoes: 'black',
    socks: 'cream',
  },
  directionTags: ['clean_fit'],
  selectedDirection: 'clean_fit',
  slotSelections: {
    innerwear: 'item-1',
  },
  variants: [
    {
      direction: 'clean_fit',
      sortOrder: 0,
      resultUrl: '/generated/demo.jpg',
      presentationTone: 'soft-clean',
    },
  ],
} as const;

test('accepts a completed styling session with one generated preview', () => {
  assert.equal(isCreatorPreviewSavePayload(basePayload), true);
});

test('rejects a styling session without a generated preview', () => {
  assert.equal(
    isCreatorPreviewSavePayload({
      ...basePayload,
      variants: [],
    }),
    false
  );
});

test('rejects malformed outfit color plans', () => {
  assert.equal(
    isCreatorPreviewSavePayload({
      ...basePayload,
      outfitColorPlan: {
        ...basePayload.outfitColorPlan,
        hat: 'neon',
      },
    }),
    false
  );
});

test('completes the color plan when optional innerwear and hat are skipped', () => {
  assert.equal(
    isOutfitColorPlanComplete(
      {
        top: 'black',
        pants: 'navy',
        shoes: 'black',
        socks: 'cream',
      },
      false,
      false
    ),
    true
  );
});

test('requires an innerwear color when innerwear is enabled', () => {
  assert.equal(
    isOutfitColorPlanComplete(
      {
        top: 'black',
        pants: 'navy',
        shoes: 'black',
        socks: 'cream',
      },
      true,
      false
    ),
    false
  );
});
