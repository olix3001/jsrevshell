module.exports = {
    name: 'ping',
    usage: 'ping <message>',
    args: {
        message: { desc: 'message for the client', default: 'ping' },
    },
    description: 'pings client with <message>',
    run: async (methods, args) => {
        const { send, feedback, clientResponse, code } = methods
        send(0x02, code(feedback(args.length == 0 ? '"ping"' : `"${args.join(' ')}"`)))
        console.log(await clientResponse())
    }
}