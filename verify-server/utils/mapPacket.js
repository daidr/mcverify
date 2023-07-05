import prismarineChunk from 'prismarine-chunk';
import { getMcDataByVersion, getMajorVersionByProtocol } from './mcdata.js';
import { Vec3 } from 'vec3';

const chunkCache = {};

const sendChunk = (client, chunk, x, z) => {
  let chunk_light = client.protocolVersion >= 757 ? chunk.dumpLight() : {};
  let map_data = {
    x,
    z,
    groundUp: true,
    biomes: chunk.dumpBiomes(),
    heightmaps: {
      type: 'compound',
      name: '',
      value: {
        MOTION_BLOCKING: {
          type: 'longArray',
          value: new Array(36).fill([0, 0]),
        },
      },
    },
    bitMap: chunk.getMask(),
    chunkData: chunk.dump(),
    ignoreOldData: true,
    blockEntities: [],
  };
  // added in 1.18+
  if (client.protocolVersion >= 757) {
    map_data = {
      ...map_data,
      trustEdges: true,
      skyLightMask: chunk_light.skyLightMask,
      blockLightMask: chunk_light.blockLightMask,
      emptySkyLightMask: 0,
      emptyBlockLightMask: 0,
      skyLight: chunk_light.skyLight,
      blockLight: chunk_light.blockLight,
    };
  }
  client.write('map_chunk', map_data);

  // if (client.protocolVersion >= 757) {
  //   client.write('update_light', {
  //     chunkX: x,
  //     chunkZ: z,
  //     trustEdges: true,
  //     skyLightMask: chunk.skyLightMask,
  //     blockLightMask: chunk.blockLightMask,
  //     emptySkyLightMask: 0,
  //     emptyBlockLightMask: 0,
  //     skyLight: chunk_light.skyLight,
  //     blockLight: chunk_light.blockLight,
  //     // data: chunk.dumpLight(),
  //   });
  // }
};

const sendNearbyChunks = (client, chunk, x, z) => {
  for (let i = -2; i < 2; i++) {
    for (let j = -2; j < 2; j++) {
      sendChunk(client, chunk, x + i, z + j);
    }
  }
};

export const sendMapPacket = (client) => {
  //   if (!chunkCache[pVer]) {
  //     let Chunk = prismarineChunk(getMajorVersionByProtocol(pVer));
  //     let chunk = new Chunk();
  //     let mcData = getMcDataByVersion(pVer);
  //     for (let x = 0; x < 16; x++) {
  //       for (let z = 0; z < 16; z++) {
  //         chunk.setBlockType(
  //           new Vec3(x, 100, z),
  //           mcData.blocksByName.grass_block.id,
  //         );
  //         chunk.setBlockData(new Vec3(x, 100, z), 1);
  //         for (let y = 0; y < 256; y++) {
  //           chunk.setSkyLight(new Vec3(x, y, z), 15);
  //         }
  //       }
  //     }

  //     chunkCache[pVer] = chunk;
  //   }
  // if (client.protocolVersion >= 757) return;
  let mcVersion = getMajorVersionByProtocol(client.protocolVersion);

  if (!chunkCache[mcVersion]) {
    let Chunk = prismarineChunk(mcVersion);

    let chunk = new Chunk();
    chunkCache[mcVersion] = chunk;

    // for (let x = 0; x < 16; x++) {
    //   for (let z = 0; z < 16; z++) {
    //     chunk.setBlockType(new Vec3(x, -0, z), 2);
    //     chunk.setBlockData(new Vec3(x, -0, z), 0);
    //     for (let y = 0; y < 256; y++) {
    //       chunk.setSkyLight(new Vec3(x, y, z), 15);
    //     }
    //   }
    // }
  }

  let chunk = chunkCache[mcVersion];

  sendNearbyChunks(client, chunk, 0, 0);
};
