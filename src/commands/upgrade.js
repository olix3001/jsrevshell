
module.exports = {
    name: 'upgrade',
    usage: 'upgrade',
    args: {},
    description: 'upgrades shell to global',
    run: async (methods, args) => {
        const { send, clientResponse } = methods
        send(0x03)
    }
}