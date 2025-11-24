import Aboutbooks from "../components/About/Aboutbooks";
export default function About() {
  return (
    <div className="w-full bg-white pt-20">
      {/* HERO SECTION */}
      <section className="text-center px-6 py-10">
        <h1 className="text-4xl font-bold text-blue-600 mb-3">
          About Our Bookstore
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto text-lg">
          We are passionate about connecting readers with amazing books. Our
          mission is to make reading easier, accessible, and enjoyable for
          everyone.
        </p>
      </section>

      {/* IMAGE + TEXT SECTION */}
      <section className="px-6 lg:px-20 py-10 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
        {/* IMAGE */}
        <img
          src="/images/about.jpg"
          alt="About Us"
          className="rounded-xl shadow-lg w-full object-cover"
        />

        {/* TEXT */}
        <div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Who We Are</h2>
          <p className="text-gray-600 leading-7 mb-4">
            BookStore is a digital platform built to help readers explore,
            discover, and enjoy thousands of books across different genres. Our
            mission is to create a seamless reading experience for book lovers
            around the world.
          </p>
          <p className="text-gray-600 leading-7">
            Whether you're into fiction, self-help, technology, or history, you
            will always find something inspiring here.
          </p>
        </div>
      </section>

      {/* HIGHLIGHTS / STATS */}
      <Aboutbooks />

      {/* MISSION SECTION */}
      <section className="px-6 lg:px-20 py-16 text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-3">Our Mission</h2>
        <p className="text-gray-600 max-w-3xl mx-auto leading-7 text-lg">
          To inspire the love of reading and provide a modern platform where
          readers can discover, buy, and download books instantly. We believe
          that knowledge should be accessible for everyone.
        </p>
      </section>

      {/* TEAM / FOUNDER CARD */}
      <section className="px-6 lg:px-20 pb-20">
        <div
          className="max-w-6xl mx-auto bg-white hover:shadow-lg border border-gray-200 
                  rounded-xl shadow-md p-6 flex flex-col md:flex-row items-center gap-6"
        >
          {/* IMAGE */}
          <img
            src="/images/founder.jpg"
            className="w-28 h-28 object-cover rounded-full shadow-md"
            alt="Founder"
          />

          {/* TEXT */}
          <div className="text-center md:text-left">
            <h3 className="text-2xl font-bold text-gray-800">Samafale</h3>
            <p className="text-blue-600 font-semibold">Founder & Developer</p>

            <p className="text-gray-700 mt-3 leading-6 max-w-lg">
              Passionate about creating digital solutions that inspire, educate,
              and transform the way we interact with books.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
