const http = require('http')
const { RTCPeerConnection, RTCRtpCodecParameters } = require('werift')

http.createServer((req, res) => {
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
        // console.log(packet)
        })
    )

    pc.addTransceiver('audio', { direction: 'recvonly' }).onTrack.subscribe(
      (track) =>
        track.onReceiveRtp.subscribe((packet) => {
        // console.log(packet)
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
}).listen(4321)
