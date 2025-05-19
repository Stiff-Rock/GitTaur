type Language = 'en' | 'es';

type Theme = 'light' | 'dark' | 'system';

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
  themeConfig: Theme,
  themeValue: Theme,
  accentColor: string,
}
