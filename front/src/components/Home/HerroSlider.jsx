import { useState, useEffect } from 'react';
import image1 from '../../../public/images/image1.jpg';
import image2 from '../../../public/images/image2.jpg';
import image3 from '../../../public/images/image3.jpg';
import image4 from '../../../public/images/image4.jpg';

export default function HeroSlider() {
  const images = [image1, image2, image3, image4];
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 3000);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="relative w-full  overflow-hidden">

      {/* Image */}
      <img
        src={images[currentIndex]}
        alt={`slider-image-${currentIndex}`}
        className="w-full h-80 object-cover transition-all duration-500 ease-in-out"
      />

      {/* Indicators - Always bottom center */}
      {/* <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
        {images.map((_, index) => (
          <span
            key={index}
            className={`w-3 h-3 rounded-full ${
              currentIndex === index ? 'bg-[#2563eb]' : 'bg-gray-300'
            }`}
          ></span>
        ))}
      </div> */}

    </div>
  );
}
