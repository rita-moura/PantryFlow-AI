export const PANTRY_TRANSACTION_TYPES = [
  'PURCHASE',
  'CONSUMPTION',
  'ADJUSTMENT',
  'WASTE',
] as const;
export type PantryTransactionType = (typeof PANTRY_TRANSACTION_TYPES)[number];

export interface PantryItemRecord {
  readonly id: string;
  readonly userId: string;
  readonly foodId: string;
  readonly foodName: string;
  readonly quantity: number;
  readonly unit: string;
  readonly purchaseDate: string | null;
  readonly expirationDate: string | null;
  readonly openedAt: Date | null;
  readonly minimumStock: number | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface CreatePantryItemData {
  readonly foodId: string;
  readonly quantity: number;
  readonly unit: string;
  readonly purchaseDate?: string;
  readonly expirationDate?: string;
  readonly openedAt?: string;
  readonly minimumStock?: number;
}

export interface UpdatePantryItemData {
  readonly quantity?: number;
  readonly unit?: string;
  readonly purchaseDate?: string | null;
  readonly expirationDate?: string | null;
  readonly openedAt?: string | null;
  readonly minimumStock?: number | null;
  readonly transactionType?: PantryTransactionType;
  readonly reason?: string;
}
