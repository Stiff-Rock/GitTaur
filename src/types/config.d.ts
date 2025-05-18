type Language = 'en' | 'es';

interface Configuration {
  // General configs
  lang: Language,
  dateFormat: string,
  maxCommits: number,
  terminalApp: string,
  // Git configs
  username: string,
  email: string,
  // UI Customization
  theme: string,
  accentColor: string,
}
