import parseGitUrl from "git-url-parse";

export function gitToPath(repo: string) {
  const parsed = parseGitUrl(repo);
  if (parsed.protocol !== "ssh") {
    throw new Error(`Use ssh ! (found ${parsed.protocol})`);
  }
  const source = parsed.source === "github.com-etienne-dldc" ? "github.com" : parsed.source;

  return `${source}/${parsed.organization}/${parsed.name}`;
}
