"use client";
import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { motion, useAnimation, useInView, useScroll, useTransform } from "framer-motion";
import { Truck, Smile, ShieldCheck, Headphones } from "lucide-react";
import { FiShoppingCart, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { CaretDown, ShoppingCartSimple } from "@phosphor-icons/react";
export default function HomeComponent1() {
  // Main container ref for scroll tracking
  const containerRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Scroll progress tracking
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);
  
  // Transform scroll progress into various values for animations
  const scaleProgress = useTransform(scrollYProgress, [0, 1], [1, 1.05]);
  const opacityProgress = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [1, 1, 0.8, 0.6]);
  const yPos = useTransform(scrollYProgress, [0, 1], [0, -100]);
  
  // Animation controls
  const controls = useAnimation();
  const refs = {
    banner: useRef(null),
    flashSales: useRef(null),
    products: useRef(null),
    offers: useRef(null),
    snacks: useRef(null),
    delivery: useRef(null)
  };

  // Set up inView triggers for each section
  const isInView = {
    banner: useInView(refs.banner, { once: true, amount: 0.1 }),
    flashSales: useInView(refs.flashSales, { once: true, amount: 0.1 }),
    products: useInView(refs.products, { once: true, amount: 0.1 }),
    offers: useInView(refs.offers, { once: true, amount: 0.1 }),
    snacks: useInView(refs.snacks, { once: true, amount: 0.1 }),
    delivery: useInView(refs.delivery, { once: true, amount: 0.1 })
  };

  // Animate when sections come into view
  useEffect(() => {
    if (isInView.banner) {
      controls.start("visible");
    }
  }, [isInView.banner, controls]);

  // Banner slider settings
  const bannerSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    arrows: true,
  };

  // Flash sales slider settings
  const flashSalesSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 2,
    slidesToScroll: 2,
    autoplay: true,
    autoplaySpeed: 3000,
    arrows: true,
    responsive: [
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1
        }
      }
    ]
  };

 
const CustomPrevArrow = ({ onClick }) => (
  <button
    onClick={onClick}
    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white p-3 rounded-full shadow-md z-10 hover:bg-gray-600"
  >
    ◀
  </button>
);

const CustomNextArrow = ({ onClick }) => (
  <button
    onClick={onClick}
    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white p-3 rounded-full shadow-md z-10 hover:bg-gray-600"
  >
    ▶
  </button>
);






const settings = {
  dots: false,
  infinite: true,
  speed: 500,
  slidesToShow: 1,
  slidesToScroll: 1,
  autoplay: true,
  autoplaySpeed: 3000,
  arrows: true,
  prevArrow: <CustomPrevArrow />,
  nextArrow: <CustomNextArrow />,
};

const bannerData = {
  banner: {
    container: "container container-lg",
    items: [
      {
        id: 1,
        title: "Daily Grocery Order and Get Express Delivery",
        buttonText: "Explore Shop",
        buttonLink: "/shop",
        image: "/images/banner-img1.png",
      },
      {
        id: 2,
        title: "Fresh Vegetables & Fruits, Delivered Fast",
        buttonText: "Explore Shop",
        buttonLink: "/shop",
        image: "/images/banner-img3.png",
      },
    ],
    backgroundImage: "/images/bg/banner-bg.png",
  },
};

  const [flashSalesData, setFlashSalesData] = useState([]);
  const [timers, setTimers] = useState({});
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      const data = [
        {
          id: 1,
          title: "Fresh Vegetables",
          bgImage: "/images/bg/flash-sale-bg1.png",
          productImage: "/images/thumbs/flash-sale-img1.png",
          endTime: "2025-04-01T23:59:59",
        },
        {
          id: 2,
          title: "Daily Snacks",
          bgImage: "/images/bg/flash-sale-bg2.png",
          productImage: "/images/thumbs/flash-sale-img2.png",
          endTime: "2025-04-02T23:59:59",
        },
      ];
      setFlashSalesData(data);
    };
    fetchData();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const updatedTimers = {};
      flashSalesData.forEach((item) => {
        const timeLeft = new Date(item.endTime) - new Date();
        updatedTimers[item.id] = {
          days: Math.floor(timeLeft / (1000 * 60 * 60 * 24)),
          hours: Math.floor((timeLeft / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((timeLeft / (1000 * 60)) % 60),
          seconds: Math.floor((timeLeft / 1000) % 60),
        };
      });
      setTimers(updatedTimers);
    }, 1000);

    return () => clearInterval(interval);
  }, [flashSalesData]);

  useEffect(() => {
    const targetDate = new Date("2025-12-31T23:59:59").getTime();
    const updateCountdown = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / (1000 * 60)) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const apiUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/product/get` : '/api/product/get';
        const response = await fetch(apiUrl, { method: 'GET' });
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("Invalid JSON response from server");
        }
        
        const data = await response.json();
        setProducts(data);
      } catch (error) {
        console.error('Error fetching products:', error);
        setError(error.message);
      }
    };

    fetchProducts();
  }, []);
  const offers = [
    {
      id: 1,
      discount: "$5 off your first order",
      deliveryTime: "Delivery by 6:15 AM",
      expiryDate: "Expired Aug 5",
      bgImage: "/images/shape/offer-shape.png",
      thumbImage: "/images/thumbs/offer-img1.png",
      logoImage: "/images/thumbs/offer-logo.png",
    },
    {
      id: 2,
      discount: "$10 off on selected items",
      deliveryTime: "Delivery by 7:30 AM",
      expiryDate: "Expires Sep 15",
      bgImage: "/images/shape/offer-shape.png",
      thumbImage: "/images/thumbs/offer-img2.png",
      logoImage: "/images/thumbs/offer-logo.png",
    },
  ];

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  const fadeInVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: "easeInOut"
      }
    }
  };

  const slideInVariants = {
    hidden: { x: -50, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  // Scroll direction tracking
  const [scrollDirection, setScrollDirection] = useState('down');
  const [lastScrollTop, setLastScrollTop] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      
      if (scrollTop > lastScrollTop) {
        setScrollDirection('down');
      } else if (scrollTop < lastScrollTop) {
        setScrollDirection('up');
      }
      
      setLastScrollTop(scrollTop <= 0 ? 0 : scrollTop);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollTop]);

  // Scroll-based animations for sections
  const sectionVariants = {
    hiddenDown: { y: 50, opacity: 0 },
    hiddenUp: { y: -50, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };
  // Brand slider settings - move this outside the BrandSlider component
  const brandSettings = {
    dots: false,
    infinite: true,
    speed: 500,
    slidesToShow: 5,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 2000,
    responsive: [
      { breakpoint: 1024, settings: { slidesToShow: 4 } },
      { breakpoint: 768, settings: { slidesToShow: 3 } },
      { breakpoint: 480, settings: { slidesToShow: 2 } }
    ]
  };

  const brands = [
    { id: 1, image: "/images/thumbs/brand-img1.png" },
    { id: 2, image: "/images/thumbs/brand-img2.png" },
    { id: 3, image: "/images/thumbs/brand-img3.png" },
    { id: 4, image: "/images/thumbs/brand-img4.png" },
    { id: 5, image: "/images/thumbs/brand-img5.png" },
    { id: 6, image: "/images/thumbs/brand-img6.png" },
    { id: 7, image: "/images/thumbs/brand-img7.png" },
    { id: 8, image: "/images/thumbs/brand-img8.png" }
  ];
  const features = [
    { icon: Truck, title: "Free Shipping", description: "Free shipping all over the US" },
    { icon: Smile, title: "100% Satisfaction", description: "Free shipping all over the US" },
    { icon: ShieldCheck, title: "Secure Payments", description: "Free shipping all over the US" },
    { icon: Headphones, title: "24/7 Support", description: "Free shipping all over the US" },
  ];
  const HotDeals = () => {
    // Countdown Timer (Example)
    const [timeLeft, setTimeLeft] = useState({ days: 277, hours: 10, minutes: 53, seconds: 20 });
  
    useEffect(() => {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          let { days, hours, minutes, seconds } = prev;
          if (seconds > 0) seconds--;
          else {
            seconds = 59;
            if (minutes > 0) minutes--;
            else {
              minutes = 59;
              if (hours > 0) hours--;
              else {
                hours = 23;
                if (days > 0) days--;
              }
            }
          }
          return { days, hours, minutes, seconds };
        });
      }, 1000);
  
      return () => clearInterval(timer);
    }, []);
  }
  
const vendors = [
  {
    name: "Organic Market",
    logo: "/images/thumbs/vendor-logo1.png",
    delivery: "Delivery by 6:15am",
    offer: "$5 off Snack & Candy",
    items: [
      "/images/thumbs/vendor-img1.png",
      "/images/thumbs/vendor-img2.png",
      "/images/thumbs/vendor-img3.png",
      "/images/thumbs/vendor-img4.png",
      "/images/thumbs/vendor-img5.png",
    ],
  },
  {
    name: "Safeway",
    logo: "/images/thumbs/vendor-logo2.png",
    delivery: "Delivery by 6:15am",
    offer: "$5 off Snack & Candy",
    items: [
      "/images/thumbs/vendor-img1.png",
      "/images/thumbs/vendor-img2.png",
      "/images/thumbs/vendor-img3.png",
      "/images/thumbs/vendor-img4.png",
      "/images/thumbs/vendor-img5.png",
    ],
  },
  {
    name: " Market",
    logo: "/images/thumbs/vendor-logo1.png",
    delivery: "Delivery by 6:15am",
    offer: "$5 off Snack & Candy",
    items: [
      "/images/thumbs/vendor-img1.png",
      "/images/thumbs/vendor-img2.png",
      "/images/thumbs/vendor-img3.png",
      "/images/thumbs/vendor-img4.png",
      "/images/thumbs/vendor-img5.png",
    ],
  },
];
const productsData = [
  {
    id: 1,
    name: "C-500 Antioxidant Protect Dietary Supplement",
    image: "/images/lettuce.png",
    price: 14.99,
    originalPrice: 28.99,
    rating: 4.8,
    reviews: 17000,
    category: "Grocery",
    discount: "Sale 50%",
  },
  {
    id: 2,
    name: "Marcel’s Modern Pantry Almond Unsweetened",
    image: "/images/almond-milk.png",
    price: 14.99,
    originalPrice: 28.99,
    rating: 4.8,
    reviews: 17000,
    category: "Grocery",
    discount: "Sale 50%",
  },
  {
    id: 3,
    name: "O Organics Milk, Whole, Vitamin D",
    image: "/images/milk.png",
    price: 14.99,
    originalPrice: 28.99,
    rating: 4.8,
    reviews: 17000,
    category: "Dairy",
    discount: "Sale 50%",
  },
  {
    id: 4,
    name: "Whole Grains and Seeds Organic Bread",
    image: "/images/bread.png",
    price: 14.99,
    originalPrice: 28.99,
    rating: 4.8,
    reviews: 17000,
    category: "Bakery",
    discount: "Best Sale",
  },
  {
    id: 5,
    name: "Whole Grains and Seeds Organic Bread",
    image: "/images/bread.png",
    price: 14.99,
    originalPrice: 28.99,
    rating: 4.8,
    reviews: 17000,
    category: "Fruits",
    discount: "Best Sale",
  },
  {
    id: 6,
    name: "Whole Grains and Seeds Organic Bread",
    image: "/images/bread.png",
    price: 14.99,
    originalPrice: 28.99,
    rating: 4.8,
    reviews: 17000,
    category: "Vegetables",
    discount: "Best Sale",
  }
];

const categories = ["All", "Grocery", "Fruits", "Juices", "Vegetables", "Snacks", "Organic Foods"];
const [selectedCategory, setSelectedCategory] = useState("All");
const [filteredProducts, setFilteredProducts] = useState(productsData);

useEffect(() => {
  if (selectedCategory === "All") {
    setFilteredProducts(productsData);
  } else {
    setFilteredProducts(productsData.filter((p) => p.category === selectedCategory));
  }
}, [selectedCategory]);
  return (
    <>
{isLoading && (
  <div className="preloader fixed inset-0 z-[9999] flex justify-center items-center bg-white">
    <Image 
      src="/images/thumbs/bea.webp"
      alt="Loading"
      width={64}
      height={64}
      className="animate-spin"
    />
  </div>
)}
    <div 
    className={`relative py-12 px-6 transition-opacity duration-300 ${
      isLoading ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100'
    }`} 
    ref={containerRef}
  >
      {/* Parallax background effect */}
      <motion.div 
        className="fixed inset-0 -z-10 bg-gradient-to-b from-green-50 to-white"
        style={{
          scale: scaleProgress,
          opacity: opacityProgress,
          y: yPos
        }}
      />

      {/* Banner Section */}
      <div className="relative rounded-[30px] bg-[#d3ebc0]">
          {/* Background Image */}
          <div className="absolute inset-0 rounded-[30px] overflow-hidden">
            <Image
              src={bannerData.banner.backgroundImage}
              alt="Background"
              layout="fill"
              objectFit="cover"
              className="rounded-[30px]"
            />
          </div>
          <Slider {...settings} className="relative">
            {bannerData.banner.items.map((item) => (
              <div key={item.id} className="p-6">
                <div className="relative flex items-center max-w-7xl mx-auto">
                  <div className="hidden md:flex justify-center items-center w-[10%]"></div>
                  {/* Banner Content (80% Width) */}
        <div className="w-[80%] flex flex-wrap md:flex-nowrap items-center gap-6">
        {/* Left Text Content (50%) */}
        <div className="w-full md:w-[50%] text-left">
        <h1 className="text-5xl font-bold text-gray-800 leading-tight">{item.title}</h1>
        <a
        className="inline-flex items-center justify-center rounded-full gap-2 bg-green-600 text-white px-6 py-3 hover:bg-green-700 transition shadow-lg mt-6"
        href={item.buttonLink}
        >
        {item.buttonText}
        <ShoppingCartSimple size={24} />
        </a>
        </div>

        {/* Right Image (50%) */}
        <div className="w-full md:w-[50%] flex justify-end">
        <Image src={item.image} alt={item.title} width={500} height={300} className="rounded-[30px]" />
        </div>
        </div>
        <div className="hidden md:flex justify-center items-center w-[10%]"></div>
                </div>
              </div>
            ))}
          </Slider>

            <div className="relative flex items-center justify-center w-full mt-10">
              {/* Downward Facing U-Shape */}
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 w-40 h-16 bg-[#d3ebc0] rounded-b-full shadow-lg-new">
            </div>

            {/* Circular Scroll Button */}
            <div
                  className="absolute left-1/2 transform -translate-x-1/2 w-16 h-16 flex items-center justify-center bg-green-600 rounded-full shadow-md border-4 border-white cursor-pointer"
                  onClick={() => {
                  window.scrollTo({
                  top: window.scrollY + 500,
                  behavior: "smooth",
                  });
                  }}
                  >
                  {/* Dashed Line + Down Arrows */}
                  <div className="flex flex-col items-center">
                      {/* Dashed Line */}
                      <div className="w-0.9 h-6 border-l-2 border-dashed border-white animate-bounce">
                        
                      </div>

                      {/* Downward Arrows */}
                      <CaretDown size={25} className="text-white animate-bounce leading-none" />
                      <CaretDown size={25} className="text-white animate-bounce mt-[-18px]" />
                  </div>
            </div>
      </div>
      </div>

      {/* Flash Sales Section */}
      <motion.section 
        ref={refs.flashSales}
        initial={scrollDirection === 'down' ? "hiddenDown" : "hiddenUp"}
        animate={isInView.flashSales ? "visible" : scrollDirection === 'down' ? "hiddenDown" : "hiddenUp"}
        variants={sectionVariants}
        id="flash-sales-section" 
        className="flash-sales pt-20 pb-5 overflow-hidden mb-10"
      >
        <div className="">
          <motion.div variants={itemVariants} className="section-heading flex justify-between items-center mb-6">
            <h5 className="text-2xl font-bold"> Flash Sales Today</h5>
            <a href="/shop" className="text-sm font-medium text-gray-700 hover:underline">
              View All Deals
            </a>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Slider {...flashSalesSettings} className="flash-sales-slider">
              {flashSalesData.map((item) => (
                <div key={item.id} className="px-2">
                  <motion.div
                    whileHover={{ y: -5 }}
                    className="relative p-6 rounded-lg shadow-lg h-full min-h-[250px] bg-green-100 flex items-center"
                    style={{ backgroundImage: `url(${item.bgImage})`, backgroundSize: "cover", backgroundPosition: "center" }}
                  >
                    {/* Left Side - Product Image */}
                    <div className="w-1/2 flex justify-center items-center">
                      <Image
                        src={item.productImage}
                        alt={item.title}
                        width={180}
                        height={180}
                        className="object-contain max-h-[180px]"
                      />
                    </div>

                    {/* Right Side - Title, Countdown Timer, Shop Now */}
                    <div className="w-1/2 flex flex-col justify-center items-start pl-4">
                      <h6 className="text-xl font-semibold mb-2 text-gray-900">{item.title}</h6>

                      <div className="flex space-x-2 mb-3">
                        {timers[item.id] ? (
                          <>
                            <span className="bg-white px-2 py-1 rounded text-gray-800 text-sm font-semibold">
                              {timers[item.id].days}D
                            </span>
                            <span className="bg-white px-2 py-1 rounded text-gray-800 text-sm font-semibold">
                              {timers[item.id].hours}H
                            </span>
                            <span className="bg-white px-2 py-1 rounded text-gray-800 text-sm font-semibold">
                              {timers[item.id].minutes}M
                            </span>
                            <span className="bg-white px-2 py-1 rounded text-gray-800 text-sm font-semibold">
                              {timers[item.id].seconds}S
                            </span>
                          </>
                        ) : (
                          <span>Loading...</span>
                        )}
                      </div>

                      <motion.a
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        href="/shop"
                        className="mt-auto px-4 py-2 bg-green-600 text-white rounded-full text-center hover:bg-green-700 transition"
                      >
                        Shop Now →
                      </motion.a>
                    </div>
                  </motion.div>
                </div>
              ))}
            </Slider>
          </motion.div>
        </div>
      </motion.section>

      {/* Product Grid Section */}
      <motion.div
          ref={refs.products}
          initial={scrollDirection === 'down' ? 'hiddenDown' : 'hiddenUp'}
          animate={isInView.products ? 'visible' : scrollDirection === 'down' ? 'hiddenDown' : 'hiddenUp'}
          variants={sectionVariants}
          className="product mt-24 mb-10"
        >
          {error ? (
            <p className="text-red-500">Error: {error}</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map(product => (
                <div key={product._id} className="border p-4 rounded-lg shadow">
                  <img src={product.images[0] || '/images/default.png'} alt={product.name} className="w-full h-40 object-cover mb-4" />
                  <h3 className="font-semibold text-lg">{product.name}</h3>
                  <p className="text-gray-500">{product.brand}</p>
                  <p className="text-sm text-gray-700">{product.category}</p>
                  <div className="flex justify-between mt-2">
                    <span className="text-red-500 font-bold">${product.special_price || product.price}</span>
                    {product.special_price && <span className="line-through text-gray-500">${product.price}</span>}
                  </div>
                  <p className={`mt-2 text-sm ${product.stock_status === 'In Stock' ? 'text-green-500' : 'text-red-500'}`}>{product.stock_status}</p>
                </div>
              ))}
            </div>
          )}
      </motion.div>
      
      {/* Offer Section */}
      <motion.section 
        ref={refs.offers}
        initial={scrollDirection === 'down' ? "hiddenDown" : "hiddenUp"}
        animate={isInView.offers ? "visible" : scrollDirection === 'down' ? "hiddenDown" : "hiddenUp"}
        variants={sectionVariants}
        className="offer py-10 mb-10"
      >
        <div className="">
          <motion.div variants={containerVariants} className="grid md:grid-cols-2 gap-8">
            {offers.map((offer, index) => (
              <motion.div
                key={offer.id}
                variants={itemVariants}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="relative rounded-2xl bg-green-800 overflow-hidden p-6 flex items-center gap-6 flex-wrap z-10"
              >
                {/* Background Image */}
                <div className="absolute inset-0 bg-green-800 bg-opacity-80 z-[-1]">
                  <Image
                    src={offer.bgImage}
                    alt="Background Shape"
                    layout="fill"
                    objectFit="cover"
                    className="mix-blend-multiply"
                  />
                </div>

                {/* Left Side - Offer Thumbnail */}
                <motion.div 
                  initial={{ x: -20, opacity: 0 }}
                  animate={isInView.offers ? { x: 0, opacity: 1 } : {}}
                  transition={{ delay: 0.2 }}
                  className="hidden xl:block"
                >
                  <Image
                    src={offer.thumbImage}
                    alt="Offer Image"
                    width={246}
                    height={150}
                    className="w-full h-auto"
                  />
                </motion.div>

                {/* Right Side - Offer Details */}
                <motion.div
                  initial={{ x: 20, opacity: 0 }}
                  animate={isInView.offers ? { x: 0, opacity: 1 } : {}}
                  transition={{ delay: 0.3 }}
                >
                  <div className="w-20 h-20 flex items-center justify-center bg-white rounded-full mb-4">
                    <Image src={offer.logoImage} alt="Logo" width={50} height={50} />
                  </div>
                  <h4 className="text-white text-lg font-bold mb-2">{offer.discount}</h4>
                  <div className="flex items-center gap-4 text-white text-sm">
                    <span>{offer.deliveryTime}</span>
                    <span className="text-yellow-300">{offer.expiryDate}</span>
                  </div>
                  <motion.a
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    href="/shop"
                    className="mt-4 inline-flex items-center px-4 py-2 bg-white text-green-800 font-medium rounded-full hover:bg-green-700 hover:text-white transition"
                  >
                    Shop Now
                    <span className="ml-2 text-xl">→</span>
                  </motion.a>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* Special Snacks Section */}
      <motion.div 
        ref={refs.snacks}
        initial={scrollDirection === 'down' ? "hiddenDown" : "hiddenUp"}
        animate={isInView.snacks ? "visible" : scrollDirection === 'down' ? "hiddenDown" : "hiddenUp"}
        variants={sectionVariants}
        className="w-full bg-purple-100 py-16 relative rounded-2xl mb-10"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 z-[-1]">
          <Image
            src="/images/bg/special-snacks.png"
            alt="Special Snacks"
            layout="fill"
            objectFit="cover"
            className="opacity-20 rounded-2xl"
          />
        </div>

        {/* Content */}
        <motion.div 
          variants={containerVariants}
          className="container mx-auto text-center"
        >
          <motion.h2 variants={itemVariants} className="text-2xl font-bold text-gray-900">Special Snacks</motion.h2>

          {/* Countdown Timer */}
          <motion.div 
            variants={containerVariants}
            className="flex justify-center gap-4 mt-4"
          >
            <motion.span 
              variants={itemVariants}
              className="bg-green-600 text-white px-4 py-2 rounded-md font-semibold"
            >
              {timeLeft.hours} Hours
            </motion.span>
            <motion.span 
              variants={itemVariants}
              className="bg-green-600 text-white px-4 py-2 rounded-md font-semibold"
            >
              {timeLeft.minutes} Min
            </motion.span>
            <motion.span 
              variants={itemVariants}
              className="bg-green-600 text-white px-4 py-2 rounded-md font-semibold"
            >
              {timeLeft.seconds} Sec
            </motion.span>
          </motion.div>

          {/* Shop Now Button */}
          <motion.a
            variants={itemVariants}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            href="/shop"
            className="mt-6 inline-flex items-center bg-orange-500 text-white px-6 py-3 rounded-full gap-2 text-lg font-semibold transition hover:bg-orange-700"
          >
            Shop Now
            <i className="ph ph-arrow-right text-xl"></i>
          </motion.a>
        </motion.div>
      </motion.div>

      {/* Delivery Section */}
      <motion.div 
        ref={refs.delivery}
        initial={scrollDirection === 'down' ? "hiddenDown" : "hiddenUp"}
        animate={isInView.delivery ? "visible" : scrollDirection === 'down' ? "hiddenDown" : "hiddenUp"}
        variants={sectionVariants}
        className="delivery-section py-10 mb-10"
      >
        <div className=" mx-auto ">
          <div className="relative bg-green-600 rounded-2xl flex items-center justify-between flex-wrap z-10 overflow-hidden">
            {/* Background Image */}
            <Image
              src="/images/bg/delivery-bg.png"
              alt="Delivery Background"
              fill
              style={{ objectFit: "cover" }}
              className="absolute top-0 left-0 z-[-1]"
            />

            <div className="flex flex-wrap items-center w-full">
              {/* Delivery Man Image - Slides in from Left */}
              <motion.div
                initial={{ x: "-100%", opacity: 0 }}
                animate={isInView.delivery ? { x: 0, opacity: 1 } : {}}
                transition={{ duration: 1, ease: "easeOut" }}
                className="hidden lg:block lg:w-3/12 text-center"
              >
                <Image
                  src="/images/thumbs/delivery-man.png"
                  alt="Delivery Man"
                  width={400}
                  height={400}
                  priority
                />
              </motion.div>

              {/* Delivery Info - Slides in from Top */}
              <motion.div
                initial={{ y: "-50%", opacity: 0 }}
                animate={isInView.delivery ? { y: 0, opacity: 1 } : {}}
                transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
                className="w-full md:w-7/12 lg:w-5/12 text-center"
              >
                <h3 className="text-white text-lg font-semibold mb-2">
                  We Deliver on Next Day from 10:00 AM to 08:00 PM
                </h3>
                <p className="text-white text-sm">
                  For Orders starting from $100
                </p>
                <a
                  href="/shop"
                  className="mt-4 px-6 py-2 inline-flex items-center gap-2 text-white bg-orange-500 hover:bg-orange-600 transition-all rounded-full text-md font-medium"
                >
                  Shop Now
                  <span className="text-xl flex">
                    <i className="ph ph-arrow-right"></i>
                  </span>
                </a>
              </motion.div>

              {/* Special Snacks Image */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={isInView.delivery ? { scale: 1, opacity: 1 } : {}}
                transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
                className="hidden md:block md:w-5/12 lg:w-4/12 text-center"
              >
                <Image
                  src="/images/thumbs/special-snacks-img.png"
                  alt="Special Snacks"
                  width={600}
                  height={150}
                  priority
                />
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>
      <div className="relative py-12 px-6" ref={containerRef}>
      {/* ... (keep all your existing sections until the brands section) */}

      {/* Brands Section */}
        <motion.div 
          initial={scrollDirection === 'down' ? "hiddenDown" : "hiddenUp"}
          animate={isInView.delivery ? "visible" : scrollDirection === 'down' ? "hiddenDown" : "hiddenUp"}
          variants={sectionVariants}
          className="brand  overflow-hidden bg-gray-100"
        >
          <div className=" mx-auto p-6">
            <motion.div 
              variants={containerVariants}
              className=" rounded-lg "
            >
              <motion.div 
                variants={itemVariants}
                className="flex justify-between items-center mb-4"
              >
                <h5 className="text-lg font-semibold">Shop by Brands</h5>
                <a href="/shop" className="text-sm font-medium text-gray-700 hover:text-main-600">
                  View All Brands
                </a>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Slider {...brandSettings} className="brand-slider">
                  {brands.map((brand) => (
                    <motion.div 
                      key={brand.id} 
                      className="p-4 flex justify-center items-center"
                      whileHover={{ scale: 1.1 }}
                    >
                      <div className="  shadow-md p-4 hover:shadow-lg transition-all">
                        <Image 
                          src={brand.image} 
                          alt="Brand Logo" 
                          width={100} 
                          height={100} 
                          className="object-contain h-16 w-16 mx-auto rounded-full"
                        />
                      </div>
                    </motion.div>
                  ))}
                </Slider>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>

      </div>
     
      {/* Hot Deals Section */}
      <motion.section className="hot-deals pt-15 overflow-hidden mb-10 bg-gray-100">
        <div className="container mx-auto px-4">
          {/* Section Header */}
          <div className="flex justify-between items-center flex-wrap gap-4 mb-6">
            <h5 className="text-2xl font-bold">Hot Deals Today</h5>
            <div className="flex items-center gap-4">
              <a href="/shop" className="text-sm font-medium text-gray-700 hover:text-green-600 hover:underline">
                View All Deals
              </a>
              <div className="flex items-center gap-2">
                <button className="p-2 border border-gray-300 rounded-full hover:bg-green-600 hover:text-white transition">
                  <FiChevronLeft size={18} />
                </button>
                <button className="p-2 border border-gray-300 rounded-full hover:bg-green-600 hover:text-white transition">
                  <FiChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Main Deals Section */}
          <div className="grid grid-cols-4 gap-6">
            {/* Left Banner */}
            <div className="col-span-1 bg-green-600 text-white p-6 rounded-lg flex flex-col justify-center items-center">
              <h3 className="text-3xl font-bold">Fresh Vegetables</h3>
              <Image src="/images/thumbs/hot-deals-img.png" alt="hotdeals" width={200} height={160} className="w-full h-40 object-contain" />
              <p className="mt-2 text-lg">Limited Time Offer</p>
              <div className="flex gap-2 text-center mt-4">
                <span className="bg-white text-green-600 px-3 py-1 rounded-md text-lg">{timeLeft.days} Days</span>
                <span className="bg-white text-green-600 px-3 py-1 rounded-md text-lg">{timeLeft.hours} Hrs</span>
                <span className="bg-white text-green-600 px-3 py-1 rounded-md text-lg">{timeLeft.minutes} Min</span>
                <span className="bg-white text-green-600 px-3 py-1 rounded-md text-lg">{timeLeft.seconds} Sec</span>
              </div>
              <button className="mt-4 bg-white text-green-600 font-semibold px-4 py-2 rounded hover:bg-gray-100">
                Shop Now →
              </button>
            </div>

            {/* Product Cards */}
            <div className="col-span-3 flex space-x-6 overflow-x-auto pb-4">
              {/* Deal Card 1 */}
              <motion.div whileHover={{ y: -5 }} className="min-w-[250px] p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition">
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded">Sale 50%</span>
                <Image src="/images/thumbs/product-img10.png" alt="O Organics Milk" width={200} height={160} className="w-full h-40 object-contain mb-20" />
                <h3 className="text-sm font-semibold mt-2">O Organics Milk, Whole, Vitamin D</h3>
                <p className="text-green-600 text-sm">$14.99 <span className="line-through text-gray-400">$28.99</span></p>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full mt-3 bg-green-600 text-white py-2 rounded flex items-center justify-center gap-2">
                  <FiShoppingCart size={16} /> Add To Cart
                </motion.button>
              </motion.div>

              {/* Deal Card 2 */}
              <motion.div whileHover={{ y: -5 }} className="min-w-[250px] p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition">
                <span className="bg-[#d72828] text-white text-xs px-2 py-1 rounded">Best Sale</span>
                <Image src="/images/thumbs/bread.png" alt="Whole Grains Bread" width={200} height={160} className="w-full h-40 object-contain  mb-20" />
                <h3 className="text-sm font-semibold mt-2">Whole Grains and Seeds Organic Bread</h3>
                <p className="text-green-600 text-sm">$14.99 <span className="line-through text-gray-400">$28.99</span></p>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full mt-3 bg-green-600 text-white py-2 rounded flex items-center justify-center gap-2">
                  <FiShoppingCart size={16} /> Add To Cart
                </motion.button>
              </motion.div>

              {/* Deal Card 3 */}
              <motion.div whileHover={{ y: -5 }} className="min-w-[250px] p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition">
                <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded">New</span>
                <Image src="/images/thumbs/juice.png" alt="Tropicana Juice" width={200} height={160} className="w-full h-40 object-contain mb-20" />
                <h3 className="text-sm font-semibold mt-2">Tropicana 100% Juice, Orange, No Pulp</h3>
                <p className="text-green-600 text-sm">$14.99 <span className="line-through text-gray-400">$28.99</span></p>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full mt-3 bg-green-600 text-white py-2 rounded flex items-center justify-center gap-2">
                  <FiShoppingCart size={16} /> Add To Cart
                </motion.button>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.section>
      <section className="top-vendors py-10">
      <div className=" px-4">
        <div className="flex justify-between items-center flex-wrap mb-8">
          <h5 className="text-xl font-semibold">Weekly Top Vendors</h5>
          <a
            href="shop.html"
            className="text-sm font-medium text-gray-700 hover:text-main-600 underline"
          >
            All Vendors
          </a>
        </div>
        <div className="flex flex-wrap -mx-4">
          {vendors.map((vendor, index) => (
            <div
              key={index}
              className="w-full md:w-6/12 xl:w-4/12 px-4"
              data-aos="zoom-in"
              data-aos-duration={`${200 * (index + 1)}`}
            >
              <div
                className="relative text-center rounded-xl shadow-lg p-6"
                style={{
                  backgroundColor: index % 2 === 0 ? "#f3f4f6" : "#fde8e9", // Gray for even, Pink for odd
                  borderRadius: "20px",
                  paddingTop: "60px",
                  position: "relative",
                }}
              >
                {/* Top Curve with Logo */}
                <div
                  className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-full p-4 shadow-md"
                  style={{ width: "80px", height: "80px" }}
                >
                  <Image
                    src={vendor.logo}
                    alt={vendor.name}
                    width={50}
                    height={50}
                    className="mx-auto"
                  />
                </div>

                <h6 className="text-lg font-semibold mt-4">{vendor.name}</h6>
                <span className="text-gray-600 text-sm block">
                  {vendor.delivery}
                </span>

                {/* Offer Button */}
                <a
                  href="shop.html"
                  className="inline-block bg-orange-500 text-white rounded-full py-2 px-4 text-xs mt-4"
                >
                  {vendor.offer}
                </a>

                {/* Product Items */}
                <div className="flex justify-center flex-wrap gap-2 mt-4">
                  {vendor.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md"
                    >
                      <Image src={item} alt="Item" width={40} height={40} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      </section>
      <div className=" px-4">
          <h2 className="text-2xl font-bold mb-4">Recommended for you</h2>

          {/* Category Filter */}
          <div className="flex space-x-4 mb-6">
            {categories.map((category) => (
              <button
                key={category}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  selectedCategory === category ? "bg-green-500 text-white" : "bg-gray-200"
                }`}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Product List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <div key={product.id} className="border rounded-lg shadow p-4">
                {product.discount && (
                  <span className={`px-2 py-1 text-xs text-white bg-red-500 rounded`}>
                    {product.discount}
                  </span>
                )}
                <img src={product.image} alt={product.name} className="w-full h-40 object-cover mt-2" />
                <h3 className="mt-3 font-semibold">{product.name}</h3>
                <p className="text-gray-500 text-sm">By Lucky Supermarket</p>
                <p className="mt-2 text-lg font-bold text-green-600">${product.price}{" "}
                  <span className="line-through text-gray-400 text-sm">${product.originalPrice}</span>
                </p>
                <p className="text-sm text-gray-600">⭐ {product.rating} ({product.reviews.toLocaleString()})</p>
                <button className="mt-3 bg-green-500 text-white px-4 py-2 rounded-md w-full">
                  Add To Cart
                </button>
              </div>
            ))}
          </div>
      </div>
      <div className=" px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {features.map((feature, index) => (
            <div key={index} className="flex items-center p-4 bg-green-100 rounded-lg">
              <feature.icon className="w-10 h-10 text-green-600 mr-4" />
              <div>
                <h3 className="text-lg font-semibold">{feature.title}</h3>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
      </>
  );
}