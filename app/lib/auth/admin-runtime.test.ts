import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";

describe("Firebase Admin runtime compatibility", () => {
  it("loads Auth and resolves a signing key without require(ESM) support", () => {
    const result = execFileSync(process.execPath, ["--no-experimental-require-module", "-e", `
      const assert = require('node:assert/strict');
      const { createRequire } = require('node:module');
      const { generateKeyPairSync, createSign, createVerify } = require('node:crypto');
      assert.equal(typeof require('firebase-admin/auth').getAuth, 'function');
      const adminRequire = createRequire(require.resolve('firebase-admin/auth'));
      const jwks = adminRequire('jwks-rsa');
      const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
      const jwk = { ...publicKey.export({ format: 'jwk' }), kid: 'test-key', use: 'sig', alg: 'RS256' };
      const client = jwks({ jwksUri: 'https://invalid.example.test/jwks', getKeysInterceptor: async () => [jwk] });
      client.getSigningKey('test-key').then(key => {
        const signature = createSign('RSA-SHA256').update('test payload').sign(privateKey);
        assert.equal(createVerify('RSA-SHA256').update('test payload').verify(key.getPublicKey(), signature), true);
        assert.equal(createVerify('RSA-SHA256').update('tampered payload').verify(key.getPublicKey(), signature), false);
        console.log('Auth runtime and signature verification passed');
      }).catch(() => process.exit(1));
    `], { encoding: "utf8", timeout: 10_000 });
    expect(result).toContain("Auth runtime and signature verification passed");
  });
});
