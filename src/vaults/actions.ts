import invariant from 'invariant';
import fs from 'fs';
import path from 'path';
import isUndefined from 'lodash/isUndefined';

import logger from '../alfred-workflow/logger';
import { settingsIcon, checkIcon } from '../icons';
import { createItem, createDeleteItem } from '../alfred-workflow/item';
import { IVaultConfig, vaultsConfig } from '../config';
import workflow from '../workflow';

export enum Action {
  ShowVaultsList = 'vaults-list',
  AddVault = 'add-vault',
  ShowEditVaultOptions = 'edit-vault',
  DeleteVault = 'delete-vault',
  ShowSetPath = 'show-set-path',
  SetPath = 'set-path',
  SetActive = 'set-active',
}

export function showVaultsList() {
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
      variables: {
        action: Action.AddVault,
        payload: { name: workflow.input },
      }
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
        variables: {
          action: Action.ShowEditVaultOptions,
          payload: { name: vaults[vault].name }
        },
        icon: {
          path: vaultsConfig.isVaultActive(vault) ? checkIcon() : settingsIcon(),
        },
      }))
    ));
}

export function setVaultActive(vault: string) {
  vaultsConfig.setVaultActive(vault);
  workflow.pushAction(Action.ShowVaultsList);
}

export function loadDefaultParamsIfRequired(vault: string) {
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

export function showEditVaultOptions(vault: string) {
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
      variables: {
        action: Action.DeleteVault,
        payload: { name: vault },
      },
    })
  ];

  if (!vaultsConfig.isVaultActive(vault)) {
    items.unshift(
      createItem({
        title: 'Set as active',
        subtitle: `'${vault}' will become default vault`,
        variables: {
          action: Action.SetActive,
          payload: { name: vault },
        },
      }),
    )
  }

  workflow.sendResult(items);
}

export function addVault(name: string) {
  invariant(name, 'Incorrect vault name');
  vaultsConfig.addVault({ name });
  workflow.pushAction(Action.ShowVaultsList);
}

export function deleteVault(name: string) {
  invariant(name, 'Incorrect vault name');
  vaultsConfig.deleteVault(name);
  workflow.pushAction(Action.ShowVaultsList);
}

export function setVaultPath(vault: string, target: keyof IVaultConfig, path: string) {
  vaultsConfig.setVaultProp(vault, target, path);
  workflow.pushAction(Action.ShowEditVaultOptions, { name: vault });
}

interface ISpecifyPathItem {
  title: string;
  subtitle: string;
  vault: string;
  pathTarget: keyof IVaultConfig;
}

export function createPathSettingItem(item: ISpecifyPathItem) {
  const isSpecified = vaultsConfig.isVaultProp(item.vault, item.pathTarget);

  return createItem({
    title: item.title,
    subtitle: vaultsConfig.getVaultProp(item.vault, item.pathTarget) || item.subtitle,
    arg: vaultsConfig.getVaultProp(item.vault, 'rootDir'),
    variables: {
      action: Action.ShowSetPath,
      payload: {
        vault: item.vault,
        target: item.pathTarget,
      },
    },
    icon: {
      path: isSpecified ? checkIcon() : settingsIcon(),
    },
  });
}
