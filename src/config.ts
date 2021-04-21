import invariant from 'invariant';

import workflow from './workflow';

export interface IConfig {
  notesSearchIndexes?: string, // TODO: check type and set correct one
  vaults?: Record<IVaultConfig['name'], IVaultConfig>;
}

export interface IVaultConfig {
  name: string;
  isActive?: boolean;
  rootDir?: string;
  notesDir?: string;
  regularTemplatePath?: string;
  attachmentDir?: string;
  dailyDir?: string;
  dailyTemplatePath?: string;
}

export const config = workflow.config;

export const vaultsConfig = (() => {
  const conf = workflow.config;

  const hasVaults = () => !!Object.keys(getVaults()).length;

  const getVaults = (): Record<string, IVaultConfig> => {
    return conf.get('vaults', {})
  };

  const isVaultProp = (vault: string, prop: keyof IVaultConfig): boolean => {
    return Boolean(conf.get(`vaults.${vault}.${prop}`));
  };

  const addVault = (vault: IVaultConfig) => {
    invariant(vault.name, 'Vault name is not specified');

    const vaults = getVaults();
    vaults[vault.name] = vault;
    if (!hasVaults()) {
      vault.isActive = true;
    }
    conf.set('vaults', vaults);
  };

  const setVaultProp = (vault: string, propPath: keyof IVaultConfig, value: string) => {
    invariant(vault && propPath && value, 'setVaultProp: incorrect data', vault, propPath, value);
    conf.set(`vaults.${vault}.${propPath}`, value);
  };

  const getActiveVault = () => {
    const vaults = getVaults();
    return (Object.keys(vaults)).find((name) => vaults[name].isActive) || null
  };

  const setVaultActive = (vault: string) => {
    Object.keys(conf.get('vaults') || []).forEach((v) => {
      conf.set(`vaults.${v}.isActive`, v === vault);
    });
  };

  const isVaultActive = (vault: string) => {
    return Boolean(conf.get(`vaults.${vault}.isActive`));
  };

  const getVaultProp = <T>(vault: string, propPath: keyof IVaultConfig): T => {
    return conf.get(`vaults.${vault}.${propPath}`);
  };

  const deleteVault = (name: string) => {
    let { [name]: _, ...rest } = getVaults();
    conf.set('vaults', rest);
  };

  const clear= () => {
    conf.delete('vaults');
  };

  return {
    hasVaults,
    isVaultProp,
    isVaultActive,
    getActiveVault,
    getVaults,
    addVault,
    getVaultProp,
    setVaultProp,
    setVaultActive,
    deleteVault,
    clear,
  };
})();
