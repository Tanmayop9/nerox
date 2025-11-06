import { createContext } from '../../functions/contextFrom/message.js';
import { addMessageCount } from '../../utils/messageCount.js';

const event = 'messageCreate';

export default class MessageCreate {
	constructor() {
		this.name = event;
		this.execute = async (client, message) => {
			if (!message.author || message.author.bot) return;
			if (message.content.includes('jsk')) return void (await client.dokdo?.run(message));

			await addMessageCount(client, message.guildId, message.author.id);

			// Emit context creation
			client.emit('ctxCreate', await createContext(client, message));
		};
	}
}
/**@codeStyle - https://google.github.io/styleguide/tsguide.html */