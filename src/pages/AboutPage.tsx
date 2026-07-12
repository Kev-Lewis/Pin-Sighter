// The About page — version + author. First page lifted out of App.tsx into
// src/pages/. The app version string lives here since this is the only place
// it's shown; bump it when releasing.

const appVersion = "1.1.1";

export function AboutPage() {
  return (
    <>
      <h2>About Pin-Sighter</h2>

      <section className="about-grid simple-about-grid">
        <article className="about-card">
          <h3>Version</h3>
          <p>{appVersion}</p>
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
