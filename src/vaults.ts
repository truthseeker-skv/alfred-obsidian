import fs from 'fs';
import invariant from 'invariant';
import path from 'path';
import isUndefined from 'lodash/isUndefined';

import { questionIcon, settingsIcon, checkIcon } from '@truthseeker-skv/alfred-workflow/lib/icons';
import { createItem, createDeleteItem, createDirentItem } from '@truthseeker-skv/alfred-workflow/lib/items';
import { walkDir } from '@truthseeker-skv/alfred-workflow/lib/helpers/walk-dir';
import { logger } from '@truthseeker-skv/alfred-workflow';

import {
  Action,
  setPathAction,
  showVaultsListAction,
  deleteVaultAction,
  setActiveVaultAction,
  addVaultAction,
  showEditVaultOptionsAction,
  showSetPathAction,
} from './actions';
import { IVaultConfig, vaultsConfig } from './config';
import workflow from './workflow';

export default async () => {
  const { name: action, payload } = workflow.action;

  switch (action) {
    case Action.AddVault:
      addVault(payload.name);
      break;

    case Action.DeleteVault:
      deleteVault(payload.name);
      break;

    case Action.SetActiveVault:
      setVaultActive(payload.name);
      break;

    case Action.ShowEditVaultOptions:
      loadInitialParamsFromObsidian(payload.name);
      showEditVaultOptions(payload.name);
      break;

    case Action.ShowSetPath:
      await showFilesFilter(payload.vault, payload.target);
      break;

    case Action.SetPath:
      setVaultPath(payload.vault, payload.target, payload.path);
      break;

    default:
      showVaultsList();
  }
};

function addVault(name: string) {
  invariant(name, 'Incorrect vault name');
  vaultsConfig.addVault({ name });
  workflow.pushAction(
    showVaultsListAction()
  );
}

function deleteVault(name: string) {
  invariant(name, 'Incorrect vault name');
  vaultsConfig.deleteVault(name);
  workflow.pushAction(
    showVaultsListAction()
  );
}

function setVaultActive(vault: string) {
  vaultsConfig.setVaultActive(vault);
  workflow.pushAction(
    showVaultsListAction()
  );
}

function loadInitialParamsFromObsidian(vault: string) {
  const rootPath = vaultsConfig.getVaultProp<string>(vault, 'rootDir');
  if (!rootPath) {
    return;
  }

  const obsConfigPath = path.resolve(rootPath, '.obsidian', 'config');

  try {
    const obsConfig = JSON.parse(fs.readFileSync(obsConfigPath, { encoding: 'utf-8' }));

    const setParam = (from: string, to: keyof IVaultConfig) => {
      const paramValue = vaultsConfig.getVaultProp(vault, to);

      if (obsConfig[from] && isUndefined(paramValue)) {
        vaultsConfig.setVaultProp(vault, to, path.join(rootPath, obsConfig[from]));
      }
    };

    setParam('newFileFolderPath', 'notesDir');
    setParam('attachmentFolderPath', 'attachmentDir');
  } catch (err) {
    logger.error(err);
  }
}

function showEditVaultOptions(vault: string) {
  const items = [
    createPathSettingItem({
      title: 'Vault\'s root',
      subtitle: `Specify path to '${vault}' directory`,
      vault,
      pathTarget: 'rootDir',
    }),
    createPathSettingItem({
      title: 'Regular notes directory',
      subtitle: `Specify path to regular notes folder of vault '${vault}'`,
      vault,
      pathTarget: 'notesDir',
    }),
    createPathSettingItem({
      title: 'Regular note template file',
      subtitle: `Specify path to template file of vault '${vault}'`,
      vault,
      pathTarget: 'regularTemplatePath',
    }),
    createPathSettingItem({
      title: 'Attachment directory',
      subtitle: `Specify path to attachments folder of vault '${vault}'`,
      vault,
      pathTarget: 'attachmentDir',
    }),
    createPathSettingItem({
      title: 'Daily notes directory',
      subtitle: `Specify path to daily notes folder of vault '${vault}'`,
      vault,
      pathTarget: 'dailyDir',
    }),
    createPathSettingItem({
      title: 'Daily note template file',
      subtitle: `Specify path to daily template file of vault '${vault}'`,
      vault,
      pathTarget: 'dailyTemplatePath',
    }),
    createDeleteItem({
      title: 'Delete vault from workflow',
      subtitle: `Will delete '${vault}' vault.`,
      action: deleteVaultAction(vault),
    })
  ];

  if (!vaultsConfig.isVaultActive(vault)) {
    items.unshift(
      createItem({
        title: 'Set as active',
        subtitle: `'${vault}' will become default vault`,
        action: setActiveVaultAction(vault),
      }),
    )
  }

  workflow.sendResult(items);
}

async function showFilesFilter(vault: string, target: keyof IVaultConfig) {
  const dirTargets: Array<keyof IVaultConfig> = ['dailyDir', 'rootDir'];

  const entries = await walkDir(workflow.input, {
    type: dirTargets.includes(target) ? 'directories' : 'files_directories',
    showHidden: false,
  });

  let items = entries.map((entry) => (
    createDirentItem(entry)
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
        action: setPathAction(vault, target, workflow.input),
        icon: {
          path: settingsIcon(),
        },
      }),
    );
  }

  workflow.sendResult(items);
}

function setVaultPath(vault: string, target: keyof IVaultConfig, path: string) {
  vaultsConfig.setVaultProp(vault, target, path);
  workflow.pushAction(
    showEditVaultOptionsAction(vault)
  );
}

interface ISpecifyPathItem {
  title: string;
  subtitle: string;
  vault: string;
  pathTarget: keyof IVaultConfig;
}

function createPathSettingItem(item: ISpecifyPathItem) {
  const isSpecified = vaultsConfig.isVaultProp(item.vault, item.pathTarget);

  return createItem({
    title: item.title,
    subtitle: vaultsConfig.getVaultProp(item.vault, item.pathTarget) || item.subtitle,
    arg: vaultsConfig.getVaultProp(item.vault, 'rootDir'),
    action: showSetPathAction(item.vault, item.pathTarget),
    icon: {
      path: isSpecified ? checkIcon() : settingsIcon(),
    },
  });
}

function showVaultsList() {
  if (workflow.input) {
    showAddVault();
    return;
  }

  if (!vaultsConfig.hasVaults()) {
    showNoVaults();
    return;
  }

  showVaultsItems(vaultsConfig.getVaults());
}

function showNoVaults() {
  workflow.sendResult([
    createItem({
      title: 'Vaults not found.',
      subtitle: 'Input the name to add one.',
      valid: false,
    }),
  ]);
}

function showAddVault() {
  workflow.sendResult([
    createItem({
      title: `Add vault '${workflow.input}'.`,
      action: addVaultAction(workflow.input),
    }),
  ]);
}

function showVaultsItems(vaults: Record<IVaultConfig['name'], IVaultConfig>) {
  workflow.sendResult(
    Object.keys(vaults).map((vault) => (
      createItem({
        title: vaults[vault].name,
        autocomplete: vaults[vault].name,
        subtitle: 'Select to edit vault settings.',
        action: showEditVaultOptionsAction(vaults[vault].name),
        icon: {
          path: vaultsConfig.isVaultActive(vault) ? checkIcon() : settingsIcon(),
        },
      }))
    ));
}
