export const sendUniformChatPacket = (client, message) => {
  if (client.protocolVersion <= 758) {
    // 协议版本 <= 758(1.18.2)
    client.write('chat', {
      message: JSON.stringify(message),
      position: 0,
      sender: '0',
    });
    return;
  } else {
    // 1.19 之后的版本使用 system_chat
    client.write('system_chat', {
      content: JSON.stringify(message),
      isActionBar: false,
    });
  }
};

export const BOSSBAR_STYLE = {
  PINK: 0,
  BLUE: 1,
  RED: 2,
  GREEN: 3,
  YELLOW: 4,
  PURPLE: 5,
  WHITE: 6,
};

const getBossbarColor = (progress) => {
  // 70% 以上为绿色，30% 以上为黄色，其余为红色
  if (progress >= 0.7) {
    return BOSSBAR_STYLE.GREEN;
  } else if (progress >= 0.3) {
    return BOSSBAR_STYLE.YELLOW;
  } else {
    return BOSSBAR_STYLE.RED;
  }
};

// progress from 0 to 1
export const sendBossbarPacket = (client, message, progress) => {
  client.write('boss_bar', {
    action: 0,
    entityUUID: '00000000-0000-0000-0000-000000000000',
    title: JSON.stringify(message),
    health: progress,
    dividers: 4,
    flags: 0x1,
    color: getBossbarColor(progress),
  });
};
