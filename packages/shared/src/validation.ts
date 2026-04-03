const VALID_NAME = /^[\w.-]+$/;

export function isValidRepoName(name: string): boolean {
  return VALID_NAME.test(name);
}
