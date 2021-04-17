import { getEnv } from '../utils/alfred';

// Returns the name of the currently running workflow.
export function name(): string {
  return getEnv('workflow_name')!;
}

// Returns the version of the currently running workflow.
export function version(): string {
  return getEnv('workflow_version')!;
}

// Returns the unique ID of the currently running workflow.
// Example: "user.workflow.B0AC54EC-601C-479A-9428-01F9FD732959"
export function uid(): string {
  return getEnv('workflow_uid')!;
}

// Returns the bundle ID of the current running workflow.
export function bundleId(): string {
  return getEnv('workflow_bundleid')!;
}

// Returns `true` if the user has the debug panel open for the workflow.
export function isDebug(): boolean {
  return getEnv('debug') === '1';
}

// Returns the recommended location for non-volatile workflow data.
// Will only be populated if the workflow has a bundle identifier set.
// Example: "/Users/User/Library/Application Support/Alfred/Workflow Data/com.alfredapp.david.googlesuggest"
export function dataPath() {
  return getEnv('workflow_data');
}

// Returns the recommended location for volatile workflow data.
// Will only be populated if the workflow has a bundle identifier set.
// Example: "/Users/User/Library/Caches/com.runningwithcrayons.Alfred/Workflow Data/com.alfredapp.david.googlesuggest"
export function cachePath() {
  return getEnv('workflow_cache');
}
