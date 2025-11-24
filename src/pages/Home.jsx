import AppDownloadBanner from "../components/Home/AppDownloadBanner";
import BookCarousel from "../components/Home/BookCarousel";
import BooksStats from "../components/Home/BooksStats";
import EbookAd from "../components/Home/EbookAd";
import HerroSlider from "../components/Home/HerroSlider";
import NewReleases from "../components/Home/NewReleases";

export default function Home() {
  return (
    <div className="pt-2">
    <HerroSlider />
    <EbookAd /> 
    <BookCarousel />
        <NewReleases />
        <BooksStats/>
        <AppDownloadBanner />

    </div>
  );
}
