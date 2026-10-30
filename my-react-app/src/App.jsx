import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Link,
  NavLink,
  Route,
  Routes,
  useLocation,
  useParams,
} from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowDownToLine,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  Github,
  Linkedin,
  LoaderCircle,
  Menu,
  Search,
  ShieldCheck,
  Star,
  Trash2,
  X,
} from "lucide-react";
import apps from "./data/apps.json";

// Replace this one value with your GitHub profile URL.
const GITHUB_URL = "https://github.com/YOUR_USERNAME";
const STORAGE_KEY = "hero.io.installed.v1";
const AppContext = createContext(null);
const numberFormat = new Intl.NumberFormat("en", {
  notation: "compact",
  maximumFractionDigits: 1,
});
const compact = (value) => numberFormat.format(value);
const useApps = () => useContext(AppContext);

function readInstalled() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (!Array.isArray(saved)) return [];
    return [...new Set(saved.map((item) => item?.id))].filter((id) =>
      apps.some((app) => app.id === id),
    );
  } catch {
    return [];
  }
}

function AppProvider({ children }) {
  const [installedIds, setInstalledIds] = useState(readInstalled);
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Set());
  const installedRef = useRef(installedIds);
  const notify = (message, type = "success") => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((items) => [...items, { id, message, type }]);
    const timer = setTimeout(() => {
      setToasts((items) => items.filter((toast) => toast.id !== id));
      timers.current.delete(timer);
    }, 3800);
    timers.current.add(timer);
  };

  useEffect(() => {
    const sync = (event) => {
      if (event.key === STORAGE_KEY || event.key === null) {
        const ids = readInstalled();
        installedRef.current = ids;
        setInstalledIds(ids);
      }
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const updateInstallation = (app, install) => {
    const current = installedRef.current;
    if (install && current.includes(app.id)) return;
    const next = install
      ? [...current, app.id]
      : current.filter((id) => id !== app.id);
    try {
      // Store full app objects, so localStorage contains the installed apps.
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(next.map((id) => apps.find((item) => item.id === id))),
      );
      installedRef.current = next;
      setInstalledIds(next);
      notify(
        `${app.title} ${install ? "installed successfully!" : "uninstalled successfully."}`,
      );
    } catch {
      notify(
        "Could not save changes. Please allow browser storage and try again.",
        "error",
      );
    }
  };

  return (
    <AppContext.Provider value={{ installedIds, updateInstallation }}>
      {children}
      <div className="toast-stack" aria-live="polite" aria-atomic="false">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast ${toast.type}`}>
            {toast.type === "success" ? (
              <CheckCircle2 size={21} />
            ) : (
              <CircleAlert size={21} />
            )}
            <span>{toast.message}</span>
            <button
              aria-label="Dismiss notification"
              onClick={() =>
                setToasts((items) =>
                  items.filter((item) => item.id !== toast.id),
                )
              }
            >
              <X size={17} />
            </button>
          </div>
        ))}
      </div>
    </AppContext.Provider>
  );
}

function Brand() {
  return (
    <Link to="/" className="brand" aria-label="HERO.IO home">
      <img src="/asset/logo.png" alt="" />
      HERO.IO
    </Link>
  );
}

function Header() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => setOpen(false), [pathname]);
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Brand />
        <nav
          aria-label="Main navigation"
          className={open ? "main-nav open" : "main-nav"}
        >
          <NavLink to="/" end>
            Home
          </NavLink>
          <NavLink to="/apps">Apps</NavLink>
          <NavLink to="/installation">Installation</NavLink>
        </nav>
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noreferrer"
          className="button contribute"
        >
          <Github size={18} />
          Contribution
        </a>
        <button
          className="menu-toggle"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-top">
          <div>
            <Brand />
            <p>Small apps. Big possibilities.</p>
          </div>
          <div className="social-block">
            <span>Social Links</span>
            <div className="social-links">
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noreferrer"
                aria-label="GitHub"
              >
                <Github size={19} />
              </a>
              <a
                href="https://www.linkedin.com/"
                target="_blank"
                rel="noreferrer"
                aria-label="LinkedIn"
              >
                <Linkedin size={19} />
              </a>
              <a
                href="https://x.com/"
                target="_blank"
                rel="noreferrer"
                aria-label="X"
              >
                <X size={19} />
              </a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>
            Copyright © {new Date().getFullYear()} HERO.IO. All rights reserved.
          </span>
          <span>Built for a more productive you.</span>
        </div>
      </div>
    </footer>
  );
}

function Loader({ label = "Loading apps…", full = false }) {
  return (
    <div className={`loading-state ${full ? "full-loader" : ""}`} role="status">
      <LoaderCircle className="spin" size={32} />
      <span>{label}</span>
    </div>
  );
}

function AppImage({ app, className = "" }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [app.image]);
  return failed ? (
    <div
      className={`app-image image-fallback ${className}`}
      style={{ "--hue": (app.id * 49) % 360 }}
      role="img"
      aria-label={app.title}
    >
      <span>{app.title.slice(0, 1)}</span>
    </div>
  ) : (
    <img
      className={`app-image ${className}`}
      src={app.image}
      alt={app.title}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

function AppBadges({ app, size = false }) {
  return (
    <div className="app-badges">
      <span className="badge downloads">
        <ArrowDownToLine size={14} />
        {compact(app.downloads)}
      </span>
      <span className="badge rating">
        <Star size={14} fill="currentColor" />
        {app.ratingAvg}
      </span>
      {size && <span className="app-size">{app.size} MB</span>}
    </div>
  );
}

function AppCard({ app }) {
  return (
    <Link
      className="app-card"
      to={`/apps/${app.id}`}
      aria-label={`View ${app.title}`}
    >
      <AppImage app={app} />
      <h3>{app.title}</h3>
      <AppBadges app={app} />
    </Link>
  );
}

function AppGrid({ items }) {
  return (
    <div className="app-grid">
      {items.map((app) => (
        <AppCard key={app.id} app={app} />
      ))}
    </div>
  );
}

function PlayIcon() {
  return (
    <svg width="23" height="25" viewBox="0 0 24 26" aria-hidden="true">
      <path fill="#00d4ff" d="M1 1v24l13-12z" />
      <path fill="#00e77b" d="m1 1 16 9-3 3z" />
      <path fill="#ffce00" d="m17 10 6 3-6 3-3-3z" />
      <path fill="#ff4568" d="M1 25 17 16l-3-3z" />
    </svg>
  );
}

function StoreIcon() {
  return (
    <svg width="25" height="25" viewBox="0 0 26 26" aria-hidden="true">
      <rect width="26" height="26" rx="6" fill="#0ba9fa" />
      <path
        d="m10 5 9 16M16 5 7 21M5 17h16"
        stroke="white"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Home() {
  return (
    <>
      <section className="hero">
        <div className="container hero-copy">
          <h1>
            We Build
            <br />
            <span>Productive</span> Apps
          </h1>
          <p>
            At HERO.IO, we craft innovative apps designed to make everyday life
            simpler, smarter, and more exciting.
            <br className="desktop-break" /> Our goal is to turn your ideas into
            digital experiences that truly make an impact.
          </p>
          <div className="store-buttons">
            <a
              className="store-button"
              href="https://play.google.com/store/apps"
              target="_blank"
              rel="noreferrer"
            >
              <PlayIcon />
              Google Play
            </a>
            <a
              className="store-button"
              href="https://www.apple.com/app-store/"
              target="_blank"
              rel="noreferrer"
            >
              <StoreIcon />
              App Store
            </a>
          </div>
        </div>
        <img
          className="hero-art"
          src="/asset/hero.png"
          alt="Productivity apps on a phone surrounded by task and timer icons"
          fetchPriority="high"
        />
      </section>
      <section className="stats-section">
        <div className="container">
          <h2>Trusted By Millions, Built For You</h2>
          <div className="stats-grid">
            {[
              ["Total Downloads", "29.6M", "21% More Than Last Month"],
              ["Total Reviews", "906K", "46% More Than Last Month"],
              ["Active Apps", "132+", "31 More Will Launch"],
            ].map(([label, value, note]) => (
              <div className="stat-card" key={label}>
                <p>{label}</p>
                <strong>{value}</strong>
                <span>{note}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="section container">
        <PageTitle
          title="Trending Apps"
          subtitle="Explore All Trending Apps on the Market developed by us"
        />
        <AppGrid items={apps.slice(0, 8)} />
        <div className="section-action">
          <Link className="button" to="/apps">
            Show All
            <ArrowRight size={17} />
          </Link>
        </div>
      </section>
    </>
  );
}

function PageTitle({ title, subtitle }) {
  return (
    <div className="page-title">
      <h1>{title}</h1>
      <p>{subtitle}</p>
    </div>
  );
}

function SortSelect({ value, onChange }) {
  return (
    <div className="select-wrap">
      <select
        aria-label="Sort by downloads"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="default">Sort by Downloads</option>
        <option value="high-low">High-Low</option>
        <option value="low-high">Low-High</option>
      </select>
      <ChevronDown size={16} />
    </div>
  );
}

function sortApps(items, order) {
  return [...items].sort((a, b) =>
    order === "high-low"
      ? b.downloads - a.downloads
      : order === "low-high"
        ? a.downloads - b.downloads
        : a.id - b.id,
  );
}

function AllApps() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [order, setOrder] = useState("default");
  useEffect(() => {
    if (query === debouncedQuery) {
      setSearching(false);
      return;
    }
    setSearching(true);
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      setSearching(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, debouncedQuery]);
  const results = useMemo(
    () =>
      sortApps(
        apps.filter((app) =>
          app.title.toLowerCase().includes(debouncedQuery.trim().toLowerCase()),
        ),
        order,
      ),
    [debouncedQuery, order],
  );
  return (
    <section className="container section listing-page">
      <PageTitle
        title="Our All Applications"
        subtitle="Explore All Apps on the Market developed by us. We code for Millions"
      />
      <div className="list-toolbar">
        <h2 aria-live="polite">
          ({results.length}) Apps Found{" "}
          <span className="total-count">of {apps.length}</span>
        </h2>
        <div className="toolbar-controls">
          <label className="search-box">
            <Search size={19} />
            <input
              type="search"
              aria-label="Search apps by title"
              placeholder="Search Apps"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setSearching(true);
              }}
            />
            {searching && <LoaderCircle size={17} className="spin" />}
          </label>
          <SortSelect value={order} onChange={setOrder} />
        </div>
      </div>
      <div aria-busy={searching}>
        {searching ? (
          <Loader label="Searching apps…" />
        ) : results.length ? (
          <AppGrid items={results} />
        ) : (
          <div className="empty-state">
            <Search size={42} />
            <h2>No App Found</h2>
            <p>No apps match “{debouncedQuery}”. Try another title.</p>
            <button
              className="button"
              onClick={() => {
                setQuery("");
                setSearching(true);
              }}
            >
              Clear Search
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

function Metric({ icon, fallback: Icon, label, value }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="detail-metric">
      {failed ? (
        <Icon size={33} />
      ) : (
        <img src={`/asset/${icon}`} alt="" onError={() => setFailed(true)} />
      )}
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function AppDetails() {
  const { id } = useParams();
  const { installedIds, updateInstallation } = useApps();
  const app = apps.find((item) => String(item.id) === id);
  if (!app) return <NotFound appError />;
  const installed = installedIds.includes(app.id);
  const chartData = [...app.ratings].reverse();
  return (
    <section className="container details-page">
      <div className="app-overview">
        <AppImage app={app} className="detail-image" />
        <div className="overview-content">
          <h1>{app.title}</h1>
          <p className="developer">
            Developed by <span>{app.companyName}</span>
          </p>
          <div className="detail-metrics">
            <Metric
              icon="icon-downloads.png"
              fallback={ArrowDownToLine}
              label="Downloads"
              value={compact(app.downloads)}
            />
            <Metric
              icon="icon-ratings.png"
              fallback={Star}
              label="Average Ratings"
              value={app.ratingAvg}
            />
            <Metric
              icon="icon-review.png"
              fallback={CheckCircle2}
              label="Total Reviews"
              value={compact(app.reviews)}
            />
          </div>
          <button
            disabled={installed}
            className="button install-button"
            onClick={() => updateInstallation(app, true)}
          >
            {installed ? (
              <>
                <Check size={19} />
                Installed
              </>
            ) : (
              <>
                <ArrowDownToLine size={18} />
                Install Now ({app.size} MB)
              </>
            )}
          </button>
        </div>
      </div>
      <section className="ratings-section" aria-label="App ratings">
        <h2>Ratings</h2>
        <div
          className="rating-chart"
          role="img"
          aria-label={`Ratings for ${app.title}: ${chartData.map((rating) => `${rating.name}: ${rating.count}`).join(", ")}`}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 4, right: 20, bottom: 0, left: 4 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                horizontal={false}
                stroke="#e5e7eb"
              />
              <XAxis
                type="number"
                tickFormatter={compact}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#7a8796", fontSize: 12 }}
              />
              <YAxis
                dataKey="name"
                type="category"
                width={55}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#66788d", fontSize: 13 }}
              />
              <Tooltip
                formatter={(value) => [
                  Number(value).toLocaleString(),
                  "Reviews",
                ]}
                cursor={{ fill: "#fff3e6" }}
              />
              <Bar
                dataKey="count"
                fill="#ff8811"
                radius={[0, 3, 3, 0]}
                barSize={24}
                isAnimationActive={false}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
      <section className="description-section">
        <h2>Description</h2>
        {app.description.split("\n\n").map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </section>
    </section>
  );
}

function Installation() {
  const { installedIds, updateInstallation } = useApps();
  const [order, setOrder] = useState("default");
  const installedApps = sortApps(
    apps.filter((app) => installedIds.includes(app.id)),
    order,
  );
  return (
    <section className="container section installation-page">
      <PageTitle
        title="Your Installed Apps"
        subtitle="Explore All Trending Apps on the Market developed by us"
      />
      <div className="list-toolbar">
        <h2 aria-live="polite">{installedApps.length} Apps Found</h2>
        <SortSelect value={order} onChange={setOrder} />
      </div>
      {installedApps.length ? (
        <div className="installed-list">
          {installedApps.map((app) => (
            <article className="installed-card" key={app.id}>
              <Link to={`/apps/${app.id}`} className="installed-info">
                <AppImage app={app} />
                <div>
                  <h3>{app.title}</h3>
                  <AppBadges app={app} size />
                </div>
              </Link>
              <button
                className="button uninstall-button"
                onClick={() => updateInstallation(app, false)}
                aria-label={`Uninstall ${app.title}`}
              >
                <Trash2 size={16} />
                Uninstall
              </button>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <ShieldCheck size={48} />
          <h2>No apps installed yet</h2>
          <p>
            Your next favorite app is waiting. Explore the collection and
            install one.
          </p>
          <Link to="/apps" className="button">
            Explore Apps
            <ArrowRight size={17} />
          </Link>
        </div>
      )}
    </section>
  );
}

function NotFound({ appError = false }) {
  return (
    <section className="container not-found">
      <img
        src={appError ? "/asset/App-Error.png" : "/asset/error-404.png"}
        alt={
          appError
            ? "App not found illustration"
            : "404 page not found illustration"
        }
      />
      <h1>{appError ? "OPPS!! APP NOT FOUND" : "Oops, page not found!"}</h1>
      <p>
        {appError
          ? "The App you are requesting is not found on our system. Please try another app."
          : "The page you are looking for is not available."}
      </p>
      <Link className="button" to={appError ? "/apps" : "/"}>
        Go Back!
      </Link>
    </section>
  );
}

function PageRoutes() {
  const location = useLocation();
  const [readyKey, setReadyKey] = useState(null);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    const titles = {
      "/": "Productive Apps",
      "/apps": "All Applications",
      "/installation": "My Installation",
    };
    document.title = `${titles[location.pathname] || (location.pathname.startsWith("/apps/") ? "App Details" : "Page Not Found")} | hero.io`;
    const timer = setTimeout(() => setReadyKey(location.key), 250);
    return () => clearTimeout(timer);
  }, [location.key, location.pathname]);
  if (readyKey !== location.key)
    return <Loader full label="Loading your next possibility…" />;
  return (
    <Routes location={location}>
      <Route path="/" element={<Home />} />
      <Route path="/apps" element={<AllApps />} />
      <Route path="/apps/:id" element={<AppDetails />} />
      <Route path="/installation" element={<Installation />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AppProvider>
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <Header />
      <main id="main-content">
        <PageRoutes />
      </main>
      <Footer />
    </AppProvider>
  );
}