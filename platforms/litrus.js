import sqlite3 from "sqlite3";
import axios from "axios";
import fs from "fs";

const sqlite = sqlite3.verbose();
var db;

async function getGames() {
    const sql = 'SELECT * FROM games';
    return new Promise(function(resolve,reject){
        db.all(sql, function(err,rows){
           if(err){return reject(err);}
           resolve(rows);
         });
    });
}

export default async function getLitrusGame(proc, noHTTP) {
    try {
        if (!fs.existsSync(`${process.env.HOME}/.local/share/lutris/pga.db`)) return null;
        if (db == null) {
            db = new sqlite.Database(`${process.env.HOME}/.local/share/lutris/pga.db`, sqlite.OPEN_READONLY);
        }
        const gameList = await getGames();
        
        for (let i = 0; i < gameList.length; i++) {
            const row = gameList[i];
            if (proc.cmd.includes('lutris-wrapper') && proc.cmd.includes(row.name) || proc.cmd.includes(row.directory)) {
                if (noHTTP) {
                    return {
                        detectionid: `lutris-${row.slug}`,
                        appid: 0,
                        litrusSlug: row.slug,
                        name: row.name,
                        description: '',
                        requiredAge: 13,
                        developers: ['Unknown'],
                        publishers: ['Unknown'],
                        cover: `https://lutris.net/games/banner/${row.slug}.jpg`,
                        icon: `https://lutris.net/games/icon/${row.slug}.png`,
                    };
                } else {
                    const gameReq = await axios.get(`https://lutris.net/api/games/${row.slug}`);
                    if (gameReq.status == 200) {
                        const gameInfo = gameReq.data;
                        return {
                            detectionid: `lutris-${row.slug}`,
                            appid: gameInfo.steamid || 0,
                            litrusSlug: row.slug,
                            name: row.name,
                            description: gameInfo.description || '',
                            requiredAge: 13,
                            developers: ['Unknown'],
                            publishers: ['Unknown'],
                            cover: `https://lutris.net/games/banner/${row.slug}.jpg`, //? use gameInfo.coverart instead?
                            icon: `https://lutris.net/games/icon/${row.slug}.png`,
                        };
                    }
                }
            }
        }

        return null;
    }
    catch(err) {
        return null;
    }
}