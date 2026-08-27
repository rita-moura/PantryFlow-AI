export class NutritionValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NutritionValidationError';
  }
}

export class IncompatibleUnitError extends NutritionValidationError {
  constructor(fromUnit: string, toUnit: string) {
    super(`Cannot convert incompatible units: ${fromUnit} to ${toUnit}.`);
    this.name = 'IncompatibleUnitError';
  }
}

export class UnsupportedUnitError extends NutritionValidationError {
  constructor(unit: string) {
    super(`Unsupported unit: ${unit}.`);
    this.name = 'UnsupportedUnitError';
  }
}
