export function getEnv(key: string) {
  return process.env[`alfred_${key}`];
}
