import { useEffect, useState } from "react";
import { FiBookOpen, FiGift, FiShoppingCart } from "react-icons/fi";
import { useCountUp } from "./useCountUp";
import { getTenantUrl, getTenantHeaders } from "../../utils/tenantUtils";

export default function BooksStats() {
  const [allBooks, setAllBooks] = useState(0);
  const [freeBooks, setFreeBooks] = useState(0);
  const [buyBooks, setBuyBooks] = useState(0);

  const [ready, setReady] = useState(false);

  useEffect(() => {
    const fetchBooksStats = async () => {
      try {
        const url = getTenantUrl("http://localhost:3000/api/books");
        const headers = getTenantHeaders();

        const response = await fetch(url, { headers });
        const responseData = await response.json();

        const data = responseData.data || [];
        const free = data.filter((b) => {
          const price = String(b.price).toLowerCase();
          return price === "free" || price === "0" || b.price === 0;
        }).length;

        setAllBooks(data.length);
        setFreeBooks(free);
        setBuyBooks(data.length - free);

        setReady(true);
      } catch (error) {
        console.error("Error fetching books:", error);
        setReady(true);
      }
    };

    fetchBooksStats();
  }, []);

  // 👉 Animate ONLY when data is ready
  const countAll = useCountUp(ready ? allBooks : 0);
  const countFree = useCountUp(ready ? freeBooks : 0);
  const countBuy = useCountUp(ready ? buyBooks : 0);

  const box =
    "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow hover:shadow-md px-5 py-5 w-full rounded-xl flex flex-col items-center justify-center transition-colors duration-200";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6  lg:p-0 md:p-0 p-4 mx-auto mt-10">

      {/* ALL BOOKS */}
      <div className={box}>
        <FiBookOpen className="text-4xl text-blue-600 dark:text-blue-400 mb-2" />
        <p className="text-3xl text-blue-600 dark:text-blue-400 font-bold">{countAll}</p>
        <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">ALL BOOKS</p>
      </div>

      {/* FREE BOOKS */}
      <div className={box}>
        <FiGift className="text-4xl text-green-600 dark:text-green-400 mb-2" />
        <p className="text-3xl text-green-600 dark:text-green-400 font-bold">{countFree}</p>
        <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">FREE BOOKS</p>
      </div>

      {/* BUY BOOKS */}
      <div className={box}>
        <FiShoppingCart className="text-4xl text-purple-600 dark:text-purple-400 mb-2" />
        <p className="text-3xl text-purple-600 dark:text-purple-400 font-bold">{countBuy}</p>
        <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">BUY BOOKS</p>
      </div>

    </div>
  );
}
