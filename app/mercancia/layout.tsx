import Mercancia from "./Mercancia";

export default function MercanciaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Mercancia />
      {children}
    </>
  );
}
