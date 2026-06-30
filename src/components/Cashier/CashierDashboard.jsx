import { useMemo, useState } from "react";
import CategoryTabs from "./CategoryTabs";
import MenuItemCard from "./MenuItem";
import OrderSidebar from "./OrderSidebar";
import ProductModal from "./ProductModal";
import RightSidebar from "./RightSidebar";
import TopBar from "./TopBar";
import menuData from "../../Data/MenuData";

function CashierDashboard() {
    const [openModal, setOpenModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [activeCategory, setActiveCategory] = useState("all");
    const [search, setSearch] = useState("");
    const [cartItems, setCartItems] = useState([]);

    const visibleItems = useMemo(() => {
        const query = search.trim().toLowerCase();

        return menuData.filter((item) => {
            const matchesCategory = activeCategory === "all" || item.category === activeCategory;
            const matchesSearch = !query || `${item.title} ${item.description}`.toLowerCase().includes(query);
            return matchesCategory && matchesSearch;
        });
    }, [activeCategory, search]);

    const addToCart = (product) => {
        setCartItems((current) => {
            const existingIndex = current.findIndex(
                (item) => item.id === product.id && item.size === product.size && item.notes === product.notes
            );

            if (existingIndex === -1) return [...current, product];

            return current.map((item, index) =>
                index === existingIndex
                    ? { ...item, quantity: item.quantity + product.quantity }
                    : item
            );
        });
    };

    return (
        <div className="min-h-dvh bg-[#F5F1EB] font-[Raleway] text-[#261F1D] lg:flex lg:h-dvh lg:overflow-hidden">
            <aside className="hidden shrink-0 lg:block">
                <RightSidebar />
            </aside>

            <main className="min-w-0 flex-1 lg:overflow-y-auto">
                <TopBar search={search} setSearch={setSearch} cartCount={cartItems.length} />

                <section className="px-4 pb-10 sm:px-6 xl:px-8">
                    <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p className="mb-1 text-xs font-bold uppercase tracking-[0.2em] text-[#9A7A70]">Today&apos;s menu</p>
                            <h1 className="text-2xl font-extrabold sm:text-3xl">Choose an item</h1>
                        </div>
                        <p className="text-sm font-medium text-[#806F69]">{visibleItems.length} items available</p>
                    </div>

                    <CategoryTabs activeCategory={activeCategory} setActiveCategory={setActiveCategory} />

                    {visibleItems.length > 0 ? (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                            {visibleItems.map((item) => (
                                <MenuItemCard
                                    key={item.id}
                                    item={item}
                                    onOpen={() => {
                                        setSelectedItem(item);
                                        setOpenModal(true);
                                    }}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-[28px] border border-dashed border-[#D8C8C1] bg-white/70 px-6 py-16 text-center">
                            <h2 className="text-xl font-bold">No items found</h2>
                            <p className="mt-2 text-[#806F69]">Try another category or search phrase.</p>
                        </div>
                    )}
                </section>

                <ProductModal
                    isOpen={openModal}
                    onClose={() => setOpenModal(false)}
                    item={selectedItem}
                    addToCart={addToCart}
                />
            </main>

            <aside className="border-t border-[#E9DED8] bg-white lg:h-dvh lg:w-[360px] lg:shrink-0 lg:border-l lg:border-t-0 xl:w-[390px]">
                <OrderSidebar cartItems={cartItems} setCartItems={setCartItems} />
            </aside>
        </div>
    );
}

export default CashierDashboard;
