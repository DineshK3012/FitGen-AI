import { GoogleGenAI, Type } from "@google/genai";
import { UserPreferences, FitnessPlan, AlternativeOption } from "../types";
import { storageService } from './storageService';

const getClient = () => {
  const apiKey = storageService.getApiKey();
  if (!apiKey) throw new Error("API Key not found. Please set one in Settings, or provide one in the environment.");
  return new GoogleGenAI({ apiKey });
};

const handleGeminiError = (error: any): never => {
  console.error("Gemini API Error:", error);
  const msg = error?.message || '';
  
  if (msg.includes('429') || msg.includes('quota') || msg.includes('limit')) {
    throw new Error("AI usage limit reached. Please try again in a few minutes.");
  }
  if (msg.includes('API key')) {
    throw new Error("Invalid API Key. Please check your settings.");
  }
  if (error instanceof SyntaxError) {
    throw new Error("AI returned incomplete data. Please try again.");
  }
  
  throw new Error("Failed to connect to AI. Please try again.");
};

export const generateFitnessPlan = async (prefs: UserPreferences): Promise<FitnessPlan> => {
  const ai = getClient();
  
  const prompt = `
    Create a comprehensive 7-DAY JSON fitness plan for:
    - User: ${prefs.name}, Goal: ${prefs.goal}, Level: ${prefs.level}.
    - Equipment: ${prefs.equipment}.
    - Workout Days: ${prefs.workoutDays.join(',')}.
    - Diet: ${prefs.diet}, Meals/Day: ${prefs.mealsPerDay}, Cheat Day: ${prefs.cheatDay}.
    - Constraints: Allergies: ${prefs.allergies}, Injuries: ${prefs.injuries}.
    - Remarks: "${prefs.remarks || 'None'}".

    CRITICAL INSTRUCTIONS:
    1. The plan MUST cover all 7 days of the week (Monday to Sunday).
    2. For days NOT in the workout schedule, the 'workout' array should contain a single object for "Rest" or "Active Recovery" (e.g., name: "Rest Day", sets: "N/A").
    3. The 'meals' array MUST be populated for ALL 7 days.
    4. On the user's cheat day (${prefs.cheatDay}), include one more lenient "cheat meal".
    5. 'instructions' & 'recipe' MUST be arrays of strings. Max 4 steps.
    6. 'notes' must be a brief tip. 'summary' must be a concise overview.
    7. Output STRICTLY VALID JSON.

    JSON Structure:
    {
      "userName": "${prefs.name}",
      "summary": "...",
      "totalCalories": 2500,
      "days": [
        {
          "day": "Monday",
          "workout": [{ "id": "w1", "name": "...", "sets": "3", "reps": "10", "rest": "60s", "notes": "...", "instructions": ["Step 1"] }],
          "meals": [{ "id": "m1", "name": "...", "calories": 500, "protein": 30, "carbs": 50, "fat": 15, "ingredients": ["A"], "recipe": ["Step 1"] }]
        },
        ... (6 more days) ...
      ]
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    let text = response.text;
    if (!text) throw new Error("No data returned from Gemini.");

    // Sanitization
    text = text.trim();
    text = text.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '');

    const data = JSON.parse(text);
    
    return {
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      goal: prefs.goal,
      duration: `${prefs.workoutDays.length} Days/Week`,
      preferences: prefs, 
      ...data
    };
  } catch (error) {
    return handleGeminiError(error);
  }
};

export const getAlternatives = async (
  itemName: string, 
  type: 'Exercise' | 'Meal', 
  constraint: string
): Promise<AlternativeOption[]> => {
  const ai = getClient();
  
  const prompt = `
    Substitute ${type}: "${itemName}". Issue: "${constraint}".
    Provide 3 alternatives.
    Return strictly valid JSON array.

    If Exercise, data must include: sets, reps, rest, notes (Tip), instructions (Array of strings).
    If Meal, data must include: calories, protein, carbs, fat, ingredients, recipe (Array of strings).

    Output format:
    [
      { 
        "name": "New Name", 
        "reason": "Why it fits", 
        "data": { ...properties... } 
      }
    ]
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text || "[]";
    const cleanText = text.replace(/```json|```/g, '').trim();
    return JSON.parse(cleanText);
  } catch (error) {
    return handleGeminiError(error);
  }
};

export const generateImage = async (prompt: string): Promise<string> => {
  const ai = getClient();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: prompt,
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image generated");
  } catch (error) {
    return handleGeminiError(error);
  }
};

export const editImage = async (base64Image: string, editInstruction: string): Promise<string> => {
  const ai = getClient();
  try {
    const matches = base64Image.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
    
    let mimeType = 'image/png';
    let data = base64Image;

    if (matches && matches.length === 3) {
      mimeType = matches[1];
      data = matches[2];
    } else {
      data = base64Image.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { mimeType, data } },
          { text: editInstruction }
        ]
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("Image editing failed");
  } catch (error) {
    return handleGeminiError(error);
  }
};

export const getDemoPlan = (): FitnessPlan => {
  return {
    id: 'demo-plan-123',
    createdAt: Date.now(),
    userName: 'Demo User',
    goal: 'Muscle Gain Demo',
    duration: '3 Days/Week',
    summary: 'A balanced routine for muscle gain with a full weekly diet.',
    totalCalories: 2600,
    preferences: {
        name: 'Demo User', age: 25, gender: 'Male', weight: 75, height: 180,
        goal: 'Muscle Gain', level: 'Intermediate', equipment: 'Gym',
        diet: 'None', workoutDays: ['Monday', 'Wednesday', 'Friday'], injuries: 'None', allergies: 'None', medications: 'None', remarks: 'None',
        mealsPerDay: 4, cheatDay: 'Sunday'
    },
    days: [
      {
        day: 'Monday',
        workout: [
          { id: 'w1_mon', name: 'Barbell Squat', sets: '4', reps: '8-10', rest: '120s', notes: 'Keep chest up.', instructions: ['Place bar on upper back.', 'Squat until thighs are parallel.'], imageUrl: '' }
        ],
        meals: [
          { id: 'm1_mon', name: 'Protein Oatmeal', calories: 550, protein: 35, carbs: 60, fat: 12, ingredients: ['Oats', 'Whey'], recipe: ['Cook oats.', 'Mix in protein.'], imageUrl: '' }
        ]
      },
      {
        day: 'Tuesday',
        workout: [{ id: 'w1_tue', name: 'Rest Day', sets: 'N/A', reps: 'N/A', rest: 'N/A', notes: 'Focus on recovery.', instructions: ['Light stretching or a short walk is beneficial.'] }],
        meals: [
          { id: 'm1_tue', name: 'Grilled Chicken Salad', calories: 500, protein: 40, carbs: 20, fat: 25, ingredients: ['Chicken Breast', 'Greens'], recipe: ['Grill chicken.', 'Serve over greens.'], imageUrl: '' }
        ]
      },
       {
        day: 'Wednesday',
        workout: [
          { id: 'w1_wed', name: 'Bench Press', sets: '3', reps: '10', rest: '90s', notes: 'Control the bar.', instructions: ['Lower bar to chest.', 'Press back up.'], imageUrl: '' }
        ],
        meals: [
          { id: 'm1_wed', name: 'Salmon and Quinoa', calories: 600, protein: 45, carbs: 50, fat: 20, ingredients: ['Salmon', 'Quinoa'], recipe: ['Bake salmon.', 'Cook quinoa.'], imageUrl: '' }
        ]
      },
       {
        day: 'Thursday',
        workout: [{ id: 'w1_thu', name: 'Active Recovery', sets: 'N/A', reps: '30 min', rest: 'N/A', notes: 'Light cardio.', instructions: ['Go for a brisk walk or a light jog.'] }],
        meals: [
          { id: 'm1_thu', name: 'Greek Yogurt Bowl', calories: 400, protein: 30, carbs: 40, fat: 15, ingredients: ['Greek Yogurt', 'Berries'], recipe: ['Combine in a bowl.'], imageUrl: '' }
        ]
      },
      {
        day: 'Friday',
        workout: [
          { id: 'w1_fri', name: 'Deadlift', sets: '4', reps: '6-8', rest: '180s', notes: 'Keep back straight.', instructions: ['Hinge at hips.', 'Lift with your legs.'], imageUrl: '' }
        ],
        meals: [
          { id: 'm1_fri', name: 'Steak and Sweet Potato', calories: 650, protein: 50, carbs: 55, fat: 22, ingredients: ['Steak', 'Sweet Potato'], recipe: ['Grill steak.', 'Bake sweet potato.'], imageUrl: '' }
        ]
      },
      {
        day: 'Saturday',
        workout: [{ id: 'w1_sat', name: 'Rest Day', sets: 'N/A', reps: 'N/A', rest: 'N/A', notes: 'Enjoy your weekend.', instructions: ['Allow your body to fully recover.'] }],
        meals: [
          { id: 'm1_sat', name: 'Chicken Wraps', calories: 500, protein: 35, carbs: 40, fat: 20, ingredients: ['Chicken', 'Tortilla'], recipe: ['Assemble ingredients in wrap.'], imageUrl: '' }
        ]
      },
       {
        day: 'Sunday',
        workout: [{ id: 'w1_sun', name: 'Rest Day', sets: 'N/A', reps: 'N/A', rest: 'N/A', notes: 'Prepare for the week.', instructions: ['Relax and hydrate.'] }],
        meals: [
          { id: 'm1_sun_cheat', name: 'Cheat Meal: Pizza', calories: 800, protein: 40, carbs: 90, fat: 35, ingredients: ['Pizza Dough', 'Cheese'], recipe: ['Enjoy a slice or two of your favorite pizza.'], imageUrl: '' }
        ]
      },
    ]
  };
};