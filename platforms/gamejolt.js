import path from 'path';
import { readFileSync } from 'fs';
import axios from 'axios';

export default async function getGamejoltGame(proc, noHTTP) {
    try {
        var dataDir;
        switch (process.platform) {
            case 'win32':
                dataDir = `${process.env.APPDATA}/../Local/game-jolt-client/Default`;
                break;
            case 'linux':
                dataDir = `${process.env.HOME}/.config/game-jolt-client/Default`;
                break;
            case 'darwin':
                dataDir = `${process.env.HOME}/Library/Application Support/game-jolt-client/Default`;
                break;
            default:
                throw new Error(`No gamejolt support for ${process.platform}`);
        }
        
        const packagesDict = JSON.parse(readFileSync(path.join(dataDir, 'packages.wttf')));
        const gamesDict = JSON.parse(readFileSync(path.join(dataDir, 'games.wttf')));

        for (const [key, value] of Object.entries(packagesDict.objects)) {
            if (value?.running_pid) {
                if (proc.pid == JSON.parse(value.running_pid.slice(2)).pid) {
                    const gamejoltId = value.game_id;
                    const gameDetails = gamesDict.objects[gamejoltId];
    
                    var description = '';
                    var age = 13;
                    if (!noHTTP) {
                        const gameInfoReq = await axios.get(`https://gamejolt.com/site-api/web/discover/games/${gamejoltId}`);
    
                        if (gameInfoReq.status == 200) {
                            const gameInfo = gameInfoReq.data.payload.game;
                            age = (gameInfo.has_adult_content ? 18 : 13);
    
                            const desc = JSON.parse(gameInfo.description_content).content;
                            for (let i = 0; i < desc.length; i++) {
                                const paragraph = desc[i];
                                for (let d = 0; d < paragraph.content.length; d++) {
                                    const txt = paragraph.content[d];
                                    if (txt?.text) {
                                        var final = txt.text;
                                        if (txt?.marks) {
                                            const marks = txt.marks.map((value, index) => {
                                                return value.type;
                                            })
                                            for (let x = 0; x < marks.length; x++) {
                                                switch(marks[x]) {
                                                    case 'strong':
                                                        final = `<b>${final}</b>`
                                                }
                                            }
                                        }
    
                                        description = description + final + '\n';
                                    }
                                }
                            }
                        }
                    }
    
                    return {
                        detectionid: `gamejolt-${gamejoltId}`,
                        appid: 0,
                        gamejoltid: gamejoltId,
                        gamejolturl: `https://gamejolt.com/games/${gameDetails.slug || 'redirect'}/${gamejoltId}`,
                        name: gameDetails.title,
                        description: description,
                        requiredAge: age,
                        developers: [gameDetails.developer.display_name],
                        publishers: [gameDetails.developer.display_name],
                        cover: gameDetails.header_media_item.img_url,
                        icon: gameDetails.thumbnail_media_item.img_url,
                    };
                }
            }
        }
    }
    catch(err) {
        console.log(err);
        return null;
    }
}