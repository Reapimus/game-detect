import psList from 'ps-list';
import getCurrentSteamGame from './platforms/steam.js'
import isCustomGame from './platforms/custom.js';
import getItchIoGame from './platforms/itchio.js';
import getLitrusGame from './platforms/litrus.js';
import getGamejoltGame from './platforms/gamejolt.js';

export default async function detectCurrentGame(noHTTP = false) {
    const steamData = await getCurrentSteamGame(noHTTP);

    if (steamData) {
        // We found a steam game, no need to continue.
        return steamData;
    }

    const processes = await psList();

    // Scan the process list for games using other platforms
    for (let i = 0; i < processes.length; i++) {
        const proc = processes[i];

        const customGame = await isCustomGame(proc, noHTTP);

        if (customGame) {
            return customGame;
        }

        const itchGame = await getItchIoGame(proc);

        if (itchGame) {
            return itchGame;
        }

        const litrusGame = await getLitrusGame(proc, noHTTP);

        if (litrusGame) {
            return litrusGame;
        }

        const gamejoltGame = await getGamejoltGame(proc, noHTTP);

        if (gamejoltGame) {
            return gamejoltGame;
        }
    }
}