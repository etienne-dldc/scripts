#!~/Workspace/github.com/etienne-dldc/scripts/node_modules/.bin/tsx

import("../src/" + process.argv[2] + ".ts").catch(console.error);
