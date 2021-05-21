import { existsSync } from "fs";
import { exec } from "child_process";
import { createInterface } from "readline";
import { default as nodeFetch } from "node-fetch";
import { promisify } from "util";
import chalk from "chalk";

export interface $ {
  (pieces: TemplateStringsArray, ...args: any[]): Promise<ProcessOutput>;
  verbose: boolean;
  shell: string;
  cwd: string;
  prefix: string;
}

function colorize(cmd: string) {
  return cmd.replace(/^\w+(\s|$)/, (substr) => {
    return chalk.greenBright(substr);
  });
}

function substitute(arg: any) {
  if (arg instanceof ProcessOutput) {
    return arg.stdout.replace(/\n$/, "");
  }
  return arg.toString();
}

export const $: $ = function $(
  pieces: TemplateStringsArray,
  ...args: any[]
): Promise<ProcessOutput> {
  let __from = new Error().stack!.split("at ")[2].trim();
  let cmd = pieces[0],
    i = 0;
  while (i < args.length) {
    let s;
    if (Array.isArray(args[i])) {
      s = args[i].map((x: any) => substitute(x)).join(" ");
    } else {
      s = substitute(args[i]);
    }
    cmd += s + pieces[++i];
  }

  if ($.verbose) {
    console.log("$", colorize(cmd));
  }

  return new Promise((resolve, reject) => {
    let options: any = {
      windowsHide: true,
    };
    if (typeof $.shell !== "undefined") options.shell = $.shell;
    if (typeof $.cwd !== "undefined") options.cwd = $.cwd;

    let child = exec($.prefix + cmd, options);
    let stdout = "",
      stderr = "",
      combined = "";
    if (child.stdout) {
      child.stdout.on("data", (data) => {
        if ($.verbose) {
          process.stdout.write(data);
        }
        stdout += data;
        combined += data;
      });
    }
    if (child.stderr) {
      child.stderr.on("data", (data) => {
        if ($.verbose) {
          process.stderr.write(data);
        }
        stderr += data;
        combined += data;
      });
    }
    child.on("exit", (code) => {
      child.on("close", () => {
        (code === 0 ? resolve : reject)(
          new ProcessOutput({ code, stdout, stderr, combined, __from })
        );
      });
    });
  });
};

$.shell = undefined as any;
$.verbose = true;
$.prefix = "";
$.cwd = undefined as any;

export function cd(path: string) {
  if ($.verbose) {
    console.log("$", colorize(`cd ${path}`));
  }
  if (!existsSync(path)) {
    let __from = new Error().stack!.split("at ")[2].trim();
    console.error(`cd: ${path}: No such directory`);
    console.error(`  at ${__from}`);
    process.exit(1);
  }
  $.cwd = path;
}

export async function question(
  query: string,
  options: { choices?: Array<string> } = {}
) {
  let completer = undefined;
  if (Array.isArray(options?.choices)) {
    completer = function completer(line: string) {
      const completions = options.choices;
      const hits = completions!.filter((c) => c.startsWith(line));
      return [hits.length ? hits : completions, line];
    };
  }
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
    completer,
  });
  const question = (q: string) =>
    new Promise((resolve) => rl.question(q ?? "", resolve));
  let answer = await question(query);
  rl.close();
  return answer;
}

export async function fetch(url: string, init?: any) {
  if ($.verbose) {
    if (typeof init !== "undefined") {
      console.log("$", colorize(`fetch ${url}`), init);
    } else {
      console.log("$", colorize(`fetch ${url}`));
    }
  }
  return nodeFetch(url, init);
}

export const sleep = promisify(setTimeout);

export class ProcessOutput {
  #code = 0;
  #stdout = "";
  #stderr = "";
  #combined = "";
  #__from = "";

  constructor({ code, stdout, stderr, combined, __from }: any) {
    this.#code = code;
    this.#stdout = stdout;
    this.#stderr = stderr;
    this.#combined = combined;
    this.#__from = __from;
  }

  toString() {
    return this.#combined;
  }

  get stdout() {
    return this.#stdout;
  }

  get stderr() {
    return this.#stderr;
  }

  get exitCode() {
    return this.#code;
  }

  get __from() {
    return this.#__from;
  }
}
