import { useEffect, useRef, useState } from 'react';

interface GoogleCredentialResponse {
  credential: string;
}

interface GoogleIdentityApi {
  initialize: (options: { client_id: string; callback: (response: GoogleCredentialResponse) => void }) => void;
  renderButton: (element: HTMLElement, options: Record<string, string>) => void;
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleIdentityApi } };
  }
}

interface GoogleSignInButtonProps {
  onCredential: (credential: string) => void;
}

export default function GoogleSignInButton({ onCredential }: GoogleSignInButtonProps) {
  const container = useRef<HTMLDivElement>(null);
  const onCredentialRef = useRef(onCredential);
  onCredentialRef.current = onCredential;
  const [ready, setReady] = useState(false);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!clientId) return;
    let script = document.querySelector<HTMLScriptElement>('script[data-google-identity]');
    const initialize = () => {
      if (!window.google?.accounts.id || !container.current) return;
      window.google.accounts.id.initialize({ client_id: clientId, callback: (result) => {
        if (result.credential) onCredentialRef.current(result.credential);
      } });
      window.google.accounts.id.renderButton(container.current, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'rectangular',
        width: '360',
      });
      setReady(true);
    };
    if (window.google?.accounts.id) {
      initialize();
      return;
    }
    if (!script) {
      script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.dataset.googleIdentity = 'true';
      script.onload = initialize;
      document.head.appendChild(script);
    } else {
      script.addEventListener('load', initialize, { once: true });
    }
  }, [clientId]);

  if (!clientId) {
    return <p className="rounded-lg border border-line bg-canvas px-3 py-2 text-center text-xs text-muted">Google sign-in will be enabled when the OAuth Client ID is configured.</p>;
  }
  return <div aria-label="Continue with Google" className={`flex min-h-10 justify-center ${ready ? '' : 'animate-pulse'}`} ref={container} />;
}
