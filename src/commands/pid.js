module.exports = {
    name: 'pid',
    usage: 'pid',
    args: {},
    description: 'gets process PID',
    run: async (methods, args) => {
        const { send, feedback, clientResponse, code } = methods
        send(0x02, code(feedback("process.pid")))
        console.log(`PID: ${await clientResponse()}`)
    }
}