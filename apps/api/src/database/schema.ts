import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  vector,
} from 'drizzle-orm/pg-core';

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
};

const quantity = (name: string) => numeric(name, { precision: 12, scale: 3 });
const nutrient = (name: string) => numeric(name, { precision: 10, scale: 3 });

export const pantryTransactionType = pgEnum('pantry_transaction_type', [
  'PURCHASE',
  'CONSUMPTION',
  'ADJUSTMENT',
  'WASTE',
]);
export const mealPlanStatus = pgEnum('meal_plan_status', [
  'DRAFT',
  'ACTIVE',
  'COMPLETED',
]);
export const mealItemStatus = pgEnum('meal_item_status', [
  'PLANNED',
  'CONSUMED',
  'SKIPPED',
  'REPLACED',
]);
export const shoppingListStatus = pgEnum('shopping_list_status', [
  'ACTIVE',
  'COMPLETED',
  'ARCHIVED',
]);
export const userPreferenceType = pgEnum('user_preference_type', [
  'LIKES',
  'DISLIKES',
  'EXCLUDES',
  'CUISINE',
  'MEAL_STYLE',
]);

export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey(),
  displayName: text('display_name').notNull(),
  ...timestamps,
});

export const nutritionGoals = pgTable(
  'nutrition_goals',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    targetCalories: nutrient('target_calories').notNull(),
    targetProteinG: nutrient('target_protein_g').notNull(),
    targetCarbsG: nutrient('target_carbs_g'),
    targetFatG: nutrient('target_fat_g'),
    targetFiberG: nutrient('target_fiber_g'),
    validFrom: date('valid_from').notNull(),
    validUntil: date('valid_until'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index('nutrition_goals_user_id_idx').on(table.userId)],
);

export const foods = pgTable(
  'foods',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    brand: text('brand'),
    source: text('source').notNull(),
    externalId: text('external_id'),
    defaultUnit: text('default_unit').notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('foods_source_external_id_uidx').on(
      table.source,
      table.externalId,
    ),
  ],
);

export const foodNutrients = pgTable(
  'food_nutrients',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    foodId: uuid('food_id')
      .notNull()
      .references(() => foods.id, { onDelete: 'cascade' }),
    basisQuantity: quantity('basis_quantity').notNull(),
    basisUnit: text('basis_unit').notNull(),
    calories: nutrient('calories').notNull(),
    proteinG: nutrient('protein_g').notNull(),
    carbsG: nutrient('carbs_g').notNull(),
    fatG: nutrient('fat_g').notNull(),
    fiberG: nutrient('fiber_g').notNull(),
    metadata: jsonb('metadata').notNull().default({}),
  },
  (table) => [
    uniqueIndex('food_nutrients_food_id_uidx').on(table.foodId),
    index('food_nutrients_food_id_idx').on(table.foodId),
  ],
);

export const pantryItems = pgTable(
  'pantry_items',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    foodId: uuid('food_id')
      .notNull()
      .references(() => foods.id, { onDelete: 'restrict' }),
    quantity: quantity('quantity').notNull(),
    unit: text('unit').notNull(),
    purchaseDate: date('purchase_date'),
    expirationDate: date('expiration_date'),
    openedAt: timestamp('opened_at', { withTimezone: true }),
    minimumStock: quantity('minimum_stock'),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    check(
      'pantry_items_quantity_nonnegative_check',
      sql`${table.quantity} >= 0`,
    ),
    check(
      'pantry_items_minimum_stock_nonnegative_check',
      sql`${table.minimumStock} IS NULL OR ${table.minimumStock} >= 0`,
    ),
    index('pantry_items_user_id_idx').on(table.userId),
    index('pantry_items_expiration_date_idx').on(table.expirationDate),
    index('pantry_items_food_id_idx').on(table.foodId),
  ],
);

export const pantryTransactions = pgTable(
  'pantry_transactions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    pantryItemId: uuid('pantry_item_id')
      .notNull()
      .references(() => pantryItems.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    type: pantryTransactionType('type').notNull(),
    quantityDelta: quantity('quantity_delta').notNull(),
    unit: text('unit').notNull(),
    reason: text('reason').notNull(),
    referenceType: text('reference_type'),
    referenceId: uuid('reference_id'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('pantry_transactions_item_id_idx').on(table.pantryItemId),
    index('pantry_transactions_user_id_idx').on(table.userId),
  ],
);

export const recipes = pgTable(
  'recipes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    ownerUserId: uuid('owner_user_id').references(() => profiles.id, {
      onDelete: 'cascade',
    }),
    title: text('title').notNull(),
    description: text('description').notNull(),
    instructions: jsonb('instructions').notNull(),
    prepMinutes: integer('prep_minutes').notNull(),
    cookMinutes: integer('cook_minutes'),
    servings: numeric('servings', { precision: 8, scale: 2 }).notNull(),
    source: text('source').notNull(),
    sourceUrl: text('source_url'),
    contentHash: text('content_hash').notNull(),
    embedding: vector('embedding', { dimensions: 768 }),
    embeddingModel: text('embedding_model'),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('recipes_content_hash_uidx').on(table.contentHash),
    index('recipes_owner_user_id_idx').on(table.ownerUserId),
  ],
);

export const knowledgeChunks = pgTable(
  'knowledge_chunks',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    source: text('source').notNull(),
    sourceId: text('source_id'),
    content: text('content').notNull(),
    contentHash: text('content_hash').notNull(),
    embedding: vector('embedding', { dimensions: 768 }),
    embeddingModel: text('embedding_model'),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('knowledge_chunks_content_hash_uidx').on(table.contentHash),
    index('knowledge_chunks_source_idx').on(table.source),
  ],
);

export const recipeIngredients = pgTable(
  'recipe_ingredients',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    recipeId: uuid('recipe_id')
      .notNull()
      .references(() => recipes.id, { onDelete: 'cascade' }),
    foodId: uuid('food_id')
      .notNull()
      .references(() => foods.id, { onDelete: 'restrict' }),
    quantity: quantity('quantity').notNull(),
    unit: text('unit').notNull(),
    optional: boolean('optional').notNull().default(false),
    position: integer('position').notNull(),
  },
  (table) => [
    index('recipe_ingredients_recipe_id_idx').on(table.recipeId),
    index('recipe_ingredients_food_id_idx').on(table.foodId),
    uniqueIndex('recipe_ingredients_position_uidx').on(
      table.recipeId,
      table.position,
    ),
  ],
);

export const mealPlans = pgTable(
  'meal_plans',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    planDate: date('plan_date').notNull(),
    status: mealPlanStatus('status').notNull().default('DRAFT'),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('meal_plans_user_date_uidx').on(table.userId, table.planDate),
  ],
);

export const mealPlanItems = pgTable(
  'meal_plan_items',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    mealPlanId: uuid('meal_plan_id')
      .notNull()
      .references(() => mealPlans.id, { onDelete: 'cascade' }),
    recipeId: uuid('recipe_id').references(() => recipes.id, {
      onDelete: 'set null',
    }),
    mealType: text('meal_type').notNull(),
    scheduledAt: timestamp('scheduled_at', { withTimezone: true }),
    servings: numeric('servings', { precision: 8, scale: 2 }).notNull(),
    status: mealItemStatus('status').notNull().default('PLANNED'),
    notes: text('notes'),
    ...timestamps,
  },
  (table) => [index('meal_plan_items_plan_id_idx').on(table.mealPlanId)],
);

export const consumptionEntries = pgTable(
  'consumption_entries',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    mealPlanItemId: uuid('meal_plan_item_id').references(
      () => mealPlanItems.id,
      { onDelete: 'set null' },
    ),
    foodId: uuid('food_id').references(() => foods.id, {
      onDelete: 'set null',
    }),
    recipeId: uuid('recipe_id').references(() => recipes.id, {
      onDelete: 'set null',
    }),
    quantity: quantity('quantity').notNull(),
    unit: text('unit').notNull(),
    consumedAt: timestamp('consumed_at', { withTimezone: true }).notNull(),
    nutritionSnapshot: jsonb('nutrition_snapshot').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('consumption_entries_user_consumed_idx').on(
      table.userId,
      table.consumedAt,
    ),
    index('consumption_entries_meal_item_id_idx').on(table.mealPlanItemId),
  ],
);

export const shoppingLists = pgTable(
  'shopping_lists',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    status: shoppingListStatus('status').notNull().default('ACTIVE'),
    ...timestamps,
  },
  (table) => [index('shopping_lists_user_id_idx').on(table.userId)],
);

export const shoppingListItems = pgTable(
  'shopping_list_items',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    shoppingListId: uuid('shopping_list_id')
      .notNull()
      .references(() => shoppingLists.id, { onDelete: 'cascade' }),
    foodId: uuid('food_id')
      .notNull()
      .references(() => foods.id, { onDelete: 'restrict' }),
    quantity: quantity('quantity').notNull(),
    unit: text('unit').notNull(),
    checked: boolean('checked').notNull().default(false),
    reason: text('reason'),
    ...timestamps,
  },
  (table) => [
    index('shopping_list_items_list_id_idx').on(table.shoppingListId),
    index('shopping_list_items_food_id_idx').on(table.foodId),
  ],
);

export const userPreferences = pgTable(
  'user_preferences',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    preferenceType: userPreferenceType('preference_type').notNull(),
    value: text('value').notNull(),
    weight: numeric('weight', { precision: 5, scale: 2 }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index('user_preferences_user_id_idx').on(table.userId)],
);
