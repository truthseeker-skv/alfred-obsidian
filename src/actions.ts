import { IVaultConfig } from './config';

export enum Action {
  // Vaults actions
  ShowVaultsList = 'vaults-list',
  AddVault = 'add-vault',
  ShowEditVaultOptions = 'edit-vault',
  DeleteVault = 'delete-vault',
  SetActiveVault = 'set-active-vault',
  ShowSetPath = 'show-set-path',
  SetPath = 'set-path',

  // Notes actions
}

export function showVaultsListAction() {
  return {
    name: Action.ShowVaultsList,
  };
}

export function addVaultAction(vault: string) {
  return {
    name: Action.AddVault,
    payload: { name: vault },
  };
}

export function deleteVaultAction(vault: string) {
  return {
    name: Action.DeleteVault,
    payload: { name: vault },
  };
}

export function setActiveVaultAction(vault: string) {
  return {
    name: Action.SetActiveVault,
    payload: { name: vault },
  };
}

export function showEditVaultOptionsAction(vault: string) {
  return {
    name: Action.ShowEditVaultOptions,
    payload: { name: vault },
  };
}

export function showSetPathAction(vault: string, pathTarget: keyof IVaultConfig) {
  return {
    name: Action.ShowSetPath,
    payload: {
      vault,
      target: pathTarget,
    },
  };
}

export function setPathAction(vault: string, pathTarget: keyof IVaultConfig, path: string) {
  return {
    name: Action.SetPath,
    payload: {
      vault,
      path,
      target: pathTarget,
    },
  };
}
