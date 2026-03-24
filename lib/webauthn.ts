export function bufferToBase64url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let str = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    str += String.fromCharCode(bytes[i]);
  }
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

export function base64urlToBuffer(base64url: string): ArrayBuffer {
  const padding = '='.repeat((4 - base64url.length % 4) % 4);
  const base64 = (base64url + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray.buffer;
}

export async function createBiometricLock(): Promise<boolean> {
  try {
    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);
    const userId = new Uint8Array(16);
    crypto.getRandomValues(userId);

    const cred = await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: { name: "Trackr App Lock", id: window.location.hostname },
        user: {
          id: userId,
          name: "localUser",
          displayName: "Local App Lock"
        },
        pubKeyCredParams: [{ type: "public-key", alg: -7 }, { type: "public-key", alg: -257 }],
        authenticatorSelection: { authenticatorAttachment: "platform", userVerification: "required" },
        timeout: 60000,
        attestation: "none"
      }
    }) as PublicKeyCredential;

    if (cred) {
      localStorage.setItem('trackr-app-lock', bufferToBase64url(cred.rawId));
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error creating passkey:", error);
    return false;
  }
}

export async function verifyBiometricLock(): Promise<boolean> {
  const idBase64 = localStorage.getItem('trackr-app-lock');
  if (!idBase64) return true; // Not locked

  try {
    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);

    const cred = await navigator.credentials.get({
      publicKey: {
        challenge,
        allowCredentials: [{
          id: base64urlToBuffer(idBase64),
          type: "public-key",
          transports: ["internal"]
        }],
        userVerification: "required",
        timeout: 60000
      }
    });

    return !!cred;
  } catch (error) {
    console.error("Error verifying passkey:", error);
    return false;
  }
}

export function disableBiometricLock() {
  localStorage.removeItem('trackr-app-lock');
}

export function isBiometricLockEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('trackr-app-lock');
}
