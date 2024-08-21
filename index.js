const http = require('http')

const { RTCPeerConnection, RTCRtpCodecParameters } = require('werift')
const { Client, StageChannel } = require('discord.js-selfbot-v13')
const { command, streamLivestreamVideo, MediaUdp, getInputMetadata, inputHasAudio, Streamer } = require('@dank074/discord-video-stream')

const config = require('./config.json')

const streamer = new Streamer(new Client())
streamer.client.login(config.userToken).then(() => {
  streamer.joinVoice(config.serverIdNumber, config.channelIdNumber).then(() => {
    streamer.createStream({}).then(udp => {
      udp.mediaConnection.setSpeaking(true)
      udp.mediaConnection.setVideoStatus(true)

      // try {
      //   const res = await streamLivestreamVideo("DIRECT VIDEO URL OR READABLE STREAM HERE", udp);

      //   console.log("Finished playing video " + res);
      // } catch (e) {
      //   console.log(e);
      // } finally {
      //   udp.mediaConnection.setSpeaking(false);
      //   udp.mediaConnection.setVideoStatus(false);
      // }

      // console.log('authed')
    })
  })
})

http.createServer((req, res) => {
  streamer.client.on('ready', () => {
    console.log(`--- ${streamer.client.user.tag} is ready ---`)
  })

  handleWHIPRequest(req, res,
    audioPacket => {
      console.log(audioPacket)
    },
    videoPacket => {
      console.log(videoPacket)
    })
}).listen(4321)

function handleWHIPRequest (req, res, onAudio, onVideo) {
  if (req.method !== 'POST') {
    res.end()
    return
  }

  let body = ''
  req.on('data', chunk => {
    body += chunk
  })

  req.on('end', () => {
    const pc = new RTCPeerConnection({
      iceServers: [],
      codecs: {
        audio: [
          new RTCRtpCodecParameters({
            mimeType: 'audio/opus',
            clockRate: 48000,
            channels: 2
          })
        ],
        video: [
          new RTCRtpCodecParameters({
            mimeType: 'video/H264',
            clockRate: 90000,
            rtcpFeedback: [
              { type: 'nack' },
              { type: 'nack', parameter: 'pli' },
              { type: 'goog-remb' }
            ],
            parameters:
              'profile-level-id=42e01f;packetization-mode=1;level-asymmetry-allowed=1'
          })
        ]
      }
    })

    pc.iceConnectionStateChange.subscribe((v) =>
      console.log('pc.iceConnectionStateChange', v)
    )

    pc.addTransceiver('video', { direction: 'recvonly' }).onTrack.subscribe(
      (track) =>
        track.onReceiveRtp.subscribe((packet) => {
          onVideo(packet)
        })
    )

    pc.addTransceiver('audio', { direction: 'recvonly' }).onTrack.subscribe(
      (track) =>
        track.onReceiveRtp.subscribe((packet) => {
          onAudio(packet)
        })
    )

    pc.setRemoteDescription({
      type: 'offer',
      sdp: body
    })

    pc.createAnswer().then(answer => {
      pc.setLocalDescription(answer)

      let timerStarted = false
      pc.onicecandidate = ({ candidate }) => {
        if (timerStarted) {
          return
        }
        timerStarted = true

        setTimeout(() => {
          res.setHeader('Location', '/')
          res.statusCode = 201
          res.end(pc.localDescription.sdp)
        }, 200)
      }
    })
  })
}
