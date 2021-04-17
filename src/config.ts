import invariant from 'invariant';

import workflow from './vaults/workflow';

export interface IConfig {
  vaults?: Record<IVaultConfig['name'], IVaultConfig>;
}

export interface IVaultConfig {
  name: string;
  rootDir?: string;
  dailyDir?: string;
  dailyTemplatePath?: string;
  isActive?: boolean;
}

export const vaultsConfig = (() => {
  const conf = workflow.config;

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
    conf.set('vaults', vaults);
  };

  const setVaultProp = (vault: string, propPath: keyof IVaultConfig, value: string) => {
    invariant(vault && propPath && value, 'setVaultProp: incorrect data', vault, propPath, value);
    conf.set(`vaults.${vault}.${propPath}`, value);
  };

  const setVaultActive = (vault: string) => {
    Object.keys(conf.get('vaults') || []).forEach((v) => {
      conf.set(`vaults.${v}.isActive`, v === vault);
    });
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
    hasVaults: () => Object.keys(getVaults()).length,
    isVaultProp,
    getVaults,
    addVault,
    getVaultProp,
    setVaultProp,
    setVaultActive,
    deleteVault,
    clear,
  };
})();