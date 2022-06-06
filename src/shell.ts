
import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import { config } from "./config";



class Shell {
    shell_child_process = spawn(config.path, []);
    constructor() {
        // this.shell_child_process.stdin.write("ls -l\n");
        // this.shell_child_process.stdin.write("ls\n");
        // this.shell_child_process.stdout.on('data', (data) => {
        //     console.log(`stdout: ${data}`);
        // });
    }
    write(data) {
        console.log('write: ', data);
        this.shell_child_process.stdin.write(data);
    }
    onData(cb) {
        this.shell_child_process.stdout.on('data', (data) => {
            console.log('shell out:\n', data.toString());
            cb(data);
        });
       
        this.shell_child_process.stderr.on('data', (data) => {
            console.log('shell err:\n', data.toString());
            cb(data);
        });
    }
}
export const shell = new Shell();





