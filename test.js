const { SSHClient } = require('./dist/SSHClient');

const client1 = new SSHClient();

client1.connect({
  host: '127.0.0.1',
  port: 22,
  through: {
    host: '127.0.0.1',
    port: 22,
    through: {
      host: '127.0.0.1',
      port: 22,
    }
  }
});

client1.on('ready', () => {
  console.log('ready first');
  const client2 = new SSHClient();

  client2.connect({
    host: '127.0.0.1',
    port: 22,
    through: client1
  });
  client2.on('ready', () => {
    console.log('ready second');
    setTimeout(() => {
      console.log('action close client1');
      client1.end();
    }, 5000);
  });
  client2.on('close', () => {
    console.log('client2 was closed');
  });

  const parent = client1.releaseParent();
});

