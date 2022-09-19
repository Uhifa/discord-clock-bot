import discord, { ContextMenuInteraction, HTTPOptions, Intents, Message, MessageActionRow, MessageAttachment, MessageButton, MessageEmbed, TextChannel } from 'discord.js'
import dotenv from 'dotenv'
import users from './users.json'
import noblox, { HttpOptions, ProductInfo } from 'noblox.js'
import express, { Request } from 'express'
import { buildCommands } from './commands'
import fetch from 'node-fetch'
import { codeBlock } from "@discordjs/builders";
import e from 'express'

dotenv.config()
buildCommands()

const app = express()
app.use(express.json())

const PORT = process.env.PORT || 80
const channelId = process.env.CHANNEL || '966053014207074345'
const groupId = 6556072
const testGroupId = 8063722
const SCRIPTER = {
    id: 70755279,
    name: 'Scripters',
    rank: 248
}
const OFFWORK = {
    id: 82943078,
    name: 'Off-work',
    rank: 245
}


async function startApp() {
    // You MUST call setCookie() before using any authenticated methods [marked by 🔐]
    // Replace the parameter in setCookie() with your .ROBLOSECURITY cookie.
    const currentUser = await noblox.setCookie(process.env.RBXCOOKIE as string, true)
    console.log(`Logged in as ${currentUser.UserName} [${currentUser.UserID}]`)

    // Do everything else, calling functions and the like.
}
startApp()

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});

app.get('/', (req, res) => {
    res.send('Hello world')
})

app.post("/rank", async (req: Request, res) => {
    let discordid: string = req.body.discordid;
    if (!discordid) return res.json("Invalid Discord Id")
    let user = users[discordid as keyof typeof users]
    if (!user) return res.json("Invalid roblox user")
    const currentRank = await noblox.getRankInGroup(groupId, user)
    let newRank = currentRank === OFFWORK.rank ? SCRIPTER : OFFWORK
    const testGroupRank = newRank.rank === 248 && 252 || 50
    noblox.setRank(testGroupId, user, testGroupRank).catch(err => console.log(err))
    await noblox.setRank(groupId, user, newRank).then(() => {
        Promise.resolve(res.json({
            userId: user,
            rankData: newRank
        }))
    }, err => {
        console.log(err)
        Promise.resolve(res.json("Internal Server Error"))
    });
})

const client = new discord.Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES
    ]
})

client.once('ready', (client) => {
    console.log(`BOT READY as ${client.user.tag}`)
})

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;
    const logInput = interaction.options.get('log')?.value as string

    if (commandName === 'clock' && interaction.channelId === channelId) {
        const url = process.env.URL || "https://aut-clock-bot.herokuapp.com/rank"
        fetch(url, {
            method: 'POST', // or 'PUT'
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                discordid: interaction.user.id
            }),
        })
            .then(response => response.json())
            .then(async data => {
                if (!data.userId || !data.rankData) {
                    await interaction.reply("Linked roblox user not found")
                    return
                }
                let username = await noblox.getUsernameFromId(data.userId)
                let robloxProfile = `https://www.roblox.com/users/${data.userId}/profile`
                let userThumbnail = await noblox.getPlayerThumbnail(data.userId, 720)
                let timeValue = Math.floor(Date.now() / 1000)
                let timestamp = `<t:${timeValue}:R>`
                let timestamp2 = `<t:${timeValue}:f>`
                let embedMessage = new MessageEmbed()
                    .setColor('#03e8fc')
                    .setTitle(username)
                    .setDescription(`Clocked ${data.rankData.rank === SCRIPTER.rank && 'in' || 'out'} [${data.rankData.name}]\n${timestamp}\n${timestamp2}`)
                    .setThumbnail(userThumbnail[0].imageUrl as string)
                let linkRow = new MessageActionRow().addComponents(
                    new MessageButton()
                        .setLabel('Profile')
                        .setURL(robloxProfile)
                        .setStyle('LINK'),
                )

                let formattedMessage = logInput && (logInput.replaceAll('|', '\n|')).replaceAll('-', '\n\t-')

                await interaction.reply({
                    embeds: [embedMessage],
                    components: [linkRow],
                    content: formattedMessage && codeBlock(formattedMessage)
                });
            })
            .catch((error) => {
                console.error('Error:', error);
            });
    }
    else if (commandName === 'grantaudio' && (interaction.channelId === '996114166219812916' || interaction.channelId === '994408219743101028')) {
        const soundid = interaction.options.get('soundid')?.value as string
        const endpoint = `https://apis.roblox.com/asset-permissions-api/v1/assets/${soundid}/permissions`
        const universeids = [1900951801, 2913165147, 1782832995]
        const xcsrftoken = await noblox.getGeneralToken({
            session: process.env.RBXCOOKIE
        })
        const productinfo = await noblox.getProductInfo(parseInt(soundid)).catch(err => undefined) as ProductInfo
        if (!productinfo) {
            await interaction.reply({
                content: `${soundid} not found in the group`,
            });
            return
        }

        fetch(endpoint, {
            method: 'PATCH',
            headers: {
                'Content-type': 'application/json; charset=UTF-8',
                'cookie': process.env.FULLRBXCOOKIE as string,
                'x-csrf-token': xcsrftoken
            },
            body: JSON.stringify({
                requests: universeids.map(id => ({
                    subjectType: "Universe",
                    subjectId: id,
                    action: "Use"
                }))
            })
        }).catch(err => console.log(err))

        let linkRow = new MessageActionRow().addComponents(
            new MessageButton()
                .setLabel(productinfo.Name)
                .setURL(`https://www.roblox.com/library/configure?id=${soundid}#!/general`)
                .setStyle('LINK'),
        )

        await interaction.reply({
            components: [linkRow],
            content: `${soundid} successfully granted permissions`
        });
    }
});

client.login(process.env.TOKEN)