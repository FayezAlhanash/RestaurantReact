import { ClipboardX } from "lucide-react";
import { getStoredUser } from "../../utils/auth";

function getUserName(user) {
    return (
        user?.name ||
        [user?.first_name, user?.last_name].filter(Boolean).join(" ") ||
        user?.email ||
        "User"
    );
}

export default function NoTasks() {
    const user = getStoredUser();

    return (
        <div className="grid min-h-[calc(100dvh-88px)] place-items-center p-6">
            <section className="w-full max-w-xl rounded-2xl border border-[#E8DCD4] bg-[#FFFDFB] p-8 text-center shadow-[0_18px_45px_rgba(70,45,30,0.08)]">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[#F9ECEC] text-[#7F1D1D]">
                    <ClipboardX size={30} />
                </div>
                <p className="mt-5 text-xs font-black uppercase tracking-[0.18em] text-[#9A7A70]">
                    No assigned tasks
                </p>
                <h1 className="mt-2 text-2xl font-black text-[#241F1D]">
                    {getUserName(user)}, you do not have any tasks yet.
                </h1>
                <p className="mt-3 text-sm font-semibold leading-6 text-[#7A6A64]">
                    Ask an admin to assign permissions to your role. Once a task is
                    assigned, it will appear automatically in the sidebar.
                </p>
            </section>
        </div>
    );
}
