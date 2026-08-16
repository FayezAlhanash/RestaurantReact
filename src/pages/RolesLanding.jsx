import {
  BarChart3,
  Boxes,
  ChefHat,
  ChevronDown,
  DoorOpen,
  LogIn,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  UserRoundCheck,
  CheckCircle2,
  Code2,
  Headset,
  Phone,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import BrandLogo from "../components/Shared/BrandLogo";
import adminScreenshot from "../assets/role-admin-preview.png";
import adminEmployeesScreenshot from "../assets/role-admin-employees-preview.png";
import adminRestaurantsScreenshot from "../assets/role-admin-restaurants-preview.png";
import adminTablesScreenshot from "../assets/role-admin-tables-preview.png";
import cashierOrdersScreenshot from "../assets/role-cashier-orders-preview.png";
import cashierScreenshot from "../assets/role-cashier-preview.png";
import kitchenScreenshot from "../assets/role-kitchen-preview.png";
import managerIngredientsScreenshot from "../assets/role-manager-ingredients-preview.png";
import managerMenuScreenshot from "../assets/role-manager-menu-preview.png";
import managerScreenshot from "../assets/role-manager-preview.png";
import waiterScreenshot from "../assets/role-waiter-preview.png";
import "./RolesLanding.css";

const warehouseScreenshotFiles = import.meta.glob(
  "../assets/role-warehouse-*.{png,jpg,jpeg,webp,svg}",
  {
    eager: true,
    import: "default",
  },
);

const warehouseScreenshotOrder = [
  {
    key: "inventory",
    alt: "Warehouse inventory levels interface preview",
    label: "Warehouse inventory",
  },
  {
    key: "stock-actions",
    alt: "Warehouse stock actions interface preview",
    label: "Warehouse stock actions",
  },
];

const warehouseScreenshots = warehouseScreenshotOrder
  .map((item) => {
    const match = Object.entries(warehouseScreenshotFiles).find(([path]) =>
      path.includes(item.key),
    );

    if (!match) return null;

    return {
      src: match[1],
      alt: item.alt,
      label: item.label,
    };
  })
  .filter(Boolean);

const roles = [
  {
    id: 1,
    name: "Admin",
    path: "/dashboard",
    accent: "Platform",
    icon: ShieldCheck,
    description:
      "Controls the full system workspace for restaurants, employees, roles, tables, reports, reviews, and loyalty settings.",
    responsibilities: [
      "Manage restaurants and branch profiles",
      "Manage employees, shifts, and role assignments",
      "Open reports, delivery reviews, tables, inventory, menu, and loyalty settings",
    ],
    screenshots: [
      {
        src: adminScreenshot,
        alt: "Admin dashboard interface preview",
        label: "Admin dashboard",
      },
      {
        src: adminRestaurantsScreenshot,
        alt: "Admin restaurants management interface preview",
        label: "Admin restaurants",
      },
      {
        src: adminEmployeesScreenshot,
        alt: "Admin employees management interface preview",
        label: "Admin employees",
      },
      {
        src: adminTablesScreenshot,
        alt: "Admin tables management interface preview",
        label: "Admin tables",
      },
    ],
  },
  {
    id: 3,
    name: "Manager",
    path: "/manager/dashboard",
    accent: "Restaurant Lead",
    icon: BarChart3,
    description:
      "Leads daily restaurant operations through reports, menu work, recipes, stock visibility, order workspaces, tables, and restaurant settings.",
    responsibilities: [
      "Review restaurant performance and live order activity",
      "Build menus, maintain foods, recipes, modifiers, and ingredients",
      "Monitor inventory, kitchen orders, takeaway orders, dine-in service, tables, and loyalty settings",
    ],
    screenshots: [
      {
        src: managerScreenshot,
        alt: "Manager dashboard interface screenshot",
        label: "Manager dashboard",
      },
      {
        src: managerMenuScreenshot,
        alt: "Manager menu builder interface preview",
        label: "Manager menu builder",
      },
      {
        src: managerIngredientsScreenshot,
        alt: "Manager food ingredients interface preview",
        label: "Manager ingredients",
      },
    ],
  },
  {
    id: 4,
    name: "Cashier",
    path: "/cashier",
    accent: "Front Counter",
    icon: ReceiptText,
    description:
      "Works inside the cashier dashboard for takeaway order handling and the catalog/order flow assigned to counter staff.",
    responsibilities: [
      "Create and manage takeaway orders",
      "Use the cashier catalog and order sidebar",
      "Track pickup order workflow from the cashier workspace",
    ],
    screenshots: [
      {
        src: cashierScreenshot,
        alt: "Cashier workspace interface preview with sidebar",
        label: "Cashier workspace",
      },
      {
        src: cashierOrdersScreenshot,
        alt: "Cashier active kitchen orders interface preview",
        label: "Cashier active orders",
      },
    ],
  },
  {
    id: 6,
    name: "Kitchen",
    path: "/kitchen/dashboard",
    accent: "Preparation",
    icon: ChefHat,
    description:
      "Runs the kitchen dashboard and keeps preparation flowing through shared restaurant operation sections.",
    responsibilities: [
      "Manage the kitchen order queue and preparation flow",
      "Open takeaway and dine-in service views",
      "Access menu, recipes, inventory, stock alerts, and reports",
    ],
    screenshots: [
      {
        src: kitchenScreenshot,
        alt: "Kitchen order queue interface preview",
        label: "Kitchen order queue",
        imageClassName: "roles-help-kitchen-preview",
      },
    ],
  },
  {
    id: 7,
    name: "Warehouse Manager",
    path: "/warehouse/dashboard",
    accent: "Inventory",
    icon: Boxes,
    description:
      "Owns warehouse visibility for stock health, low-stock alerts, stock actions, and manager communication.",
    responsibilities: [
      "Monitor ingredient stock levels and warehouse health",
      "Review low-stock items and record refill, adjust, or waste actions",
      "Use manager chat and shared operational sections",
    ],
    screenshots: warehouseScreenshots,
  },
  {
    id: 8,
    name: "Waiter",
    path: "/waiter",
    accent: "Dining Room",
    icon: UserRoundCheck,
    description:
      "Serves dine-in orders through the waiter workspace and routes guests through the table-service flow.",
    responsibilities: [
      "Serve dine-in orders from the waiter dashboard",
      "Work through service, serve-orders, and cash-payments views",
      "Stay focused on table-side restaurant service",
    ],
    screenshots: [
      {
        src: waiterScreenshot,
        alt: "Waiter table sessions interface preview",
        label: "Waiter table sessions",
      },
    ],
  },
];

const heroPreviewScreenshots = roles.flatMap((role) =>
  (role.screenshots || []).map((screenshot) => ({
    ...screenshot,
    label: `${role.name} - ${screenshot.label}`,
    path: role.path,
  })),
);

const heroPreviewRole = {
  name: "Role gallery",
  path: "/info#roles",
  screenshots: [
    ...heroPreviewScreenshots.filter(
      (screenshot) => screenshot.path === "/cashier",
    ),
    ...heroPreviewScreenshots.filter(
      (screenshot) => screenshot.path !== "/cashier",
    ),
  ],
};

const getRoleCardId = (role) => `role-card-${role.id}`;

const footerContacts = ["+96335352733", "+963944128650", "+963988462713"];

const footerDevelopers = [
  "Tariq Odeh",
  "Marwa Alsaffori",
  "Alaa Alkabbani",
  "Eman Hamed",
  "Fayez Alhanash",
];

function BrowserFrame({ role }) {
  const screenshots = role.screenshots || [];
  const hasScreenshots = screenshots.length > 0;
  const hasMultipleScreenshots = screenshots.length > 1;
  const [currentSlide, setCurrentSlide] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isSliderPaused, setIsSliderPaused] = useState(false);
  const dragStartX = useRef(0);
  const dragOffsetRef = useRef(0);

  useEffect(() => {
    if (!hasMultipleScreenshots || isSliderPaused || isDragging)
      return undefined;

    const intervalId = window.setInterval(() => {
      setCurrentSlide((slide) => (slide + 1) % screenshots.length);
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [hasMultipleScreenshots, isDragging, isSliderPaused, screenshots.length]);

  const showPreviousSlide = () => {
    setCurrentSlide(
      (slide) => (slide - 1 + screenshots.length) % screenshots.length,
    );
  };

  const showNextSlide = () => {
    setCurrentSlide((slide) => (slide + 1) % screenshots.length);
  };

  const handlePointerDown = (event) => {
    if (!hasMultipleScreenshots || event.target.closest("button")) return;

    dragStartX.current = event.clientX;
    dragOffsetRef.current = 0;
    setDragOffset(0);
    setIsDragging(true);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const handlePointerMove = (event) => {
    if (!isDragging) return;

    const nextOffset = event.clientX - dragStartX.current;
    dragOffsetRef.current = nextOffset;
    setDragOffset(nextOffset);
  };

  const finishDrag = (event) => {
    if (!isDragging) return;

    const offset = dragOffsetRef.current;
    const threshold = 64;

    if (Math.abs(offset) > threshold) {
      if (offset < 0) {
        showNextSlide();
      } else {
        showPreviousSlide();
      }
    }

    dragOffsetRef.current = 0;
    setDragOffset(0);
    setIsDragging(false);
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  };

  const sliderTransform = `translateX(calc(-${currentSlide * 100}% + ${dragOffset}px))`;

  return (
    <div className="roles-help-browser overflow-hidden">
      <div
        className={`roles-help-browser-screen relative overflow-hidden bg-[#0f0b0a] ${
          hasMultipleScreenshots ? "is-draggable" : ""
        }`}
        onMouseEnter={() => setIsSliderPaused(true)}
        onMouseLeave={() => setIsSliderPaused(false)}
        onPointerCancel={finishDrag}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishDrag}
      >
        {hasScreenshots ? (
          <>
            <div
              className={`roles-help-slider-track ${isDragging ? "is-dragging" : ""}`}
              style={{ transform: sliderTransform }}
            >
              {screenshots.map((screenshot, index) => (
                <div
                  key={screenshot.label}
                  className="roles-help-slide"
                  aria-hidden={index !== currentSlide}
                >
                  <img
                    src={screenshot.src}
                    alt={screenshot.alt}
                    className={`block h-auto w-full ${screenshot.imageClassName || ""}`}
                  />
                </div>
              ))}
            </div>

            {hasMultipleScreenshots && (
              <div
                className="roles-help-slider-dots"
                aria-label={`${role.name} previews`}
              >
                {screenshots.map((screenshot, index) => (
                  <button
                    key={screenshot.label}
                    type="button"
                    className={`roles-help-slider-dot ${
                      index === currentSlide ? "is-active" : ""
                    }`}
                    onClick={() => setCurrentSlide(index)}
                    aria-label={`Show ${screenshot.label}`}
                    aria-current={index === currentSlide ? "true" : undefined}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="grid h-full place-items-center bg-[linear-gradient(145deg,#1b1110_0%,#2a1715_55%,#120d0c_100%)] p-6">
            <div className="max-w-sm text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-lg border border-[#ffd166]/32 bg-[#ffd166]/10 text-[#ffd166]">
                <DoorOpen size={24} />
              </div>
              <p className="mt-4 text-sm font-black uppercase tracking-wide text-[#ffd166]">
                Interface screenshot pending
              </p>
              <p className="mt-2 text-sm font-bold leading-6 text-white/58">
                This preview is reserved for the real {role.name} interface.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function RoleCard({ role }) {
  const Icon = role.icon;
  const cardRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const node = cardRef.current;

    if (!node) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      {
        rootMargin: "-12% 0px -18% 0px",
        threshold: 0.22,
      },
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  return (
    <article
      ref={cardRef}
      className={`roles-help-card roles-help-role-card border border-white/10 bg-white/[0.045] shadow-[0_22px_64px_rgba(0,0,0,0.22)] backdrop-blur ${
        isVisible ? "is-copy-visible" : ""
      }`}
    >
      <div className="roles-help-role-copy min-w-0">
        <div className="flex flex-wrap items-center gap-4">
          <span className="roles-help-role-icon grid h-16 w-16 place-items-center rounded-lg border border-[#ffd166]/35 bg-[#ffd166]/12 text-[#ffd166] shadow-[0_18px_38px_rgba(255,209,102,0.08)]">
            <Icon size={30} />
          </span>
          <div className="min-w-0">
            <p className="roles-help-kicker text-sm font-black uppercase tracking-[0.18em] text-[#efb547]">
              {role.accent} · Role ID {role.id}
            </p>
            <h3 className="roles-help-title roles-help-zoom-text mt-2 text-4xl font-black leading-tight text-white sm:text-6xl">
              {role.name}
            </h3>
          </div>
        </div>

        <p className="roles-help-copy mt-7 text-lg font-bold leading-9 text-white/68">
          {role.description}
        </p>

        <div className="mt-8">
          <p className="roles-help-muted text-sm font-black uppercase tracking-[0.18em] text-white/48">
            Main Responsibilities
          </p>
          <div className="mt-4 grid gap-3">
            {role.responsibilities.map((item) => (
              <div
                key={item}
                className="roles-help-duty roles-help-copy flex gap-4 rounded-lg border border-white/10 bg-black/16 p-4 text-base font-bold leading-7 text-white/78"
              >
                <CheckCircle2
                  size={20}
                  className="roles-help-duty-icon mt-0.5 shrink-0 text-[#ffd166]"
                />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="roles-help-role-visual">
        <BrowserFrame role={role} />
      </div>
    </article>
  );
}

export default function RolesLanding() {
  const [isRolesMenuOpen, setIsRolesMenuOpen] = useState(false);
  const [isLeavingForSignIn, setIsLeavingForSignIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const shouldReduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (shouldReduceMotion) return undefined;

    const zoomTextNodes = Array.from(
      document.querySelectorAll(".roles-help-zoom-text"),
    );
    let animationFrame = 0;

    const updateTextZoom = () => {
      const viewportHeight = window.innerHeight || 1;
      const focusLine = viewportHeight * 0.52;
      const activeRadius = Math.max(220, viewportHeight * 0.48);

      zoomTextNodes.forEach((node) => {
        const rect = node.getBoundingClientRect();
        const center = rect.top + rect.height / 2;
        const distance = Math.abs(center - focusLine);
        const closeness = Math.max(0, 1 - distance / activeRadius);
        const easedCloseness = closeness * closeness * (3 - 2 * closeness);
        const scale = 0.9 + easedCloseness * 0.145;

        node.style.setProperty("--roles-help-text-scale", scale.toFixed(3));
        node.style.setProperty(
          "--roles-help-text-focus",
          easedCloseness.toFixed(3),
        );
        node.style.setProperty(
          "--roles-help-text-shadow-y",
          `${(easedCloseness * 6).toFixed(1)}px`,
        );
        node.style.setProperty(
          "--roles-help-text-shadow-blur",
          `${(easedCloseness * 16).toFixed(1)}px`,
        );
      });
    };

    const requestTextZoomUpdate = () => {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(updateTextZoom);
    };

    updateTextZoom();
    window.addEventListener("scroll", requestTextZoomUpdate, { passive: true });
    window.addEventListener("resize", requestTextZoomUpdate);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("scroll", requestTextZoomUpdate);
      window.removeEventListener("resize", requestTextZoomUpdate);
    };
  }, []);

  const handleRolesScroll = (event) => {
    event.preventDefault();

    const rolesSection = document.getElementById("roles");
    const shouldReduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    rolesSection?.scrollIntoView({
      behavior: shouldReduceMotion ? "auto" : "smooth",
      block: "start",
    });
    window.history.replaceState(null, "", "#roles");
    setIsRolesMenuOpen(false);
  };

  const handleRoleScroll = (event, role) => {
    event.preventDefault();

    const roleCard = document.getElementById(getRoleCardId(role));
    const shouldReduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    roleCard?.scrollIntoView({
      behavior: shouldReduceMotion ? "auto" : "smooth",
      block: "start",
    });
    window.history.replaceState(null, "", `#${getRoleCardId(role)}`);
    setIsRolesMenuOpen(false);
  };

  const handleSignInNavigation = (event) => {
    event.preventDefault();

    if (isLeavingForSignIn) return;

    const goToSignIn = () => {
      navigate("/", {
        state: {
          openSignIn: true,
          fromHelp: true,
        },
      });
    };

    const shouldReduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    setIsRolesMenuOpen(false);

    if (shouldReduceMotion) {
      goToSignIn();
      return;
    }

    setIsLeavingForSignIn(true);
    window.setTimeout(goToSignIn, 260);
  };

  return (
    <main
      className={`roles-help-page relative overflow-hidden font-merriweather ${
        isLeavingForSignIn ? "is-leaving-for-signin" : ""
      }`}
    >
      <div
        className="roles-help-grid absolute inset-0 opacity-35"
        aria-hidden="true"
      />
      <div className="relative">
        <header className="roles-help-header flex items-center justify-center">
          <div className="roles-help-shell flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
            <Link
              to="/"
              className="flex min-w-0 items-center gap-3"
              aria-label="Go to sign in"
            >
              <BrandLogo className="h-11 w-11" rounded="rounded-lg" />
              <div className="min-w-0">
                <p className="roles-help-title truncate text-lg font-black text-white">
                  Big-4
                </p>
                <p className="truncate text-[11px] font-black uppercase tracking-[0.2em] text-[#ffd166]">
                  Restaurant System
                </p>
              </div>
            </Link>

            <nav className="roles-help-copy hidden items-center gap-7 text-sm font-bold text-white/68 md:flex">
              <div className="roles-help-menu relative">
                <button
                  type="button"
                  className="roles-help-link roles-help-menu-button inline-flex items-center gap-1.5"
                  onClick={() => setIsRolesMenuOpen((isOpen) => !isOpen)}
                  aria-expanded={isRolesMenuOpen}
                  aria-haspopup="menu"
                >
                  Roles
                  <ChevronDown
                    size={16}
                    className={`roles-help-menu-arrow ${isRolesMenuOpen ? "is-open" : ""}`}
                  />
                </button>

                {isRolesMenuOpen && (
                  <div className="roles-help-role-menu" role="menu">
                    <a
                      href="#roles"
                      onClick={handleRolesScroll}
                      role="menuitem"
                    >
                      All roles
                    </a>
                    {roles.map((role) => (
                      <a
                        key={role.id}
                        href={`#${getRoleCardId(role)}`}
                        onClick={(event) => handleRoleScroll(event, role)}
                        role="menuitem"
                      >
                        {role.name}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </nav>

            <Link
              to="/"
              onClick={handleSignInNavigation}
              className="roles-help-button roles-help-signin-button inline-flex h-14 items-center justify-center gap-2 rounded-lg px-6 text-base font-black text-white transition hover:-translate-y-0.5 active:translate-y-0"
            >
              <LogIn size={18} />
              <span>Sign in</span>
            </Link>
          </div>
        </header>

        <section className="roles-help-shell roles-help-hero grid min-h-[calc(100dvh-84px)] items-center gap-8 px-4 pb-12 pt-8 sm:px-6 lg:grid-cols-[0.78fr_1.22fr] lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-lg border border-[#ffd166]/26 bg-[#ffd166]/10 px-3 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#ffd166]">
              <Sparkles size={15} />
              Employee Role Guide
            </div>
            <h1 className="roles-help-title roles-help-zoom-text mt-7 max-w-3xl text-5xl font-black leading-[0.98] text-white sm:text-6xl lg:text-7xl">
              One system. Clear workspaces for every shift.
            </h1>
            <p className="roles-help-copy roles-help-zoom-text mt-6 max-w-2xl text-base font-bold leading-8 text-white/68 sm:text-lg">
              A premium role overview for the Big-4 restaurant management
              system, built from the real role IDs and protected workspaces used
              by the app.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#roles"
                onClick={handleRolesScroll}
                className="roles-help-button inline-flex h-12 items-center justify-center rounded-lg bg-[#7f1d1d] px-5 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-[#9f2424] active:translate-y-0"
              >
                Explore Roles
              </a>
            </div>
          </div>

          <div className="min-w-0">
            <BrowserFrame role={heroPreviewRole} />
          </div>
        </section>

        <section
          id="roles"
          className="roles-help-shell px-4 py-20 sm:px-6 lg:px-8"
        >
          <div className="mb-12 max-w-5xl">
            <p className="roles-help-zoom-text text-xs font-black uppercase tracking-[0.18em] text-[#ffd166]">
              Employee Roles
            </p>
            <h2 className="roles-help-title roles-help-zoom-text mt-4 text-4xl font-black leading-[1.02] text-white sm:text-6xl">
              Role workspaces, presented like a premium product tour.
            </h2>
          </div>

          <div className="grid gap-8">
            {roles.map((role) => (
              <div
                id={getRoleCardId(role)}
                key={role.name}
                className="grid gap-4"
              >
                <h3 className="roles-help-role-section-title roles-help-zoom-text text-3xl font-black uppercase leading-tight text-[#7f1d1d] sm:text-5xl">
                  {role.name}
                </h3>
                <RoleCard role={role} />
              </div>
            ))}
          </div>
        </section>

        <footer className="roles-help-footer">
          <div className="roles-help-shell roles-help-footer-inner px-4 py-10 sm:px-6 lg:px-8">
            <div className="roles-help-footer-brand">
              <Link
                to="/"
                className="flex min-w-0 items-center gap-3"
                aria-label="Go to sign in"
              >
                <BrandLogo className="h-12 w-12" rounded="rounded-lg" />
                <div className="min-w-0">
                  <p className="roles-help-title truncate text-xl font-black">
                    Big-4
                  </p>
                  <p className="truncate text-[11px] font-black uppercase tracking-[0.2em] text-[#9a6400]">
                    Restaurant System
                  </p>
                </div>
              </Link>
              <p className="roles-help-copy mt-4 max-w-xl text-sm font-bold leading-6">
                A role-based operations guide for the restaurant team, from
                admin control to kitchen prep, cashier orders, table service,
                and inventory.
              </p>
            </div>

            <div
              className="roles-help-footer-links"
              aria-label="Help footer links"
            >
              <a href="#roles" onClick={handleRolesScroll}>
                All roles
              </a>
              {roles.slice(0, 4).map((role) => (
                <a
                  key={role.id}
                  href={`#${getRoleCardId(role)}`}
                  onClick={(event) => handleRoleScroll(event, role)}
                >
                  {role.name}
                </a>
              ))}
              <Link to="/" onClick={handleSignInNavigation}>
                Sign in
              </Link>
            </div>

            <div className="roles-help-footer-contact">
              <div>
                <p className="roles-help-footer-heading">Contact Numbers</p>
                <div className="mt-3 grid gap-2">
                  {footerContacts.map((phoneNumber) => (
                    <a
                      key={phoneNumber}
                      href={`tel:${phoneNumber}`}
                      className="roles-help-footer-line"
                    >
                      <Phone size={16} />
                      <span>{phoneNumber}</span>
                    </a>
                  ))}
                </div>
              </div>

              <div>
                <p className="roles-help-footer-heading">Developers</p>
                <div className="mt-3 grid gap-2">
                  {footerDevelopers.map((developer) => (
                    <div key={developer} className="roles-help-footer-line">
                      <Code2 size={16} />
                      <span>{developer}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="roles-help-footer-bottom">
              <span>© 2026 Big-4 Restaurant System</span>
              <span className="inline-flex items-center gap-2">
                <Headset size={16} />
                Internal operations info
              </span>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
