import { closeIcon } from '../icons';
import { initVariables, Variables } from './variables';

export type ItemCreator = ReturnType<typeof createItem>;

export function createItem(item: Item) {
  const variables = initVariables(item.variables || {});

  const itemData: Item = {
    valid: true,
    type: ItemType.Default,
    ...item,
  };

  return {
    variables,
    obj: (params: IItemFlushParams): Item => {
      variables.update({ ...params.workflowVariables.all(), ...variables.all() });

      for (const key in itemData.modifiers) {
        const mod = itemData.modifiers[key];
        const modVars = initVariables(mod.variables);
        modVars.update({ ...variables.all(), ...modVars.all() });
        mod.variables = modVars.obj();
      }

      return {
        ...itemData,
        variables: variables.obj(),
      };
    },
  };
}

export function createDeleteItem(item: Omit<Item, 'icon'>) {
  return createItem({
    ...item,
    icon: { path: closeIcon() },
  });
}

export interface Item {
  /**
   * Title for the item.
   */
  title: string;

  /**
   * Subtitle may be overridden by modifiers.
   */
  subtitle?: string;

  /**
   * Whether or not the result is valid.
   * When 'false', actioning the result will populate the search field with
   * the 'autocomplete' value instead.
   * The validity may be overridden by modifiers.
   */
  valid?: boolean;

  /**
   * The value that is passed to the next portion of the workflow when this item is selected.
   */
  arg?: string;

  /**
   * Autocomplete data for the item.
   * This value is populated into the search field if the tab key is
   * pressed.
   * If 'valid = false', this value is populated if the item is
   * actioned.
   */
  autocomplete?: string;

  /**
   * If you have "Alfred filters results" turned on for your Script Filter,
   * Alfred (version 3.5 and above) will filter against this field, not "title".
   */
  match?: string;

  /**
   * Identifier for the results.
   * If given, must be unique among items, and is used for prioritizing
   * feedback results based on usage. If blank, Alfred presents results in
   * the order given and does not learn from them.
   */
  uid?: string;

  /**
   * What type of result this is.
   */
  type?: ItemType;

  /**
   * A URL to use for Quick Look.
   */
  quicklookurl?: string;

  /**
   * Variables to pass out of the script filter if this item is selected in Alfred's results.
   * This property is only used with JSON output and only affects Alfred 3.4.1 or later.
   */
  variables?: Record<string, unknown>;

  /**
   * Icon for the item
   */
  icon?: {
    path?: string;
    type?: string;
  };

  text?: {
    /**
     * What text the user gets when displaying large type.
     * This value is displayed if the user presses ⌘L.
     */
    largetype?: string;

    /**
     * What text the user gets when copying the result.
     * This value is copied if the user presses ⌘C.
     */
    copy?: string;
  };

  /**
   * Optional overrides of subtitle, arg, and valid by modifiers.
   */
  modifiers?: Record<ModifierKey, ModifierData>;
}

export enum ItemType {
  /**
   * Default type for an item.
   */
  Default,

  /**
   * Type representing a file.
   * Already checks that the file exists on disk, and hides the result if it does not.
   */
  File,

  /**
   * Type representing a file, with filesystem checks skipped.
   * Similar to `File` but skips the check to ensure the file exists.
   */
  FileSkipCheck,
}

export interface Icon {
  path?: string;
  // UTI for a file type to use (e.g. public.folder).
  type?: string;
}

export enum ModifierKey {
  // Command key
  Command,
  // Option/Alt key
  Option,
  // Control key
  Control,
  // Shift key
  Shift,
  // Fn key
  Fn
}

export type ModifierData = Partial<Pick<Item, 'subtitle' | 'arg' | 'valid' | 'icon' | 'variables'>>;

interface IItemFlushParams {
  workflowVariables: Variables;
}
