declare module "find-git-repositories" {
  function findGitRepositories(
    path: string,
    onProgress: (repo: Array<string>) => void
  ): Promise<Array<string>>;

  export default findGitRepositories;
}
