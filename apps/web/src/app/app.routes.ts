import { Routes } from '@angular/router';
import { SectionPage } from './section-page';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  {
    path: 'dashboard',
    component: SectionPage,
    data: {
      key: 'dashboard',
      eyebrow: 'Today',
      title: 'Good morning, Rita.',
      summary:
        'Keep your plan moving with a clear view of nutrition, meals, and what needs attention.',
      cards: ['1,240 kcal remaining', '78 g protein remaining', '3 meals planned'],
    },
  },
  {
    path: 'pantry',
    component: SectionPage,
    data: {
      key: 'pantry',
      eyebrow: 'Inventory',
      title: 'Your pantry',
      summary: 'Track what you have and use ingredients before they expire.',
      cards: ['Chicken breast · 800 g', 'Rice · 1.2 kg', 'Broccoli · expires tomorrow'],
    },
  },
  {
    path: 'recipes',
    component: SectionPage,
    data: {
      key: 'recipes',
      eyebrow: 'Library',
      title: 'Recipes',
      summary: 'Browse recipes linked to your nutrition data and pantry ingredients.',
      cards: [
        'Protein oats · 389 kcal / serving',
        'Chicken rice bowl · 540 kcal / serving',
        'Black bean tacos · 420 kcal / serving',
      ],
    },
  },
  {
    path: 'meal-plan',
    component: SectionPage,
    data: {
      key: 'meal-plan',
      eyebrow: 'Planning',
      title: "Today's meal plan",
      summary: 'Your plan adapts after each meal while keeping consumed items fixed.',
      cards: ['Breakfast · Protein oats', 'Lunch · Chicken rice bowl', 'Dinner · Black bean tacos'],
    },
  },
  {
    path: 'shopping-list',
    component: SectionPage,
    data: {
      key: 'shopping-list',
      eyebrow: 'Preparation',
      title: 'Shopping list',
      summary: 'Missing ingredients are consolidated from your planned recipes.',
      cards: ['Tomatoes · 250 g', 'Greek yogurt · 500 g', 'Limes · 4 units'],
    },
  },
  {
    path: 'settings/goals',
    component: SectionPage,
    data: {
      key: 'settings',
      eyebrow: 'Preferences',
      title: 'Nutrition goals',
      summary: 'Set the targets that guide your daily progress and meal planning.',
      cards: ['Calories · 2,000 kcal', 'Protein · 110 g', 'Fiber · 30 g'],
    },
  },
  { path: '**', redirectTo: 'dashboard' },
];
