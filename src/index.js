import express from "express";
import chalk from "chalk";
import Discord, {
    ActionRowBuilder,
    ActivityType,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder
} from "discord.js";
import fs from "node:fs";
import "dotenv/config";
import { db } from "./postgres.js";

const client = new Discord.Client({
    intents: 131071,
    presence: {
        activities: [{
            name: "Your Fate…",
            type: ActivityType.Watching
        }],
        status: "online"
    }
});

client.on("ready", () => console.log(chalk.green(`\n● ${client.user.tag} is online\n`)));

const defaults = {
    name: "My Bizarre Adventure",
    year: 2024
}

// all stands
const stands = JSON.parse(fs.readFileSync("src/database/stands.json", "utf-8"));

client.on("interactionCreate", async i => {
    let user = await db`SELECT * FROM mba_users WHERE id = ${i.user.id}`;
    const server = i.guildId ? await db`SELECT * FROM mba_servers WHERE id = ${i.guildId};` : [];

    if (i.guildId && server.length === 0) {
        await db`INSERT INTO mba_servers (id) VALUES (${i.guildId});`;
    }

    const standProfile = (standInfo) => {
        const specialMoves = standInfo.special_moves.map(move => {
            return move.name;
        });

        return ({
            embeds: [{
                title: `~ ${standInfo.name} ~`,
                color: 0x1F336E,
                description: standInfo.description,
                fields: [
                    { name: "Health", value: `**${standInfo.health} HP**`, inline: true },
                    { name: "Attack", value: `**${standInfo.attack} ATK**`, inline: true },
                    { name: "Rarity", value: `*${standInfo.rarity}*`, inline: true },
                    { name: "Special Moves", value: String(specialMoves).replaceAll(",", ", "), inline: true }
                ],
                image: {
                    url: `attachment://${standInfo.image}`
                },
                footer: { text: `${defaults.name}™ ${defaults.year}` }
            }],
            files: [{
                attachment: `img/stands/${standInfo.image}`,
                name: standInfo.image
            }]
        });
    }

    if (i.isButton()) {
        switch (i.customId) {
            case "cancel":
                i.update({
                    content: "recording has been cancelled",
                    components: []
                });
                break;
            case "record":
                await db`UPDATE mba_servers SET recording = true WHERE id = ${server[0].id};`;
                
                i.update({
                    content: "",
                    embeds: [{ title: "Recording Conversation…", color: 0xD9544D }],
                    components: []
                });
                break;
        }
    } else if (i.isStringSelectMenu()) {
       if (i.customId.startsWith("search")) {
            i.update({
                content: "",
                ...standProfile(stands.find(stand => stand.name == i.values[0])),
                components: []
            })
       }
    } else if (i.isCommand()){
        const error = (message) => {
            i.reply({
                embeds: [{
                    description: message ? message : "You haven't started your journey yet! Use </start:1251414426985435210> to start your Bizarre Adventure!",
                    color: 0xD9544D
                }],
                ephemeral: true
            });
        }
        
        switch (i.commandName) {
            case "start":
                if (user.length === 0) {
                    await db`INSERT INTO mba_users (id) VALUES (${i.user.id});`;

                    i.reply({ embeds: [{
                        title: "You have started your Bizarre Adventure!",
                        author: {
                            name: i.user.username,
                            icon_url: `https://cdn.discordapp.com/avatars/${i.user.id}/${i.user.avatar}`
                        },
                        color: 0x1F336E,
                        description: `${i.user.username}, some basic information about you has been stored. Use the </profile:1251414426985435211> command to learn more.`,
                        fields: [
                            { name: "Role", value: "__Student__", inline: true },
                            { name: "Balance", value: "¥100", inline: true },
                            { name: "Stand", value: "**none**", inline: true }
                        ],
                        footer: { text: `${defaults.name}™ ${defaults.year}` }
                    }]});
                } else {
                    error("You've already started your Bizarre Adventure. Use the </profile:1251414426985435211> command.");
                }
                break;
            case "profile":
                if (user.length === 0) {
                   error();
                } else {
                    const profile = (clientUser, selectedUser, stand) => {
                        i.reply({
                            embeds: [{
                                title: selectedUser[0].stand == "none" ? "<:pericolo:1253235047666810921> Some Old Geezer" : "<:stand_arrow:1253233708769611796> Stand User Profile",
                                author: {
                                    name: clientUser.username,
                                    icon_url: `https://cdn.discordapp.com/avatars/${clientUser.id}/${clientUser.avatar}`
                                },
                                color: 0x1F336E,
                                description: selectedUser[0].stand == "none" ? `${clientUser.username} has yet to become a Stand user. They are currently a normal person.` : `${clientUser.username} is a stand user and is currently on their Bizarre Adventure!`,
                                thumbnail: {
                                    url: selectedUser[0].stand == "none" ? "" : `attachment://${stand.image}`
                                },
                                fields: [
                                    { name: "Role", value: `__${`${selectedUser[0].role.charAt(0).toUpperCase()}${selectedUser[0].role.slice(1)}`}__`, inline: true },
                                    { name: "Balance", value: `¥${selectedUser[0].bal}`, inline: true },
                                    { name: "Stand", value: `**${selectedUser[0].stand}**`, inline: true }
                                ],
                                footer: { text: `${defaults.name}™ ${defaults.year}` }
                            }],
                            files: selectedUser[0].stand == "none" ? [] : [{
                                attachment: `img/stands/${stand.image}`,
                                name: stand.image
                            }]
                        });
                    }

                    if (i.options.data.length !== 0) {
                        const selectedUser = await db`SELECT * FROM mba_users WHERE id = ${i.options.data[0].value.replace(/<|@|>|#|_/g, "")}`;

                        if (selectedUser.length === 0) {
                            error("This user hasn't started their Bizarre Adventure yet.");
                        } else{
                            const selectedClientUser = await client.users.fetch(selectedUser[0].id);

                            const stand = stands.find(stand => stand.name == selectedUser[0].stand);

                            profile(selectedClientUser, selectedUser, stand);
                        }
                    } else {
                        const stand = stands.find(stand => stand.name == user[0].stand);

                        profile(i.user, user, stand);
                    }
                }
                break;
            case "stand":
                if (i.options.data.length !== 0) {
                    const stands = JSON.parse(fs.readFileSync("src/stands.json", "utf-8"));
                    let parsedStands = {
                        common: [],
                        uncommon: [],
                        rare: [],
                        epic: [],
                        legendary: []
                    }
        
                    stands.forEach(stand => {
                        const parsedStand = new StringSelectMenuOptionBuilder()
                        .setLabel(stand.name)
                        .setDescription(stand.series)
                        .setValue(stand.name)

                        switch (stand.rarity) {
                            case "Common":
                                parsedStands.common.push(parsedStand);
                                break;
                            case "Uncommon":
                                parsedStands.uncommon.push(parsedStand);
                                break;
                            case "Rare":
                                parsedStands.rare.push(parsedStand);
                                break;
                            case "Epic":
                                parsedStands.epic.push(parsedStand);
                                break;
                            case "Legendary":
                                parsedStands.legendary.push(parsedStand);
                                break;
                        }
                    });

                    const menus = [];

                    Object.entries(parsedStands).forEach(([ key, value ]) => {
                        menus.push(
                            new ActionRowBuilder().addComponents(
                                new StringSelectMenuBuilder()
                                .setCustomId(`search-${key.toLowerCase()}`)
                                .setPlaceholder(`${key.charAt(0).toUpperCase()}${key.slice(1)}`)
                                .addOptions(value)
                            )
                        );
                    });

                    i.reply({
                        content: "Select a Stand for its information",
                        components: menus,
                    })
                } else {
                    if (user[0].length === 0) {
                        error();
                    } else if (user[0].stand == "none") {
                        error("You have yet to awaken your Stand. Use the </awaken:1251649911724707920> command.");
                    } else {
                        i.reply(standProfile(stands.find(stand => stand.name == user[0].stand)));
                    }
                }
                
                break;
            case "awaken":
                if (user.length === 0) {
                    error();
                } else if (user[0].stand != "none") {
                    error("You have already awakened your Stand.");
                } else {
                    const awakenStandProfile = async (stand) => {
                        i.reply({
                            embeds: [{
                                title: `!! You have awakened ${stand.name} !!`,
                                color: 0x1F336E,
                                author: {
                                    name: i.user.username,
                                    iconURL: `https://cdn.discordapp.com/avatars/${i.user.id}/${i.user.avatar}`
                                },
                                description: `You were pierced with a Stand Arrow! To learn more information about *${stand.name}*, use the </stand:1251687363491659826> command.`,
                                fields: [
                                    { name: "Health", value: `**${stand.health} HP**`, inline: true },
                                    { name: "Attack", value: `**${stand.attack} ATK**`, inline: true },
                                    { name: "Rarity", value: `*${stand.rarity}*`, inline: true }
                                ],
                                image: {
                                    url: `attachment://${stand.image}`
                                },
                                footer: { text: `${defaults.name}™ ${defaults.year}` }
                            }],
                            files: [{
                                attachment: `img/stands/${stand.image}`,
                                name: stand.image
                            }]
                        });

                        await db`UPDATE mba_users SET stand = ${stand.name} WHERE id = ${user[0].id};`;
                    }

                    switch (Math.floor(Math.random() * (15) - 1 + 0)) {
                        case 1: case 2: case 3: case 4: case 5:
                            await awakenStandProfile(stands.filter(stand => stand.rarity == "Common")[Math.floor(Math.random() * (12) + 0)]);
                            break;
                        case 6: case 7: case 8: case 9:
                            await awakenStandProfile(stands.filter(stand => stand.rarity == "Uncommon")[Math.floor(Math.random() * (6) + 0)]);
                            break;
                        case 10: case 11: case 12:
                            await awakenStandProfile(stands.filter(stand => stand.rarity == "Rare")[Math.floor(Math.random() * (5) + 0)]);
                            break;
                        case 13: case 14:
                            await awakenStandProfile(stands.filter(stand => stand.rarity == "Epic")[Math.floor(Math.random() * (11) + 0)]);
                            break;
                        case 15:
                            await awakenStandProfile(stands.filter(stand => stand.rarity == "Legendary")[Math.floor(Math.random() * (8) + 0)]);
                            break;
                    }
                }
                break;
            case "fight":
                const opponent = await db`SELECT * FROM mba_users WHERE id = ${i.options.data[0].value.replace(/<|@|>|#|_/g, "")};`;

                if (opponent[0].stand == "none") {
                    error("<:stand_arrow:1253233708769611796> This user has yet to awaken their Stand.");
                } else if (opponent[0].id == i.user.id) {
                    error("You can't fight yourself!");
                }
                break;
            case "record":
                if (!server) {
                    error("This command can only be used in a server.");
                } else if (i.user.id == process.env.ADMIN_ID && server) {
                    if (server[0].recording == true) {
                        i.reply({
                            content: "Recording has already been enabled in this server.",
                            ephemeral: true
                        });
                    } else {
                        const cancel = new ButtonBuilder()
                        .setCustomId("cancel")
                        .setLabel("Cancel")
                        .setStyle(ButtonStyle.Secondary);
    
                        const confirm = new ButtonBuilder()
                        .setCustomId("record")
                        .setLabel("Start Recording")
                        .setStyle(ButtonStyle.Danger);

                        i.reply({
                            content: "Are you sure you want to start recording this conversation?",
                            components: [
                                new ActionRowBuilder().addComponents(cancel, confirm)
                            ],
                            ephemeral: true
                        });
                    }
                } else {
                    error(`You are unable to record conversations.`);
                }
                break;
            case "eval":
                if (i.user.id == process.env.ADMIN_ID) {
                    try {
                        eval(`(async () => {${i.options.data[0].value}})();`);
                        i.reply({
                            embeds: [{
                                description: "Evaluated successfully!",
                                color: 0x22BB33
                            }]
                        });
                    } catch (e) {
                        error(e.message);
                    }
                } else {
                    error("You are not authorized to use this command.");
                }
                break;
        }   
    }
});

client.on("messageCreate", async m => {
    const server = m.guildId ? await db`SELECT * FROM mba_servers WHERE id = ${m.guildId};` : [];

    if (server.length !== 0 && server[0].recording == true && !m.author.bot) {
        await db`UPDATE mba_servers SET messages = ${[{ channel: m.channelId, author: m.author.id, content: m.content }, ...server[0].messages]} WHERE id = ${m.guildId};`;
    }
});

client.login(process.env.CLIENT_TOKEN);

const app = express();

app.listen(4000, () => {
    console.log(chalk.blue("\n:: Web Server Started ::"));
});

app.get("/", (req, res) => {
    res.send("Bot is running");
});