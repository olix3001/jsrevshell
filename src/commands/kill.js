module.exports = {
    name: 'kill',
    usage: 'kill',
    args: {},
    description: 'kill connection',
    run: async (methods, args) => {
        const { send } = methods
        send(0x01)
    }
}