import Conf, { Options } from 'conf';

import * as wfEnv from './env/workflow';
import * as env from './env/alfred';
import { closeIcon } from '../icons';
import { ItemCreator, createItem } from './item';
import { formatError } from './logger';
import { initVariables, Variables } from './variables';

export type Workflow = ReturnType<typeof getWorkflow>;

export function getWorkflow<T>(params: WorkflowOptions<T> = {}) {
  const input = process.argv[2] || '';
  const config = initConfig(params.configOptions);
  const variables: Variables = initVariables();

  function sendResult(
    itemsCreators?: ItemCreator | Array<ItemCreator>,
    params: ISendFeedbackParams = {}
  ) {
    const items = Array.isArray(itemsCreators)
      ? itemsCreators
      : [itemsCreators].filter(Boolean);

    console.log(
      JSON.stringify({
        variables: variables.obj(),
        items: items.map((it) => (
          it!.obj({ workflowVariables: variables })
        )),
        rerun: params.rerunInterval,
      }, null, 2)
    );
  }

  function sendError(err: Error) {
    const formattedError = formatError(err);

    sendResult([
      createItem({
        title: `${err.name}: ${err.message}`,
        subtitle: 'Press ⌘L to see the full error and ⌘C to copy it.',
        valid: false,
        text: {
          copy: formattedError,
          largetype: err.stack,
        },
        icon: {
          path: closeIcon(),
        },
      })
    ]);
  }

  function pushAction<T>(action: string, payload?: T) {
    variables.set('action', action);
    if (payload) {
      variables.set('payload', payload);
    }
    sendResult([], { rerunInterval: .1 });
  }

  return {
    env: {
      ...wfEnv,
      alfred: env,
    },
    input,
    config,
    variables,
    sendResult,
    pushAction,
    sendError,
  };
}

export type ConfigOptions<T> = Omit<Options<T>, 'cwd' | 'serialize'>;

function initConfig<T>(params: ConfigOptions<T> = {}) {
  return new Conf({
    cwd: wfEnv.dataPath(),
    serialize: (value) => JSON.stringify(value, null, 2),
    ...params,
  });
}

export interface IWorkflowState {
  arg?: string;
  variables?: Record<string, unknown>;
}

export interface WorkflowOptions<T> {
  configOptions?: ConfigOptions<T>;
}

interface ISendFeedbackParams {
  rerunInterval?: number;
}
