

export interface Exercise {
  id: string;
  name: string;
  sets: string;
  reps: string;
  rest: string;
  notes: string;
  instructions?: string[]; // Updated to array of strings
  imageUrl?: string;
}

export interface Meal {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients: string[];
  recipe: string[]; // Updated to array of strings
  imageUrl?: string;
}

export interface DayPlan {
  day: string;
  workout: Exercise[];
  meals: Meal[];
}

export interface FitnessPlan {
  id: string;
  createdAt: number;
  userName?: string;
  goal: string;
  duration: string;
  days: DayPlan[];
  summary: string;
  totalCalories?: number;
  preferences?: UserPreferences; // Stored for regeneration
}

export interface UserPreferences {
  // Step 1: Personal Info
  name: string;
  age: number;
  gender: string;
  weight: number; // kg
  height: number; // cm
  
  // Step 2: Fitness Profile
  goal: string;
  level: string;
  equipment: string;
  
  // Step 3: Constraints & Preferences
  diet: string;
  workoutDays: string[];
  injuries: string;
  allergies: string;
  medications: string;
  remarks?: string; // New field for specific user requests
  mealsPerDay: number;
  cheatDay: string;
}

export interface AlternativeOption {
  name: string;
  reason: string;
  data: any; // structured data (Partial<Exercise> or Partial<Meal>)
}

export enum LoadingState {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export type Theme = 'light' | 'dark';