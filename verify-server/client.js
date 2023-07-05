import { createClient } from 'minecraft-protocol';
import fs from 'fs';

const client = createClient({
  host: 'localhost',
  port: '25565',
  username: 'echo',
});
client.on('error', function (err) {
  console.error(err);
});

client.on('connect', function () {
  console.info('connected');
});
client.on('disconnect', function (packet) {
  console.log('disconnected: ' + packet.reason);
});
client.on('end', function () {
  console.log('Connection lost');
});
client.on('packet', function (packet, meta) {
  if (meta.name === 'login') {
    console.log(packet.dimensionCodec);

    fs.writeFileSync(
      `./dimensionCodec/761.json`,
      JSON.stringify(packet.dimensionCodec),
    );
  }
});
