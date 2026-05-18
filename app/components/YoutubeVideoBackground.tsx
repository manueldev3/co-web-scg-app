"use client";

import React from "react";
import YouTube, { YouTubeProps } from "react-youtube";

export default function YoutubeBackground({
  children,
}: {
  children: React.ReactNode;
}) {
  // Extraemos el ID del video (por ejemplo, de: https://www.youtube.com/watch?v=WQ25HrxQaM8)
  const videoId = "WQ25HrxQaM8";

  const opts: YouTubeProps["opts"] = {
    height: "100%",
    width: "100%",
    playerVars: {
      autoplay: 1,
      controls: 0,
      rel: 0,
      showinfo: 0,
      mute: 1,
      loop: 1,
      playlist: videoId, // Requerido por la API de YouTube para que el bucle (loop) funcione
      iv_load_policy: 3,
      modestbranding: 1,
    },
  };

  // Forzamos que se repita cuando termine (por si el loop nativo de la API se duerme)
  const onEnd: YouTubeProps["onEnd"] = (event) => {
    event.target.playVideo();
  };

  return (
    <div className="relative w-full min-h-[88.9vh] overflow-hidden">
      {/* Contenedor del Player que fuerza la proporción 16:9 de fondo tipo 'cover' */}
      <div className="fixed top-0 left-0 w-full h-screen pointer-events-none z-[-1]">
        <div className="absolute top-1/2 left-1/2 w-screen h-[56.25vw] min-h-screen min-w-[177.77vh] -translate-x-1/2 -translate-y-1/2">
          <YouTube
            videoId={videoId}
            opts={opts}
            onEnd={onEnd}
            className="w-full h-full"
            iframeClassName="w-full h-full"
          />
        </div>
      </div>

      {/* Capa oscura para legibilidad del texto */}
      <div className="relative z-10 min-h-[88.9vh] bg-[#0A1D29]/50 text-white p-8">
        {children}
      </div>
    </div>
  );
}
