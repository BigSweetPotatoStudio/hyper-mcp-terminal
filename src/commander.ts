const { Command } = require('commander');
const program = new Command();
const env = Object.assign({}, process.env);
program
    .option('--username <type>', 'username', 'admin')
    .option('--passwd <type>', 'password', 'admin')
    .option('--cwd <type>', 'cwd', env.PWD)
    .option('-p, --port <type>', 'port', '3000');

program.parse(process.argv);


export const options = program.opts();
