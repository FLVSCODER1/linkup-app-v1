# Firebase Admin Auth runtime compatibility

Production runtime logs on November 24, 2026 showed `/api/auth/profile` failing
before its handler ran: `jwks-rsa@4.1.0` synchronously required ESM-only
`jose@6`, producing `ERR_REQUIRE_ESM`. This is unrelated to profile migration
or Firestore read rules.

Firebase Admin remains on 14.5.1 with the security fixes from PR #24. A narrowly
scoped npm override selects `jwks-rsa@3.2.2` only beneath Firebase Admin. That
version provides the signing-key APIs used by Admin without requiring Node's
experimental CommonJS-to-ESM interoperability. Token/signature verification is
not disabled and no production settings or credentials are changed.

The runtime regression test launches Node with `--no-experimental-require-module`,
loads Admin Auth and resolves a locally generated RSA JWK. It verifies a real
signature and rejects a tampered payload without contacting Firebase or reading
student data. The production-mode smoke suite additionally calls the profile
endpoint without credentials and expects 401, catching module-load failures
that a successful compilation alone cannot detect.

Remove this temporary override only after an upstream-compatible replacement
passes the same regression and deployed preview smoke check. An authenticated
profile lookup still needs a test account; the anonymous 401 is not proof of
successful login.
