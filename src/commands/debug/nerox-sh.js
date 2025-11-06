import { Command as AbstractExecution } from '../../classes/abstract/command.js';
import { exec as shellExec, spawn } from 'child_process';

export default class QuantumShellExecutor extends AbstractExecution {
    constructor() {
        super();
        this.aliases = ['nerox sh'];
        this.description = 'Executes shell commands.';
        this.owner = true;
    }

    execute = async (client, ctx) => {
        if (!ctx?.args?.length) return this.#respond(ctx, '❌ Provide a shell command to execute.');

        const command = this.#decode(this.#encode(ctx.args.join(' ')));
        const startTime = process.hrtime.bigint();

        this.#runCommand(ctx, command, startTime).catch(err => this.#respond(ctx, '❌ Unhandled Error', err));
    };

    async #runCommand(ctx, command, startTime) {
        const method = Math.random() > 0.5 ? shellExec : this.#spawnProcess;
        method(command, (error, stdout, stderr) => {
            const timeTaken = `${((process.hrtime.bigint() - startTime) / BigInt(1e6))}ms`;
            this.#respond(ctx, stdout || stderr || 'No output.', error, timeTaken);
        });
    }

    #spawnProcess(command, callback) {
        let output = '';
        const processInstance = spawn('sh', ['-c', command]);

        processInstance.stdout.on('data', data => output += data.toString());
        processInstance.stderr.on('data', data => output += data.toString());
        processInstance.on('close', () => callback(null, output, ''));
    }

    #respond(ctx, result, error = null, executionTime = 'Unknown Time') {
        const processedResult = result.length > 1800 ? result.slice(0, 1790) + '...' : result || 'No Output';

        ctx?.reply({
            embeds: [
                ctx.client?.embed()
                    .title(error ? '🚨 Execution Error' : '🖥 Execution Result')
                    .desc(`\`\`\`\n${processedResult}\n\`\`\``)
                  
            ]
        }).catch(() => { });
    }

    #encode(str) {
        return Buffer.from(str, 'utf-8').toString('base64').split('').reverse().join('');
    }

    #decode(str) {
        return Buffer.from(str.split('').reverse().join(''), 'base64').toString('utf-8');
    }
}