import CategoryTabs from "./CategoryTabs"
import RightSidebar from "./RightSidebar"
import TopBar from "./TopBar"
import MenuItemCard from "./MenuItem"
import { useState } from "react"
import ProductModal from "./ProductModal"
import menuData from "../../data/menuData";
import OrderSidebar from "./OrderSidebar"
function CashierDashboard() {
    const [openModal, setOpenModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [activeCategory, setActiveCategory] = useState("shawarma");
    const [cartItems, setCartItems] = useState([])
    return (
        <div className="min-h-screen bg-[#F5F1EB] flex font-['lemon'] ">

            {/* Left Side */}
           <div className="w-[320px] h-screen sticky top-0 bg-white border-r">
                <OrderSidebar
                    cartItems={cartItems}
                    setCartItems={setCartItems}
                />
            </div>

            {/* Center */}
            <div className="flex-1 bg-[#F8F5F1]">
                <TopBar />
                <CategoryTabs
                    activeCategory={activeCategory}
                    setActiveCategory={setActiveCategory}
                />
                <div className="grid grid-cols-4 gap-6 px-6">

                    {
                        menuData.map((item) => (

                            <MenuItemCard
                                key={item.id}
                                item={item}
                                onOpen={() => {
                                    setSelectedItem(item)
                                    setOpenModal(true)
                                }}
                            />

                        ))
                    }
                </div>

                <ProductModal
                    isOpen={openModal}
                    onClose={() => setOpenModal(false)}
                    item={selectedItem}
                    addToCart={(product) => {
                        setCartItems([...cartItems, product])
                    }}
                />
            </div>

            {/* Right Side */}
            <div className="w-[90px] h-screen sticky top-0 bg-white border-l">
                <RightSidebar />
            </div>

        </div>
    )
}

export default CashierDashboard