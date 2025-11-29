
import { GoogleGenAI, Type } from "@google/genai";
import { UserPreferences, FitnessPlan, AlternativeOption } from "../types";

const getClient = () => {
  const apiKey = localStorage.getItem('gemini_api_key');
  if (!apiKey) throw new Error("API Key not found");
  return new GoogleGenAI({ apiKey });
};

export const generateFitnessPlan = async (prefs: UserPreferences): Promise<FitnessPlan> => {
  const ai = getClient();
  
  // Optimized prompt: shorter instructions, strictly valid JSON to prevent truncation and improve speed
  const prompt = `
    Create a JSON fitness plan for: ${prefs.name}, ${prefs.goal}, ${prefs.level}, ${prefs.equipment}, ${prefs.workoutDays.join(',')}.
    Diet: ${prefs.diet}. Allergies: ${prefs.allergies}. Injuries: ${prefs.injuries}.
    Additional User Remarks/Requests: "${prefs.remarks || 'None'}".

    Constraints:
    1. Output strictly valid JSON.
    2. 'instructions': Provide clear step-by-step instructions as an array of strings (e.g. ["Stand tall", "Lower hips"]). Max 4 steps.
    3. 'notes': max 10 words tip.
    4. 'recipe': Provide preparation steps as an array of strings (e.g. ["Mix ingredients", "Cook for 10 mins"]). Max 4 steps.
    5. 'summary': max 15 words.

    JSON Structure:
    {
      "userName": "${prefs.name}",
      "summary": "...",
      "totalCalories": 2500,
      "days": [
        {
          "day": "Monday",
          "workout": [{ "id": "w1", "name": "...", "sets": "3", "reps": "10", "rest": "60s", "notes": "...", "instructions": ["Step 1", "Step 2"] }],
          "meals": [{ "id": "m1", "name": "...", "calories": 500, "protein": 30, "carbs": 50, "fat": 15, "ingredients": ["A"], "recipe": ["Step 1", "Step 2"] }]
        }
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
    // Remove markdown code blocks if present
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
    console.error("Plan Generation Error:", error);
    throw error;
  }
};

export const getAlternatives = async (
  itemName: string, 
  type: 'Exercise' | 'Meal', 
  constraint: string
): Promise<AlternativeOption[]> => {
  const ai = getClient();
  
  // Prompt requests full data structure to ensure Instructions and Tips are updated correctly
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

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: "application/json"
    }
  });

  const text = response.text || "[]";
  try {
    const cleanText = text.replace(/```json|```/g, '').trim();
    return JSON.parse(cleanText);
  } catch (e) {
    return [];
  }
};

export const generateImage = async (prompt: string): Promise<string> => {
  const ai = getClient();
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
};

export const editImage = async (base64Image: string, editInstruction: string): Promise<string> => {
  const ai = getClient();
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
};

export const getDemoPlan = (): FitnessPlan => {
  return {
    id: 'demo-plan-123',
    createdAt: Date.now(),
    userName: 'Demo User',
    goal: 'Muscle Gain Demo',
    duration: '3 Days/Week',
    summary: 'This is a demonstration plan designed to showcase the capabilities of the application.',
    totalCalories: 2600,
    preferences: {
        name: 'Demo User', age: 25, gender: 'Male', weight: 75, height: 180,
        goal: 'Muscle Gain', level: 'Intermediate', equipment: 'Gym',
        diet: 'None', workoutDays: ['Mon', 'Wed', 'Fri'], injuries: 'None', allergies: 'None', medications: 'None', remarks: 'None'
    },
    days: [
      {
        day: 'Monday',
        workout: [
          { id: 'w1', name: 'Barbell Squat', sets: '4', reps: '8-10', rest: '120s', notes: 'Keep chest up.', instructions: ['Place bar on upper back.', 'Feet shoulder width.', 'Squat down until thighs are parallel.', 'Drive back up.'], imageUrl: '' },
          { id: 'w2', name: 'Bench Press', sets: '3', reps: '10', rest: '90s', notes: 'Control the bar.', instructions: ['Lie on bench.', 'Grip bar wider than shoulders.', 'Lower bar to chest.', 'Press back up.'], imageUrl: '' }
        ],
        meals: [
          { id: 'm1', name: 'Oatmeal Protein Bowl', calories: 550, protein: 35, carbs: 60, fat: 12, ingredients: ['Oats', 'Whey Protein', 'Berries'], recipe: ['Cook oats in water.', 'Stir in whey protein.', 'Top with berries.'], imageUrl: '' }
        ]
      }
    ]
  };
};