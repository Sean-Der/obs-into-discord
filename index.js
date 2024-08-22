const http = require('http')

const { RTCPeerConnection, RTCRtpCodecParameters, H264RtpPayload } = require('werift')
const { Client } = require('discord.js-selfbot-v13')
const { Streamer, H264NalSplitter } = require('@dank074/discord-video-stream')

const config = require('./config.json')
checkConfig()

http.createServer(async (req, res) => {
  if (req.method !== 'POST') {
    res.end()
    return
  }

  const streamer = new Streamer(new Client())
  await streamer.client.login(config.userToken)
  await streamer.joinVoice(config.serverIdNumber, config.channelIdNumber, {
    width: 1280,
    height: 720,
    fps: 30,
    bitrateKbps: 1000,
    maxBitrateKbps: 2500,
    videoCodec: 'H264'
  })
  const udp = await streamer.createStream({
    width: 1280,
    height: 720,
    fps: 30,
    bitrateKbps: 1000,
    maxBitrateKbps: 2500,
    videoCodec: 'H264'
  })

  udp.mediaConnection.setSpeaking(true)
  udp.mediaConnection.setVideoStatus(true)

  const nalSplitter = new H264NalSplitter()
  nalSplitter.on('data', frame => {
    udp.sendVideoFrame(frame)
  })

  let h264Res = new H264RtpPayload()
  handleWHIPRequest(req, res,
    connectionState => {
      if (connectionState === 'disconnected') {
        streamer.stopStream()
        streamer.leaveVoice()
      }
    },
    audioPacket => {
      udp.sendAudioFrame(audioPacket.payload)
    },
    videoPacket => {
      h264Res = H264RtpPayload.deSerialize(videoPacket.payload, h264Res.fragment)
      if (h264Res.payload !== undefined) {
        nalSplitter._transform(h264Res.payload, null, () => {})
      }
    })
}).listen(config.httpPort)

function handleWHIPRequest (req, res, onConnectionState, onAudio, onVideo) {
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

    pc.iceConnectionStateChange.subscribe(onConnectionState)

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

function checkConfig () {
  const redText = '\x1b[31m'
  const resetText = '\x1b[0m'

  const startupErrors = []
  if (config.userToken === '') {
    startupErrors.push(redText + 'Config is missing userToken' + resetText)
  }
  if (config.serverIdNumber === '') {
    startupErrors.push(redText + 'Config is missing serverIdNumber' + resetText)
  }
  if (config.channelIdNumber === '') {
    startupErrors.push(redText + 'Config is missing channelIdNumber' + resetText)
  }
  if (!config.httpPort) {
    startupErrors.push(redText + 'Config is missing httpPort' + resetText)
  }

  startupErrors.forEach((e, i) => {
    console.log(e)
  })

  if (startupErrors.length !== 0) {
    process.exit(1)
  }
}
