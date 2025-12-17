import { useMemo, useState, useEffect, useRef } from "react";
import "./App.css";
import { ChatbotWidget } from "./components/ChatbotWidget";
import { resume } from "./data/resume";
import profilePic from "./assets/ProfilePic2.jpg";
import waterlooLogo from "./assets/university-of-waterloo-seal-logo-png_seeklogo-443174.png";
import ottawaLogo from "./assets/university-of-ottawa-vector-logo.png";

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

function SkillsCarousel({
  skills,
}: {
  skills: Array<{ category: string; items: string[] }>;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [startX, setStartX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % skills.length);
    }, 12000); // Change card every 12 seconds

    return () => clearInterval(interval);
  }, [skills.length]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        setCurrentIndex((prev) => (prev - 1 + skills.length) % skills.length);
      } else if (event.key === "ArrowRight") {
        setCurrentIndex((prev) => (prev + 1) % skills.length);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [skills.length]);

  const handleStart = (clientX: number) => {
    setStartX(clientX);
    setIsDragging(true);
  };

  const handleMove = (_clientX: number) => {
    if (!isDragging) return;
    // Optional: Add visual feedback during drag
  };

  const handleEnd = (clientX: number) => {
    if (!isDragging) return;

    const diffX = startX - clientX;
    const threshold = 50; // Minimum swipe distance

    if (Math.abs(diffX) > threshold) {
      if (diffX > 0) {
        // Swiped left - go to next
        setCurrentIndex((prev) => (prev + 1) % skills.length);
      } else {
        // Swiped right - go to previous
        setCurrentIndex((prev) => (prev - 1 + skills.length) % skills.length);
      }
    }

    setIsDragging(false);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <div className="skillsCarousel">
      <div
        className="carouselContainer"
        ref={carouselRef}
        onMouseDown={(e) => handleStart(e.clientX)}
        onMouseMove={(e) => handleMove(e.clientX)}
        onMouseUp={(e) => handleEnd(e.clientX)}
        onMouseLeave={(e) => handleEnd(e.clientX)}
        onTouchStart={(e) => handleStart(e.touches[0].clientX)}
        onTouchMove={(e) => handleMove(e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (e.changedTouches[0]) {
            handleEnd(e.changedTouches[0].clientX);
          }
        }}
        style={{ cursor: isDragging ? "grabbing" : "grab" }}
      >
        <div
          className="carouselTrack"
          style={{
            transform: `translateX(-${currentIndex * 100}%)`,
            transition: isDragging ? "none" : "transform 0.5s ease-in-out",
          }}
        >
          {skills.map((group, index) => (
            <div key={group.category} className="carouselSlide">
              <div className={`card skillCard skillCard-${index}`}>
                <h3 className="cardTitle">{group.category}</h3>
                <div className="tags">
                  {group.items.map((s) => (
                    <span className="tag" key={s}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="carouselIndicators">
        {skills.map((_, index) => (
          <button
            key={index}
            className={`carouselDot ${index === currentIndex ? "active" : ""}`}
            onClick={() => goToSlide(index)}
            aria-label={`Go to ${skills[index].category}`}
          />
        ))}
      </div>
    </div>
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
                <a className="btn btnPrimary" href="#experience">
                  Experience
                </a>
                <a className="btn btnPrimary" href="#projects">
                  See Projects
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
                <a
                  className="linkChip"
                  href="https://github.com/AvaneeshM"
                  target="_blank"
                  rel="noreferrer"
                >
                  <svg
                    className="socialIcon"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    width="18"
                    height="18"
                  >
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                  GitHub
                </a>
                <a
                  className="linkChip"
                  href="https://www.linkedin.com/in/avaneesh-madaram/"
                  target="_blank"
                  rel="noreferrer"
                >
                  <svg
                    className="socialIcon"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    width="18"
                    height="18"
                  >
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                  LinkedIn
                </a>
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
              <h3 className="cardTitle">Education</h3>
              <div className="educationList">
                {resume.highlights.map((h) => {
                  // Parse the education string to extract degree and university
                  const match = h.match(/^(.+?)\s*\((.+?)\)$/);
                  if (match) {
                    const [, degree, university] = match;
                    // Get university logo
                    const getUniversityLogo = (uni: string) => {
                      if (uni.toLowerCase().includes("waterloo")) {
                        return waterlooLogo;
                      } else if (uni.toLowerCase().includes("ottawa")) {
                        return ottawaLogo;
                      }
                      return null;
                    };
                    const logoPath = getUniversityLogo(university);
                    return (
                      <div key={h} className="educationItem">
                        <div className="educationIcon">
                          {logoPath ? (
                            <img
                              src={logoPath}
                              alt={`${university} logo`}
                              className="universityLogo"
                            />
                          ) : (
                            <span>🎓</span>
                          )}
                        </div>
                        <div className="educationContent">
                          <div className="educationDegree">{degree}</div>
                          <div className="educationUniversity">
                            {university}
                          </div>
                        </div>
                      </div>
                    );
                  }
                  // Fallback if parsing fails
                  return (
                    <div key={h} className="educationItem">
                      <div className="educationIcon">🎓</div>
                      <div className="educationContent">
                        <div className="educationDegree">{h}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            {/* <div className="card">
              <h3 className="cardTitle">What I'm looking for</h3>
              <p className="muted">{resume.about.goals}</p>
            </div> */}
            <div className="card">
              <h3 className="cardTitle">Bio</h3>
              <p className="muted">{resume.about.bio}</p>
            </div>
          </div>
        </section>

        <section id="skills" className="section">
          <div className="sectionHeader">
            <h2>Skills</h2>
          </div>
          <SkillsCarousel skills={resume.skills} />
        </section>

        <section id="experience" className="section">
          <div className="sectionHeader">
            <h2>Experience</h2>
          </div>
          <div className="experienceGrid">
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
                <div className="experienceHighlights">
                  {job.highlights.map((h) => (
                    <p key={h} className="experienceItem">
                      {h}
                    </p>
                  ))}
                </div>
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
                <a
                  className="linkChip"
                  href="https://www.linkedin.com/in/avaneesh-madaram/"
                  target="_blank"
                  rel="noreferrer"
                >
                  <svg
                    className="socialIcon"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    width="18"
                    height="18"
                  >
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                  LinkedIn
                </a>
                <a
                  className="linkChip"
                  href="https://github.com/AvaneeshM"
                  target="_blank"
                  rel="noreferrer"
                >
                  <svg
                    className="socialIcon"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    width="18"
                    height="18"
                  >
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                  GitHub
                </a>
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
