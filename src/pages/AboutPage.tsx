// The About page — what Pin-Sighter is, version + author, and quick links.
// First page lifted out of App.tsx into src/pages/. The version string comes
// from the shared src/version.ts module (also used by the sidebar footer) so
// there's one place to bump on release.

import { APP_VERSION } from "../version";

export function AboutPage() {
  return (
    <div className="about-page">
      <h2>About Pin-Sighter</h2>

      <p className="about-lead">
        Pin-Sighter is a local-first bowling analytics app. Log your games frame
        by frame across open, league, and tournament sessions, then dig into
        averages, strike and spare trends, spare-leave conversions, targeting
        and board progression, and saved scorecards — all on one device.
      </p>

      <section className="about-grid simple-about-grid">
        <article className="about-card">
          <h3>Version</h3>
          <p>{APP_VERSION}</p>
        </article>

        <article className="about-card">
          <h3>Created By</h3>
          <p>
            <a
              href="https://kevinlewis.net/"
              target="_blank"
              rel="noreferrer"
            >
              Kevin Lewis
            </a>
          </p>
        </article>

        <article className="about-card">
          <h3>Your Data</h3>
          <p>
            Local-first — everything stays on this device unless you export a
            backup.
          </p>
        </article>
      </section>

      <section className="about-links-section">
        <h3 className="about-links-heading">Links</h3>
        <div className="about-links">
          <a
            className="resource-link-pill"
            href="https://pin-sighter.kevinlewis.net/"
            target="_blank"
            rel="noreferrer"
          >
            <span className="resource-link-label">Live app</span>
            <span className="resource-link-arrow" aria-hidden="true">↗</span>
          </a>

          <a
            className="resource-link-pill"
            href="https://kevinlewis.net/pin-sighter"
            target="_blank"
            rel="noreferrer"
          >
            <span className="resource-link-label">Website</span>
            <span className="resource-link-arrow" aria-hidden="true">↗</span>
          </a>

          <a
            className="resource-link-pill"
            href="https://github.com/Kev-Lewis/Pin-Sighter"
            target="_blank"
            rel="noreferrer"
          >
            <span className="resource-link-label">Source on GitHub</span>
            <span className="resource-link-arrow" aria-hidden="true">↗</span>
          </a>
        </div>
      </section>
    </div>
  );
}
