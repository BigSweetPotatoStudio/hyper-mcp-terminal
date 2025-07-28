// import * as pty from "node-pty";
// import { options } from "./commander";
// import os from "node:os";

// const shell = os.platform() === "win32" ? "powershell.exe" : "bash";

// export class Shell {
//   start: any;
//   term = pty.spawn(shell, [], {
//     name: "xterm-color",
//     cols: 80,
//     rows: 30,
//     cwd: process.env.HOME,
//     env: process.env,
//   });
//   constructor() {
//     this.term.onExit(() => {
//       console.log("终端进程已退出");
//     });
//   }
//   write(data: string) {
//     // console.log('write: ', data);
//     this.term.write(data);
//   }
//   onData(cb: (data: string) => void) {
//     this.term.onData((data: string) => {
//     //   console.log('shell out:\n', data.toString());
//       cb(data);
//     });
//   }
//   kill() {
//     this.term.kill();
//   }
// }
