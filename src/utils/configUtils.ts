export const Languages: Record<Language, string> = {
  'en': 'English',
  'es': 'Spanish',
};

export const languageCodes: Language[] = Object.keys(Languages) as Language[];

export const languageNames: string[] = Object.values(Languages);

export function languageCodeFromStr(name: string): Language {
  const entries = Object.entries(Languages);
  const found = entries.find(([_, displayName]) => displayName === name);
  return found ? found[0] as Language : 'en';
}
