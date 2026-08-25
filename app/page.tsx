"use client";

import { Button } from "antd";
import {
  LineChartOutlined,
  NodeIndexOutlined,
  ContainerOutlined,
  RocketOutlined,
  SafetyCertificateOutlined,
  ThunderboltOutlined,
  GiftOutlined,
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

          {/* Únete a la comunidad */}
          <section className="px-6 lg:px-8 py-16 max-w-6xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl lg:text-4xl font-bold text-white">
                Únete a la comunidad
              </h2>
              <p className="mt-4 text-gray-300 max-w-2xl mx-auto lg:text-lg">
                Somos una organización de cargadores, chatarreros y mineros en
                Star Citizen. Únete a nuestro Discord, síguenos en redes y forma
                parte de Atlas Cargos Industries.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {/* Discord */}
              <Link
                href="https://discord.com/invite/C5J52cKgF6"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-4 rounded-xl border border-[#143A52] bg-[#071421] p-5 no-underline transition-all hover:border-[#5865F2] hover:bg-[#0c1f33]"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#5865F2] text-white">
                  <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24" aria-hidden="true">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                  </svg>
                </div>
                <div>
                  <span className="text-white font-semibold group-hover:text-[#9ED0FA]">
                    Discord
                  </span>
                  <p className="text-sm text-gray-400 mt-0.5">
                    Chatea con la comunidad
                  </p>
                </div>
              </Link>

              {/* Twitch */}
              <Link
                href="https://www.twitch.tv/tioatlasgamer"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-4 rounded-xl border border-[#143A52] bg-[#071421] p-5 no-underline transition-all hover:border-[#9146FF] hover:bg-[#0c1f33]"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#9146FF] text-white">
                  <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24" aria-hidden="true">
                    <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0 1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z" />
                  </svg>
                </div>
                <div>
                  <span className="text-white font-semibold group-hover:text-[#9ED0FA]">
                    Twitch
                  </span>
                  <p className="text-sm text-gray-400 mt-0.5">
                    Streams en vivo
                  </p>
                </div>
              </Link>

              {/* TikTok */}
              <Link
                href="https://www.tiktok.com/@atlas.cargo.i"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-4 rounded-xl border border-[#143A52] bg-[#071421] p-5 no-underline transition-all hover:border-[#ff0050] hover:bg-[#0c1f33]"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#ff0050] text-white">
                  <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24" aria-hidden="true">
                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                  </svg>
                </div>
                <div>
                  <span className="text-white font-semibold group-hover:text-[#9ED0FA]">
                    TikTok
                  </span>
                  <p className="text-sm text-gray-400 mt-0.5">
                    Clips y contenido corto
                  </p>
                </div>
              </Link>

              {/* Organización RSI */}
              <Link
                href="https://robertsspaceindustries.com/en/orgs/ACIN"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-4 rounded-xl border border-[#143A52] bg-[#071421] p-5 no-underline transition-all hover:border-[#00c3ff] hover:bg-[#0c1f33]"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#00c3ff] text-white">
                  <RocketOutlined className="text-2xl" />
                </div>
                <div>
                  <span className="text-white font-semibold group-hover:text-[#9ED0FA]">
                    Atlas Cargos Industries
                  </span>
                  <p className="text-sm text-gray-400 mt-0.5">
                    Nuestra org en RSI
                  </p>
                </div>
              </Link>

              {/* Código de referido */}
              <Link
                href="https://robertsspaceindustries.com/en/enlist?referral=STAR-5HYJ-THXD"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-4 rounded-xl border border-[#143A52] bg-[#071421] p-5 no-underline transition-all hover:border-[#f5a623] hover:bg-[#0c1f33] sm:col-span-2 lg:col-span-1"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#f5a623] text-white">
                  <GiftOutlined className="text-2xl" />
                </div>
                <div>
                  <span className="text-white font-semibold group-hover:text-[#9ED0FA]">
                    ¿Nuevo en Star Citizen?
                  </span>
                  <p className="text-sm text-gray-400 mt-0.5">
                    Usa nuestro código de referido y gana 5.000 UEC
                  </p>
                </div>
              </Link>
            </div>
          </section>

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
