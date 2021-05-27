import { $ } from "./utils/zx";

(async () => {
  const commitsStr = (await $`git log --oneline --no-decorate`).toString();
  const commits = commitsStr.trim().split("\n");
  const branches: Array<{ hash: string; name: string }> = [];
  commits.forEach((commit) => {
    const [hash, command, name] = commit.split(" ");
    if (command === "Branch") {
      branches.push({ hash, name });
    }
  });
  const existingBranchesStr = (await $`git branch -v`).toString();
  const existingBranches = existingBranchesStr
    .trim()
    .split("\n")
    .map((str) => str.replace(/^[ \*]+/g, ""))
    .map((str) => {
      const [name, hash] = str.split(/[ ]+/);
      return { name, hash };
    })
    .filter((b) => b.name !== "main" && b.name !== "master");
  const unusedBranches = existingBranches.filter(
    (v) => branches.find((b) => b.name === v.name) === undefined
  );
  for await (const { hash, name } of branches) {
    const existing = existingBranches.find((b) => b.name === name);
    if (existing === undefined || existing.hash !== hash) {
      await $`git branch -f ${name} ${hash}`;
    }
  }
  console.log(
    `Done ! Don't forget to push with 'git push --all --force origin' !`
  );
  if (unusedBranches.length > 0) {
    console.warn(
      `The following branches are not necessary anymore:\n${unusedBranches
        .map((v) => `- ${v.name}`)
        .join("\n")}`
    );
  }
})();
