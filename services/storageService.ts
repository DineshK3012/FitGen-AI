import { FitnessPlan } from '../types';

const KEYS = {
  API_KEY: 'gemini_api_key',
  PLANS: 'fitness_plans',
  DRAFT_PLAN: 'fitness_plan_draft' // For temporary storage
};

export const storageService = {
  getApiKey: (): string | null => {
    // Prioritize user's key, then fall back to environment variable.
    const userKey = localStorage.getItem(KEYS.API_KEY);
    if (userKey) {
      return userKey;
    }
    // Use Vite's typed env object. Client-exposed env vars must be prefixed with `VITE_`.
    // NOTE: do not store true secrets in client-side code; prefer a server-side proxy.
    const gemini_api_key = import.meta.env.VITE_GEMINI_API_KEY;
    return gemini_api_key ?? null;
  },

  // Returns only the user-provided API key saved in localStorage.
  // This intentionally does NOT fall back to `import.meta.env` so callers
  // (like the Settings UI) don't accidentally expose env keys to users.
  getUserApiKey: (): string | null => {
    const userKey = localStorage.getItem(KEYS.API_KEY);
    return userKey ?? null;
  },

  setApiKey: (key: string) => {
    localStorage.setItem(KEYS.API_KEY, key);
  },

  // --- Permanent Storage (Dashboard) ---

  getPlans: (): FitnessPlan[] => {
    const plans = localStorage.getItem(KEYS.PLANS);
    return plans ? JSON.parse(plans) : [];
  },

  savePlan: (plan: FitnessPlan) => {
    const plans = storageService.getPlans();
    // Check if exists
    const index = plans.findIndex(p => p.id === plan.id);
    if (index !== -1) {
      plans[index] = plan;
    } else {
      plans.unshift(plan);
    }
    localStorage.setItem(KEYS.PLANS, JSON.stringify(plans));
  },

  updatePlan: (updatedPlan: FitnessPlan) => {
    // Also try to update draft if it matches
    const draft = storageService.getDraftPlan();
    if (draft && draft.id === updatedPlan.id) {
      storageService.saveDraftPlan(updatedPlan);
    }

    // Update permanent storage
    const plans = storageService.getPlans();
    const index = plans.findIndex(p => p.id === updatedPlan.id);
    if (index !== -1) {
      plans[index] = updatedPlan;
      localStorage.setItem(KEYS.PLANS, JSON.stringify(plans));
    }
  },

  deletePlan: (id: string) => {
    const plans = storageService.getPlans();
    const filtered = plans.filter(p => p.id !== id);
    localStorage.setItem(KEYS.PLANS, JSON.stringify(filtered));
  },

  getPlanById: (id: string): FitnessPlan | undefined => {
    // Check permanent storage first
    const plan = storageService.getPlans().find(p => p.id === id);
    if (plan) return plan;

    // Check draft storage
    const draft = storageService.getDraftPlan();
    if (draft && draft.id === id) return draft;

    return undefined;
  },

  // --- Temporary Storage (Drafts) ---

  saveDraftPlan: (plan: FitnessPlan) => {
    sessionStorage.setItem(KEYS.DRAFT_PLAN, JSON.stringify(plan));
  },

  getDraftPlan: (): FitnessPlan | null => {
    const draft = sessionStorage.getItem(KEYS.DRAFT_PLAN);
    return draft ? JSON.parse(draft) : null;
  },

  clearDraft: () => {
    sessionStorage.removeItem(KEYS.DRAFT_PLAN);
  },

  // Helper to check if a plan is just a draft
  isDraft: (id: string): boolean => {
    const draft = storageService.getDraftPlan();
    const permanent = storageService.getPlans().find(p => p.id === id);
    return !!(draft && draft.id === id && !permanent);
  }
};