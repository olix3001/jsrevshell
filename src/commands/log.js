module.exports = {
    name: 'log',
    usage: 'log <message>',
    args: {
        message: { desc: 'message for the client', default: 'You\'ve been hacked :D' },
    },
    description: 'logs <message> to the console',
    run: async (methods, args) => {
        const { send } = methods
        args = args.length != 0 ? args : ["You've been hacked :D"]
        send(0x02, `console.log("${args.join(' ')}")`)
    }
}