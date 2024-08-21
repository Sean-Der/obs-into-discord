# OBS Into Discord

[![License][license-image]][license-url]
[![Discord][discord-image]][discord-invite-url]

- [What is OBS Into Discord](#what-is-obs-into-discord)
- [Building](#building)
- [Using](#using)
- [TODO](#todo)
- [More](#more)

## What is OBS Into Discord

This project allows you to send video from OBS directly into Discord.
The video is not transcoded or modified in any way. You should see
little to no CPU usage and latency should be minimal.

This projects accepts WebRTC (WHIP) clients using [werift-webrtc](https://github.com/shinyoshiaki/werift-webrtc). It then bridges this
into Discord using [dank074/Discord-video-stream](https://github.com/dank074/Discord-video-stream). This project also supports more then
just OBS. You can also use any client that support WHIP.

* [GStreamer](https://gstreamer.freedesktop.org/documentation/webrtchttp/whipsink.html?gi-language=c)
* [Larix Broadcaster](https://softvelum.com/larix/)
* [FFmpeg](https://github.com/ossrs/ffmpeg-webrtc)
* [Web Browser](https://github.com/Eyevinn/whip)


## Building

## Using

## TODO

## More

[Join the Discord][discord-invite-url] and we are ready to help!

[license-image]: https://img.shields.io/badge/License-MIT-yellow.svg
[license-url]: https://opensource.org/licenses/MIT
[discord-image]: https://img.shields.io/discord/1162823780708651018?logo=discord
[discord-invite-url]: https://discord.gg/An5jjhNUE3
