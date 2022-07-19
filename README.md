# game-detect
game-detect is a node package specifically for detecting what game a user is playing, for use cases such as showing game activity or presence in a chatting service or app.

Support for Windows, MacOS, and Linux have been implemented, however Windows & MacOS support have not been tested yet.

## Install
```
npm i game-detect
```

## Usage
```js
import detectCurrentGame from 'game-detect';

console.log(await detectCurrentGame(false));
/* =>
{
    detectionid: 'gamejolt-215221',
    appid: 0,
    gamejoltid: 215221,
    gamejolturl: 'https://gamejolt.com/games/hero-as-a-hobby/215221',
    name: gameDetails.title,
    description: '',
    requiredAge: 13,
    developers: ['fishwind'],
    publishers: ['fishwind'],
    cover: 'https://i.gjcdn.net/data/games/3/221/215221/1',
    icon: 'https://i.gjcdn.net/data/games/3/221/215221/screenshot_5 - copy-iwrwyawc.png',
}
*/
```

## API
### **detectCurrentGame(noHTTP?)**
Returns information about the game the user is playing or `null` if they aren't playing one or it cannot be detected.

**noHTTP**
Type: `boolean`
Default: `False`

Whether or not to send HTTP requests to fill in information that isn't provided by the game's platform directly on the user's system. (recommended if you are just checking if the user's current game has changed)

## Compatibility

| Platform  | Windows | MacOS | Linux |
|-----------|---------|-------|-------|
| Steam     | ❔      | ❔    | ✔️    |
| Itch.io   | ❔      | ❔    | ✔️    |
| Gamejolt  | ❔      | ❔    | ✔️    |
| Litrus    | ❌      | ❌    | ✔️    |
| Roblox    | ✔️      | ✔️    | ✔️    |
| Minecraft | ✔️      | ✔️    | ✔️    |