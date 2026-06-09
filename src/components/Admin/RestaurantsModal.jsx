import { useState, useEffect } from "react";
import { ImagePlus } from "lucide-react";
import api from "../../API/axios";
function RestaurantModal({
    isOpen,
    onClose,
    onSave,
    restaurant
}) {

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [tax, setTax] = useState("");
    const [frontImage, setFrontImage] = useState(null);
    const [backImage, setBackImage] = useState(null);
    useEffect(() => {

        if (restaurant) {

            setName(restaurant.name || "");
            setDescription(
                restaurant.description || ""
            );
            setTax(
                restaurant.tax_percentage || ""
            );

        }

    }, [restaurant]);
    if (!isOpen) return null;


    return (
        <div
            className="
                fixed
                inset-0
                bg-black/50
                backdrop-blur-sm
                flex
                items-center
                justify-center
                z-50
            "
        >
            <div
                className="
        bg-white
        w-[800px]
        rounded-[32px]
        p-5
        shadow-2xl
    "
            >
                <h2 className="text-3xl font-bold mb-5">
                    Add Restaurant
                </h2>

                {/* Images */}
                <div className="grid grid-cols-2 gap-6 mb-8">

                    <label
                        className="
        h-40
        border-2
        border-dashed
        border-red-200
        rounded-3xl
        flex
        flex-col
        items-center
        justify-center
        cursor-pointer
    "
                    >
                        <input
                            type="file"
                            hidden
                            onChange={(e) =>
                                setFrontImage(e.target.files[0])
                            }
                        />
                        <ImagePlus size={48} />

                        <h3>Front Image</h3>

                        <p>
                            {frontImage
                                ? frontImage.name
                                : "Click to upload image"}
                        </p>
                    </label>
                    <label
                        className="
        h-40
        border-2
        border-dashed
        border-red-200
        rounded-3xl
        flex
        flex-col
        items-center
        justify-center
        cursor-pointer
    "
                    >
                        <input
                            type="file"
                            hidden
                            onChange={(e) =>
                                setBackImage(e.target.files[0])
                            }
                        />

                        <ImagePlus size={48} />

                        <h3>Back Image</h3>

                        <p>
                            {backImage
                                ? backImage.name
                                : "Click to upload image"}
                        </p>
                    </label>

                </div>

                {/* Name */}
                <div className="mb-5">
                    <label className="font-semibold block mb-2">
                        Restaurant Name
                    </label>

                    <input
                        type="text"
                        placeholder="Enter restaurant name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="
        w-full
        border
        rounded-2xl
        p-4
        outline-none
        focus:border-red-800
    "
                    />
                </div>

                {/* Description */}
                <div className="mb-5">
                    <label className="font-semibold block mb-2">
                        Description
                    </label>

                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Restaurant description..."
                        className="
        w-full
        h-20
        border
        rounded-2xl
        p-4
        resize-none
        outline-none
        focus:border-red-800
    "
                    />
                </div>

                {/* Tax */}
                <div className="mb-8">
                    <label className="font-semibold block mb-2">
                        Tax (%)
                    </label>

                    <input
                        type="number"
                        value={tax}
                        onChange={(e) => setTax(e.target.value)}
                        placeholder="10"
                        className="
        w-full
        border
        rounded-2xl
        p-4
        outline-none
        focus:border-red-800
    "
                    />
                </div>

                {/* Buttons */}
                <div className="flex justify-end gap-4">

                    <button
                        onClick={onClose}
                        className="
                        cursor-pointer
                            px-8
                            py-3
                            rounded-2xl
                            border
                            hover:bg-gray-100
                            transition
                        "
                    >
                        Cancel
                    </button>

                    <button
                        onClick={async () => {

                            try {

                                const formData = new FormData();

                                formData.append("name", name);
                                if (frontImage) {
                                    formData.append("front_image", frontImage);
                                }

                                if (backImage) {
                                    formData.append("back_image", backImage);
                                }
                                formData.append("description", description);
                                formData.append("delivery_time", 30);
                                formData.append("tax_percentage", tax);

                                if (restaurant) {

                                    const response = await api.post(
                                        `/restaurants/${restaurant.id}`,
                                        formData
                                    );

                                    console.log(response.data);

                                    onSave(response.data.restaurant);

                                } else {

                                    const response = await api.post(
                                        "/restaurants",
                                        formData
                                    );

                                    console.log(response.data);

                                    onSave(response.data.restaurant);
                                }
                                setName("");
                                setDescription("");
                                setTax("");
                                setFrontImage(null);
                                setBackImage(null);

                                onClose();

                            } catch (error) {

                                console.log("ERROR:", error);
                                console.log("DATA:", error.response?.data);
                                console.log("STATUS:", error.response?.status);

                            }
                        }}
                        className="
        cursor-pointer
        px-8
        py-3
        bg-red-900
        text-white
        rounded-2xl
        hover:bg-red-950
        transition
    "
                    >
                        {restaurant
                            ? "Update Restaurant"
                            : "Save Restaurant"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default RestaurantModal;