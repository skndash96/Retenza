"use client"
import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
    ArrowRight,
    Download,
    Gift,
    Users,
    Trophy,
    Star,
    Store,
    Target,
    CheckCircle,
    Zap,
    Heart,
    ShoppingBag,
    Award
} from "lucide-react";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { useRouter } from "next/navigation";

const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0 },
};

const stagger = {
    hidden: {},
    show: { transition: { staggerChildren: 0.1 } },
};

export default function HowItWorksPage() {
    const { isInstalled, isInstallable, installPWA } = usePWAInstall();
    const router = useRouter();

    const steps = [
        {
            step: "1",
            icon: Download,
            title: "Download the App",
            description: "Get the Retenza app from your app store or install it directly from our website.",
            color: "from-blue-500 to-indigo-600",
            bgColor: "from-blue-50 to-indigo-50"
        },
        {
            step: "2",
            icon: Users,
            title: "Sign Up & Discover",
            description: "Create your account and explore participating stores near you.",
            color: "from-purple-500 to-pink-600",
            bgColor: "from-purple-50 to-pink-50"
        },
        {
            step: "3",
            icon: ShoppingBag,
            title: "Shop & Earn",
            description: "Make purchases at partner stores and automatically earn loyalty points.",
            color: "from-green-500 to-emerald-600",
            bgColor: "from-green-50 to-emerald-50"
        },
        {
            step: "4",
            icon: Trophy,
            title: "Unlock Rewards",
            description: "Redeem points for exclusive discounts, free items, and special perks.",
            color: "from-orange-500 to-red-600",
            bgColor: "from-orange-50 to-red-50"
        }
    ];

    const features = [
        {
            icon: Target,
            title: "Smart Missions",
            description: "Complete fun challenges and earn bonus rewards",
            color: "text-blue-600"
        },
        {
            icon: Award,
            title: "Tier System",
            description: "Level up to unlock exclusive benefits and perks",
            color: "text-purple-600"
        },
        {
            icon: Gift,
            title: "Instant Rewards",
            description: "Get immediate points and cashback on every purchase",
            color: "text-green-600"
        },
        {
            icon: Star,
            title: "VIP Treatment",
            description: "Enjoy priority access and special member-only offers",
            color: "text-orange-600"
        }
    ];

    const benefits = [
        "Earn points on every purchase",
        "Unlock exclusive discounts and offers",
        "Get personalized rewards based on your shopping habits",
        "Access member-only events and promotions",
        "Track your loyalty status across all partner stores",
        "Redeem cashback and free products"
    ];

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
                        <Link href="/" className="flex items-center space-x-3">
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
                        </Link>

                        <div className="flex items-center space-x-4">
                            <Link
                                href="/"
                                className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-lg hover:bg-blue-50 transition-all duration-200 font-medium text-sm"
                            >
                                Home
                            </Link>

                            {/* PWA Download Button */}
                            {isInstallable && !isInstalled && (
                                <button
                                    onClick={installPWA}
                                    className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-lg font-medium text-sm shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2 hover:scale-105"
                                >
                                    <Download className="w-4 h-4" />
                                    Download App
                                </button>
                            )}

                            <button
                                onClick={installPWA}
                                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg font-medium text-sm shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2 hover:scale-105"
                            >
                                <Download className="w-4 h-4" />
                                Get App
                            </button>
                        </div>
                    </div>
                </div>
            </motion.header>

            {/* Hero Section */}
            <section className="relative overflow-hidden py-16 sm:py-24">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50"></div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial="hidden"
                        animate="show"
                        variants={stagger}
                        className="text-center"
                    >
                        <motion.div variants={fadeUp} className="mb-8">
                            <div className="inline-flex items-center bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold mb-6 shadow-sm border border-blue-200">
                                <Zap className="w-4 h-4 mr-2 text-blue-600" />
                                How Retenza Works
                            </div>

                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
                                Your loyalty,
                                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent block">
                                    rewarded simply
                                </span>
                            </h1>

                            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
                                Discover how easy it is to earn points, unlock rewards, and get the most out of your shopping experience with Retenza.
                            </p>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* How It Works Steps */}
            <section className="py-16 sm:py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true }}
                        variants={stagger}
                        className="text-center mb-16"
                    >
                        <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                            Get Started in 4 Simple Steps
                        </motion.h2>
                        <motion.p variants={fadeUp} className="text-lg text-gray-600 max-w-2xl mx-auto">
                            Join thousands of smart shoppers who are already earning rewards every day
                        </motion.p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {steps.map((step, index) => (
                            <motion.div
                                key={step.step}
                                initial="hidden"
                                whileInView="show"
                                viewport={{ once: true }}
                                variants={fadeUp}
                                transition={{ delay: index * 0.1 }}
                                className="relative"
                            >
                                <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
                                    <div className={`w-12 h-12 bg-gradient-to-r ${step.color} rounded-xl flex items-center justify-center mb-4 shadow-lg`}>
                                        <step.icon className="w-6 h-6 text-white" />
                                    </div>

                                    <div className="mb-4">
                                        <div className="text-sm font-bold text-gray-400 mb-1">STEP {step.step}</div>
                                        <h3 className="text-xl font-bold text-gray-900 mb-2">{step.title}</h3>
                                    </div>

                                    <p className="text-gray-600 leading-relaxed">{step.description}</p>
                                </div>

                                {/* Connector Arrow */}
                                {index < steps.length - 1 && (
                                    <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                                        <ArrowRight className="w-6 h-6 text-gray-300" />
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-16 sm:py-24 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true }}
                        variants={stagger}
                        className="text-center mb-16"
                    >
                        <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                            Why Choose Retenza?
                        </motion.h2>
                        <motion.p variants={fadeUp} className="text-lg text-gray-600 max-w-2xl mx-auto">
                            Experience the future of loyalty programs with smart features designed for modern shoppers
                        </motion.p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {features.map((feature, index) => (
                            <motion.div
                                key={feature.title}
                                initial="hidden"
                                whileInView="show"
                                viewport={{ once: true }}
                                variants={fadeUp}
                                transition={{ delay: index * 0.1 }}
                                className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 text-center"
                            >
                                <div className={`w-12 h-12 ${feature.color} bg-opacity-10 rounded-xl flex items-center justify-center mx-auto mb-4`}>
                                    <feature.icon className={`w-6 h-6 ${feature.color}`} />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                                <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Benefits Section */}
            <section className="py-16 sm:py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <motion.div
                            initial="hidden"
                            whileInView="show"
                            viewport={{ once: true }}
                            variants={stagger}
                        >
                            <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                                What You&apos;ll Get
                            </motion.h2>
                            <motion.p variants={fadeUp} className="text-lg text-gray-600 mb-8">
                                Every purchase becomes an opportunity to earn more and save more with our comprehensive rewards program.
                            </motion.p>

                            <motion.div variants={stagger} className="space-y-4">
                                {benefits.map((benefit, index) => (
                                    <motion.div
                                        key={index}
                                        variants={fadeUp}
                                        className="flex items-center space-x-3"
                                    >
                                        <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                                            <CheckCircle className="w-4 h-4 text-green-600" />
                                        </div>
                                        <span className="text-gray-700">{benefit}</span>
                                    </motion.div>
                                ))}
                            </motion.div>
                        </motion.div>

                        <motion.div
                            initial="hidden"
                            whileInView="show"
                            viewport={{ once: true }}
                            variants={fadeUp}
                            className="relative"
                        >
                            <div className="relative bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-8 shadow-2xl">
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-700 rounded-2xl transform rotate-3"></div>
                                <div className="relative bg-white rounded-xl p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                                <Heart className="w-5 h-5 text-white" />
                                            </div>
                                            <div>
                                                <div className="font-semibold text-gray-900">Loyalty Points</div>
                                                <div className="text-sm text-gray-500">Your Rewards</div>
                                            </div>
                                        </div>
                                        <div className="text-2xl font-bold text-green-600">+125</div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600">Coffee Shop Visit</span>
                                            <span className="font-medium text-gray-900">+25 pts</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600">Mission Completed</span>
                                            <span className="font-medium text-gray-900">+50 pts</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600">Tier Bonus</span>
                                            <span className="font-medium text-gray-900">+50 pts</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-16 sm:py-24 bg-gradient-to-r from-blue-600 to-purple-600">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <motion.div
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true }}
                        variants={stagger}
                    >
                        <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-bold text-white mb-6">
                            Ready to Start Earning Rewards?
                        </motion.h2>
                        <motion.p variants={fadeUp} className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                            Join thousands of smart shoppers who are already earning points and unlocking exclusive rewards every day.
                        </motion.p>

                        <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button
                                onClick={installPWA}
                                className="bg-white text-blue-600 px-8 py-4 rounded-xl font-bold text-base shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center justify-center group"
                            >
                                <Download className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform duration-300" />
                                Download App Now
                            </button>

                            <button
                                onClick={() => router.push('/login/customer')}
                                className="border-2 border-white text-white px-8 py-4 rounded-xl font-bold text-base hover:bg-white hover:text-blue-600 transition-all duration-300 flex items-center justify-center group"
                            >
                                <Store className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform duration-300" />
                                Find Stores
                            </button>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-white py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <div className="flex items-center justify-center space-x-3 mb-6">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-lg overflow-hidden">
                                <img
                                    src="/icon-512.png"
                                    alt="Retenza Logo"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <span className="text-xl font-bold">RETENZA</span>
                        </div>

                        <p className="text-gray-400 mb-6 max-w-2xl mx-auto">
                            Smart loyalty rewards for modern shoppers. Earn more, save more, and unlock exclusive experiences with every purchase.
                        </p>

                        <div className="flex justify-center space-x-6">
                            <Link href="/" className="text-gray-400 hover:text-white transition-colors">
                                Home
                            </Link>
                            <Link href="/login/customer" className="text-gray-400 hover:text-white transition-colors">
                                Find Stores
                            </Link>
                            <Link href="/login/business" className="text-gray-400 hover:text-white transition-colors">
                                Partner with Us
                            </Link>
                        </div>

                        <div className="mt-8 pt-8 border-t border-gray-800 text-gray-400 text-sm">
                            © 2024 Retenza. All rights reserved.
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}