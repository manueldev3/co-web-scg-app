/** Respuesta del endpoint GET /commodities */
export interface ApiTerminal {
  id: number;
  name: string;
}

export interface TerminalOption {
  id: number;
  name: string;
  location: string;
}
