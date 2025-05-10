import { useEffect } from "react";

function Video() {
  // useEffect(() => {
  //   const script = document.createElement("script");

  //   script.src = "https://cdn.jsdelivr.net/npm/hls.js@latest";
  //   script.async = true;

  //   document.appendChild(script);

  //   if (Hls.isSupported()) {
  //     var video = document.getElementById("video");
  //     var hls = new Hls();
  //     hls.loadSource(
  //       "https://vidmuxperma.blob.core.windows.net/permabucket/iphone16_47dc3a93833248/index-1080p.m3u8"
  //     );
  //     hls.attachMedia(video);
  //     hls.on(Hls.Events.MANIFEST_PARSED, function () {
  //       video.play();
  //     });
  //   }
  // }, []);

  return (
    <div>
      <div className="">Video</div>
      <video
        id="my-player"
        className="video-js"
        controls
        preload="auto"
        poster="//vjs.zencdn.net/v/oceans.png"
        data-setup="{}"
      />
    </div>
  );
}

export default Video;
