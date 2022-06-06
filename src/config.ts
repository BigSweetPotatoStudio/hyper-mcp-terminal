var os = require('os');

export const config = {
    path: process.env.WEB_SHELL
};
if (!config.path) {
    config.path = 'C:\\Program Files\\Git\\bin\\bash.exe'
    config.path =  os.platform() === 'win32' ? 'powershell.exe' : 'bash';
}