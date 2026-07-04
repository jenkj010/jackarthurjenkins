import PixelText from "./PixelText";
import Stars from "./Stars";

/* Full-screen hero: boot sequence, then the launchpad below it. */
export default function Hero() {
  return (
    <header className="hero compact">
      <Stars count={20} />

      <PixelText text="JAJ" label="JAJ" />

      <p className="hero-sub">Mission Control</p>
      <p className="hero-line">Tools and experiments.</p>

      <div className="boot" aria-hidden="true">
        <div className="boot-label">
          <span>Booting JAJ.OS</span>
          <span className="boot-status online">OK</span>
        </div>
        <div className="boot-bar"><div className="boot-fill" /></div>
      </div>

      <div className="after-boot">
        <p className="system-msg">
          System online. Select a destination.
          <span className="cursor" aria-hidden="true" />
        </p>
      </div>
    </header>
  );
}
