'use strict';

let path = require('path');
let child_process = require('child_process');
let fsp = require('fs-promise');
let minimist = require('minimist');

(async () => {
    let args = minimist(process.argv.slice(2), {
        string: ['browser'],
        boolean: ['fresh'],
        default: {
            browser: 'chromium',
            fresh: false,
        },
    });

    let executable;
    let user_data_dir;
    switch (process.platform + ' ' + args.browser) {
      case 'linux chromium':
        executable = '/usr/bin/chromium';
        user_data_dir = path.join(process.env.HOME, '/.config/chromium');
        break;
      case 'linux google-chrome':
        executable = '/usr/bin/google-chrome';
        user_data_dir = path.join(process.env.HOME, '/.config/google/chrome');
        break;
      case 'darwin chromium':
        executable = '/Applications/Chromium.app/Contents/MacOS/Chromium';
        user_data_dir = path.join(process.env.HOME, '/Library/Application Support/Chromium');
        break;
      case 'darwin google-chrome':
        executable = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
        user_data_dir = path.join(process.env.HOME, '/Library/Application Support/Google/Chrome');
        break;
      default:
        throw new Error(`Unsupported platform/browser: ${process.platform}/${args.browser}`);
    }

    let build_dir = '../test-build';
    let fresh_user_data_dir = '../fresh-user-data';
    try {
        child_process.execSync(`babel-node build.js --dir=${build_dir}`);

        if (args.fresh) {
            await fsp.remove(fresh_user_data_dir);
            await fsp.ensureDir(fresh_user_data_dir);
        }

        let command = `${executable}`;
        command += ` --load-extension=${build_dir}`;
        if (args.fresh) {
            command += ` --user-data-dir=${fresh_user_data_dir}`;
            command += ` --no-first-run`;
        }

        child_process.execSync(command);
    } finally {
        if (args.fresh) {
            await fsp.remove(fresh_user_data_dir);
        }

        await fsp.remove(build_dir);
    }
})().catch(e => {
    console.error(e.stack);
});
