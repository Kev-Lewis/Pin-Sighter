// The About page — version + author. First page lifted out of App.tsx into
// src/pages/. The version string comes from the shared src/version.ts module
// (also used by the sidebar footer) so there's one place to bump on release.

import { APP_VERSION } from "../version";

export function AboutPage() {
  return (
    <>
      <h2>About Pin-Sighter</h2>

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
      </section>
    </>
  );
}
