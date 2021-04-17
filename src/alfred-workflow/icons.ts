export const macIcon = {
  get: getMackIcon,
  info: getMackIcon('ToolbarInfo'),
  error: getMackIcon('AlertStopIcon'),
  alert: getMackIcon('Actions'),
  heart: getMackIcon('ToolbarFavoritesIcon'),
  customize: getMackIcon('ToolbarCustomizeIcon'),
  sync: getMackIcon('Sync'),
  delete: getMackIcon('ToolbarDeleteIcon'),
};

function getMackIcon(name: string): string {
  return `/System/Library/CoreServices/CoreTypes.bundle/Contents/Resources/${name}.icns`;
}
