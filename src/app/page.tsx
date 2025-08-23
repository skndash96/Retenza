"use client"
import React, { useEffect } from "react";
import { motion } from "framer-motion";
import {
  Gift,
  Zap,
  Trophy,
  ArrowRight,
  Check,
  Download,
  UserPlus,
  Sparkles,
  Heart,
  Globe,
  Smartphone,
  Target
} from "lucide-react";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { useRouter } from "next/navigation";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0 },
};



const scaleIn = {
  hidden: { opacity: 0, scale: 0.8 },
  show: { opacity: 1, scale: 1 },
};

export default function RetenzaLanding() {
  const { isInstalled, isInstallable, installPWA } = usePWAInstall();
  const router = useRouter();

  // Check authentication status on component mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/session');
        if (response.ok) {
          const data = await response.json() as { user: any; role: string | null };
          if (data.user && data.role) {
            if (data.role === 'business') {
              void router.push('/business');
            } else if (data.role === 'user') {
              void router.push('/customer');
            }
          }
        }
      } catch {
        console.log('User not authenticated, staying on landing page');
      }
    };

    void checkAuth();
  }, [router]);

  const customerFeatures = [
    {
      icon: Target,
      title: "Mission-Based Rewards",
      desc: "Turn shopping into adventures with personalized challenges and quests",
      color: "from-green-500 to-emerald-500",
      bgColor: "from-green-50 to-emerald-50"
    },
    {
      icon: Zap,
      title: "AI-Powered Insights",
      desc: "Smart recommendations and personalized offers based on your behavior",
      color: "from-blue-500 to-indigo-500",
      bgColor: "from-blue-50 to-indigo-50"
    },
    {
      icon: Trophy,
      title: "Dynamic Tiers",
      desc: "Fluid loyalty levels that adapt to your shopping patterns and preferences",
      color: "from-amber-500 to-orange-500",
      bgColor: "from-amber-50 to-orange-50"
    },
    {
      icon: Sparkles,
      title: "Gamified Experience",
      desc: "Streaks, achievements, and social challenges that make loyalty fun",
      color: "from-purple-500 to-pink-500",
      bgColor: "from-purple-50 to-pink-50"
    }
  ];

  const howItWorks = [
    {
      step: "1",
      title: "Join the Revolution",
      desc: "Download the app and experience the future of loyalty rewards in minutes.",
      color: "from-blue-500 to-indigo-600",
      icon: UserPlus
    },
    {
      step: "2",
      title: "Complete Missions",
      desc: "Take on personalized challenges that transform shopping into adventures.",
      color: "from-purple-500 to-pink-600",
      icon: Target
    },
    {
      step: "3",
      title: "Unlock the Extraordinary",
      desc: "Access exclusive rewards, experiences, and benefits that go beyond traditional loyalty.",
      color: "from-amber-500 to-orange-600",
      icon: Sparkles
    }
  ];

  const valueProps = [
    {
      number: "100%",
      label: "Free Forever",
      icon: Heart,
      color: "from-red-500 to-pink-500",
      description: "No hidden fees, ever"
    },
    {
      number: "10x",
      label: "Better Rewards",
      icon: Trophy,
      color: "from-amber-500 to-orange-500",
      description: "Than traditional programs"
    },
    {
      number: "24/7",
      label: "Smart Tracking",
      icon: Zap,
      color: "from-blue-500 to-indigo-500",
      description: "AI-powered insights"
    },
    {
      number: "∞",
      label: "Possibilities",
      icon: Sparkles,
      color: "from-purple-500 to-pink-500",
      description: "Unlimited earning potential"
    }
  ];

  const handlePrimaryAction = async () => {
    if (isInstalled) {
      router.push('/signup/customer');
    } else if (isInstallable) {
      const success = await installPWA();
      if (success) {
        console.log('PWA installed successfully');
      }
    } else {
      router.push('/signup/customer');
    }
  };

  const getPrimaryButtonContent = () => {
    if (isInstalled) {
      return {
        text: "Get Started",
        icon: UserPlus,
        description: "Already have the app? Sign up now!"
      };
    } else if (isInstallable) {
      return {
        text: "Install App",
        icon: Download,
        description: "Install Retenza for the best experience"
      };
    } else {
      return {
        text: "Sign Up Now",
        icon: UserPlus,
        description: "Join thousands of smart shoppers"
      };
    }
  };

  const primaryButton = getPrimaryButtonContent();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-lg overflow-hidden">
                <img
                  src="/icon-512.png"
                  alt="Retenza Logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                RETENZA
              </span>
            </div>

            <div className="hidden sm:flex items-center space-x-4">
              <button
                onClick={() => router.push('/how-it-works')}
                className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-lg hover:bg-blue-50 transition-all duration-200 font-medium text-sm"
              >
                How it Works
              </button>
              <button
                onClick={() => router.push('/login/customer')}
                className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-lg hover:bg-blue-50 transition-all duration-200 font-medium text-sm"
              >
                Find Stores
              </button>

              {/* Download App Button */}
              <button
                onClick={installPWA}
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg font-medium text-sm shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2 hover:scale-105"
              >
                <Download className="w-4 h-4" />
                Download App
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-12 sm:py-20">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50"></div>
        <div className="absolute inset-0 opacity-5 bg-gradient-to-br from-blue-200 to-purple-200"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            animate="show"
            variants={container}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center"
          >
            <motion.div variants={fadeUp} className="text-center lg:text-left">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 px-4 py-2 rounded-full text-xs font-semibold mb-6 shadow-sm border border-blue-200"
              >
                <Sparkles className="w-3 h-3 mr-2 text-blue-600" />
                Revolutionary Loyalty Platform
              </motion.div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-6">
                The Future of
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent block">
                  Customer Loyalty
                </span>
              </h1>

              <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                Revolutionary AI-powered platform that transforms every purchase into rewards, missions into adventures, and customers into brand champions. Built for the next generation of Indian consumers.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handlePrimaryAction}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-bold text-base shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center justify-center group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <span className="relative z-10">{primaryButton.text}</span>
                  <primaryButton.icon className="w-5 h-5 ml-3 group-hover:scale-110 transition-transform duration-300 relative z-10" />
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.push('/login/business')}
                  className="text-gray-600 px-6 py-4 rounded-xl font-semibold text-base hover:text-blue-600 transition-all duration-300 border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                >
                  Partner with us
                </motion.button>
              </div>

              {/* Button Description */}
              <p className="text-sm text-gray-500 mb-6 text-center lg:text-left">
                {primaryButton.description}
              </p>

              {/* Value Props Grid */}
              <motion.div
                variants={fadeUp}
                className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl lg:max-w-none"
              >
                {valueProps.map((prop, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className="text-center group"
                  >
                    <div className={`w-12 h-12 bg-gradient-to-r ${prop.color} rounded-xl flex items-center justify-center mx-auto mb-2 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <prop.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-lg font-bold text-gray-900 mb-1">{prop.number}</div>
                    <div className="text-xs font-medium text-gray-700 mb-1">{prop.label}</div>
                    <div className="text-xs text-gray-500">{prop.description}</div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>

            <motion.div variants={scaleIn} className="relative">
              <div className="relative mx-auto w-64 h-80 sm:w-80 sm:h-96">
                <motion.div
                  animate={{ y: [-10, 10, -10] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -top-6 -right-6 w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-xl"
                >
                  <Gift className="w-6 h-6 text-white" />
                </motion.div>

                <motion.div
                  animate={{ y: [10, -10, 10] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -bottom-6 -left-6 w-16 h-16 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-xl"
                >
                  <Trophy className="w-8 h-8 text-white" />
                </motion.div>

                <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl shadow-2xl border-4 border-gray-700">
                  <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-gray-600 rounded-full"></div>

                  <div className="absolute top-6 bottom-6 left-3 right-3 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl overflow-hidden">
                    <div className="p-4 h-full">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-sm font-bold text-gray-900">Smart Rewards</h3>
                          <p className="text-xs text-gray-500">AI-Powered</p>
                        </div>
                        <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
                          <Sparkles className="w-5 h-5 text-white" />
                        </div>
                      </div>

                      {/* Mission Card */}
                      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-3 mb-4 text-white shadow-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs opacity-90">Active Mission</span>
                          <Target className="w-3 h-3" />
                        </div>
                        <div className="text-sm font-bold">Coffee Explorer</div>
                        <div className="text-xs opacity-90">Visit 3 cafes this week</div>
                      </div>

                      <div className="mb-4">
                        <div className="flex justify-between text-xs mb-2">
                          <span className="text-gray-600">Mission Progress</span>
                          <span className="font-medium">2/3</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full w-2/3 shadow-sm"></div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-2 text-center shadow-sm">
                          <Gift className="w-4 h-4 text-blue-600 mx-auto mb-1" />
                          <span className="text-xs font-medium text-gray-700">Rewards</span>
                        </div>
                        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-2 text-center shadow-sm">
                          <Target className="w-4 h-4 text-green-600 mx-auto mb-1" />
                          <span className="text-xs font-medium text-gray-700">Missions</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section className="py-16 sm:py-24 bg-gradient-to-br from-gray-50 to-blue-50 relative">
        <div className="absolute inset-0 opacity-3 bg-gradient-to-br from-gray-200 to-blue-200"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={container}
            className="text-center mb-16"
          >
            <motion.div variants={fadeUp}>
              <div className="inline-flex items-center bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 px-4 py-2 rounded-full text-xs font-semibold mb-4">
                <Target className="w-3 h-3 mr-2" />
                Simple & Effective
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                How Retenza Works
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Three simple steps to start earning rewards and unlocking exclusive benefits at your favorite stores.
              </p>
            </motion.div>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={container}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {howItWorks.map((step, index) => (
              <motion.div key={index} variants={fadeUp} className="relative group">
                <div className="bg-white rounded-2xl shadow-lg p-6 h-full border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <div className={`w-16 h-16 bg-gradient-to-r ${step.color} rounded-xl flex items-center justify-center text-white text-2xl font-bold mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <step.icon className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{step.desc}</p>
                </div>
                {index < howItWorks.length - 1 && (
                  <div className="hidden md:block absolute -right-3 top-1/2 transform -translate-y-1/2">
                    <ArrowRight className="w-8 h-8 text-gray-300" />
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={container}
            className="text-center mb-16"
          >
            <motion.div variants={fadeUp}>
              <div className="inline-flex items-center bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 px-4 py-2 rounded-full text-xs font-semibold mb-4">
                <Zap className="w-3 h-3 mr-2" />
                Revolutionary Features
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Why Retenza is Revolutionary
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
                We&apos;re not just another loyalty program. We&apos;re building the future where every interaction is meaningful, every reward is earned, and every customer becomes a brand champion.
              </p>
            </motion.div>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={container}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {customerFeatures.map((feature, index) => (
              <motion.div
                key={index}
                variants={fadeUp}
                className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100 group"
              >
                <div className={`w-14 h-14 bg-gradient-to-r ${feature.bgColor} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className={`w-7 h-7 ${feature.color.replace('from-', 'text-').replace(' to-', '')}`} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed text-sm">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="py-16 sm:py-24 bg-gradient-to-br from-blue-600 to-purple-700 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-gradient-to-br from-blue-200 to-purple-200"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={container}
          >
            <motion.div variants={fadeUp}>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Ready to Experience the Future?
              </h2>
              <p className="text-lg text-blue-100 max-w-3xl mx-auto leading-relaxed mb-8">
                Be among the first to experience revolutionary loyalty rewards. Join the movement that&apos;s transforming how brands connect with customers across India.
              </p>
            </motion.div>

            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={handlePrimaryAction}
                className="bg-white text-blue-600 px-8 py-4 rounded-xl font-bold text-base shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center justify-center group"
              >
                {primaryButton.text}
                <primaryButton.icon className="w-5 h-5 ml-3 group-hover:scale-110 transition-transform duration-300" />
              </motion.button>
            </motion.div>

            <motion.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
              <div className="flex items-center justify-center text-blue-100">
                <Check className="w-5 h-5 mr-2 text-green-300" />
                <span className="font-medium text-sm">Free to join</span>
              </div>
              <div className="flex items-center justify-center text-blue-100">
                <Check className="w-5 h-5 mr-2 text-green-300" />
                <span className="font-medium text-sm">Instant rewards</span>
              </div>
              <div className="flex items-center justify-center text-blue-100">
                <Check className="w-5 h-5 mr-2 text-green-300" />
                <span className="font-medium text-sm">No fees</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <footer className="bg-gray-900 text-white py-12 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center shadow-lg overflow-hidden">
                  <img
                    src="/icon-512.png"
                    alt="Retenza Logo"
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  RETENZA
                </span>
              </div>
              <p className="text-gray-300 mb-4 max-w-lg leading-relaxed text-sm">
                Pioneering the next generation of customer loyalty through AI-powered missions, dynamic rewards, and gamified experiences that create lasting brand connections.
              </p>
              <div className="flex space-x-3">
                <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors cursor-pointer">
                  <Globe className="w-4 h-4 text-gray-300" />
                </div>
                <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors cursor-pointer">
                  <Smartphone className="w-4 h-4 text-gray-300" />
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-base mb-4 text-white">For Customers</h3>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li className="hover:text-white transition-colors cursor-pointer">How it Works</li>
                <li className="hover:text-white transition-colors cursor-pointer">Download App</li>
                <li className="hover:text-white transition-colors cursor-pointer">Find Stores</li>
                <li className="hover:text-white transition-colors cursor-pointer">Support</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-base mb-4 text-white">Company</h3>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li className="hover:text-white transition-colors cursor-pointer">About Us</li>
                <li className="hover:text-white transition-colors cursor-pointer">Contact</li>
                <li className="hover:text-white transition-colors cursor-pointer">Careers</li>
                <li className="hover:text-white transition-colors cursor-pointer">For Business</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-6 flex flex-col sm:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">&copy; 2025 Retenza. All rights reserved.</p>
            <div className="flex space-x-6 mt-3 sm:mt-0 text-gray-400 text-sm">
              <span className="hover:text-white transition-colors cursor-pointer">Privacy Policy</span>
              <span className="hover:text-white transition-colors cursor-pointer">Terms of Service</span>
              <span className="hover:text-white transition-colors cursor-pointer">Contact</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
