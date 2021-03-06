const Telegraf = require("telegraf").Telegraf;
const uuidv4   = require("uuid").v4;

const db     = require("./db");
const config = require("./config");
const logger = require("./logger");

const filters     = require("./filters");
const middlewares = require("./middlewares");
const commands    = require("./commands");
const handlers    = require("./handlers");

module.exports = class Bot
{
	constructor(token)
	{
		this.token    = token;
		this.username = null;
		this.bot      = new Telegraf(this.token);

		this.bot.use(middlewares.update);

		this.bot.start(commands.start);

		this.bot.command("anecdot", commands.anecdot);
		this.bot.command("story",   commands.story);
		this.bot.command("music",   commands.music);

		this.bot.command("addanecdot", filters.admin, commands.addanecdot);
		this.bot.command("setmusic",   filters.admin, commands.setmusic);

		this.bot.command("add",      filters.admin, filters.voice, commands.add);
		this.bot.command("remove",   filters.admin, filters.voice, commands.remove);
		this.bot.command("addstory", filters.admin, filters.voice, commands.addstory);

		this.bot.on("inline_query",         handlers.inline_query);
		this.bot.on("chosen_inline_result", handlers.chosen_inline_result);
	}

	async start()
	{
		await db.start();

		this.bot
			.launch(config.bot.params)
			.then(res => {
				this.username = this.bot.botInfo.username;
				logger.info(`Bot @${this.username} started.`);
			})
			.catch(err => {
				logger.fatal(err);
				process.exit(1);
			});
	}

	async stop()
	{
		logger.info(`Stop the bot @${this.username}`);

		await this.bot.stop();
		await db.stop();

		process.exit(0);
	}

	async reload()
	{
		logger.info(`Reload the bot @${this.username}`);

		await this.bot.stop();
		await db.stop();
		await this.start();
	}
}
