import path from "path";
/**
 * Correctly resolves path if cli is invoked with pnpm
 * pnpm sets INIT_CWD to refer to directory it was invoked from
 * @param p cli path in argument
 * @returns absolute path
 */
export function resolveCliPath(p: string) {
  const CWD = process.env.INIT_CWD || process.cwd();
  return path.isAbsolute(p) ? p : path.resolve(CWD, p);
}
