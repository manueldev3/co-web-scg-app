"use client";

interface Commodity {
  id: number;
  name: string;
  price: number;
  demand: number;
  supply: number;
}

const Comercio = ({ data }: { data: Commodity[] }) => {
  return (
    <div>
      <main>
        <h1>Comercio</h1>
        <ul>
          {data.map((commodity) => (
            <li key={commodity.id}>
              <h2>{commodity.name}</h2>
              <p>Price: {commodity.price}</p>
              <p>Demand: {commodity.demand}</p>
              <p>Supply: {commodity.supply}</p>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
};

export default Comercio;
