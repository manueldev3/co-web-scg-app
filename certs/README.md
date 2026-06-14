# Local extra CA certificate (`extra-ca.pem`)

The `dev` script sets `NODE_EXTRA_CA_CERTS=./certs/extra-ca.pem` so Node's
`fetch` (used by the server-side UEX Corp API client) can verify HTTPS when a
local TLS-inspection product (antivirus / corporate proxy such as **Norton**,
Kaspersky, Zscaler, …) re-signs outbound TLS with its own root CA.

Without this, server-side `fetch` to `https://api.uexcorp.uk` fails with
`UNABLE_TO_VERIFY_LEAF_SIGNATURE` and the page shows "No se pudieron cargar los
datos de mercado" — even though the API is up (a browser / PowerShell works
because Windows already trusts the interceptor's root).

`extra-ca.pem` is **machine-specific and git-ignored** (`*.pem`). It does not
exist on a fresh clone; if you are not behind a TLS interceptor you can ignore
the harmless "could not load extra CA" warning, or remove the
`NODE_EXTRA_CA_CERTS=...` prefix from the `dev` script.

## Regenerate it on a machine behind a TLS interceptor (Windows / PowerShell)

```powershell
# Replace "*Norton*" with your interceptor's name if different.
$cert = Get-ChildItem Cert:\LocalMachine\Root, Cert:\CurrentUser\Root |
  Where-Object { $_.Subject -like "*Norton*" } | Select-Object -First 1
$b64 = [Convert]::ToBase64String($cert.RawData, 'InsertLineBreaks')
"-----BEGIN CERTIFICATE-----`n$b64`n-----END CERTIFICATE-----`n" |
  Set-Content -Path certs\extra-ca.pem -NoNewline -Encoding ascii
```

Verify:

```powershell
$env:NODE_EXTRA_CA_CERTS="$PWD\certs\extra-ca.pem"
node -e "fetch('https://api.uexcorp.uk/2.0/vehicles').then(r=>console.log(r.status))"
# expected: 200
```

## Alternatives

- Disable HTTPS/SSL scanning in your antivirus for `api.uexcorp.uk` (then no
  cert export is needed).
- **Never** use `NODE_TLS_REJECT_UNAUTHORIZED=0` — it disables TLS verification
  globally and is unsafe.
