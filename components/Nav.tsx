import Link from "next/link";

/* Sticky retro command bar, shared by every page. */
const LINKS = [
  { href: "/", label: "Home" },
  { href: "/draft", label: "Draft Hub" },
  { href: "/tools", label: "Tools" },
  { href: "/experiments", label: "Experiments" },
];

export default function Nav() {
  return (
    <nav className="nav" aria-label="Main">
      <div className="container nav-inner">
        <Link href="/" className="nav-brand">JAJ</Link>
        {LINKS.map((l) => (
          <Link key={l.label} href={l.href} className="nav-link">
            {l.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
