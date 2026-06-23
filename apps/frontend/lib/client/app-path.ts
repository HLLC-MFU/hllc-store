const BASE_PATH = "/store";

export function appPath(path: string) {
  if (/^https?:\/\//.test(path) || path.startsWith("data:")) return path;
  if (path === BASE_PATH || path.startsWith(`${BASE_PATH}/`)) return path;
  if (!path.startsWith("/")) {
    return `${BASE_PATH}/${path}`;
  }
  return `${BASE_PATH}${path}`;
}
