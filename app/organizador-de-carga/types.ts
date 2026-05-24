import { CommodityOption } from "../mercancia/types";
import { TerminalOption } from "../terminales/types";

export interface OptimizedDestination {
  terminal: TerminalOption;
  commodity: CommodityOption;
  scuCount: number;
}
