// Script de un solo uso para conceder/quitar el custom claim `admin` a un
// usuario de Firebase Authentication (no se puede hacer desde la consola web).
//
// Uso (Node 20.6+, carga las credenciales desde .env.local):
//   node --env-file=.env.local scripts/set-admin-claim.mjs correo@ejemplo.com
//   node --env-file=.env.local scripts/set-admin-claim.mjs correo@ejemplo.com --revoke
//
// Reutiliza las mismas variables de entorno NEXT_PRIVATE_* que usa
// lib/firebase/admin.ts. Tras ejecutarlo, el usuario debe volver a iniciar
// sesión (o refrescar su token) para que el claim aparezca en el ID token.

import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const email = process.argv[2];
const revoke = process.argv.includes("--revoke");

if (!email) {
  console.error(
    "Falta el correo. Uso: node --env-file=.env.local scripts/set-admin-claim.mjs correo@ejemplo.com [--revoke]",
  );
  process.exit(1);
}

if (!getApps().length) {
  initializeApp({
    credential: cert({
      type: process.env.NEXT_PRIVATE_TYPE,
      project_id: process.env.NEXT_PRIVATE_PROJECT_ID,
      private_key_id: process.env.NEXT_PRIVATE_PRIVATE_KEY_ID,
      // En .env los saltos de línea suelen venir escapados como \n.
      private_key: process.env.NEXT_PRIVATE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      client_email: process.env.NEXT_PRIVATE_CLIENT_EMAIL,
      client_id: process.env.NEXT_PRIVATE_CLIENT_ID,
      auth_uri: process.env.NEXT_PRIVATE_AUTH_URI,
      token_uri: process.env.NEXT_PRIVATE_TOKEN_URI,
      auth_provider_x509_cert_url:
        process.env.NEXT_PRIVATE_AUTH_PROVIDER_X509_CERT_URL,
      client_x509_cert_url: process.env.NEXT_PRIVATE_CLIENT_X509_CERT_URL,
      universe_domain: process.env.NEXT_PRIVATE_UNIVERSE_DOMAIN,
    }),
  });
}

const auth = getAuth();

try {
  const user = await auth.getUserByEmail(email);
  // Conserva otros claims existentes y solo cambia `admin`.
  const claims = { ...(user.customClaims ?? {}), admin: !revoke };
  if (revoke) delete claims.admin;

  await auth.setCustomUserClaims(user.uid, claims);

  console.log(
    `OK: claim admin=${!revoke} aplicado a ${email} (uid: ${user.uid}).`,
  );
  console.log(
    "El usuario debe cerrar sesión y volver a entrar (o llamar a getIdToken(true)) para que el cambio surta efecto.",
  );
  process.exit(0);
} catch (err) {
  console.error("Error:", err?.message ?? err);
  process.exit(1);
}
