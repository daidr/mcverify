import { getMcDataByVersion } from './mcdata.js';
import fs from 'fs';

const extraCodec = {};

// 遍历./dimensionCodec/目录下的所有文件,存到extraCodec中
fs.readdirSync('./dimensionCodec/').forEach((file) => {
  let version = file.split('.')[0];
  let data = fs.readFileSync(`./dimensionCodec/${file}`);
  extraCodec[version] = JSON.parse(data);
});

export const sendLoginPacket = (client) => {
  let mcData = getMcDataByVersion(client.protocolVersion);
  let loginPacket = {
    dimension: 0,
    difficulty: 0,
    maxPlayers: 1,
    levelType: 'default',
    ...mcData.loginPacket,
    viewDistance: 1,
    enableRespawnScreen: 1,
    entityId: 1,
    reducedDebugInfo: true,
    previousGameMode: 3,
    gameMode: 0,
    isDebug: false,
    dimensionCodec:
      Object.keys(extraCodec).indexOf(client.protocolVersion.toString()) !== -1
        ? extraCodec[client.protocolVersion.toString()]
        : mcData.loginPacket.dimensionCodec,
  };

  client.write('login', loginPacket);
  // console.log(JSON.stringify(loginPacket));
};
