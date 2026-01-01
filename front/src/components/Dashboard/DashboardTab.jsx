    import { useEffect, useState } from "react";
    import { FiDownload, FiClock, FiLoader, FiPackage } from "react-icons/fi";

    export default function DashboardTab() {
    const [downloads, setDownloads] = useState(0);
    const [pending, setPending] = useState(0);
    const [active, setActive] = useState(0);
    const [totalOrders, setTotalOrders] = useState(0);

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem("user"));
        if (!user) return;

        const userId = (user._id || user.id)?.toString(); // Convert to string
        const userEmail = user.email?.toLowerCase(); // Normalize email

        // Fetch Orders
        const adminToken = localStorage.getItem("admin_token");
        const userToken = localStorage.getItem("token");
        const token = adminToken || userToken;
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        fetch("http://localhost:3000/api/purchased", { headers })
        .then((res) => res.json())
        .then((responseData) => {
            const data = responseData.data || [];
            const userOrders = data.filter((o) => {
                const orderUserId = o.userId?.toString();
                const orderEmail = o.email?.toLowerCase();
                return (
                    orderUserId === userId ||
                    orderEmail === userEmail ||
                    (o.userId && o.userId.toString() === userId) ||
                    (o.email && o.email.toLowerCase() === userEmail)
                );
            });

            setPending(userOrders.filter((o) => o.status === "pending").length);
            setActive(
            userOrders.filter(
                (o) => o.status === "active" || o.status === "processing" || o.status === "approved"
            ).length
            );
            setTotalOrders(userOrders.length);
        })
        .catch((error) => {
            console.error("Error fetching orders:", error);
        });

        // Fetch Downloads
        fetch("http://localhost:3000/api/downloads", { headers })
        .then((res) => res.json())
        .then((responseData) => {
            const data = responseData.data || [];
            const userDownloads = data.filter((d) => {
                const downloadUserId = d.userId?.toString();
                return (
                    downloadUserId === userId ||
                    d.userId === userId ||
                    (d.userId && d.userId.toString() === userId) ||
                    d.userId === user.id
                );
            });
            setDownloads(userDownloads.length);
        })
        .catch((error) => {
            console.error("Error fetching downloads:", error);
        });
    }, []);

    return (
        <div>
        <h1 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">Welcome to your dashboard</h1>

        {/* GRID BOXES */}
        <div className="w-full flex justify-center">

        <div className="flex gap-5 w-full lg:flex-row md:flex-row flex-col">

            {/* DOWNLOADS */}
            <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 shadow p-3 w-full rounded-xl flex flex-col items-center justify-center hover:shadow-lg transition-colors duration-200">
            <FiDownload className="text-4xl text-blue-500 dark:text-blue-400 mb-2" />
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{downloads}</p>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Downloaded Books</p>
            </div>

            {/* PENDING */}
            <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 shadow p-5 w-full rounded-xl flex flex-col items-center justify-center hover:shadow-lg transition-colors duration-200">
            <FiClock className="text-4xl text-blue-500 dark:text-blue-400 mb-2" />
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{pending}</p>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Pending Orders</p>
            </div>

            {/* ACTIVE/APPROVED */}
            <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 shadow p-5 w-full rounded-xl flex flex-col items-center justify-center hover:shadow-lg transition-colors duration-200">
            <FiLoader className="text-4xl text-green-500 dark:text-green-400 mb-2" />
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">{active}</p>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Approved Orders</p>
            </div>

            {/* TOTAL ORDERS */}
            <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 shadow p-5 w-full rounded-xl flex flex-col items-center justify-center hover:shadow-lg transition-colors duration-200">
            <FiPackage className="text-4xl text-blue-500 dark:text-blue-400 mb-2" />
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{totalOrders}</p>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Total Orders</p>
            </div>

        </div>
        </div>
        </div>
    );
    }
