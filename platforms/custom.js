import axios from 'axios';
import { execa } from 'execa';

import fs from 'fs';
import readline from 'readline';

function pName(proc) {
    if (proc.cmd) {
        return proc.cmd;
    } else {
        return proc.name;
    }
}

async function getRobloxGame(proc, noHTTP) {
    if (pName(proc).toLowerCase().includes('robloxplayerbeta')) {
        // Detected the Roblox game client, get further info
        if (process.platform === 'win32') {
            // // Windows-specific code to get the placeId from command line arguments using wmic
            // const output = (await execa('wmic', ['process', 'where', `processid=${proc.pid}`, 'get', 'commandline'], { cwd: undefined })).stdout;
            // var placeReg = /%26placeId%3D(\d+)/.exec(output);

            // Better method to get latest placeId always, or null if not in game.
            function getCurrentPlaceId() {
                return new Promise((resolve, reject) => {
                    const logDirectory = `${process.env.LOCALAPPDATA}/Roblox/logs`;
                    const logFiles = fs.readdirSync(logDirectory).filter(file => file.endsWith('.log'));
                    
                    if (logFiles.length > 0) {
                        const latestLogFile = logFiles.reduce((prev, curr) => (fs.statSync(`${logDirectory}/${curr}`).mtimeMs > fs.statSync(`${logDirectory}/${prev}`).mtimeMs ? curr : prev));
                        const logLocation = `${logDirectory}/${latestLogFile}`;
            
                        try {
                            const logData = fs.readFileSync(logLocation, 'utf-8').split('\n').reverse(); // Read and split lines, then reverse order
            
                            let placeId = null;
                            let disconnectFound = false;
            
                            for (const line of logData) {
                                if (placeId || disconnectFound) {
                                    resolve(placeId);
                                    return;
                                }
            
                                if (line.includes('[FLog::Network] Time to disconnect replication data:')) {
                                    disconnectFound = true;
                                }
            
                                if (line.includes('Report game_join_loadtime: placeid:')) {
                                    const match = line.match(/Report game_join_loadtime: placeid:(\d+)/);
                                    if (match) {
                                        placeId = match[1];
                                    }
                                }
                            }
            
                            resolve(placeId ? placeId : (disconnectFound ? null : null));
                        } catch (err) {
                            resolve(null);
                        }
                    } else {
                        resolve(null);
                    }
                });
            }

            var placeReg = (await getCurrentPlaceId()).trim();
        } else {
            var placeReg = RegExp(`&placeId=([0-9]+)`).exec(pName(proc));
            placeReg = placeReg[1];
        }
        if (placeReg) {
            const placeId = placeReg;
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
                            detectionid: `roblox-${placeId}`,
                            appid: 0,
                            name: 'Roblox',
                            robloxPlace: placeId,
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
        } else {
            // Return Roblox found, no/unknown Place
            return {
                detectionid: `roblox`,
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
        }
    }
    return null;
}

async function getMinecraftGame(proc) {
    // Perhaps in the future can try and find a way to show additional information about the game (mode, server, etc)?
    const lower = pName(proc).toLowerCase();
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
