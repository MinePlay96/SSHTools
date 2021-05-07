# Description
 
[ssh-tools](https://github.com/MinePlay96/ssh-tools) is a powerfull extention of the greate [ssh2]() Client class that allows to connect to a server via a different ssh server thats nearly completly backwards compatible to the [ssh2]() libary

# Table of Contents

* [Installation](#installation)
* [Differences](#Differences)
  * [connect](#connect)
* [Usage](#Usage)
  * [connect](#connect)
    * [hop](#hop)
    * [port forwards on connect](#port_forwards_on_connect)
  * [releaseParent](#releaseParent)
  * [forwardPort](#forwardPort)
  * [getPortForwards](#getPortForwards)

# Installation

    npm i ssh-tools

# Differences 

## connect
the connect methode requiers a host and a port

# Usage

## connect
the connect can be used in the same way as the connect from the [ssh]() Client class
```javascript
const connection = new SSHClient();

connection.connect({
  host: '127.0.0.1',
  port: 22
})
```
### hop
to connect to a server via a hop you can use a already existing connection
```javascript
const connectionParent = new SSHClient();
const connection = new SSHClient();

connection.connect({
  host: '127.0.0.1',
  port: 22,
  through: connectionParent
})
```
or you can direkt connect with connection options if the connection get closed it closes all hop connections if there where generatet
```javascript
const connection = new SSHClient();

connection.connect({
  host: '127.0.0.1',
  port: 22,
  through: {
    host: 'example.com',
    port: 22,
    through: {
      ...
    }
  }
})
```
### port forwards on connect
```javascript
const connection = new SSHClient();

connection.connect({
  host: '127.0.0.1',
  port: 22,
  tunnels:[
    {
      remotePort: 443;
      remoteHost: '127.0.0.1';
      localPort: 443;
    },
    {
      remotePort: 25565;
      remoteHost: '127.0.0.1';
      localPort: 25565;
    }
  ]
})
```

## releaseParent
if you have a connection you can "release" the parent an get the connection back this will prevent the closure of connections thats used for the hop

releaseParent will return false if it dosen`t have a parent
```javascript
const connection = new SSHClient();

connection.connect({
  host: '127.0.0.1',
  port: 22,
  through: {
    host: 'example.com',
    port: 22,
    through: {
      ...
    }
  }
})

const connectionParent = connection.releaseParent(); // SSHClient | false
```

## forwardPort
generates a ssh port forward and returns a instance of SSHForward

```javascript
const connection = new SSHClient();

const localPort = 443;
const remoteAdress = '127.0.0.1';
const remotePort = 443;

const forward = connection.forwardPort( localPort, remoteAdress, remotePort);

forward.close() // closes the forward

```

## getPortForwards
returns a array of open port forwards

```javascript
const connection = new SSHClient();

const connection.connect({
  host: 'example.com',
  port: 22,
  tunnels:[
    {
      remotePort: 443;
      remoteHost: '127.0.0.1';
      localPort: 443;
    },
    {
      remotePort: 25565;
      remoteHost: '127.0.0.1';
      localPort: 25565;
    }
  ]
});

// contains the tunnels defined in the connect
const forwards = forward.getPortForwards(); 

```

