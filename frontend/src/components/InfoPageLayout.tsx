import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

type InfoSection = {
  title: string;
  body: string;
};

type InfoPageLayoutProps = {
  badge: string;
  title: string;
  subtitle: string;
  highlights: string[];
  sections: InfoSection[];
  ctaLabel?: string;
  ctaTo?: string;
};

export default function InfoPageLayout({
  badge,
  title,
  subtitle,
  highlights,
  sections,
  ctaLabel = 'Back to Home',
  ctaTo = '/',
}: InfoPageLayoutProps) {
  return (
    <section className="relative isolate overflow-hidden min-h-[calc(100vh-4rem)] bg-white dark:bg-[#0B0C10] transition-colors duration-300">
      {/* Premium Background Elements */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-50/50 via-white to-white dark:from-indigo-900/10 dark:via-[#0B0C10] dark:to-[#0B0C10]" />
      
      <div className="mx-auto max-w-6xl px-6 py-12 sm:py-20 lg:py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="mb-16 max-w-3xl"
        >
          <span className="inline-flex rounded-full border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50 dark:bg-indigo-500/10 px-4 py-1.5 text-xs font-bold tracking-wide text-indigo-700 dark:text-indigo-400 uppercase">
            {badge}
          </span>

          <h1 className="mt-6 text-4xl font-display font-semibold leading-tight tracking-tight text-gray-900 dark:text-white sm:text-5xl lg:text-6xl">
            {title}
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-gray-600 dark:text-gray-400 sm:text-xl font-medium">
            {subtitle}
          </p>
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-3 lg:gap-12">
          {/* Quick Glace Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
            className="rounded-[2rem] border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 p-8 lg:p-10"
          >
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-6">Key Points</h2>
            <ul className="space-y-5">
              {highlights.map((highlight) => (
                <li key={highlight} className="flex items-start gap-4">
                  <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-500/20">
                    <div className="h-2.5 w-2.5 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                  </div>
                  <span className="text-[15px] font-medium leading-relaxed text-gray-700 dark:text-gray-300">{highlight}</span>
                </li>
              ))}
            </ul>

            <Link
              to={ctaTo}
              className="mt-10 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 dark:bg-white px-6 py-4 text-[15px] font-bold text-white dark:text-gray-900 transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-lg shadow-gray-900/20 dark:shadow-white/10"
            >
              {ctaLabel}
              <ArrowRight className="h-5 w-5" />
            </Link>
          </motion.div>

          <div className="space-y-8 lg:col-span-2">
            {sections.map((section, index) => (
              <motion.article
                key={section.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.15 + index * 0.1, ease: "easeOut" }}
                className="rounded-[2rem] border border-gray-100 dark:border-gray-800/60 bg-white dark:bg-gray-900 p-8 lg:p-10 shadow-sm"
              >
                <h3 className="text-2xl font-display font-semibold text-gray-900 dark:text-white">{section.title}</h3>
                <p className="mt-4 text-[17px] leading-relaxed text-gray-600 dark:text-gray-400 font-medium">
                  {section.body}
                </p>
              </motion.article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
