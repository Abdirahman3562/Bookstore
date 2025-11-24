import { useEffect, useState } from "react";
import { FiBookOpen, FiGift, FiShoppingCart } from "react-icons/fi";
import { useCountUp } from "./useCountUp";

export default function BooksStats() {
  const [allBooks, setAllBooks] = useState(0);
  const [freeBooks, setFreeBooks] = useState(0);
  const [buyBooks, setBuyBooks] = useState(0);

  const [ready, setReady] = useState(false);

  useEffect(() => {
    fetch("http://localhost:5100/books")
      .then((res) => res.json())
      .then((data) => {
        const free = data.filter((b) => {
          const price = String(b.price).toLowerCase();
          return price === "free" || price === "0" || b.price === 0;
        }).length;

        setAllBooks(data.length);
        setFreeBooks(free);
        setBuyBooks(data.length - free);

        setReady(true);
      });
  }, []);

  // 👉 Animate ONLY when data is ready
  const countAll = useCountUp(ready ? allBooks : 0);
  const countFree = useCountUp(ready ? freeBooks : 0);
  const countBuy = useCountUp(ready ? buyBooks : 0);

  const box =
    "bg-white border shadow hover:shadow-md  p-5 w-full rounded-xl flex flex-col items-center justify-center";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mx-auto mt-10">

      {/* ALL BOOKS */}
      <div className={box}>
        <FiBookOpen className="text-4xl text-blue-600 mb-2" />
        <p className="text-3xl text-blue-600  font-bold">{countAll}</p>
        <p className="text-gray-600 text-sm mt-1">ALL BOOKS</p>
      </div>

      {/* FREE BOOKS */}
      <div className={box}>
        <FiGift className="text-4xl text-green-600 mb-2" />
        <p className="text-3xl text-blue-600  font-bold">{countFree}</p>
        <p className="text-gray-600 text-sm mt-1">FREE BOOKS</p>
      </div>

      {/* BUY BOOKS */}
      <div className={box}>
        <FiShoppingCart className="text-4xl text-purple-600 mb-2" />
        <p className="text-3xl text-blue-600  font-bold">{countBuy}</p>
        <p className="text-gray-600 text-sm mt-1">BUY BOOKS</p>
      </div>

    </div>
  );
}
