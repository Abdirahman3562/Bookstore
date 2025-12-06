import AppDownloadBanner from "../components/Home/AppDownloadBanner";
import BookCarousel from "../components/Home/BookCarousel";
import BooksStats from "../components/Home/BooksStats";
import EbookAd from "../components/Home/EbookAd";
import NewReleases from "../components/Home/NewReleases";
import Testimonials from "../components/Home/Testimonials";

export default function Home() {
  return (
    <div className="pt-2 bg-white dark:bg-gray-900 min-h-screen transition-colors duration-200">
    <EbookAd />
    <BookCarousel />
        <NewReleases />
        <BooksStats/>
        <Testimonials/>
        <AppDownloadBanner />

    </div>
  );
}
