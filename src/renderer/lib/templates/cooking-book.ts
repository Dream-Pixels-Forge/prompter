import type { Template } from '@/shared/types';

export const cookingBookTemplate: Template = {
  id: 'cooking-book',
  name: 'Cooking Book / Recipe Collection',
  description: 'Structured prompt for generating a recipe or cookbook chapter',
  icon: 'ChefHat',
  domain: 'lifestyle',
  audienceHint: 'Home cooks, food enthusiasts',
  framework: 'openai',
  defaultInput:
    'Write a recipe for a vegan mushroom risotto with truffle oil. Include prep time, cook time, ingredients list, step-by-step instructions, and wine pairing suggestion.',
};
