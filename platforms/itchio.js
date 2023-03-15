import { existsSync, readFileSync } from 'fs';
import path from 'path';
import escapeRegExp from './util.js';

import nodegzip from 'node-gzip';
const { ungzip } = nodegzip;

export default async function getItchIoGame(proc) {
    try {
        var installLocations;
        switch (process.platform) {
            case 'win32':
                installLocations = [
                    'C://Games/Itch Games'
                ]
                var preferences = JSON.parse(readFileSync(path.join(`${process.env.APPDATA}/../Local/itch`, 'preferences.json')));
                if (preferences.installLocations.length > 0) {
                    preferences.installLocations.forEach(loc => {
                        installLocations.push(loc);
                    })
                }
                break;
            case 'linux':
                installLocations = [
                    `${process.env.HOME}/.config/itch/apps`
                ]
                var preferences = JSON.parse(readFileSync(path.join(`${process.env.HOME}/.config/itch`, 'preferences.json')));
                if (preferences.installLocations.length > 0) {
                    preferences.installLocations.forEach(loc => {
                        installLocations.push(loc);
                    })
                }
                break;
            case 'darwin':
                installLocations = [
                    `${process.env.HOME}/Library/Application Support/itch/apps`
                ]
                var preferences = JSON.parse(readFileSync(path.join(`${process.env.HOME}/Library/Application Support/itch`, 'preferences.json')));
                if (preferences.installLocations.length > 0) {
                    preferences.installLocations.forEach(loc => {
                        installLocations.push(loc);
                    })
                }
                break;
            default:
                return null;
        }
        if (installLocations) {
            for (let i = 0; i < installLocations.length; i++) {
                var loc = installLocations[i];
                if (!existsSync(loc)) return null
                if (proc.cmd.includes(loc)) {
                    // It's an itch.io game, continue
                    var gameBaseFolder = RegExp(`(${escapeRegExp(loc)}/[a-zA-z0-9\-\_ &]+)/`).exec(proc.cmd);
                    if (gameBaseFolder) {
                        var gameReceipt = readFileSync(path.join(gameBaseFolder[1], '.itch', 'receipt.json.gz'));
                        var unpackedReceipt = JSON.parse(await ungzip(gameReceipt)).game;

                        return {
                            detectionid: `itchio-${unpackedReceipt.id}`,
                            appid: 0,
                            itchid: unpackedReceipt.id,
                            itchurl: unpackedReceipt.url,
                            name: unpackedReceipt.title,
                            description: unpackedReceipt.shortText,
                            requiredAge: 13,
                            developers: [unpackedReceipt.user.displayName],
                            publishers: [unpackedReceipt.user.displayName],
                            cover: unpackedReceipt.coverUrl,
                            icon: unpackedReceipt.coverUrl,
                        };
                    }
                }
            }
        }
    }
    catch(err) {
        return null;
    }
}