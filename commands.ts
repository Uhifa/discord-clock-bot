import { SlashCommandStringOption } from "@discordjs/builders";
import { Options } from "discord.js";

const { SlashCommandBuilder } = require('@discordjs/builders');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');

export function buildCommands() {
    const commands = [
        new SlashCommandBuilder().setName('clock').setDescription('Clocks in / Clocks out')
            .addStringOption((option: SlashCommandStringOption) =>
                option.setName('log').setDescription('Additional data like work completed')),

        new SlashCommandBuilder().setName('grantaudio').setDescription('grant audio permission for the universe ids')
        .addStringOption((option: SlashCommandStringOption) =>
                option.setName('soundid').setDescription('soundid to grant permissions to')),
    ]
        .map(command => command.toJSON());

    const rest = new REST({ version: '9' }).setToken(process.env.TOKEN);

    rest.put(Routes.applicationGuildCommands(process.env.CLIENTID, process.env.GUILDID), { body: commands })
        .then(() => console.log('Successfully registered application commands.'))
        .catch(console.error);
}