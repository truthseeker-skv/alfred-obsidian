import cleanStack from 'clean-stack';

import { name as workflowName, version as workflowVersion } from './env/workflow';
import { version as alfredVersion } from './env/alfred';

function log(...args: Array<unknown>) {
  console.warn(...args);
}

function error(err: Error) {
  console.error(formatError(err));
}

export function formatError(err: Error) {
  return `
\`\`\`
  ${cleanStack(err.stack || 'No stack', { pretty: true })}
\`\`\`
-
Workflow: ${workflowName()} (v. ${workflowVersion() || '0.0.0'})
Alfred: ${alfredVersion()}
`.trim();
}

export default {
  log,
  error,
}
