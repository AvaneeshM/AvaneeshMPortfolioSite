import { useMemo, useState, useEffect } from "react";
import "./App.css";
import { ChatbotWidget } from "./components/ChatbotWidget";
import { resume } from "./data/resume";
import profilePic from "./assets/ProfilePic2.jpg";

function TypingAnimation() {
  const titles = [
    "ML Engineer",
    "Data Scientist",
    "Software Dev",
    "Full-Stack Dev",
  ];
  const [currentTitleIndex, setCurrentTitleIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [typingSpeed, setTypingSpeed] = useState(100);

  useEffect(() => {
    const currentTitle = titles[currentTitleIndex];

    if (!isDeleting && displayedText === currentTitle) {
      // Finished typing, wait then start deleting
      setTimeout(() => setIsDeleting(true), 2000);
    } else if (isDeleting && displayedText === "") {
      // Finished deleting, move to next title
      setIsDeleting(false);
      setCurrentTitleIndex((prev) => (prev + 1) % titles.length);
      setTypingSpeed(50); // Faster deletion
    } else if (isDeleting) {
      // Deleting characters
      const timeout = setTimeout(() => {
        setDisplayedText((prev) => prev.slice(0, -1));
      }, typingSpeed);
      return () => clearTimeout(timeout);
    } else {
      // Typing characters
      const timeout = setTimeout(() => {
        setDisplayedText((prev) => currentTitle.slice(0, prev.length + 1));
      }, typingSpeed);
      return () => clearTimeout(timeout);
    }
  }, [displayedText, isDeleting, currentTitleIndex, titles, typingSpeed]);

  useEffect(() => {
    // Reset typing speed when starting to type
    if (!isDeleting) {
      setTypingSpeed(100);
    }
  }, [isDeleting]);

  return (
    <span className="gradientText">
      {displayedText}
      <span className="typingCursor">|</span>
    </span>
  );
}

function App() {
  const year = useMemo(() => new Date().getFullYear(), []);

  return (
    <div className="app">
      <header className="topbar">
        <nav className="nav">
          <a href="#about">About</a>
          <a href="#skills">Skills</a>
          <a href="#experience">Experience</a>
          <a href="#projects">Projects</a>
          <a href="#contact">Contact</a>
        </nav>
      </header>

      <main id="top" className="container">
        <section className="hero" aria-label="Hero">
          <h1 className="heroHeader">Hello! My Name is Avaneesh</h1>

          <div className="heroImage">
            <img
              src={profilePic}
              alt={resume.basics.name}
              className="portfolioPicture"
            />
          </div>

          <div className="heroMeta">
            <span className="metaPill">{resume.basics.location}</span>
            <span className="metaPill">{resume.basics.availability}</span>
          </div>

          <div className="heroContent">
            <div className="heroText">
              <p className="kicker">Who Am I? My Roles Have Been:</p>
              <h2 className="heroTitle">
                <TypingAnimation />
              </h2>
              <p className="heroSubtitle">{resume.basics.summary}</p>

              <div className="heroCtas">
                <a className="btn btnPrimary" href="#projects">
                  See Projects
                </a>
                <a className="btn btnPrimary" href="#experience">
                  Experience
                </a>
                <a
                  className="btn btnPrimary"
                  href={`mailto:${resume.basics.email}`}
                >
                  Email Me
                </a>
              </div>
            </div>

            <div className="heroCard" aria-label="Links">
              <div className="heroLinks">
                {resume.basics.links.github && (
                  <a
                    className="linkChip"
                    href={resume.basics.links.github}
                    target="_blank"
                    rel="noreferrer"
                  >
                    GitHub
                  </a>
                )}
                {resume.basics.links.linkedin && (
                  <a
                    className="linkChip"
                    href={resume.basics.links.linkedin}
                    target="_blank"
                    rel="noreferrer"
                  >
                    LinkedIn
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
          <div className="grid3">
            <div className="card">
              <h3 className="cardTitle">Bio</h3>
              <p className="muted">{resume.about.bio}</p>
            </div>
            <div className="card">
              <h3 className="cardTitle">What I'm looking for</h3>
              <p className="muted">{resume.about.goals}</p>
            </div>
            <div className="card">
              <h3 className="cardTitle">Education</h3>
              <div className="educationList">
                {resume.highlights.map((h) => (
                  <p key={h} className="educationItem">
                    {h}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="skills" className="section">
          <div className="sectionHeader">
            <h2>Skills</h2>
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

        <section id="experience" className="section">
          <div className="sectionHeader">
            <h2>Experience</h2>
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

        <section id="projects" className="section">
          <div className="sectionHeader">
            <h2>Projects</h2>
          </div>
          <div className="grid3">
            {resume.projects.map((p) => (
              <article className="card" key={p.name}>
                <div className="projectTop">
                  <h3 className="cardTitle">{p.name}</h3>
                  <div className="projectLinks">
                    {p.links.demo && (
                      <a
                        className="linkChip"
                        href={p.links.demo}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Demo
                      </a>
                    )}
                    {p.links.repo && (
                      <a
                        className="linkChip"
                        href={p.links.repo}
                        target="_blank"
                        rel="noreferrer"
                      >
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

        <section id="contact" className="section">
          <div className="sectionHeader">
            <h2>Contact</h2>
          </div>
          <div className="grid2">
            <div className="card">
              <h3 className="cardTitle">Email</h3>
              <p className="muted">
                <a href={`mailto:${resume.basics.email}`}>
                  {resume.basics.email}
                </a>
              </p>
            </div>
            <div className="card">
              <h3 className="cardTitle">Social</h3>
              <div className="linksRow">
                {resume.basics.links.linkedin && (
                  <a
                    className="linkChip"
                    href={resume.basics.links.linkedin}
                    target="_blank"
                    rel="noreferrer"
                  >
                    LinkedIn
                  </a>
                )}
                {resume.basics.links.github && (
                  <a
                    className="linkChip"
                    href={resume.basics.links.github}
                    target="_blank"
                    rel="noreferrer"
                  >
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
  );
}

export default App;
