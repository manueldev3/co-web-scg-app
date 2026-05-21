"use client";

import { Button } from "antd";
import YoutubeBackground from "./components/YoutubeVideoBackground";

const Home = () => {
  return (
    <div>
      <main>
        <YoutubeBackground>
          <div className="lg:min-w-screen min-h-[80vh] lg:min-h-[82vh] flex flex-col justify-end items-center lg:items-start p-8 pb-20 space-y-10">
            <div className="flex flex-col items-center lg:items-start">
              <h1 className="text-4xl text-center lg:text-start lg:text-6xl font-bold tracking-wider text-white drop-shadow-md">
                Comercio Lucrativo
              </h1>
              <p className="mt-4 text-center lg:text-start lg:text-lg text-gray-200">
                Haste millonario en la nueva Alpha 4.8, Visita nuestra
                calculadora de rutas y materiales
              </p>
            </div>
            <Button type="primary" size="large" href="/mercancia">
              <span className="text-[#0A1D29] font-bold uppercase">
                Comienza ahora
              </span>
            </Button>
          </div>
        </YoutubeBackground>
      </main>
    </div>
  );
};

export default Home;

{
  /* <div className="max-w-4xl min-h-[80vh] pb-6 flex flex-col justify-end items-start">
  <h1 className="text-6xl font-extrabold tracking-wider text-white drop-shadow-md">
    
  </h1>
  <p className="mt-4 text-lg text-gray-200">
    Haste millonario en la nueva Alpha 4.8, Visita nuestra calculadora de rutas
    y materiales
  </p>
  <button className="mt-6 px-6 py-3 bg-[#143A52] hover:bg-[#0F2C3E] text-white rounded-lg transition-colors">
    Calcular ruta
  </button>
</div>; */
}
