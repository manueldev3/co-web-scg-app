// Puedes guardarlo en components/VideoBackground.tsx
"use client";

import React from "react";

export default function VideoBackground() {
  return (
    <div className="relative w-full min-height-screen overflow-hidden">
      {/* El video de fondo fija su posición */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="fixed top-0 left-0 w-full h-full object-cover z-[-1]"
      >
        <source src="/videos/star-citizen-cargo.mp4" type="video/mp4" />
        Tu navegador no soporta videos.
      </video>

      {/* Contenedor del contenido de tu guía */}
      <div className="relative z-10 min-h-screen bg-black/40 text-white p-8">
        {/* El bg-black/40 añade una capa oscura semitransparente 
            para que las letras de tus guías se lean perfectamente */}
        <header className="max-w-4xl mx-auto mt-20">
          <h1 className="text-4xl font-bold tracking-wider uppercase text-amber-400">
            Rutas de Carga - Star Citizen
          </h1>
          <p className="mt-4 text-lg text-gray-200">
            Bienvenido a la guía definitiva de comercio y transporte de
            mercancías.
          </p>
        </header>

        {/* Aquí va el resto del contenido de tu página */}
      </div>
    </div>
  );
}
