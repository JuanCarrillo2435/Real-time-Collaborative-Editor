import { Server } from '@hocuspocus/server';

const server = new Server({
  port: 4005,
});

server.listen();
console.log(`Bulletproof Hocuspocus Relay running on ws://127.0.0.1:4005`);
