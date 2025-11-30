export interface UserSettings {
  craftToken: string;
  openaiKey: string;
}

const STORAGE_KEY = "memory_capsule_settings";

export const saveSettings = (settings: UserSettings) => {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }
};

export const getSettings = (): UserSettings | null => {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  }
  return null;
};
