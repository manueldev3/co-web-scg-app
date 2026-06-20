"use client";

import { Button } from "antd";
import {
  LineChartOutlined,
  NodeIndexOutlined,
  ContainerOutlined,
  RocketOutlined,
  SafetyCertificateOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import YoutubeBackground from "./components/YoutubeVideoBackground";
import HomeWikiSection from "./components/HomeWikiSection";

type Tool = {
  icon: React.ReactNode;
  name: string;
  tagline: string;
  description: string;
  bullets: string[];
  href: string;
  cta: string;
};

const TOOLS: Tool[] = [
  {
    icon: <LineChartOutlined className="text-8xl" />,
    name: "Mercancía",
    tagline: "Precios de compra y venta en tiempo real",
    description:
      "Consulta el precio de cualquier mercancía en todas las terminales del universo, con datos de la comunidad de UEX Corp. Encuentra dónde comprar barato y dónde vender caro de un vistazo.",
    bullets: [
      "Mejores precios de compra y venta por terminal",
      "Existencias (SCU) disponibles en cada ubicación",
      "Búsqueda rápida por nombre de mercancía",
    ],
    href: "/mercancia",
    cta: "Ver precios",
  },
  {
    icon: <NodeIndexOutlined className="text-8xl" />,
    name: "Mejor Ruta",
    tagline: "Rutas comerciales más rentables para tu nave",
    description:
      "Indica tu nave y tu capital inicial y calculamos las rutas de comercio más rentables: dónde comprar, dónde vender, cuánto cargar y cuánta ganancia obtienes por viaje.",
    bullets: [
      "Ordena por ganancia pura o ganancia por tiempo",
      "Filtra por mercancía, tipo, facción y tamaño de caja",
      "Respeta la capacidad de tu nave y tu inversión",
    ],
    href: "/mejor-ruta",
    cta: "Calcular rutas",
  },
  {
    icon: <ContainerOutlined className="text-8xl" />,
    name: "Organizador de carga",
    tagline: "Distribuye tu bodega entre destinos",
    description:
      "Organiza la carga de tu nave por destino y mercancía para aprovechar al máximo cada SCU de tu bodega y planificar entregas sin desperdiciar espacio.",
    bullets: [
      "Asigna mercancías a múltiples destinos",
      "Controla la ocupación total en SCU",
      "Planifica entregas de forma ordenada",
    ],
    href: "/organizador-de-carga",
    cta: "Organizar carga",
  },
];

const FEATURES = [
  {
    icon: <ThunderboltOutlined />,
    title: "Datos actualizados",
    text: "Precios y existencias provenientes de la comunidad de UEX Corp, refrescados con frecuencia.",
  },
  {
    icon: <SafetyCertificateOutlined />,
    title: "Gratis y sin cuenta",
    text: "Usa todas las herramientas sin registrarte. Sin costos ni límites para empezar a comerciar.",
  },
  {
    icon: <RocketOutlined />,
    title: "Hecho para cargadores",
    text: "Pensado para pilotos de carga de Star Citizen que quieren maximizar cada viaje.",
  },
];

const Home = () => {
  return (
    <div>
      <main>
        {/* Hero */}
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
            <Button type="primary" size="large" href="/mejor-ruta">
              <span className="text-[#0A1D29] font-bold uppercase">
                Comienza ahora
              </span>
            </Button>
          </div>
        </YoutubeBackground>

        {/* Secciones (fondo opaco para cubrir el video fijo de fondo) */}
        <div className="relative bg-[#040d16]">
          {/* Intro */}
          <section className="px-6 lg:px-8 py-16 max-w-6xl mx-auto text-center">
            <h2 className="text-3xl lg:text-4xl font-bold text-white">
              Herramientas para cargadores
            </h2>
            <p className="mt-4 text-gray-300 max-w-3xl mx-auto lg:text-lg">
              Todo lo que necesitas para comerciar de forma inteligente en Star
              Citizen: consulta precios, encuentra las rutas más rentables y
              organiza tu bodega. Estas son las herramientas disponibles y cómo
              te ayudan.
            </p>
          </section>

          {/* Tool sections */}
          <section className="px-6 lg:px-8 pb-8 max-w-6xl mx-auto space-y-6">
            {TOOLS.map((tool, i) => (
              <div
                key={tool.href}
                className={`flex flex-col gap-6 rounded-2xl border border-[#143A52] bg-[#071421] p-6 lg:p-10 lg:flex-row lg:items-center ${
                  i % 2 === 1 ? "lg:flex-row-reverse" : ""
                }`}
              >
                {/* Icon panel */}
                <div className="flex shrink-0 items-center justify-center">
                  <div className="flex h-64 w-64 items-center justify-center rounded-2xl bg-[#0F2C3E] text-5xl text-[#9ED0FA]">
                    {tool.icon}
                  </div>
                </div>

                {/* Text */}
                <div className="flex-1">
                  <span className="text-sm font-semibold uppercase tracking-wide text-[#4a9eda]">
                    {tool.tagline}
                  </span>
                  <h3 className="mt-1 text-2xl lg:text-3xl font-bold text-white">
                    {tool.name}
                  </h3>
                  <p className="mt-3 text-gray-300 lg:text-lg">
                    {tool.description}
                  </p>
                  <ul className="mt-4 space-y-2">
                    {tool.bullets.map((b) => (
                      <li
                        key={b}
                        className="flex items-start gap-2 text-gray-200"
                      >
                        <span className="mt-1 text-[#9ED0FA]">▸</span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6">
                    <Button type="primary" size="large" href={tool.href}>
                      <span className="font-bold uppercase text-[#0A1D29]">
                        {tool.cta}
                      </span>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </section>

          {/* Feature highlights */}
          <section className="px-6 lg:px-8 py-16 max-w-6xl mx-auto">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {FEATURES.map((f) => (
                <div
                  key={f.title}
                  className="rounded-xl border border-[#143A52] bg-[#071421] p-6 text-center"
                >
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#0F2C3E] text-2xl text-[#9ED0FA]">
                    {f.icon}
                  </div>
                  <h4 className="text-lg font-semibold text-white">
                    {f.title}
                  </h4>
                  <p className="mt-2 text-sm text-gray-300">{f.text}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Wiki destacada (Req 7.1) */}
          <HomeWikiSection />

          {/* Closing CTA */}
          <section className="px-6 lg:px-8 pb-20">
            <div className="mx-auto max-w-4xl rounded-2xl border border-[#1e4a6e] bg-gradient-to-r from-[#0a1929] to-[#0F2C3E] p-8 lg:p-12 text-center">
              <h2 className="text-2xl lg:text-3xl font-bold text-white">
                ¿Listo para hacer tu primer millón?
              </h2>
              <p className="mt-3 text-gray-300 lg:text-lg">
                Empieza por calcular tu mejor ruta de comercio según tu nave y
                tu capital.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Button type="primary" size="large" href="/mejor-ruta">
                  <span className="font-bold uppercase text-[#0A1D29]">
                    Calcular mi mejor ruta
                  </span>
                </Button>
                <Link
                  href="/mercancia"
                  className="inline-flex items-center rounded-md border border-[#1e4a6e] px-5 py-2 font-semibold text-[#9ED0FA] no-underline transition-colors hover:bg-[#0F2C3E]"
                >
                  Explorar precios
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default Home;
