import axios from 'axios';
import { readFileSync } from 'fs';
import path from 'path';
import vdf from 'vdf-parser';
import { execa } from 'execa';

const REG_TREE_PATH = 'HKCU\\Software\\Valve\\Steam';
const getRegExePath = () => process.platform === 'win32' && process.env.windir != null
    ? path.join(process.env.windir, 'System32', 'reg.exe')
    : 'REG';

async function getSteamGameInfo(appid) {
    var res = await axios.get(`https://store.steampowered.com/api/appdetails?appids=${appid}`);
    if (res.status == 200) {
        return res.data[appid].data;
    }
}

export default async function getCurrentSteamGame(noHTTP) {
    try {
        var curApp;
        switch (process.platform) {
            case 'win32':
                const output = (await execa(getRegExePath(), ['QUERY', REG_TREE_PATH, '/v', 'SteamPath'], { cwd: undefined })).stdout;
                const matches = output.match(/RunningAppID\s+[A-Z_]+\s+(.+)/);
                if (!matches || matches[1] === '')
                    return null;
                curApp = Number(matches[1]);
                break;
            case 'linux':
                var steamRegistry = vdf.parse(readFileSync(path.join(`${process.env.HOME}/.steam`, 'registry.vdf'), 'utf-8'));
                curApp = steamRegistry.Registry.HKCU.Software.Valve.Steam.RunningAppID;
                break;
            case 'darwin':
                var steamRegistry = vdf.parse(readFileSync(path.join(`${process.env.HOME}/Library/Application Support/Steam`, 'registry.vdf'), 'utf-8'));
                curApp = steamRegistry.Registry.HKCU.Software.Valve.Steam.RunningAppID;
                break;
            default:
                return null;
        }

        if (curApp) {
            if (noHTTP) {
                return {
                    detectionid: `steam-${curApp}`,
                    appid: curApp,
                    name: toString(curApp),
                    description: '',
                    requiredAge: '',
                    developers: ['Unknown'],
                    publishers: ['Unknown'],
                    cover: '',
                    icon: `https://cdn.cloudflare.steamstatic.com/steam/apps/${curApp}/hero_capsule.jpg`,
                }
            } else {
                const info = await getSteamGameInfo(curApp);
                if (info) {
                    return {
                        detectionid: `steam-${curApp}`,
                        appid: curApp,
                        name: info.name,
                        description: info.short_description,
                        requiredAge: info.required_age,
                        developers: info.developers,
                        publishers: info.publishers,
                        cover: info.background_raw,
                        icon: `https://cdn.cloudflare.steamstatic.com/steam/apps/${curApp}/hero_capsule.jpg`,
                    }
                } else {
                    return null;
                }
            }
        } else {
            return null;
        }
    }
    catch (err) {
        return null
    }
}