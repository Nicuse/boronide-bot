const wait = require('node:timers/promises').setTimeout;
const discord = require("discord.js");
const fetch = require("node-fetch");
const cp = require("child_process");
const stream = require("stream");
const util = require("util");
const path = require("path");
const tmp = require("tmp");
const fs = require("fs");
const config = require("./config.js");
const obfuscate = require("./Boronide-Obfuscator-main/run.js").obfuscate;
const client = new discord.Client({
intents: [
    "GUILDS",
    "GUILD_MESSAGES",
    "GUILD_MEMBERS",
  ]
});
const streamPipeline = util.promisify(stream.pipeline);

client.once('ready', () => {
    console.log('Bot is online')
});

client.on("messageCreate", (message) => {
    if (message.author.bot) return;

    const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    if (command == "obfuscate") {
        if (message.attachments && message.attachments.first()) {
            let attachment = message.attachments.first();

            if (attachment.size <= 1e+7) {
                let embed = new discord.MessageEmbed()
                    .setTitle("Processing...")
                    .setDescription("Obfuscating...")
                    .setColor("YELLOW");
                message.reply({ embeds: [embed] }).then((m) => {
                    fetch(attachment.url).then((res) => {
                        if (res.ok) {
                            let id = (attachment.id);
                            let outStream = fs.createWriteStream(`./temp/${id}_${attachment.name}`);

                            streamPipeline(res.body, outStream).then(async () => {
                                await obfuscate(fs.readFileSync(outStream.path), "utf-8");
                                await fs.unlink(outStream.path, function(err){if(err) return console.log(err);});
                                let embed = new discord.MessageEmbed()
                                    .setTitle("Success")
                                    .setDescription("Your file has been obfuscated!")
                                    .setColor("GREEN");
                                await m.edit({ embeds: [embed] });
                                await wait(1000);
                                await message.channel.send({ files: [new discord.MessageAttachment(path.join(__dirname, "/Boronide-Obfuscator-main/temp/output-1.lua"))]})
                                await fs.unlink(path.join(__dirname, "/Boronide-Obfuscator-main/temp/output-1.lua"), function(err){if(err) return console.log(err);});
                            }).catch((err) => {
                                console.log(err)
                                let embed = new discord.MessageEmbed()
                                    .setTitle("ERROR")
                                    .setDescription("Unable to write file.")
                                    .setColor("RED");
                                m.edit({ embeds: [embed] });
                            });
                        } else {
                            let embed = new discord.MessageEmbed()
                                .setTitle("ERROR")
                                .setDescription("Unable to download file.")
                                .setColor("RED");
                            m.edit({ embeds: [embed] });
                        }
                    }).catch((err) => {
                        console.log(err)
                        let embed = new discord.MessageEmbed()
                            .setTitle("ERROR")
                            .setDescription("Unable to download file.")
                            .setColor("RED");
                        m.edit({ embeds: [embed] });
                    });
                });
            } else {
                let embed = new discord.MessageEmbed()
                    .setTitle("ERROR")
                    .setDescription("File is too large.")
                    .setColor("RED");
                message.reply({ embeds: [embed] });
            }
        } else {
            let embed = new discord.MessageEmbed()
                .setTitle("ERROR")
                .setDescription("No file provided.")
                .setColor("RED");
            message.reply({ embeds: [embed] });
        }
    }
})

client.login(config.token.toString())