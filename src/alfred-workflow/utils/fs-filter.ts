import readdirp, { EntryInfo } from 'readdirp';
import sortBy from 'lodash/sortBy';
import groupBy from 'lodash/groupBy';

import logger from '../logger';

export interface IFilterPathOptions {
  type?: 'files_directories' | 'directories' | 'files' | 'all';
  showHidden?: boolean;
}

export async function filterFiles(queryPath: string, options: IFilterPathOptions = {}): Promise<Array<EntryInfo>> {
  let query = queryPath
    .replace('~', `${process.env.HOME || '~'}/`)
    .replace(/(\/\/+)/gm, '/')
    .replace(' ', '\ ');

  if (!query) {
    return Promise.resolve([]);
  }
  const match = /(?<dir>(.*\/))(?<filter>.*)/.exec(query);
  const { dir, filter } = match?.groups || {};

  let entries: Array<EntryInfo> = [];

  try {
    entries = await readdirp.promise(dir, {
      fileFilter: (entry) => handleFilter(entry, filter, options),
      directoryFilter: (entry) => handleFilter(entry, filter, options),
      type: options.type || 'files_directories',
      depth: 0
    });
  } catch (err) {
    logger.error(err);
    entries = [];
  }

  const groups = groupBy(entries, (entry) => entry.dirent?.isDirectory() ? 1 : 0)
  return [
    ...sortBy(groups[1], ent => ent.path),
    ...sortBy(groups[0], ent => ent.path),
  ];
}

function handleFilter(entry: EntryInfo, query: string, options: IFilterPathOptions) {
  const lowerName = entry.path.toLowerCase();

  if (lowerName.startsWith('.') && !options.showHidden) {
    return false;
  }

  const [match] = query.toLowerCase().split('').reduce((acc, ch: string) => {
    let [match, lastIdx] = acc;

    const idx = lowerName.indexOf(ch, lastIdx);

    if (match && (!idx || idx > lastIdx)) {
      return [match, idx];
    }

    return [false, lastIdx];
  }, [true, 0]);

  return match;
}
