<h1 align="center">@aoijs/aoi.invite</h1>

<p align="center">
  <a href="https://www.npmjs.com/package/@akarui/aoi.invite">
    <img src="https://img.shields.io/npm/v/@akarui/aoi.invite?style=for-the-badge"  alt="aoiinvite"/>
  </a>
  <a href="https://www.npmjs.com/package/@akarui/aoi.invite">
    <img src="https://img.shields.io/npm/dt/@akarui/aoi.invite?style=for-the-badge"  alt="aoiinvite"/>
  </a>

## Installation

```sh
npm i @aoijs/aoi.invite
```

## Setup

```js
const { InviteManager } = require("@aoijs/aoi.invite");
const { AoiClient } = require("aoi.js");

const client = new AoiClient({
    intents: ["MessageContent", "Guilds", "GuildMessages"],
    events: ["onMessage", "onInteractionCreate"],
    prefix: "Discord Bot Prefix",
    token: "Discord Bot Token",
    ...
});

// Ping Command
client.command({
    name: "ping",
    code: `Pong! $pingms`
});

const i = new InviteManager(client, {
    sk: "a-32-characters-long-string-here",
}, ['inviteJoin','inviteLeave']);
```