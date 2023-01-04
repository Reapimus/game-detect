import axios from 'axios';

async function getRobloxGame(proc, noHTTP) {
    if (proc.cmd.toLowerCase().includes('robloxplayerbeta')) {
        // Detected the Roblox game client, get further info
        var placeReg = RegExp(`&placeId=([0-9]+)`).exec(proc.cmd);
        if (placeReg) {
            const placeId = placeReg[1];
            if (noHTTP) {
                return {
                    detectionid: `roblox-${placeReg}`,
                    appid: 0,
                    name: 'Roblox',
                    robloxPlace: placeReg,
                    details: '',
                    description: '',
                    requiredAge: 6,
                    developers: ['Roblox'],
                    publishers: ['Roblox'],
                    cover: '',
                    icon: '',
                }
            } else {
                const universeReq = await axios.get(`https://apis.roblox.com/universes/v1/places/${placeId}/universe`);
                if (universeReq.status == 200) {
                    const universeId = universeReq.data.universeId;
                    const iconReq = await axios.get(`https://thumbnails.roblox.com/v1/games/icons?universeIds=${universeId}&size=50x50&format=png`);
                    const coverReq = await axios.get(`https://thumbnails.roblox.com/v1/games/multiget/thumbnails?universeIds=${universeId}&size=768x432&format=png&countPerUniverse=1`);
                    const infoReq = await axios.get(`https://games.roblox.com/v1/games?universeIds=${universeId}`);

                    if (iconReq.status == 200 && coverReq.status == 200 && infoReq.status == 200) {
                        const info = infoReq.data.data[0];
                        return {
                            detectionid: `roblox-${placeReg}`,
                            appid: 0,
                            name: 'Roblox',
                            robloxPlace: placeReg,
                            robloxGame: universeId,
                            details: info.name,
                            description: info.description || '',
                            requiredAge: 6, // TODO: Change this if/when Roblox implements age ratings
                            developers: [info.creator.name],
                            publishers: [info.creator.name],
                            cover: coverReq.data.data[0].thumbnails[0].imageUrl,
                            icon: iconReq.data.data[0].imageUrl,
                        };
                    }
                    return null;
                }
            }
            return null;
        }
        return null;
    }
    return null;
}

async function getMinecraftGame(proc) {
    // Perhaps in the future can try and find a way to show additional information about the game (mode, server, etc)?
    const lower = proc.cmd.toLowerCase();
    if (lower.includes('minecraft')) {
        var name = 'Minecraft';
        if (lower.includes('legends')) {
            name = 'Minecraft Legends';
        }
        else if (lower.includes('dungeons')) {
            name = 'Minecraft Dungeons';
        }
        return {
            detectionid: `minecraft-${name}`,
            appid: 0,
            name: name || 'Minecraft',
            description: '',
            requiredAge: 6,
            developers: ['Mojang Studios'],
            publishers: ['Mojang Studios'],
            cover: 'https://www.minecraft.net/content/dam/minecraft/home/home-hero-1200x600.jpg',
            icon: 'https://www.minecraft.net/etc.clientlibs/minecraft/clientlibs/main/resources/favicon-96x96.png',
        }
    }
    return null;
}

export default async function isCustomGame(proc, noHTTP) {
    const rblxGame = await getRobloxGame(proc, noHTTP);

    if (rblxGame) {
        return rblxGame;
    }

    const mcGame = await getMinecraftGame(proc);

    if (mcGame) {
        return mcGame;
    }
}