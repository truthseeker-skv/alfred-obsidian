import { getWorkflow } from '@truthseeker-skv/alfred-workflow/lib/workflow';

import { IConfig } from './config';

export default getWorkflow<IConfig>({
  configOptions: {}
});
