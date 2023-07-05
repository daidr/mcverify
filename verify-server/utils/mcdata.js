import minecraftData from 'minecraft-data';
export const getMcDataByVersion = (version) => {
  return minecraftData(version);
};

export const getMajorVersionByProtocol = (protocol) => {
  return minecraftData.versions.pc.find((v) => v.version === protocol)
    .majorVersion;
};
