import { motion } from 'motion/react';
import { BookOpen, Users, ShieldCheck, Globe } from 'lucide-react';

export default function About() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="max-w-4xl mx-auto space-y-16 py-8 font-body"
    >
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-semibold text-gray-900 dark:text-white tracking-tight font-display">About SkillEx</h1>
        <p className="text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto font-light">
          We believe education should be accessible and affordable. SkillEx connects students globally to share resources, reduce waste, and build community.
        </p>
      </div>

      <div className="aspect-video w-full rounded-3xl overflow-hidden bg-gray-100 dark:bg-gray-800 relative">
        <img 
          src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2070&auto=format&fit=crop" 
          alt="Students collaborating" 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="space-y-4">
          <div className="w-12 h-12 bg-gray-50 dark:bg-gray-800 rounded-2xl flex items-center justify-center">
            <Globe className="w-6 h-6 text-gray-900 dark:text-white" />
          </div>
          <h3 className="text-2xl font-semibold text-gray-900 dark:text-white font-display">Global Reach, Local Impact</h3>
          <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
            Whether you're looking for a specific textbook in your local campus or wanting to share a digital subscription with peers across the globe, SkillEx breaks down the barriers.
          </p>
        </div>
        <div className="space-y-4">
          <div className="w-12 h-12 bg-gray-50 dark:bg-gray-800 rounded-2xl flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-gray-900 dark:text-white" />
          </div>
          <h3 className="text-2xl font-semibold text-gray-900 dark:text-white font-display">Verified & Secure</h3>
          <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
            Every user on our platform is a verified student. We ensure that your transactions, whether buying a calculator or joining a Spotify family plan, are safe and transparent.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
