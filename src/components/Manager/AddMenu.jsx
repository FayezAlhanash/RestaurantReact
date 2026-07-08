import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  CheckCircle2,
  Edit3,
  Layers3,
  ListTree,
  Plus,
  Tags,
  Trash2,
} from "lucide-react";
import CategoryModal from "./CategoryModal";
import api from "../../API/axios";
import {
  filterCategoriesByRestaurant,
  getManagerRestaurantId,
  getResponseList,
} from "./managerHelpers";

const tabs = [
  {
    id: "categories",
    label: "Categories",
    icon: Tags,
    description: "The sections customers and cashiers browse first.",
    inactiveClass: "border-sky-200 bg-sky-50 text-sky-900 hover:border-sky-300",
    iconClass: "text-sky-700",
  },
  {
    id: "groups",
    label: "Modifier Groups",
    icon: Layers3,
    description: "Extras like size, toppings, sauces, and cooking style.",
    inactiveClass:
      "border-amber-200 bg-amber-50 text-amber-900 hover:border-amber-300",
    iconClass: "text-amber-700",
  },
  {
    id: "options",
    label: "Modifier Options",
    icon: ListTree,
    description: "The selectable choices that sit inside each group.",
    inactiveClass:
      "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-900 hover:border-fuchsia-300",
    iconClass: "text-fuchsia-700",
  },
];

export default function AddMenu() {
  const { search = "" } = useOutletContext() ?? {};
  const [activeTab, setActiveTab] = useState("categories");
  const [openCategoryModal, setOpenCategoryModal] = useState(false);
  const [categories, setCategories] = useState([]);

  const fetchCategories = async () => {
    try {
      const restaurantId = getManagerRestaurantId();
      const res = await api.get("/categories", {
        params: restaurantId ? { restaurant_id: restaurantId } : undefined,
      });
      const categoryList = getResponseList(res.data, ["categories"]);

      setCategories(filterCategoriesByRestaurant(categoryList, restaurantId));
    } catch (err) {
      console.error(err.response?.data || err);
    }
  };

  const handleSaveCategory = async (data) => {
    try {
      const restaurantId = getManagerRestaurantId();
      const formData = new FormData();

      formData.append("restaurant_id", restaurantId);
      formData.append("name", data.name);
      formData.append("is_active", data.is_active);

      await api.post("/categories", formData);
      await fetchCategories();
      setOpenCategoryModal(false);
    } catch (err) {
      console.error(err.response?.data || err);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCategories();
  }, []);

  const activeTabData = tabs.find((tab) => tab.id === activeTab);
  const normalizedSearch = search.trim().toLowerCase();
  const filteredCategories = categories.filter((category) => {
    if (!normalizedSearch) return true;

    return [
      category.name,
      category.is_active ? "active" : "inactive",
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(normalizedSearch));
  });

  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <div>
          <p className="text-sm font-black uppercase tracking-wide text-[#7F1D1D]">
            Menu Builder
          </p>
          <h1 className="mt-2 text-3xl font-black text-stone-950">
            Shape the restaurant menu
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-500">
            Manage categories now, then plug modifier groups and options into
            the same workspace when those flows are ready.
          </p>
        </div>

        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md">
          <p className="text-sm font-bold text-emerald-700">Live categories</p>
          <div className="mt-3 flex items-end justify-between">
            <strong className="text-4xl font-black text-emerald-950">
              {categories.length}
            </strong>
            <span className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-black text-emerald-700">
              Active setup
            </span>
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`group rounded-lg border p-4 text-left transition duration-200 hover:-translate-y-1 hover:scale-[1.01] hover:shadow-md active:scale-[0.99] ${
                isActive
                  ? "border-[#7F1D1D] bg-[#7F1D1D] text-white shadow-lg shadow-[#7F1D1D]/15"
                  : `${tab.inactiveClass} shadow-sm`
              }`}
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <Icon
                  size={21}
                  className={`transition duration-200 group-hover:scale-110 group-hover:-rotate-6 ${
                    isActive ? "text-white" : tab.iconClass
                  }`}
                />
                {isActive && <CheckCircle2 size={18} />}
              </div>
              <h2 className="font-black">{tab.label}</h2>
              <p
                className={`mt-2 text-sm leading-5 ${
                  isActive ? "text-white/75" : "text-stone-500"
                }`}
              >
                {tab.description}
              </p>
            </button>
          );
        })}
      </section>

      <section className="rounded-lg border border-stone-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-stone-200 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-bold text-stone-500">
              {activeTab === "categories" && normalizedSearch
                ? `${filteredCategories.length} result${filteredCategories.length === 1 ? "" : "s"} for "${search}"`
                : activeTabData.description}
            </p>
            <h2 className="mt-1 text-2xl font-black text-stone-950">
              {activeTabData.label}
            </h2>
          </div>

          {activeTab === "categories" && (
            <button
              onClick={() => setOpenCategoryModal(true)}
              className="group inline-flex items-center justify-center gap-2 rounded-lg bg-[#7F1D1D] px-4 py-3 text-sm font-black text-white shadow-lg shadow-[#7F1D1D]/20 transition duration-200 hover:-translate-y-0.5 hover:scale-105 hover:bg-[#651717] hover:shadow-xl active:translate-y-0 active:scale-100"
            >
              <Plus size={18} className="transition duration-200 group-hover:rotate-90" />
              Add Category
            </button>
          )}
        </div>

        {activeTab === "categories" && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px]">
              <thead className="bg-stone-50 text-xs font-black uppercase tracking-wide text-stone-500">
                <tr>
                  <th className="px-5 py-4 text-left">Name</th>
                  <th className="px-5 py-4 text-left">Status</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-stone-100">
                {filteredCategories.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="px-5 py-16 text-center">
                      <div className="mx-auto grid h-14 w-14 place-items-center rounded-lg bg-[#f4e7dc] text-[#7F1D1D]">
                        <Tags size={24} />
                      </div>
                      <h3 className="mt-4 text-lg font-black text-stone-950">
                        {normalizedSearch
                          ? "No matching categories"
                          : "No categories yet"}
                      </h3>
                      <p className="mt-2 text-sm text-stone-500">
                        {normalizedSearch
                          ? "Try another category name or status."
                          : "Start with the sections your cashier will use every day."}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredCategories.map((category) => (
                    <tr key={category.id} className="transition duration-200 hover:bg-stone-50">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="grid h-10 w-10 place-items-center rounded-lg bg-[#f4e7dc] text-[#7F1D1D] transition duration-200 group-hover:scale-105">
                            <Tags size={18} />
                          </div>
                          <span className="font-black text-stone-900">
                            {category.name}
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${
                            category.is_active
                              ? "border border-emerald-200 bg-emerald-100 text-emerald-800 shadow-sm shadow-emerald-100"
                              : "border border-rose-200 bg-rose-100 text-rose-800 shadow-sm shadow-rose-100"
                          }`}
                        >
                          <span
                            className={`mr-1 inline-block h-2 w-2 rounded-full ${
                              category.is_active ? "bg-emerald-500" : "bg-rose-500"
                            }`}
                          />
                          {category.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button className="group relative grid h-9 w-9 place-items-center rounded-lg border border-stone-200 bg-white text-stone-500 shadow-sm transition duration-200 hover:scale-110 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700 hover:shadow-md active:scale-95">
                            <Edit3 size={16} className="transition duration-200 group-hover:-rotate-6" />
                            <span className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 rounded-md bg-stone-950 px-2 py-1 text-xs font-bold text-white opacity-0 shadow-lg transition duration-200 group-hover:opacity-100">
                              Edit
                            </span>
                          </button>
                          <button className="group relative grid h-9 w-9 place-items-center rounded-lg border border-stone-200 bg-white text-rose-500 shadow-sm transition duration-200 hover:scale-110 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 hover:shadow-md active:scale-95">
                            <Trash2 size={16} className="transition duration-200 group-hover:rotate-6" />
                            <span className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 rounded-md bg-stone-950 px-2 py-1 text-xs font-bold text-white opacity-0 shadow-lg transition duration-200 group-hover:opacity-100">
                              Delete
                            </span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab !== "categories" && (
          <div className="px-5 py-16 text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-lg bg-stone-100 text-stone-500">
              {activeTab === "groups" ? (
                <Layers3 size={28} />
              ) : (
                <ListTree size={28} />
              )}
            </div>
            <h3 className="mt-4 text-xl font-black text-stone-950">
              {activeTabData.label} coming next
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-stone-500">
              The page is styled and ready for the workflow. When the backend is
              done, we can connect the table, modal, and save action here.
            </p>
          </div>
        )}
      </section>

      <CategoryModal
        isOpen={openCategoryModal}
        onClose={() => setOpenCategoryModal(false)}
        onSave={handleSaveCategory}
      />
    </div>
  );
}

