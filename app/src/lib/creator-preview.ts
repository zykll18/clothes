export const CREATOR_DIRECTIONS = ['old_money', 'street', 'clean_fit'] as const;
export type CreatorDirection = typeof CREATOR_DIRECTIONS[number];

export const LOOK_SLOTS = ['outerwear', 'innerwear', 'pants', 'accessory', 'shoes'] as const;
export type LookSlot = typeof LOOK_SLOTS[number];

export const PRIMARY_COLORS = [
  'black',
  'white',
  'grey',
  'navy',
  'brown',
  'green',
  'red',
  'beige',
  'cream',
  'denim',
  'pink',
  'yellow',
  'orange',
  'purple',
  'silver',
] as const;
export type PrimaryColor = typeof PRIMARY_COLORS[number];

export const OUTFIT_COLOR_SLOTS = ['innerwear', 'top', 'pants', 'shoes', 'socks', 'hat'] as const;
export type OutfitColorSlot = typeof OUTFIT_COLOR_SLOTS[number];
export type OutfitColorPlan = Partial<Record<OutfitColorSlot, PrimaryColor>>;

export const DIRECTION_LABELS: Record<CreatorDirection, string> = {
  old_money: 'Old Money',
  street: 'Street',
  clean_fit: 'Clean Fit',
};

export const DIRECTION_TONES: Record<CreatorDirection, string> = {
  old_money: 'editorial-warm',
  street: 'contrast-grit',
  clean_fit: 'soft-clean',
};

export interface CreatorPreviewVariantInput {
  direction: CreatorDirection;
  sortOrder: number;
  resultUrl: string;
  presentationTone: string;
}

export interface CreatorPreviewSavePayload {
  personImageUrl: string;
  sourceImageUrl: string;
  primaryColor: PrimaryColor;
  outfitColorPlan?: OutfitColorPlan;
  directionTags: CreatorDirection[];
  selectedDirection: CreatorDirection;
  slotSelections: Partial<Record<LookSlot, string>>;
  variants: CreatorPreviewVariantInput[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function hasOnlyAllowedKeys(record: Record<string, unknown>, allowedKeys: readonly string[]): boolean {
  return Object.keys(record).every((key) => allowedKeys.includes(key));
}

function hasUniqueValues<T>(values: readonly T[]): boolean {
  return new Set(values).size === values.length;
}

export function isCreatorDirection(value: unknown): value is CreatorDirection {
  return typeof value === 'string' && CREATOR_DIRECTIONS.includes(value as CreatorDirection);
}

export function isLookSlot(value: unknown): value is LookSlot {
  return typeof value === 'string' && LOOK_SLOTS.includes(value as LookSlot);
}

export function isPrimaryColor(value: unknown): value is PrimaryColor {
  return typeof value === 'string' && PRIMARY_COLORS.includes(value as PrimaryColor);
}

export function isOutfitColorPlanComplete(
  colorPlan: OutfitColorPlan,
  wantsInnerwear: boolean | null,
  wantsHat: boolean | null
): boolean {
  return Boolean(
    colorPlan.top &&
    colorPlan.pants &&
    colorPlan.shoes &&
    colorPlan.socks &&
    wantsInnerwear !== null &&
    (!wantsInnerwear || colorPlan.innerwear) &&
    wantsHat !== null &&
    (!wantsHat || colorPlan.hat)
  );
}

export function isCreatorPreviewVariantInput(value: unknown): value is CreatorPreviewVariantInput {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isCreatorDirection(value.direction) &&
    typeof value.sortOrder === 'number' &&
    Number.isInteger(value.sortOrder) &&
    value.sortOrder >= 0 &&
    isNonEmptyString(value.resultUrl) &&
    typeof value.presentationTone === 'string'
  );
}

function isSlotSelections(value: unknown): value is Partial<Record<LookSlot, string>> {
  if (!isRecord(value) || !hasOnlyAllowedKeys(value, LOOK_SLOTS)) {
    return false;
  }

  return Object.entries(value).every(([slot, selectionId]) => (
    isLookSlot(slot) &&
    isNonEmptyString(selectionId)
  ));
}

function isOutfitColorPlan(value: unknown): value is OutfitColorPlan {
  if (!isRecord(value) || !hasOnlyAllowedKeys(value, OUTFIT_COLOR_SLOTS)) {
    return false;
  }

  return Object.entries(value).every(([slot, color]) => (
    OUTFIT_COLOR_SLOTS.includes(slot as OutfitColorSlot) &&
    isPrimaryColor(color)
  ));
}

export function isCreatorPreviewSavePayload(value: unknown): value is CreatorPreviewSavePayload {
  if (!isRecord(value)) {
    return false;
  }

  const directionTags = value.directionTags;
  const variants = value.variants;

  if (
    !isNonEmptyString(value.personImageUrl) ||
    !isNonEmptyString(value.sourceImageUrl) ||
    !isPrimaryColor(value.primaryColor) ||
    (value.outfitColorPlan !== undefined && !isOutfitColorPlan(value.outfitColorPlan)) ||
    !Array.isArray(directionTags) ||
    directionTags.length < 1 ||
    directionTags.length > CREATOR_DIRECTIONS.length ||
    !directionTags.every(isCreatorDirection) ||
    !hasUniqueValues(directionTags) ||
    !isCreatorDirection(value.selectedDirection) ||
    !isSlotSelections(value.slotSelections) ||
    !Array.isArray(variants) ||
    variants.length < 1 ||
    variants.length > CREATOR_DIRECTIONS.length ||
    !variants.every(isCreatorPreviewVariantInput)
  ) {
    return false;
  }

  const variantDirections = variants.map((variant) => variant.direction);
  const variantSortOrders = variants.map((variant) => variant.sortOrder).sort((left, right) => left - right);

  if (
    !hasUniqueValues(variantDirections) ||
    !variantDirections.every((direction) => directionTags.includes(direction)) ||
    !variantDirections.includes(value.selectedDirection) ||
    !directionTags.includes(value.selectedDirection)
  ) {
    return false;
  }

  return variantSortOrders.every((sortOrder, index) => sortOrder === index);
}
