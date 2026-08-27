import { IncompatibleUnitError, NutritionValidationError, UnsupportedUnitError } from './errors.js';

type UnitDimension = 'mass' | 'volume' | 'count' | 'serving';

interface UnitDefinition {
  readonly dimension: UnitDimension;
  readonly factorToBase: number;
}

const units: Readonly<Record<string, UnitDefinition>> = {
  g: { dimension: 'mass', factorToBase: 1 },
  kg: { dimension: 'mass', factorToBase: 1000 },
  mg: { dimension: 'mass', factorToBase: 0.001 },
  oz: { dimension: 'mass', factorToBase: 28.349523125 },
  lb: { dimension: 'mass', factorToBase: 453.59237 },
  ml: { dimension: 'volume', factorToBase: 1 },
  l: { dimension: 'volume', factorToBase: 1000 },
  tsp: { dimension: 'volume', factorToBase: 5 },
  tbsp: { dimension: 'volume', factorToBase: 15 },
  cup: { dimension: 'volume', factorToBase: 240 },
  unit: { dimension: 'count', factorToBase: 1 },
  serving: { dimension: 'serving', factorToBase: 1 },
};

const aliases: Readonly<Record<string, string>> = {
  gram: 'g',
  grams: 'g',
  kilogram: 'kg',
  kilograms: 'kg',
  milligram: 'mg',
  milligrams: 'mg',
  milliliter: 'ml',
  milliliters: 'ml',
  millilitre: 'ml',
  millilitres: 'ml',
  liter: 'l',
  liters: 'l',
  litre: 'l',
  litres: 'l',
  ounce: 'oz',
  ounces: 'oz',
  pound: 'lb',
  pounds: 'lb',
  teaspoon: 'tsp',
  teaspoons: 'tsp',
  tablespoon: 'tbsp',
  tablespoons: 'tbsp',
  cups: 'cup',
  units: 'unit',
  each: 'unit',
  piece: 'unit',
  pieces: 'unit',
  servings: 'serving',
  portion: 'serving',
  portions: 'serving',
};

function canonicalizeUnit(unit: string): string {
  const normalized = unit.trim().toLowerCase();
  return aliases[normalized] ?? normalized;
}

function getUnit(unit: string): UnitDefinition {
  const definition = units[canonicalizeUnit(unit)];
  if (!definition) throw new UnsupportedUnitError(unit);
  return definition;
}

export function normalizeQuantity(quantity: number, fromUnit: string, toUnit: string): number {
  if (!Number.isFinite(quantity) || quantity < 0) {
    throw new NutritionValidationError('Quantity must be a finite, non-negative number.');
  }

  const from = getUnit(fromUnit);
  const to = getUnit(toUnit);
  if (from.dimension !== to.dimension) throw new IncompatibleUnitError(fromUnit, toUnit);

  return Math.round(((quantity * from.factorToBase) / to.factorToBase) * 1_000_000) / 1_000_000;
}
