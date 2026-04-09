import { useEffect, useRef } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';

interface VideoJsPlayerOptions {
  autoplay?: boolean;
  sources?: string | { src: string; type: string }[];
  poster?: string;
}

interface VideoJsPlayer {
  autoplay: (value: boolean) => void;
  src: (source: string | { src: string; type: string }[]) => void;
  poster: (value: string) => void;
  isDisposed: () => boolean;
  dispose: () => void;
}

interface VideoJSProps {
  options: VideoJsPlayerOptions;
  onReady?: (player: VideoJsPlayer) => void;
  sasToken?: string;
}

export const VideoJS = (props: VideoJSProps) => {
  const videoRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<VideoJsPlayer | null>(null);
  const { options, onReady, sasToken } = props;

  useEffect(() => {
    if (!playerRef.current && videoRef.current) {
      const videoElement = document.createElement('video');
      videoElement.classList.add('video-js', 'vjs-big-play-centered');
      videoRef.current.appendChild(videoElement);

      const playerOptions: any = { ...options };

      // If a SAS token is provided, configure VHS (Video HTTP Streaming)
      // to append it to every HLS request (master playlist, variant
      // playlists, and all .ts segment fetches).
      if (sasToken) {
        playerOptions.html5 = {
          vhs: {
            beforeRequest(opt: any) {
              const separator = opt.uri.includes('?') ? '&' : '?';
              opt.uri = `${opt.uri}${separator}${sasToken}`;
              return opt;
            },
          },
        };
      }

      // Initialize player using videojs; cast the result to unknown then to VideoJsPlayer
      const player = videojs(videoElement, playerOptions, function () {
        videojs.log('player is ready');
        if (onReady) {
          onReady(player as unknown as VideoJsPlayer);
        }
      });
      playerRef.current = player as unknown as VideoJsPlayer;
    } else if (playerRef.current) {
      const player = playerRef.current;
      player.autoplay(options.autoplay || false);
      if (options.sources) {
        player.src(options.sources);
      }
      if (options.poster) {
        player.poster(options.poster);
      }
    }
  }, [options, onReady, sasToken]);

  useEffect(() => {
    return () => {
      if (playerRef.current && !playerRef.current.isDisposed()) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, []);

  return (
    <div data-vjs-player>
      <div ref={videoRef} />
    </div>
  );
};

export default VideoJS;
