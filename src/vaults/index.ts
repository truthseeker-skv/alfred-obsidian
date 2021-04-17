import { createItem, ItemType } from '../alfred-workflow/item';
import logger from '../alfred-workflow/logger';
import { filterFiles } from '../alfred-workflow/utils/fs-filter';
import { IVaultConfig, vaultsConfig } from '../config';
import { folderIcon, fileIcon, questionIcon, settingsIcon } from '../icons';
import { Action, showVaultsList, addVault, showEditVaultOptions, deleteVault, setVaultPath } from './actions';
import workflow from './workflow';

export default async () => {
  const { action, payload } = workflow.variables.all();

  // if (vaultsConfig.hasVaults() && !action) {
  //   vaultsConfig.clear();
  // }
  logger.log('====>>> Logging actions: ', action, payload, vaultsConfig.getVaults());

  switch (action) {
    case Action.AddVault:
      addVault(payload.name);
      break;

    case Action.ShowEditVaultOptions:
      showEditVaultOptions(payload.name);
      break;

    case Action.SetPath:
      setVaultPath(payload.vault, payload.target, payload.path);
      break;

    case Action.DeleteVault:
      deleteVault(payload.name);
      break;

    case Action.ShowSetPath:
      await showFilesFilter(payload.vault, payload.target);
      break;

    default:
      showVaultsList();
  }
};

async function showFilesFilter(vault: string, target: keyof IVaultConfig) {
  const dirTargets: Array<keyof IVaultConfig> = ['dailyDir', 'rootDir'];

  const entries = await filterFiles(workflow.input, {
    type: dirTargets.includes(target) ? 'directories' : 'files_directories',
    showHidden: false,
  });

  let items = entries.map((entry) => (
    createItem({
      title: entry.path,
      subtitle: entry.fullPath,
      autocomplete: `${entry.fullPath}${entry.dirent?.isDirectory() ? '/' : ''}`,
      valid: false,
      type: ItemType.File,
      icon: {
        path: (() => {
          if (entry.dirent?.isDirectory()) {
            return folderIcon();
          }
          if (entry.dirent?.isFile()) {
            return fileIcon();
          }
          return questionIcon();
        })(),
      },
    })
  ));

  if (!items.length) {
    items.unshift(
      createItem({
        title: workflow.input ? 'No files found in this path.' : 'Start with typing: / or ~',
        valid: !!workflow.input,
        icon: {
          path: questionIcon(),
        }
      }),
    );
  }

  if (workflow.input) {
    items.unshift(
      createItem({
        title: 'Select this path',
        variables: {
          action: Action.SetPath,
          payload: {
            vault,
            target,
            path: workflow.input,
          },
        },
        icon: {
          path: settingsIcon(),
        },
      }),
    );
  }

  workflow.sendResult(items);
}
