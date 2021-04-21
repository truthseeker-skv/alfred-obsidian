declare module 'mdfind' {
  import { Readable } from 'stream';
  export type Attributes = 'kMDItemContentType' | 'kMDItemContentTypeTree' | 'kMDItemDisplayName' |
    'kMDItemDurationSeconds' | 'kMDItemFinderComment' | 'kMDItemFSContentChangeDate' | 'kMDItemFSCreationDate' |
    'kMDItemFSInvisible' | 'kMDItemFSName' | 'kMDItemFSSize' | 'kMDItemKind' | 'kMDItemLastUsedDate' |
    'kMDItemNumberOfPages' | 'kMDItemPageWidth' | 'kMDItemPath' | 'kMDItemTextContent' | 'kMDItemTitle' | 'kMDItemURL' |
    'kMDItemWhereFroms';

  // https://github.com/brandonhorst/node-mdfind#docs
  interface IMdFindParams {
    /**
     * This can use operators, wildcards, kind specifiers, and more. See man mdfind
     */
    query: string,
    /**
     * Array of attributes that should be collected for each match.
     * Note that kMDItemPath is exported for every file and does not need to be manually specified.
     */
    attributes?: Array<Attributes>;
    /**
     * Maximum number of results to return
     */
    limit?: number;
    /**
     * Array of directory paths to limit the search to
     */
    directories?: Array<string>;
    /**
     * Array of filenames (without paths) to limit the search to
     */
    names?: Array<string>;
    /**
     * Force the provided query string to be interpreted as if the user had typed the string into the Spotlight menu.
     * For example, the query string search would produce the following query string:
     * (* = search* cdw || kMDItemTextContent = search* cdw)
     */
    interpret?: boolean;
  }

  interface IMdFindResult {
    output: Readable;
    terminate: () => void;
  }

  function mdfind(params: IMdFindParams): IMdFindResult;
  namespace mdfind {}
  export = mdfind;
}
