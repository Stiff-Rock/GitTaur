export function isValidGitName(name: string, isTag: boolean = false): boolean {
  // Check if empty
  if (!name || name.trim() === '') {
    return false;
  }

  // No spaces allowed
  if (/\s/.test(name)) {
    return false;
  }

  // No consecutive dots
  if (name.includes('..')) {
    return false;
  }

  // Check for illegal characters
  if (/[~^:?*\[\]\\@]/.test(name)) {
    return false;
  }

  // Cannot end with a slash or dot
  if (name.endsWith('/') || name.endsWith('.')) {
    return false;
  }

  // For tags specifically (stricter rules)
  if (isTag) {
    // Tags cannot contain slashes
    if (name.includes('/')) {
      return false;
    }

    // Tags cannot start with a dot
    if (name.startsWith('.')) {
      return false;
    }
  } else {
    // For branches - no component can start with a dot
    const parts = name.split('/');
    if (parts.some(part => part.startsWith('.') && part !== '.')) {
      return false;
    }
  }

  return true;
}
