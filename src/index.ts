require('dotenv').config()
import { wrap, audioWrap, raw } from "@dogehouse/kebab";
import { connect as mediasoupConnect } from "@dogehouse/kebab/lib/audio/mediasoup-client";
import { Device } from "mediasoup-client"; 
var load = require('audio-loader');
const main = async () => {
  const wrapper = wrap(await raw.connect(process.env.DOGEHOUSE_TOKEN!, process.env.DOGEHOUSE_REFRESH_TOKEN!, {}));
  const audioWrapper = audioWrap(wrapper.connection);
  const { rooms } = await wrapper.query.getTopPublicRooms()
/*  var theRoom = rooms[1];
   rooms.forEach(element => {
    if (element.creatorId == "303b099b-af86-4efe-a2a7-75ba3caa3879") {
      theRoom = element
    }

  }); */
  var theRoom = rooms.filter(it => it.creatorId == "303b099b-af86-4efe-a2a7-75ba3caa3879")[0] ?? rooms[0];
  console.log(theRoom[0])
  const device = new Device();
  const currentRole = document.querySelector(".current-role")!;
  console.log(rooms)
  //"https://upload.wikimedia.org/wikipedia/en/3/34/XO_TOUR_Llif3.ogg"
  const makeMicTrack = async () => {
    var context = new AudioContext();
    var source = context.createBufferSource();
    var buffer = await load('https://upload.wikimedia.org/wikipedia/en/3/34/XO_TOUR_Llif3.ogg')
    var context = new AudioContext();
    var streamDestination = context.createMediaStreamDestination();
    // var buffer = context.createBuffer(1, data.length, sampleRate);
    var source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(streamDestination);
    source.loop = true;
    source.start();
    var stream = streamDestination.stream;
    return stream.getAudioTracks()[0];
  };
  const playOutput = (track: MediaStreamTrack) => {
    const audio = new Audio();

    audio.srcObject = new MediaStream([track]);
    audio.play();
  };

  const unsubYjap = audioWrapper.subscribe.youJoinedAsPeer(async ({ routerRtpCapabilities, recvTransportOptions }) => {
    unsubYjap();

    await mediasoupConnect(
      wrapper.connection,
      routerRtpCapabilities,
      "output",
      recvTransportOptions,
      playOutput
    )(device);
    currentRole.textContent = "Listener";

    const button = document.createElement("button");

    button.textContent = "Request to speak";
    button.addEventListener("click", () => wrapper.connection.send("ask_to_speak", {}));
    currentRole.appendChild(button);

    const unsubYbs = audioWrapper.subscribe.youBecameSpeaker(async ({ sendTransportOptions }) => {
      unsubYbs();

      await mediasoupConnect(
        wrapper.connection,
        routerRtpCapabilities,
        "input",
        sendTransportOptions,
        await makeMicTrack()
      )(device);

      currentRole.removeChild(button);
    });
  });

  const unsubYjas = audioWrapper.subscribe.youJoinedAsSpeaker(async ({
    routerRtpCapabilities,
    recvTransportOptions,
    sendTransportOptions
  }) => {
    unsubYjas();

    await mediasoupConnect(
      wrapper.connection,
      routerRtpCapabilities,
      "output",
      recvTransportOptions,
      playOutput
    )(device);

    await mediasoupConnect(
      wrapper.connection,
      routerRtpCapabilities,
      "input",
      sendTransportOptions,
      await makeMicTrack()
    )(device);
  });

  const extraInfo = await wrapper.query.joinRoomAndGetInfo(theRoom.id);
  document.querySelector(".current-room")!.textContent = theRoom.name;
}

main();
