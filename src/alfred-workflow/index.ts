import logger from './logger';
import { getWorkflow } from './workflow';

type WorkflowHandler = () => Promise<void>;

export async function run(handler: WorkflowHandler): Promise<void> {
  let exitCode = 0;

  try {
    await handler();
  } catch (err) {
    logger.error(err);
    getWorkflow().sendError(err);

    exitCode = 1;
  } finally {
    process.exit(exitCode);
  }
}
