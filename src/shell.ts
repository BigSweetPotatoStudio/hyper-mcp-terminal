import { config } from "./config";
import * as pty from 'node-pty'
import { options } from "./commander";
var os = require('os');

const env = Object.assign({}, process.env);
const USE_BINARY = os.platform() !== "win32";


export class Shell {
    start
    term = pty.spawn(process.platform === 'win32' ? 'cmd.exe' : 'bash', [], {
        name: 'xterm-256color',
        cols: 80,
        rows: 24,
        cwd: process.platform === 'win32' ? undefined : options.cwd,
        env: env,
        encoding: USE_BINARY ? null : 'utf8'
    });;
    constructor() {

    }
    write(data) {
        // console.log('write: ', data);
        this.term.write(data);
    }
    onData(cb) {
        this.term.on('data', (data) => {
            // console.log('shell out:\n', data.toString());
            cb(data);
        });
    }
    kill(){
        this.term.kill()
    }
}






