import JestHasteMap from "jest-haste-map";
import { cpus } from 'os';
import { dirname , relative} from 'path';
import { fileURLToPath } from 'url';
import { Worker } from 'jest-worker';
import { join } from 'path';
import chalk from "chalk";


const root = dirname(fileURLToPath(import.meta.url));
const hasteMapOptions = {
  extensions: ['js'],
  maxWorkers: cpus().length,
  name: 'best-test-framework',
  platforms: [],
  rootDir: root,
  roots: [root],
};

const hasteMap = new JestHasteMap.default(hasteMapOptions);
await hasteMap.setupCachePath(hasteMapOptions);
const {hasteFS}=await hasteMap.build();
const testFiles = hasteFS.matchFilesWithGlob(
    [
     process.argv[2]? `**/${process.argv[2]}*`   :'**/*.test.js'
    ]);

const worker = new Worker(join(root, 'worker.js'), {
    enableWorkerThreads: true,
});


let hasFailed = false;
for await (const testFile of testFiles) {
    const {success,errorMessage}=await worker.runTest(testFile);
    const status = success
    ? chalk.green.inverse.bold(' PASS ')
    : chalk.red.inverse.bold(' FAIL ');

    console.log(status ," ", chalk.dim(relative(root,testFile)));
    if(!success){
        hasFailed=true;
        console.log(chalk.red(errorMessage));
    }
}

if (hasFailed) {
    console.log(
      '\n' + chalk.red.bold('Test run failed, please fix all the failing tests.'),
    );
    // Set an exit code to indicate failure.
    process.exitCode = 1;
  }

worker.end();