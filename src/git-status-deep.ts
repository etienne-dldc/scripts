import findGitRepositories from "find-git-repositories";
import path from "path";
import chalk from "chalk";
import { $, ProcessOutput } from "./utils/zx";

(async () => {
  const gitBranchStatusPath = path.resolve(
    __dirname,
    "utils",
    "git-branch-status"
  );

  const repos = await findGitRepositories(process.cwd(), (_repos) => {});
  const folders = repos.map((p) => path.dirname(p));
  for await (const folder of folders) {
    $.cwd = folder;
    $.verboseCommand = false;
    $.verboseResult = false;
    try {
      const branchStatus = (await $`bash ${gitBranchStatusPath}`).toString();
      const changes = (await $`git status -s`).toString();
      const noChanges = changes.trim().length === 0;
      const isSync = branchStatus.match(
        /All tracking branches are synchronized with their upstreams/
      );
      if (isSync && noChanges) {
        console.log(chalk.green(`✓ ${folder}`));
      } else {
        console.log(chalk.red(`✗ ${folder}`));
        if (!noChanges) {
          console.log(changes);
        }
        if (!isSync) {
          console.log(branchStatus);
        }
      }
    } catch (error) {
      console.log(chalk.red(`✗ ${folder}`));
      if (error instanceof ProcessOutput) {
        console.log(error.toString());
      }
    }

    // const branchesNames = (await $`git branch`).toString().split("\n");
    // const fixedBranchNames: Array<string> = [];

    // branchesNames.forEach((branch) => {
    //   const match = branch.match(/[^ ]+$/g);
    //   if (match) {
    //     fixedBranchNames.push(match[0]);
    //   }
    // });
    // console.log(fixedBranchNames);

    // const branchInfos: Array<{
    //   lastCommitDate: string;
    //   commitCount: number;
    //   branchName: string;
    //   authorName: string;
    // }> = [];

    // for (let i = 0; i < fixedBranchNames.length; i++) {
    //   const branch = fixedBranchNames[i];
    //   const lastCommitDate = (
    //     await $`git log -1 --format=%cd ${branch}`
    //   ).toString();
    //   const commitCount = (await $`git rev-list --count ${branch}`).toString();
    //   const authorName = (
    //     await $`git log -1 --format=%an ${branch}`
    //   ).toString();

    //   branchInfos.push({
    //     branchName: branch,
    //     authorName: authorName.replace("\n", ""),
    //     lastCommitDate: lastCommitDate.replace("\n", ""),
    //     commitCount: parseInt(commitCount.replace("\n", ""), 10),
    //   });
    // }

    // console.table(branchInfos);
  }
})();
