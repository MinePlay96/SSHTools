const { SSHClient } = require('./dist/SSHClient');
const fs = require('fs');

const client1 = new SSHClient();
const privateKey = fs.readFileSync('pathToPrivateKey');

client1.connect({
  host: 'main',
  user: 'root',
  privateKey,
  port: 22,
  tunnels: [{
    localPort: 443,
    remoteHost: '127.0.0.1',
    remotePort: 443
  }],
  through: {
    host: 'hop',
    user: 'root',
    privateKey,
    port: 22,
    tunnels: [{
      localPort: 444,
      remoteHost: '127.0.0.1',
      remotePort: 443
    }]
  }
});


client1.on('ready', () => {
  console.log(client1.getPortForwards());
  const client2 = client1.releaseParent();

  if (client2) {
    console.log(client2.getPortForwards());
  }
});

