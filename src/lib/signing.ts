// Ed25519 signing keys and the login-binding proofs, from tweetnacl only: no WebCrypto, so it works on
// plain http. Shared by the browser (opaque-client.ts) and the server (auth.ts).
import nacl from "tweetnacl"

const utf8 = (s: string) => new TextEncoder().encode(s)

export const b64url = (bytes: Uint8Array) =>
  // Purpose: unpadded base64url text of some bytes
  btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")

export const unb64url = (text: string) =>
  // Purpose: the bytes of unpadded base64url text
  Uint8Array.from(atob(text.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0))

export const signingKey = () => {
  // Purpose: make an Ed25519 key pair: the public half as a JWK (the shape the session schema stores), the secret half as base64url
  const { publicKey, secretKey } = nacl.sign.keyPair()
  return {
    jwk: {
      kty: "OKP",
      crv: "Ed25519",
      x: b64url(publicKey),
      use: "sig",
      kid: b64url(nacl.randomBytes(12)),
    },
    secretKey: b64url(secretKey),
  }
}

const hmac = (key: Uint8Array, message: Uint8Array) => {
  // Purpose: HMAC-SHA512 (RFC 2104, 128-byte blocks) built on nacl.hash, since tweetnacl has no MAC of its own
  const block = new Uint8Array(128).fill(0)
  block.set(key.length > 128 ? nacl.hash(key) : key)
  const pad = (byte: number) => block.map(b => b ^ byte)
  return nacl.hash(Uint8Array.from([...pad(0x5c), ...nacl.hash(Uint8Array.from([...pad(0x36), ...message]))]))
}

const proofFor = (sessionKey: string, text: string) =>
  // Purpose: HMAC of some text under OPAQUE's session key, base64url; both sides compute the same
  b64url(hmac(utf8(sessionKey), utf8(text)))

export const clientProof = (sessionKey: string, x: string) =>
  // Purpose: the proof that the browser's public key `x` belongs to this login
  proofFor(sessionKey, `client.${x}`)

export const serverProof = (sessionKey: string, x: string) =>
  // Purpose: the proof that the server's public key `x` belongs to this login
  proofFor(sessionKey, `server.${x}`)
