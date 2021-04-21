import { getWorkflow } from './alfred-workflow/workflow';
import { IConfig } from './config';

export default getWorkflow<IConfig>({
  configOptions: {}
});
