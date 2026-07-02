import { NavLink, Outlet } from "react-router-dom";
import { useState } from "react";
import { Bell, Menu, Search, Settings2 } from "lucide-react";
import ManagerSidebar from "./ManagerSidebar";

const mobileLinks = [
  { to: "/manager/dashboard", label: "Dashboard" },
  { to: "/manager/add-menu", label: "Menu" },
  { to: "/manager/add-food", label: "Foods" },
];

export default function ManagerLayout() {
  const [search, setSearch] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f5f2ec] font-raleway text-stone-950">
      <div className="flex min-h-screen">
        {isSidebarOpen && (
          <button
            type="button"
            aria-label="Close sidebar"
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-stone-950/35 backdrop-blur-sm lg:hidden"
          />
        )}

        <ManagerSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-stone-200 bg-[#f5f2ec]/95 px-4 py-4 backdrop-blur md:px-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-[#7F1D1D]">
                    Manager
                  </p>
                  <h2 className="text-2xl font-black text-stone-950">
                    Menu operations
                  </h2>
                </div>

                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className="grid h-11 w-11 place-items-center rounded-lg border border-stone-200 bg-white text-stone-700 shadow-sm transition duration-200 hover:scale-110 hover:border-[#7F1D1D]/30 hover:text-[#7F1D1D] hover:shadow-md active:scale-95 lg:hidden"
                >
                  <Menu size={20} />
                </button>
              </div>

              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <div className="flex min-w-0 items-center gap-3 rounded-lg border border-stone-200 bg-white px-4 py-3 shadow-sm transition duration-200 focus-within:scale-[1.01] focus-within:border-[#7F1D1D]/40 focus-within:shadow-md md:w-[360px]">
                  <Search size={18} className="shrink-0 text-stone-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search menu, category, food..."
                    className="min-w-0 flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-stone-400"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button className="group grid h-11 w-11 place-items-center rounded-lg border border-stone-200 bg-white text-stone-600 shadow-sm transition duration-200 hover:scale-110 hover:border-[#7F1D1D]/30 hover:text-[#7F1D1D] hover:shadow-md active:scale-95">
                    <Bell size={18} className="transition duration-200 group-hover:-rotate-12" />
                  </button>
                  <button className="group grid h-11 w-11 place-items-center rounded-lg border border-stone-200 bg-white text-stone-600 shadow-sm transition duration-200 hover:scale-110 hover:border-[#7F1D1D]/30 hover:text-[#7F1D1D] hover:shadow-md active:scale-95">
                    <Settings2 size={18} className="transition duration-300 group-hover:rotate-45" />
                  </button>
                </div>
              </div>
            </div>

            <nav className="mt-4 flex gap-2 overflow-x-auto lg:hidden">
              {mobileLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `whitespace-nowrap rounded-lg px-4 py-2 text-sm font-bold transition duration-200 hover:scale-105 hover:shadow-sm active:scale-95 ${
                      isActive
                        ? "bg-[#7F1D1D] text-white"
                        : "bg-white text-stone-600"
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>
          </header>

          <main className="flex-1 overflow-y-auto px-4 py-6 md:px-6">
            <Outlet context={{ search }} />
          </main>
        </div>
      </div>
    </div>
  );
}

