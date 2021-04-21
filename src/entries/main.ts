import fs from 'fs';
import mdfind, { Attributes } from 'mdfind';
import moment from 'moment';
import sortBy from 'lodash/sortBy';

import { run } from '../alfred-workflow';
import { createItem, Item } from '../alfred-workflow/item';
import { vaultsConfig, IVaultConfig } from '../config';
import { fileIcon, obsidianLightIcon, questionIcon, plusIcon } from '../icons';
import workflow from '../workflow';

const main = async (): Promise<void> => {
  const activeVault = vaultsConfig.getActiveVault();

  if (!activeVault) {
    // TODO: needs to redirect to vaults settings
    throw new Error('There is no active vault selected');
  }

  const input = workflow.input.trim();

  const templatePath = vaultsConfig.getVaultProp<string>(activeVault, 'regularTemplatePath');
  let noteTemplate = workflow.variables.get('note-template');

  if (!noteTemplate && templatePath) {
    noteTemplate = fs.readFileSync(templatePath, { encoding: 'utf-8' });
    workflow.variables.set('note-template', noteTemplate);
  }

  if (!input) {
    workflow.sendResult(
      createInfoItem({ title: 'Input something to start search' }),
    );
    return;
  }

  const result = await searchFile(input, getDirsForSearch(activeVault));

  if (!result.length) {
    workflow.sendResult([
      createInfoItem({ title: 'Notes not found' }),
      createNewNoteItem(activeVault, input, noteTemplate),
    ]);
    return;
  }

  workflow.sendResult(
    result.map((res) => (
      createItem({
        title: res.kMDItemDisplayName,
        arg: `obsidian://open?vault=${activeVault}&file=${encodeURIComponent(res.kMDItemDisplayName)}`,
        icon: {
          path: res.kMDItemDisplayName.endsWith('.md') ? obsidianLightIcon() : fileIcon(),
        },
      })
    ))
    .concat(createNewNoteItem(activeVault, input, noteTemplate))
  );
}

function createNewNoteItem(vault: string, input: string, template: string) {
  const encInput = encodeURIComponent(input);
  const encContent = encodeURIComponent(replacePatternsInTemplate(template));

  return createItem({
    title: `Create: "${input}"`,
    arg: `obsidian://new?vault=${vault}&name=${encInput}&content=${encContent}`,
    icon: {
      path: plusIcon(),
    }
  });
}

function createInfoItem(item: Omit<Item, 'icon' | 'valid'>) {
  return createItem({
    ...item,
    valid: false,
    icon: {
      path: questionIcon(),
    }
  });
}

function replacePatternsInTemplate(template: string) {
  return template
    // Replacing all dates patterns
    .replace(/{{date: ([^}]+)}}/gm, (_: any, p1: string) => moment().format(p1))
}

function getDirsForSearch(vault: string) {
  const getPathProp = (name: keyof IVaultConfig) => vaultsConfig.getVaultProp<string>(vault, name);

  return [
    getPathProp('notesDir'),
    getPathProp('dailyDir'),
    getPathProp('attachmentDir'),
  ];
}

async function searchFile(query: string, dirs: Array<string>): Promise<Array<Record<Attributes, string>>> {
  const sortResult = (result: Array<Record<Attributes, string>>) => {
    return sortBy(result, [
      it => new RegExp('\.md$').exec(it.kMDItemDisplayName),
      it => new RegExp(query, 'gmi').exec(it.kMDItemDisplayName)?.index,
      it => it.kMDItemFSContentChangeDate,
    ]);
  };

  return new Promise((resolve, reject) => {
    let result: Array<Record<Attributes, string>> = [];

    const _query = `(kMDItemDisplayName == '*${query}*'cd) || (kMDItemTextContent == '${query}'cd)`;

    const res = mdfind({
      query: _query,
      attributes: [
        'kMDItemDisplayName',
        'kMDItemTextContent',
        'kMDItemFSCreationDate',
        'kMDItemLastUsedDate',
        'kMDItemFSContentChangeDate',
      ],
      limit: 50,
      directories: dirs,
    });
    res.output.on('data', (data) => {
      result = result.concat(data);
    });
    res.output.on('error', (err) => reject(err));
    res.output.on('end', () => {
      resolve(
        sortResult(result)
      );
    });
  });
}

run(main);
