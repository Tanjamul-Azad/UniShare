import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, MapPin, ArrowRight, Book, Users, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const IMAGES = [
  'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop', // Students studying
  'https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=2090&auto=format&fit=crop', // Library
  'https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=2070&auto=format&fit=crop', // Group collaboration
];

export default function Home() {
  const [currentImage, setCurrentImage] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % IMAGES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col min-h-screen w-full">
      {/* Hero Section */}
      <section className="relative h-[90vh] w-full flex items-center justify-center overflow-hidden rounded-3xl mt-2 mx-auto max-w-[98%]">
        <AnimatePresence mode="wait">
          <motion.img
            key={currentImage}
            src={IMAGES[currentImage]}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className="absolute inset-0 w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </AnimatePresence>
        <div className="absolute inset-0 bg-black/40" /> {/* Dark overlay for text readability */}

        <div className="relative z-10 w-full max-w-5xl px-6 flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm font-medium mb-6"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>The Worldwide Student Network</span>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-5xl md:text-7xl font-bold text-white tracking-tight mb-6 leading-tight"
          >
            Share resources. <br className="hidden md:block" />
            Empower your journey.
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="text-lg md:text-xl text-white/90 mb-12 max-w-2xl font-light"
          >
            Buy, sell, and share study materials with students worldwide. From textbooks to premium subscriptions, everything you need in one peaceful space.
          </motion.p>

          {/* Glassmorphism Search Bar */}
          <motion.form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const query = formData.get('q');
              if (query) {
                navigate(`/marketplace?q=${encodeURIComponent(query.toString())}`);
              } else {
                navigate('/marketplace');
              }
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="w-full max-w-4xl bg-white/10 backdrop-blur-xl border border-white/20 p-2 rounded-2xl flex flex-col md:flex-row gap-2 shadow-2xl"
          >
            <div className="flex-1 flex items-center bg-white/10 rounded-xl px-4 py-3.5 transition-colors focus-within:bg-white/20">
              <Search className="w-5 h-5 text-white/70 mr-3" />
              <input
                type="text"
                name="q"
                placeholder="Search books, tools, and study gear"
                className="bg-transparent border-none outline-none text-white placeholder:text-white/60 w-full text-base"
              />
            </div>
            <div className="flex-1 flex items-center bg-white/10 rounded-xl px-4 py-3.5 transition-colors focus-within:bg-white/20">
              <MapPin className="w-5 h-5 text-white/70 mr-3" />
              <input
                type="text"
                placeholder="Campus or city"
                className="bg-transparent border-none outline-none text-white placeholder:text-white/60 w-full text-base"
              />
            </div>
            <button 
              type="submit"
              className="bg-white text-gray-900 px-8 py-3.5 rounded-xl font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
            >
              Search <ArrowRight className="w-4 h-4" />
            </button>
          </motion.form>
        </div>
      </section>

      {/* Quick Categories */}
      <section className="max-w-6xl mx-auto px-6 py-24 w-full font-body">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-semibold text-gray-900 dark:text-white tracking-tight mb-4 font-display">Explore by Category</h2>
          <p className="text-gray-500 dark:text-gray-400">Find exactly what you need for your next semester.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { title: 'Textbooks', icon: Book, desc: 'Buy and sell used course materials.', link: '/marketplace' },
            { title: 'Stationary', icon: Sparkles, desc: 'Calculators, notebooks, and tools.', link: '/marketplace' },
            { title: 'Co-Subscriptions', icon: Users, desc: 'Share subscription costs with trusted peers.', link: '/co-subs' },
          ].map((cat, i) => (
            <motion.div
              key={cat.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
            >
              <Link to={cat.link} className="group block p-8 rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-lg dark:hover:shadow-indigo-500/5 transition-all duration-300">
                <div className="w-12 h-12 bg-gray-50 dark:bg-gray-800 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <cat.icon className="w-6 h-6 text-gray-900 dark:text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{cat.title}</h3>
                <p className="text-gray-500 dark:text-gray-400">{cat.desc}</p>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
