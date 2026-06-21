import {
  initializeApp,
  getApps,
  cert,
  ServiceAccount,
} from "firebase-admin/app";

export default function initFirebase() {
  if (!getApps().length) {
    initializeApp({
      credential: cert({
        type: process.env.NEXT_PRIVATE_TYPE,
        project_id: process.env.NEXT_PRIVATE_PROJECT_ID,
        private_key_id: process.env.NEXT_PRIVATE_PRIVATE_KEY_ID,
        private_key: process.env.NEXT_PRIVATE_PRIVATE_KEY,
        client_email: process.env.NEXT_PRIVATE_CLIENT_EMAIL,
        client_id: process.env.NEXT_PRIVATE_CLIENT_ID,
        auth_uri: process.env.NEXT_PRIVATE_AUTH_URI,
        token_uri: process.env.NEXT_PRIVATE_TOKEN_URI,
        auth_provider_x509_cert_url:
          process.env.NEXT_PRIVATE_AUTH_PROVIDER_X509_CERT_URL,
        client_x509_cert_url: process.env.NEXT_PRIVATE_CLIENT_X509_CERT_URL,
        universe_domain: process.env.NEXT_PRIVATE_UNIVERSE_DOMAIN,
      } as ServiceAccount),
    });
  }
}
