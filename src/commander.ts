const { Command } = require('commander');
const program = new Command();

program
    .option('--passwd <type>', '密码', '')
    .option('-p, --port <type>', '端口', '3000');

program.parse(process.argv);


export const options = program.opts();
