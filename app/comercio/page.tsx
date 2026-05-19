"use client";

import { useEffect, useState } from "react";

const ComercioPage = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setLoading(false);
    }, 3000);
  }, []);

  if (loading) {
    return <div>Cargando...</div>;
  }

  return <div></div>;
};

export default ComercioPage;
