type Language = 'en' | 'es';

type Theme = 'gittaur' | 'light' | 'dark' | 'custom' | 'system';

interface CustomTheme {
  primaryBg: string,
  secondaryBg: string,
  tertiaryBg: string,
  lighterBg: string,
  borderColor: string,

  primaryText: string,
  secondaryText: string,
  tertiaryText: string,
  contrastText: string,
}

interface Configuration {
  // General configs
  lang: Language,
  dateFormat: string,
  maxCommits: number,
  terminalApp: string,
  createTodo: boolean,
  // Git configs
  username: string,
  email: string,
  clonePath: string,
  // UI Customization
  themeConfig: Theme,
  themeValue: Theme,
  customTheme: CustomTheme,
  accentColor: string,
}
