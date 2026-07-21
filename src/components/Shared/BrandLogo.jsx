import big4Logo from "../../assets/big4-logo.jpg";

function BrandLogo({ className = "h-11 w-11", rounded = "rounded-2xl" }) {
    return (
        <div className={`shrink-0 overflow-hidden ${rounded} ${className} bg-[#7F1D1D] shadow-sm`}>
            <img
                src={big4Logo}
                alt="Big-4"
                className="h-full w-full object-cover"
                draggable="false"
            />
        </div>
    );
}

export default BrandLogo;
