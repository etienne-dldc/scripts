import "zx/globals";
import path from "path";
import chalk from "chalk";
import fg from "fast-glob";
import { gitToPath } from "./utils/gitToPath";

const gitBranchStatusPath = path.resolve(__dirname, "utils", "git-branch-status");

(async () => {
  const stream = fg.stream("**/.git", { cwd: process.cwd(), onlyDirectories: true, dot: true, followSymbolicLinks: false });

  for await (const entry of stream) {
    const project = path.dirname(entry as string);
    try {
      await handleProject(project);
    } catch (error) {
      console.log(chalk.red(`✗ ./${project}`));
      if (error instanceof ProcessOutput) {
        console.log(error.toString());
      } else {
        console.log(error);
      }
    }
  }
})();

async function getOrigin() {
  try {
    return (await $`git config --get remote.origin.url`).toString().trim();
  } catch (error) {
    return null;
  }
}

async function handleProject(projectPath: string) {
  const folder = path.resolve(process.cwd(), projectPath);
  $.verbose = false;
  $.cwd = folder;
  const origin = await getOrigin();
  if (origin === null) {
    console.log(chalk.blue(`? ./${projectPath}`));
    return;
  }
  const expectedDir = gitToPath(origin);
  if (expectedDir !== projectPath) {
    console.log(chalk.red(`! ./${projectPath}`));
    console.log(chalk.red(`Should be in ./${expectedDir}`));
    return;
  }
  const branchStatus = (await $`bash ${gitBranchStatusPath}`).toString();
  const changes = (await $`git status -s`).toString();
  const noChanges = changes.trim().length === 0;
  const isSync = branchStatus.match(/All tracking branches are synchronized with their upstreams/);
  if (isSync && noChanges) {
    console.log(chalk.green(`✓ ./${projectPath}`));
  } else {
    console.log(chalk.red(`✗ ./${projectPath}`));
    if (!noChanges) {
      console.log(chalk.red(`${changes.split("\n").length} changes`));
    }
    if (!isSync) {
      console.log(branchStatus);
    }
  }
}
