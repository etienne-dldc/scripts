import arg from "arg";
import chalk from "chalk";
import fs from "fs";
import inquirer from "inquirer";
import path from "path";
import "zx/globals";
import { gitToPath } from "./utils/gitToPath";

(async () => {
  const args = arg({}, { argv: process.argv.slice(3) });

  let repo: string = args._[0];
  if (!repo) {
    repo = (await inquirer.prompt({ type: "input", name: "repo", message: "Repository url ?" })).repo;
  }

  const baseDir = path.resolve(`${process.env.HOME}/Workspace`);
  const relativeDir = gitToPath(repo);
  const targetPath = path.resolve(baseDir, relativeDir);
  if (clonableDestination(targetPath)) {
    console.log(`Cloning in ${chalk.cyan(relativeDir)}`);
    await $`git clone -- ${repo} ${targetPath}`;
    console.log("Cloned");
  } else {
    console.log(chalk.blue(`${chalk.green(relativeDir)} already exists, pulling repo`));
    $.cwd = targetPath;
    await $`git pull`;
    console.log(`${chalk.green("✔︎")} Pulled`);
  }
  await $`code ${targetPath}`;
})().catch(console.error);

function clonableDestination(target: string): boolean {
  const targetExist = fs.existsSync(target);
  if (!targetExist) {
    return true;
  }
  const files = fs.readdirSync(target);
  const targetEmpty = files.length === 0;
  return targetEmpty;
}
