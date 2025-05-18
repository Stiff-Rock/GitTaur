export const nameToCode: Record<string, Language> = {
  'English': 'en',
  'Spanish': 'es',
};

export const codeToName: Record<Language, string> = {
  'en': 'English',
  'es': 'Spanish',
};

export const languageNames: string[] = Object.keys(nameToCode);

export const languageCodes: Language[] = Object.values(nameToCode);

export function languageCodeFromName(name: string): Language {
  let code: Language = nameToCode[name];
  if (!code) code = 'en';
  return code;
}

export function languageNameFromCode(code: Language): string {
  let name: string = codeToName[code];
  if (!name) name = 'English';
  return name;
}
