import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Dumbbell, Utensils, Sparkles, ArrowRight, Activity, Zap, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const stagger = {
  visible: { transition: { staggerChildren: 0.2 } }
};

export const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Background Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=2070&auto=format&fit=crop"
            className="w-full h-full object-cover opacity-20 dark:opacity-10"
            alt="Gym Background"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-50/80 to-slate-50 dark:via-slate-950/80 dark:to-slate-950"></div>
        </div>

        <div className="container mx-auto px-4 z-10 pt-20">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="text-center max-w-4xl mx-auto"
          >
            <motion.div variants={fadeInUp} className="inline-block mb-4">
              <span className="px-4 py-1.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-sm font-semibold tracking-wide border border-indigo-200 dark:border-indigo-800">
                AI-Powered Fitness Revolution
              </span>
            </motion.div>

            <motion.h1 variants={fadeInUp} className="text-5xl md:text-7xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-8 leading-tight">
              Transform Your Body <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">With Intelligent Design</span>
            </motion.h1>

            <motion.p variants={fadeInUp} className="text-xl text-slate-600 dark:text-slate-300 mb-10 max-w-2xl mx-auto leading-relaxed">
              Experience the future of personal training. Custom-built workout routines and diet plans generated instantly by advanced AI, tailored specifically to your biology and goals.
            </motion.p>

            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4">
              <button
                onClick={() => navigate('/create')}
                className="w-full sm:w-auto px-8 py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg hover:shadow-xl hover:shadow-indigo-500/30 hover:-translate-y-1 transition-all duration-300 flex items-center justify-center"
              >
                Generate My Plan
                <ArrowRight className="w-5 h-5 ml-2" />
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center"
              >
                View Dashboard
              </button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats/Social Proof */}
      <section className="py-12 border-y border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1">10k+</div>
              <div className="text-sm text-slate-500 dark:text-slate-400">Plans Generated</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1">50+</div>
              <div className="text-sm text-slate-500 dark:text-slate-400">Exercise Types</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1">100%</div>
              <div className="text-sm text-slate-500 dark:text-slate-400">Personalized</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1">24/7</div>
              <div className="text-sm text-slate-500 dark:text-slate-400">AI Availability</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-slate-50 dark:bg-slate-950">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">Precision Engineering for Your Health</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
              Our AI analyzes hundreds of data points to construct the most efficient path to your goals.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              whileHover={{ y: -10 }}
              className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm"
            >
              <div className="w-14 h-14 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mb-6">
                <Activity className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Adaptive Workouts</h3>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                Routines that evolve with you. Whether you have a full gym or just bodyweight, we optimize every set and rep for maximum hypertrophy or endurance.
              </p>
            </motion.div>

            <motion.div
              whileHover={{ y: -10 }}
              className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm"
            >
              <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-2xl flex items-center justify-center mb-6">
                <Utensils className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Macro-Perfect Diet</h3>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                Forget generic meal plans. We calculate your exact caloric and macro needs, generating recipes that fit your taste buds and allergies perfectly.
              </p>
            </motion.div>

            <motion.div
              whileHover={{ y: -10 }}
              className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm"
            >
              <div className="w-14 h-14 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-2xl flex items-center justify-center mb-6">
                <Sparkles className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">AI Visualizer</h3>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                See your success before it happens. Generate photorealistic images of your meals and exercises to ensure perfect form and presentation.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Image Showcase Section */}
      <section className="py-24 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center gap-12">
          <div className="md:w-1/2">
            <span className="text-indigo-600 dark:text-indigo-400 font-semibold tracking-wider text-sm uppercase mb-2 block">Next-Gen Technology</span>
            <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-6">Visualize Your Progress</h2>
            <p className="text-slate-500 dark:text-slate-400 text-lg mb-8 leading-relaxed">
              Unsure about an exercise form? Want to see how that high-protein meal should look?
              Our integrated generative AI creates visuals on demand, helping you execute your plan with confidence.
            </p>
            <ul className="space-y-4">
              {['Instant exercise demonstrations', 'Appetizing meal visualizations', 'Text-to-image editing capabilities'].map((item, i) => (
                <li key={i} className="flex items-center text-slate-700 dark:text-slate-300">
                  <div className="bg-indigo-100 dark:bg-indigo-900/50 p-1 rounded-full mr-3 text-indigo-600 dark:text-indigo-400">
                    <ShieldCheck size={16} />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="md:w-1/2 relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl opacity-30 blur-2xl animate-pulse"></div>
            <img
              src="https://images.unsplash.com/photo-1540497077202-7c8a3999166f?q=80&w=2070&auto=format&fit=crop"
              alt="Fitness Visualization"
              className="relative rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full object-cover transform rotate-2 hover:rotate-0 transition-all duration-500"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-slate-50 dark:bg-slate-950">
        <div className="container mx-auto px-4">
          <div className="bg-indigo-600 rounded-3xl p-12 md:p-20 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            <div className="relative z-10">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Ready to Start Your Journey?</h2>
              <p className="text-indigo-100 text-lg max-w-2xl mx-auto mb-10">
                Join thousands of users who have transformed their lives with our AI-driven approach. No credit card required to generate your first plan.
              </p>
              <button
                onClick={() => navigate('/create')}
                className="bg-white text-indigo-600 hover:bg-indigo-50 px-10 py-4 rounded-xl font-bold text-lg transition-colors shadow-lg"
              >
                Create My Free Plan
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};