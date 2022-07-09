import parseGitUrl from "git-url-parse";

export function gitToPath(repo: string) {
  const parsed = parseGitUrl(repo);
  if (parsed.protocol !== "ssh") {
    throw new Error(`Use ssh ! (found ${parsed.protocol})`);
  }

  return `${parsed.source}/${parsed.organization}/${parsed.name}`;
}
