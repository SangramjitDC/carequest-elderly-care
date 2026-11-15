import Link from "next/link";

export default function AuthErrorPage() {
  return <main className="portal-content page-stack"><h1>We couldn’t complete that request</h1><p>The link may have expired, or the connection may have been interrupted. Please sign in again. For a new confirmation link, repeat signup with the same details.</p><Link className="button button-primary" href="/login">Return to sign in</Link></main>;
}
