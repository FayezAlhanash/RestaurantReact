import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  FolderPlus,
  Layers3,
  Tags,
  UtensilsCrossed,
} from "lucide-react";

const stats = [
  {
    label: "Active categories",
    value: "12",
    hint: "Across the live menu",
    icon: Tags,
    className: "from-emerald-50 to-white text-emerald-950",
    iconClass: "bg-emerald-500 text-white shadow-emerald-500/20",
  },
  {
    label: "Food items",
    value: "48",
    hint: "Ready for cashier orders",
    icon: UtensilsCrossed,
    className: "from-sky-50 to-white text-sky-950",
    iconClass: "bg-sky-500 text-white shadow-sky-500/20",
  },
  {
    label: "Avg prep time",
    value: "18m",
    hint: "Based on menu setup",
    icon: Layers3,
    className: "from-amber-50 to-white text-amber-950",
    iconClass: "bg-amber-500 text-white shadow-amber-500/20",
  },
];

const actions = [
  {
    title: "Build menu categories",
    text: "Organize the menu before adding modifier groups.",
    to: "/manager/add-menu",
    icon: FolderPlus,
    className: "from-[#7F1D1D] to-[#B4533A]",
    label: "Menu",
  },
  {
    title: "Add food items",
    text: "Create dishes, prices, nutrition details, and images.",
    to: "/manager/add-food",
    icon: UtensilsCrossed,
    className: "from-[#0F766E] to-[#2563EB]",
    label: "Foods",
  },
  {
    title: "Prepare modifiers",
    text: "Groups and options have a polished placeholder for the next step.",
    to: "/manager/add-menu",
    icon: Layers3,
    className: "from-[#4A1942] to-[#D97706]",
    label: "Modifiers",
  },
];

const slides = [
  {
    eyebrow: "Category control",
    title: "Build clean sections before service starts.",
    text: "Keep the menu easy to scan with focused categories for cashiers and customers.",
    metric: "12",
    metricLabel: "active categories",
    to: "/manager/add-menu",
    action: "Open categories",
    icon: Tags,
    bg: "from-[#081C15] via-[#123524] to-[#1B4332]",
    accent: "bg-emerald-400 text-emerald-950",
    glow: "shadow-emerald-500/20",
  },
  {
    eyebrow: "Food library",
    title: "Tune dishes, prices, images, and availability.",
    text: "The food workspace now supports search, filters, cards, editing, and delete confirmation.",
    metric: "48",
    metricLabel: "food items",
    to: "/manager/add-food",
    action: "Open foods",
    icon: UtensilsCrossed,
    bg: "from-[#111827] via-[#1E3A5F] to-[#0F766E]",
    accent: "bg-sky-300 text-sky-950",
    glow: "shadow-sky-500/20",
  },
  {
    eyebrow: "Modifier groups",
    title: "Prepare flexible choices for every dish.",
    text: "Groups can handle sizes, sauces, toppings, and extra options when the backend is ready.",
    metric: "Next",
    metricLabel: "workflow",
    to: "/manager/add-menu",
    action: "Preview modifiers",
    icon: Layers3,
    bg: "from-[#2A0F1F] via-[#4A1942] to-[#7C2D12]",
    accent: "bg-amber-300 text-amber-950",
    glow: "shadow-amber-500/20",
  },
];

export default function ManagerDashboard() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isSliderPaused, setIsSliderPaused] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const slide = slides[activeSlide];

  const goToPreviousSlide = () => {
    setActiveSlide((current) =>
      current === 0 ? slides.length - 1 : current - 1
    );
  };

  const goToNextSlide = () => {
    setActiveSlide((current) =>
      current === slides.length - 1 ? 0 : current + 1
    );
  };

  useEffect(() => {
    if (isSliderPaused) return undefined;

    const intervalId = window.setInterval(() => {
      setActiveSlide((current) =>
        current === slides.length - 1 ? 0 : current + 1
      );
    }, 3000);

    return () => window.clearInterval(intervalId);
  }, [isSliderPaused]);

  const handlePointerDown = (event) => {
    if (event.target.closest("a,button")) return;

    setIsSliderPaused(true);
    setIsDragging(true);
    dragStartX.current = event.clientX;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event) => {
    if (!isDragging) return;
    setDragOffset(event.clientX - dragStartX.current);
  };

  const handlePointerUp = (event) => {
    if (!isDragging) return;

    const distance = event.clientX - dragStartX.current;

    if (distance > 80) {
      goToPreviousSlide();
    } else if (distance < -80) {
      goToNextSlide();
    }

    setDragOffset(0);
    setIsDragging(false);
    setIsSliderPaused(false);
  };

  return (
    <div className="space-y-6">
      <section
        onMouseEnter={() => setIsSliderPaused(true)}
        onMouseLeave={() => setIsSliderPaused(false)}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={`overflow-hidden rounded-lg border border-white/10 bg-gradient-to-br ${slide.bg} text-white shadow-2xl ${slide.glow}`}
      >
        <div
          className={`flex cursor-grab select-none ${
            isDragging ? "cursor-grabbing" : "transition-transform duration-700 ease-out"
          }`}
          style={{
            transform: `translate3d(calc(-${activeSlide * 100}% + ${dragOffset}px), 0, 0)`,
          }}
        >
          {slides.map((item) => {
            const SlideIcon = item.icon;

            return (
              <div
                key={item.eyebrow}
                className={`grid min-h-[330px] min-w-full gap-6 bg-gradient-to-br ${item.bg} p-6 md:grid-cols-[1.25fr_0.75fr] md:p-8`}
              >
                <div className="flex flex-col justify-between">
                  <div>
                    <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-wide text-white/80 backdrop-blur">
                      <SlideIcon size={15} />
                      {item.eyebrow}
                    </div>

                    <h1 className="max-w-2xl text-3xl font-black leading-tight md:text-5xl">
                      {item.title}
                    </h1>
                    <p className="mt-4 max-w-xl text-sm leading-6 text-white/75 md:text-base">
                      {item.text}
                    </p>
                  </div>

                  <div className="mt-8 flex flex-wrap items-center gap-3">
                    <Link
                      to={item.to}
                      className={`group inline-flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-black shadow-lg transition duration-200 hover:-translate-y-0.5 hover:scale-105 active:translate-y-0 active:scale-100 ${item.accent}`}
                    >
                      {item.action}
                      <ArrowUpRight
                        size={17}
                        className="transition duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      />
                    </Link>

                    <div className="flex items-center gap-2">
                      {slides.map((dot, index) => (
                        <button
                          key={dot.eyebrow}
                          type="button"
                          onClick={() => setActiveSlide(index)}
                          className={`h-2.5 rounded-full transition duration-200 ${
                            activeSlide === index
                              ? "w-9 bg-white"
                              : "w-2.5 bg-white/35 hover:bg-white/70"
                          }`}
                          aria-label={`Go to ${dot.eyebrow}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col justify-between rounded-lg border border-white/10 bg-white/10 p-5 backdrop-blur">
                  <div className="flex items-center justify-between">
                    <div className={`grid h-14 w-14 place-items-center rounded-lg ${item.accent}`}>
                      <SlideIcon size={27} />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={goToPreviousSlide}
                        className="grid h-10 w-10 place-items-center rounded-lg bg-white/10 text-white transition duration-200 hover:scale-110 hover:bg-white/20 active:scale-95"
                      >
                        <ChevronLeft size={19} />
                      </button>
                      <button
                        type="button"
                        onClick={goToNextSlide}
                        className="grid h-10 w-10 place-items-center rounded-lg bg-white/10 text-white transition duration-200 hover:scale-110 hover:bg-white/20 active:scale-95"
                      >
                        <ChevronRight size={19} />
                      </button>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-bold text-white/60">Focus</p>
                    <strong className="mt-2 block text-5xl font-black">
                      {item.metric}
                    </strong>
                    <p className="mt-2 text-sm font-bold text-white/70">
                      {item.metricLabel}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        {stats.map((stat) => {
          const StatIcon = stat.icon;

          return (
            <div
              key={stat.label}
              className={`group relative overflow-hidden rounded-lg border border-stone-200 bg-gradient-to-br ${stat.className} p-4 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg`}
            >
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/60" />
              <div className="relative flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-wide opacity-65">
                    {stat.label}
                  </p>
                  <strong className="mt-2 block text-4xl font-black">
                    {stat.value}
                  </strong>
                </div>

                <div
                  className={`grid h-12 w-12 place-items-center rounded-lg shadow-lg transition duration-200 group-hover:scale-110 group-hover:-rotate-3 ${stat.iconClass}`}
                >
                  <StatIcon size={22} />
                </div>
              </div>

              <p className="relative mt-3 text-sm font-semibold opacity-70">
                {stat.hint}
              </p>
            </div>
          );
        })}
      </section>

      <section className="grid gap-3 lg:grid-cols-3">
        {actions.map((action) => {
          const Icon = action.icon;

          return (
            <Link
              key={action.title}
              to={action.to}
              className={`group relative overflow-hidden rounded-lg bg-gradient-to-br ${action.className} p-5 text-white shadow-lg transition duration-200 hover:-translate-y-1 hover:shadow-xl active:scale-[0.99]`}
            >
              <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-white/15 transition duration-300 group-hover:scale-125" />
              <div className="relative mb-7 flex items-center justify-between">
                <div className="grid h-12 w-12 place-items-center rounded-lg bg-white/15 text-white backdrop-blur transition duration-200 group-hover:scale-110 group-hover:bg-white group-hover:text-stone-950">
                  <Icon
                    size={22}
                    className="transition duration-200 group-hover:-rotate-6"
                  />
                </div>
                <ArrowUpRight
                  size={19}
                  className="text-white/55 transition duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-white"
                />
              </div>

              <span className="relative rounded-full bg-white/15 px-3 py-1 text-xs font-black uppercase tracking-wide text-white/80">
                {action.label}
              </span>
              <h3 className="relative mt-4 text-xl font-black leading-tight">
                {action.title}
              </h3>
              <p className="relative mt-2 text-sm leading-6 text-white/75">
                {action.text}
              </p>
            </Link>
          );
        })}
      </section>
    </div>
  );
}

