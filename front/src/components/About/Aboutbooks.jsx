import { useEffect, useState } from "react";
import { FiBookOpen, FiClock, FiUsers } from "react-icons/fi";

export default function About() {
  const [booksCount, setBooksCount] = useState(0);
  const [usersCount, setUsersCount] = useState(0);

  useEffect(() => {
    // Fetch books count
    fetch("http://localhost:3000/api/books")
      .then((res) => res.json())
      .then((responseData) => {
        const data = responseData.data || [];
        setBooksCount(data.length); // number of books
      })
      .catch((error) => {
        console.error("Error fetching books:", error);
      });

    // Fetch users count
    fetch("http://localhost:3000/api/users")
      .then((res) => res.json())
      .then((responseData) => {
        const data = responseData.data || [];
        setUsersCount(data.length); // number of readers
      })
      .catch((error) => {
        console.error("Error fetching users:", error);
      });
  }, []);

  const box =
    "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow p-5 w-full hover:shadow-md rounded-xl flex flex-col items-center justify-center transition-colors duration-200";

  return (
    <section className="py-12 mt-10">
      <div className="grid grid-cols-1 md:grid-cols-3 text-center gap-8 px-6 lg:px-20">
        {/* BOOKS COUNT */}

        <div className={box}>
          <FiBookOpen className="text-4xl text-blue-600 dark:text-blue-400 mb-2" />
          <p className="text-3xl text-blue-600 dark:text-blue-400 font-bold"> {booksCount}+</p>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Books Available</p>
        </div>

        {/* USERS COUNT */}

        <div className={box}>
          <FiUsers className="text-4xl text-blue-600 dark:text-blue-400 mb-2" />
          <p className="text-3xl text-blue-600 dark:text-blue-400 font-bold">{usersCount}+</p>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Happy Readers</p>
        </div>

        {/* YEARS OF SERVICE */}
        <div className={box}>
          <FiClock className="text-4xl text-blue-600 dark:text-blue-400 mb-2" />
          <h3 className="text-3xl font-bold text-blue-600 dark:text-blue-400">5 Years</h3>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Of Service</p>
        </div>
      </div>
    </section>
  );
}
