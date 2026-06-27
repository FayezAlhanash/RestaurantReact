import CategoryTabs from "./CategoryTabs"
import RightSidebar from "./RightSidebar"
import TopBar from "./TopBar"
import MenuItemCard from "./MenuItem"
import { useState } from "react"
import ProductModal from "./ProductModal"
import menuData from "../../Data/MenuData";
import OrderSidebar from "./OrderSidebar"
function CashierDashboard() {
    const [openModal, setOpenModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [activeCategory, setActiveCategory] = useState("shawarma");
    const [cartItems, setCartItems] = useState([])
    return (
        <div className="min-h-screen bg-gradient-to-br from-[#ffffff] to-[#c0b29f] flex flex-col md:flex-row font-[Raleway]">
            {/* Left Side */}
            <div className="order-2 w-full bg-white border-t md:order-none md:w-[320px] md:h-screen md:border-r md:border-t-0">
                <OrderSidebar
                    cartItems={cartItems}
                    setCartItems={setCartItems}
                />
            </div>

            {/* Center */}
            <div className="order-1 min-w-0 flex-1 bg-[#F8F5F1] md:order-none">
                <TopBar />
                <CategoryTabs
                    activeCategory={activeCategory}
                    setActiveCategory={setActiveCategory}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6 xl:gap-8 px-4 sm:px-6 lg:px-8 pb-8">

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
            <div className="hidden md:block w-[90px] h-screen bg-white border-l">
                <RightSidebar />
            </div>

        </div>
    )
}

export default CashierDashboard
