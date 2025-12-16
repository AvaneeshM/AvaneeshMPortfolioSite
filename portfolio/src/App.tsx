import { useMemo } from 'react'
import './App.css'
import { ChatbotWidget } from './components/ChatbotWidget'
import { resume } from './data/resume'

function App() {
  const year = useMemo(() => new Date().getFullYear(), [])

  return (
    <div className="app">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Jump to top">
          <span className="brandMark" aria-hidden="true">
            ⬡
          </span>
          <span className="brandText">{resume.basics.name}</span>
        </a>

        <nav className="nav">
          <a href="#about">About</a>
          <a href="#skills">Skills</a>
          <a href="#projects">Projects</a>
          <a href="#experience">Experience</a>
          <a href="#contact">Contact</a>
        </nav>

        <div className="topbarCtas">
          <a className="btn btnGhost" href="#contact">
            Let’s talk
          </a>
          <a className="btn btnPrimary" href={resume.basics.links.resumeUrl} target="_blank" rel="noreferrer">
            View Resume
          </a>
        </div>
      </header>

      <main id="top" className="container">
        <section className="hero" aria-label="Hero">
          <div className="heroLeft">
            <p className="kicker">{resume.basics.title}</p>
            <h1 className="heroTitle">
              Building clean, high-impact products with <span className="gradientText">great UX</span>.
            </h1>
            <p className="heroSubtitle">{resume.basics.summary}</p>

            <div className="heroCtas">
              <a className="btn btnPrimary" href="#projects">
                See Projects
              </a>
              <a className="btn btnGhost" href={`mailto:${resume.basics.email}`}>
                Email Me
              </a>
            </div>

            <div className="heroMeta">
              <span className="metaPill">{resume.basics.location}</span>
              <span className="metaPill">{resume.basics.availability}</span>
            </div>
          </div>

          <div className="heroRight" aria-label="Quick facts">
            <div className="card">
              <h2 className="cardTitle">At a glance</h2>
              <ul className="facts">
                {resume.highlights.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
              <div className="linksRow">
                {resume.basics.links.github && (
                  <a className="linkChip" href={resume.basics.links.github} target="_blank" rel="noreferrer">
                    GitHub
                  </a>
                )}
                {resume.basics.links.linkedin && (
                  <a className="linkChip" href={resume.basics.links.linkedin} target="_blank" rel="noreferrer">
                    LinkedIn
                  </a>
                )}
                {resume.basics.links.website && (
                  <a className="linkChip" href={resume.basics.links.website} target="_blank" rel="noreferrer">
                    Website
                  </a>
                )}
              </div>
            </div>
          </div>
        </section>

        <section id="about" className="section">
          <div className="sectionHeader">
            <h2>About</h2>
            <p>{resume.about.tagline}</p>
          </div>
          <div className="grid2">
            <div className="card">
              <h3 className="cardTitle">Bio</h3>
              <p className="muted">{resume.about.bio}</p>
            </div>
            <div className="card">
              <h3 className="cardTitle">What I’m looking for</h3>
              <p className="muted">{resume.about.goals}</p>
            </div>
          </div>
        </section>

        <section id="skills" className="section">
          <div className="sectionHeader">
            <h2>Skills</h2>
            <p>Tools and technologies I use to ship.</p>
          </div>
          <div className="grid3">
            {resume.skills.map((group) => (
              <div className="card" key={group.category}>
                <h3 className="cardTitle">{group.category}</h3>
                <div className="tags">
                  {group.items.map((s) => (
                    <span className="tag" key={s}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="projects" className="section">
          <div className="sectionHeader">
            <h2>Projects</h2>
            <p>Selected work (swap these with your real projects).</p>
          </div>
          <div className="grid3">
            {resume.projects.map((p) => (
              <article className="card" key={p.name}>
                <div className="projectTop">
                  <h3 className="cardTitle">{p.name}</h3>
                  <div className="projectLinks">
                    {p.links.demo && (
                      <a className="linkChip" href={p.links.demo} target="_blank" rel="noreferrer">
                        Demo
                      </a>
                    )}
                    {p.links.repo && (
                      <a className="linkChip" href={p.links.repo} target="_blank" rel="noreferrer">
                        Repo
                      </a>
                    )}
                  </div>
                </div>
                <p className="muted">{p.description}</p>
                <div className="tags">
                  {p.tech.map((t) => (
                    <span className="tag" key={t}>
                      {t}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="experience" className="section">
          <div className="sectionHeader">
            <h2>Experience</h2>
            <p>Roles, impact, and what I delivered.</p>
          </div>
          <div className="stack">
            {resume.experience.map((job) => (
              <div className="card" key={`${job.company}-${job.role}`}>
                <div className="jobHeader">
                  <div>
                    <h3 className="cardTitle">{job.role}</h3>
                    <p className="muted">
                      <strong>{job.company}</strong> • {job.location}
                    </p>
                  </div>
                  <span className="metaPill">{job.dates}</span>
                </div>
                <ul className="bullets">
                  {job.highlights.map((h) => (
                    <li key={h}>{h}</li>
                  ))}
                </ul>
                <div className="tags">
                  {job.tech.map((t) => (
                    <span className="tag" key={t}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="contact" className="section">
          <div className="sectionHeader">
            <h2>Contact</h2>
            <p>Want to collaborate or hire me? Reach out.</p>
          </div>
          <div className="grid2">
            <div className="card">
              <h3 className="cardTitle">Email</h3>
              <p className="muted">
                <a href={`mailto:${resume.basics.email}`}>{resume.basics.email}</a>
              </p>
            </div>
            <div className="card">
              <h3 className="cardTitle">Social</h3>
              <div className="linksRow">
                {resume.basics.links.linkedin && (
                  <a className="linkChip" href={resume.basics.links.linkedin} target="_blank" rel="noreferrer">
                    LinkedIn
                  </a>
                )}
                {resume.basics.links.github && (
                  <a className="linkChip" href={resume.basics.links.github} target="_blank" rel="noreferrer">
                    GitHub
                  </a>
                )}
              </div>
            </div>
          </div>
        </section>

        <footer className="footer">
          <p className="muted">
            © {year} {resume.basics.name}. Built with React.
          </p>
        </footer>
      </main>

      <ChatbotWidget resume={resume} />
    </div>
  )
}

export default App
