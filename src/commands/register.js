import { REST, Routes } from "discord.js";
import chalk from "chalk";
import "dotenv/config";

const rest = new REST({ version: "10" }).setToken(process.env.CLIENT_TOKEN);

(async () => {
    try {
        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID), { body: [
                {
                    name: "start",
                    description: "Start your Bizzare Adventure!"
                },
                {
                    name: "profile",
                    description: "View your profile",
                    options: [
                        {
                            name: "username",
                            description: "A MBA player's Discord username",
                            type: 3,
                            required: false,
                        }
                    ]
                },
                {
                    name: "stand",
                    description: "View your Stand information",
                    options: [
                        {
                            name: "option",
                            description: "Options for the Stand command",
                            type: 3,
                            required: false,
                            choices: [
                                {
                                    name: "search",
                                    value: "search"
                                }
                            ]
                        }
                    ]
                },
                {
                    name: "awaken",
                    description: "Awaken your Stand with the help of the Stand Arrow"
                },
                {
                    name: "backpack",
                    description: "View your inventory items"
                },
                {
                    name: "fight",
                    description: "Challenge another MBA user to a battle!",
                    options: [
                        {
                            name: "username",
                            description: "Discord username",
                            type: 3,
                            required: true
                        }
                    ]
                },
                {
                    name: "storyline",
                    description: "Find a storyline to advance your Stand's abilities and experience",
                    options: [
                        {
                            name: "series",
                            description: "series name",
                            type: 3,
                            required: true,
                            choices: [
                                {
                                    name: "Phantom Blood",
                                    value: "Phantom Blood"
                                },
                                {
                                    name: "Battle Tendency",
                                    value: "Battle Tendency"
                                },
                                {
                                    name: "Stardust Crusaders",
                                    value: "Stardust Crusaders"
                                },
                                {
                                    name: "Diamond is Unbreakable",
                                    value: "Diamond is Unbreakable"
                                },
                                {
                                    name: "Vento Aureo",
                                    value: "Vento Aureo"
                                }
                            ]
                        }
                    ]
                },
                {
                    name: "record",
                    description: "Record a conversation in a server"
                },
                {
                    name: "eval",
                    description: "Evaluate JS code for admins only",
                    options: [
                        {
                            name: "code",
                            description: "evaluate Javascript code",
                            type: 3,
                            required: true
                        }
                    ]
                }
            ]}
        );

        console.log(chalk.green("~ Successfully registered all commands ~"));
    } catch (e) {
        console.log(e);
    }
})();