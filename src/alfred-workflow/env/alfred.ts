// https://www.alfredapp.com/help/workflows/script-environment-variables/

import { getEnv } from '../utils/alfred';

// Returns the location of the Alfred.alfredpreferences.
// Example: "/Users/Crayons/Alfred/Alfred.alfredpreferences"
export function preferences(): string {
  return getEnv('preferences')!;
}

// Returns the location of local (Mac-specific) preferences.
export function localPreferences(): string {
  return getEnv('preferences_localhash')!;
}

// Returns the version of Alfred.
// Example: "3.2.1"
export function version(): string {
  return getEnv('version')!;
}

// Returns the current Alfred theme.
export function theme(): string {
  return getEnv('theme')!;
}

// Returns the color of the theme background.
// Example: "rgba(255,255,255,0.98)"
export function themeBackground(): string {
  return getEnv('theme_background')!;
}

// Returns the color of the theme's selected item background.
// Example: "rgba(255,255,255,0.98)"
export function themeSelectionBackground(): string {
  return getEnv('theme_selection_background')!;
}

export enum SubtextMode {
  Always = '0',
  AlternativeActions = '1',
  SelectedResult = '2',
  Never = '3',
}

// Returns the subtext mode the user has selected in the Appearance preferences.
export function themeSubtextMode(): SubtextMode {
  switch (getEnv('theme_subtext')) {
    case SubtextMode.Always:
      return SubtextMode.Always;
    case SubtextMode.AlternativeActions:
      return SubtextMode.AlternativeActions;
    case SubtextMode.SelectedResult:
      return SubtextMode.SelectedResult;
    case SubtextMode.Never:
      return SubtextMode.Never;
    default:
      throw new Error('Unknown theme subtext mode received.');
  }
}
