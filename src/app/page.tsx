"use client";
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
  Target,
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
        const response = await fetch("/api/auth/session");
        if (response.ok) {
          const data = (await response.json()) as {
            user: any;
            role: string | null;
          };
          if (data.user && data.role) {
            if (data.role === "business") {
              void router.push("/business");
            } else if (data.role === "user") {
              void router.push("/customer");
            }
          }
        }
      } catch {
        console.log("User not authenticated, staying on landing page");
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
      bgColor: "from-green-50 to-emerald-50",
    },
    {
      icon: Zap,
      title: "AI-Powered Insights",
      desc: "Smart recommendations and personalized offers based on your behavior",
      color: "from-blue-500 to-indigo-500",
      bgColor: "from-blue-50 to-indigo-50",
    },
    {
      icon: Trophy,
      title: "Dynamic Tiers",
      desc: "Fluid loyalty levels that adapt to your shopping patterns and preferences",
      color: "from-amber-500 to-orange-500",
      bgColor: "from-amber-50 to-orange-50",
    },
    {
      icon: Sparkles,
      title: "Gamified Experience",
      desc: "Streaks, achievements, and social challenges that make loyalty fun",
      color: "from-purple-500 to-pink-500",
      bgColor: "from-purple-50 to-pink-50",
    },
  ];

  const howItWorks = [
    {
      step: "1",
      title: "Join the Revolution",
      desc: "Download the app and experience the future of loyalty rewards in minutes.",
      color: "from-blue-500 to-indigo-600",
      icon: UserPlus,
    },
    {
      step: "2",
      title: "Complete Missions",
      desc: "Take on personalized challenges that transform shopping into adventures.",
      color: "from-purple-500 to-pink-600",
      icon: Target,
    },
    {
      step: "3",
      title: "Unlock the Extraordinary",
      desc: "Access exclusive rewards, experiences, and benefits that go beyond traditional loyalty.",
      color: "from-amber-500 to-orange-600",
      icon: Sparkles,
    },
  ];

  const valueProps = [
    {
      number: "100%",
      label: "Free Forever",
      icon: Heart,
      color: "from-red-500 to-pink-500",
      description: "No hidden fees, ever",
    },
    {
      number: "10x",
      label: "Better Rewards",
      icon: Trophy,
      color: "from-amber-500 to-orange-500",
      description: "Than traditional programs",
    },
    {
      number: "24/7",
      label: "Smart Tracking",
      icon: Zap,
      color: "from-blue-500 to-indigo-500",
      description: "AI-powered insights",
    },
    {
      number: "∞",
      label: "Possibilities",
      icon: Sparkles,
      color: "from-purple-500 to-pink-500",
      description: "Unlimited earning potential",
    },
  ];

  const handlePrimaryAction = async () => {
    if (isInstalled) {
      router.push("/signup/customer");
    }
    // else if (isInstallable) {
    //   const success = await installPWA();
    //   if (success) {
    //     console.log('PWA installed successfully');
    //   }
    // }
    else {
      router.push("/signup/customer");
    }
  };

  const getPrimaryButtonContent = () => {
    if (isInstalled) {
      return {
        text: "Get Started",
        icon: UserPlus,
        description: "Already have the app? Sign up now!",
      };
    }
    // } else if (isInstallable) {
    //   return {
    //     text: "Install App",
    //     icon: Download,
    //     description: "Install Retenza for the best experience"
    //   };
    // }
    else {
      return {
        text: "Sign Up Now",
        icon: UserPlus,
        description: "Join thousands of smart shoppers",
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
        className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 shadow-sm backdrop-blur-md"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg shadow-lg">
                <img
                  src="/icon-512.png"
                  alt="Retenza Logo"
                  className="h-full w-full object-cover"
                />
              </div>
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-xl font-bold text-transparent">
                RETENZA
              </span>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push("/how-it-works")}
                className="hidden rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-all duration-200 hover:bg-blue-50 hover:text-blue-600 sm:inline"
              >
                How it Works
              </button>
              <button
                onClick={() => router.push("/login/customer")}
                className="hidden rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-all duration-200 hover:bg-blue-50 hover:text-blue-600 sm:inline"
              >
                Find Stores
              </button>
              <button
                onClick={installPWA}
                className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 p-2 text-white shadow-md transition-all duration-200 hover:scale-105 hover:shadow-lg sm:px-4 sm:py-2"
                aria-label="Download App"
              >
                <Download className="h-5 w-5" />
                <span className="hidden text-sm font-medium sm:inline">
                  Download App
                </span>
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-12 sm:py-20">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-blue-200 to-purple-200 opacity-5"></div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            animate="show"
            variants={container}
            className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-12"
          >
            <motion.div variants={fadeUp} className="text-center lg:text-left">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="mb-6 inline-flex items-center rounded-full border border-blue-200 bg-gradient-to-r from-blue-100 to-purple-100 px-4 py-2 text-xs font-semibold text-blue-700 shadow-sm"
              >
                <Sparkles className="mr-2 h-3 w-3 text-blue-600" />
                Revolutionary Loyalty Platform
              </motion.div>

              <h1 className="mb-6 text-3xl font-bold leading-tight text-gray-900 sm:text-4xl lg:text-5xl">
                The Future of
                <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Customer Loyalty
                </span>
              </h1>

              <p className="mx-auto mb-8 max-w-2xl text-lg leading-relaxed text-gray-600 lg:mx-0">
                Revolutionary AI-powered platform that transforms every purchase
                into rewards, missions into adventures, and customers into brand
                champions. Built for the next generation of Indian consumers.
              </p>

              <div className="mb-8 flex flex-col justify-center gap-4 sm:flex-row lg:justify-start">
                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handlePrimaryAction}
                  className="group relative flex items-center justify-center overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-4 text-base font-bold text-white shadow-xl transition-all duration-300 hover:shadow-2xl"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-purple-700 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                  <span className="relative z-10">{primaryButton.text}</span>
                  <primaryButton.icon className="relative z-10 ml-3 h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.push("/login/business")}
                  className="rounded-xl border-2 border-gray-200 px-6 py-4 text-center text-base font-semibold text-gray-600 transition-all duration-300 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600"
                >
                  Partner with us
                  <br />
                  <span className="whitespace-nowrap">
                    (Only for businesses)
                  </span>
                </motion.button>
              </div>

              {/* Button Description */}
              <p className="mb-6 text-center text-sm text-gray-500 lg:text-left">
                {primaryButton.description}
              </p>

              {/* Value Props Grid */}
              <motion.div
                variants={fadeUp}
                className="grid max-w-2xl grid-cols-2 gap-4 sm:grid-cols-4 lg:max-w-none"
              >
                {valueProps.map((prop, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className="group text-center"
                  >
                    <div
                      className={`h-12 w-12 bg-gradient-to-r ${prop.color} mx-auto mb-2 flex items-center justify-center rounded-xl shadow-lg transition-transform duration-300 group-hover:scale-110`}
                    >
                      <prop.icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="mb-1 text-lg font-bold text-gray-900">
                      {prop.number}
                    </div>
                    <div className="mb-1 text-xs font-medium text-gray-700">
                      {prop.label}
                    </div>
                    <div className="text-xs text-gray-500">
                      {prop.description}
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>

            <motion.div variants={scaleIn} className="relative">
              <div className="relative mx-auto h-80 w-64 sm:h-96 sm:w-80">
                <motion.div
                  animate={{ y: [-10, 10, -10] }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="absolute -right-6 -top-6 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 shadow-xl"
                >
                  <Gift className="h-6 w-6 text-white" />
                </motion.div>

                <motion.div
                  animate={{ y: [10, -10, 10] }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="absolute -bottom-6 -left-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-green-400 to-emerald-500 shadow-xl"
                >
                  <Trophy className="h-8 w-8 text-white" />
                </motion.div>

                <div className="absolute inset-0 rounded-3xl border-4 border-gray-700 bg-gradient-to-br from-gray-800 to-gray-900 shadow-2xl">
                  <div className="absolute left-1/2 top-4 h-1 w-16 -translate-x-1/2 transform rounded-full bg-gray-600"></div>

                  <div className="absolute bottom-6 left-3 right-3 top-6 overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 to-purple-50">
                    <div className="h-full p-4">
                      <div className="mb-4 flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-bold text-gray-900">
                            Smart Rewards
                          </h3>
                          <p className="text-xs text-gray-500">AI-Powered</p>
                        </div>
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg">
                          <Sparkles className="h-5 w-5 text-white" />
                        </div>
                      </div>

                      {/* Mission Card */}
                      <div className="mb-4 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 p-3 text-white shadow-lg">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-xs opacity-90">
                            Active Mission
                          </span>
                          <Target className="h-3 w-3" />
                        </div>
                        <div className="text-sm font-bold">Coffee Explorer</div>
                        <div className="text-xs opacity-90">
                          Visit 3 cafes this week
                        </div>
                      </div>

                      <div className="mb-4">
                        <div className="mb-2 flex justify-between text-xs">
                          <span className="text-gray-600">
                            Mission Progress
                          </span>
                          <span className="font-medium">2/3</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-gray-200">
                          <div className="h-2 w-2/3 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 shadow-sm"></div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="rounded-lg bg-white/80 p-2 text-center shadow-sm backdrop-blur-sm">
                          <Gift className="mx-auto mb-1 h-4 w-4 text-blue-600" />
                          <span className="text-xs font-medium text-gray-700">
                            Rewards
                          </span>
                        </div>
                        <div className="rounded-lg bg-white/80 p-2 text-center shadow-sm backdrop-blur-sm">
                          <Target className="mx-auto mb-1 h-4 w-4 text-green-600" />
                          <span className="text-xs font-medium text-gray-700">
                            Missions
                          </span>
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

      <section className="relative bg-gradient-to-br from-gray-50 to-blue-50 py-16 sm:py-24">
        <div className="opacity-3 absolute inset-0 bg-gradient-to-br from-gray-200 to-blue-200"></div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={container}
            className="mb-16 text-center"
          >
            <motion.div variants={fadeUp}>
              <div className="mb-4 inline-flex items-center rounded-full bg-gradient-to-r from-blue-100 to-purple-100 px-4 py-2 text-xs font-semibold text-blue-700">
                <Target className="mr-2 h-3 w-3" />
                Simple & Effective
              </div>
              <h2 className="mb-4 text-3xl font-bold text-gray-900 sm:text-4xl">
                How Retenza Works
              </h2>
              <p className="mx-auto max-w-3xl text-lg leading-relaxed text-gray-600">
                Three simple steps to start earning rewards and unlocking
                exclusive benefits at your favorite stores.
              </p>
            </motion.div>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={container}
            className="grid grid-cols-1 gap-6 md:grid-cols-3"
          >
            {howItWorks.map((step, index) => (
              <motion.div
                key={index}
                variants={fadeUp}
                className="group relative"
              >
                <div className="h-full rounded-2xl border border-gray-100 bg-white p-6 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                  <div
                    className={`h-16 w-16 bg-gradient-to-r ${step.color} mb-4 flex items-center justify-center rounded-xl text-2xl font-bold text-white shadow-lg transition-transform duration-300 group-hover:scale-110`}
                  >
                    <step.icon className="h-8 w-8" />
                  </div>
                  <h3 className="mb-3 text-xl font-bold text-gray-900">
                    {step.title}
                  </h3>
                  <p className="leading-relaxed text-gray-600">{step.desc}</p>
                </div>
                {index < howItWorks.length - 1 && (
                  <div className="absolute -right-3 top-1/2 hidden -translate-y-1/2 transform md:block">
                    <ArrowRight className="h-8 w-8 text-gray-300" />
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={container}
            className="mb-16 text-center"
          >
            <motion.div variants={fadeUp}>
              <div className="mb-4 inline-flex items-center rounded-full bg-gradient-to-r from-green-100 to-emerald-100 px-4 py-2 text-xs font-semibold text-green-700">
                <Zap className="mr-2 h-3 w-3" />
                Revolutionary Features
              </div>
              <h2 className="mb-4 text-3xl font-bold text-gray-900 sm:text-4xl">
                Why Retenza is Revolutionary
              </h2>
              <p className="mx-auto max-w-3xl text-lg leading-relaxed text-gray-600">
                We&apos;re not just another loyalty program. We&apos;re building
                the future where every interaction is meaningful, every reward
                is earned, and every customer becomes a brand champion.
              </p>
            </motion.div>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={container}
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
          >
            {customerFeatures.map((feature, index) => (
              <motion.div
                key={index}
                variants={fadeUp}
                className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <div
                  className={`h-14 w-14 bg-gradient-to-r ${feature.bgColor} mb-4 flex items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110`}
                >
                  <feature.icon
                    className={`h-7 w-7 ${feature.color.replace("from-", "text-").replace("to-", "")}`}
                  />
                </div>
                <h3 className="mb-3 text-lg font-bold text-gray-900">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-gray-600">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-purple-700 py-16 text-white sm:py-24">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-200 to-purple-200 opacity-10"></div>

        <div className="relative mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={container}
          >
            <motion.div variants={fadeUp}>
              <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
                Ready to Experience the Future?
              </h2>
              <p className="mx-auto mb-8 max-w-3xl text-lg leading-relaxed text-blue-100">
                Be among the first to experience revolutionary loyalty rewards.
                Join the movement that&apos;s transforming how brands connect
                with customers across India.
              </p>
            </motion.div>

            <motion.div
              variants={fadeUp}
              className="mb-8 flex flex-col justify-center gap-4 sm:flex-row"
            >
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={handlePrimaryAction}
                className="group flex items-center justify-center rounded-xl bg-white px-8 py-4 text-base font-bold text-blue-600 shadow-xl transition-all duration-300 hover:shadow-2xl"
              >
                {primaryButton.text}
                <primaryButton.icon className="ml-3 h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
              </motion.button>
            </motion.div>

            <motion.div
              variants={fadeUp}
              className="mx-auto grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-3"
            >
              <div className="flex items-center justify-center text-blue-100">
                <Check className="mr-2 h-5 w-5 text-green-300" />
                <span className="text-sm font-medium">Free to join</span>
              </div>
              <div className="flex items-center justify-center text-blue-100">
                <Check className="mr-2 h-5 w-5 text-green-300" />
                <span className="text-sm font-medium">Instant rewards</span>
              </div>
              <div className="flex items-center justify-center text-blue-100">
                <Check className="mr-2 h-5 w-5 text-green-300" />
                <span className="text-sm font-medium">No fees</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <footer className="relative bg-gray-900 py-12 text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"></div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            <div className="col-span-1 md:col-span-2">
              <div className="mb-4 flex items-center space-x-3">
                <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg shadow-lg">
                  <img
                    src="/icon-512.png"
                    alt="Retenza Logo"
                    className="h-full w-full object-cover"
                  />
                </div>
                <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-2xl font-bold text-transparent">
                  RETENZA
                </span>
              </div>
              <p className="mb-4 max-w-lg text-sm leading-relaxed text-gray-300">
                Pioneering the next generation of customer loyalty through
                AI-powered missions, dynamic rewards, and gamified experiences
                that create lasting brand connections.
              </p>
              <div className="flex space-x-3">
                <div className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg bg-gray-800 transition-colors hover:bg-gray-700">
                  <Globe className="h-4 w-4 text-gray-300" />
                </div>
                <div className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg bg-gray-800 transition-colors hover:bg-gray-700">
                  <Smartphone className="h-4 w-4 text-gray-300" />
                </div>
              </div>
            </div>

            <div>
              <h3 className="mb-4 text-base font-bold text-white">
                For Customers
              </h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="cursor-pointer transition-colors hover:text-white">
                  How it Works
                </li>
                <li className="cursor-pointer transition-colors hover:text-white">
                  Download App
                </li>
                <li className="cursor-pointer transition-colors hover:text-white">
                  Find Stores
                </li>
                <li className="cursor-pointer transition-colors hover:text-white">
                  Support
                </li>
              </ul>
            </div>

            <div>
              <h3 className="mb-4 text-base font-bold text-white">Company</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="cursor-pointer transition-colors hover:text-white">
                  About Us
                </li>
                <li className="cursor-pointer transition-colors hover:text-white">
                  Contact
                </li>
                <li className="cursor-pointer transition-colors hover:text-white">
                  Careers
                </li>
                <li className="cursor-pointer transition-colors hover:text-white">
                  For Business
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 flex flex-col items-center justify-between border-t border-gray-800 pt-6 sm:flex-row">
            <p className="text-sm text-gray-400">
              &copy; 2025 Retenza. All rights reserved.
            </p>
            <div className="mt-3 flex space-x-6 text-sm text-gray-400 sm:mt-0">
              <span className="cursor-pointer transition-colors hover:text-white">
                Privacy Policy
              </span>
              <span className="cursor-pointer transition-colors hover:text-white">
                Terms of Service
              </span>
              <span className="cursor-pointer transition-colors hover:text-white">
                Contact
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
