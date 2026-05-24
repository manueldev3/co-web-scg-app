import { fetchCommodities } from "../mercancia/uex-api";
import { fetchTerminals } from "../terminales/uex-api";
import OrganizadorDeCargaClient, {
  OrganizadorDeCargaProps,
} from "./OrganizadorDeCargaClient";

export default async function OrganizadorDeCargaPage() {
  const [commodities, terminals] = await Promise.all([
    fetchCommodities(),
    fetchTerminals(),
  ]);

  const commoditiesList: OrganizadorDeCargaProps["commodities"] =
    commodities.map((item) => ({
      id: item.id,
      name: item.name,
      slug: item.name.toLowerCase().replace(/\s+/g, "-"),
    }));

  const terminalsList: OrganizadorDeCargaProps["terminals"] = terminals.map(
    (item) => ({
      id: item.id,
      name: item.name,
      location: item.name,
    }),
  );

  return (
    <OrganizadorDeCargaClient
      commodities={commoditiesList}
      terminals={terminalsList}
    />
  );
}
