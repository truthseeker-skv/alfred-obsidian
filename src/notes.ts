import fs from 'fs';
import moment from 'moment';
import sortBy from 'lodash/sortBy';

import { createItem, createInfoItem } from '@truthseeker-skv/alfred-workflow/lib/items';
import { fileIcon, plusIcon } from '@truthseeker-skv/alfred-workflow/lib/icons';
import { searchFiles, SearchFilesResult } from '@truthseeker-skv/alfred-workflow/lib/helpers/search-files';

import { showVaultsListAction } from './actions';
import { vaultsConfig, IVaultConfig } from './config';
import { obsidianLightIcon } from './icons';
import workflow from './workflow';

export default async () => {
  const activeVault = vaultsConfig.getActiveVault();

  if (!activeVault) {
    workflow.pushAction(showVaultsListAction());
    return;
  }

  const input = workflow.input.trim();
  const noteTemplate = preloadNoteTemplate(activeVault);

  if (!input) {
    workflow.sendResult(
      createInfoItem({ title: 'Input something to start search' }),
    );
    return;
  }

  // const result = await searchFile(input, getDirsForSearch(activeVault));
  const result = await searchFiles({
    query: input,
    directories: getDirsForSearch(activeVault),
    sortResult: (result: SearchFilesResult) => {
      return sortBy(result, [
        it => new RegExp('\.md$').exec(it.kMDItemDisplayName),
        it => new RegExp(input, 'gmi').exec(it.kMDItemDisplayName)?.index,
        it => it.kMDItemFSContentChangeDate,
      ]);
    }
  });

  if (!result.length) {
    workflow.sendResult([
      createInfoItem({ title: 'Notes not found' }),
      createNewNoteItem(activeVault, input, noteTemplate),
    ]);
    return;
  }

  workflow.sendResult(
    result
      .map((res) => (
        createNoteItem(activeVault, res.kMDItemDisplayName)
      ))
      .concat(
        createNewNoteItem(activeVault, input, noteTemplate)
      )
  );
};

function preloadNoteTemplate(vault: string): string {
  const templatePath = vaultsConfig.getVaultProp<string>(vault, 'regularTemplatePath');
  let noteTemplate = workflow.variables['note-template'] || '';

  if (!noteTemplate && templatePath) {
    noteTemplate = fs.readFileSync(templatePath, { encoding: 'utf-8' });
    workflow.variables['note-template'] = noteTemplate;
  }

  return noteTemplate;
}

function createNoteItem(vault: string, note: string) {
  return createItem({
    title: note,
    arg: `obsidian://open?vault=${vault}&file=${encodeURIComponent(note)}`,
    icon: {
      path: note.endsWith('.md') ? obsidianLightIcon() : fileIcon(),
    },
  });
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

function replacePatternsInTemplate(template: string) {
  return template
    // Replacing all dates patterns
    .replace(/{{date: ([^}]+)}}/gm, (_: any, p1: string) => moment().format(p1));
}

function getDirsForSearch(vault: string) {
  const getPathProp = (name: keyof IVaultConfig) => vaultsConfig.getVaultProp<string>(vault, name);

  return [
    getPathProp('notesDir'),
    getPathProp('dailyDir'),
    getPathProp('attachmentDir'),
  ];
}
