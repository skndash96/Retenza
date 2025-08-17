"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

import { FooterComp } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const fadeUp: any = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

export default function LandingPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-sky-50">
      <section className="relative overflow-hidden">
        <div className="container mx-auto px-6 lg:px-20 py-20 lg:py-28">
          <motion.div
            initial="hidden"
            animate="show"
            variants={container}
            className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center"
          >
            <motion.div variants={fadeUp} className="space-y-6">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight text-slate-900">
                RETENZA
                <span className="block text-amber-600">Win the war for your customers&apos; loyalty.</span>
              </h1>

              <p className="text-lg text-slate-600 max-w-xl">
                Turn first-time visitors into loyal fans with tiered rewards, gamified missions, and personalized automations — all from a phone or tablet you already own.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mt-4">
                <Button
                  onClick={() => router.push('/login/customer')}
                  className="w-full sm:w-auto px-8 py-4 text-lg shadow-lg"
                >
                  I&apos;m a Customer
                </Button>

                <Button
                  variant="outline"
                  onClick={() => router.push('/login/business')}
                  className="w-full sm:w-auto px-8 py-4 text-lg"
                >
                  I&apos;m a Business
                </Button>
              </div>
            </motion.div>

            <motion.div variants={fadeUp} className="w-full">
              <div className="relative">
                <div className="rounded-2xl bg-gradient-to-br from-white to-amber-50 shadow-2xl p-6 lg:p-8">
                  <h3 className="text-lg font-semibold text-slate-800 mb-3">How Riya becomes a loyal fan</h3>
                  <ol className="space-y-4 text-slate-600">
                    <li className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-amber-600 text-white flex items-center justify-center font-bold">1</div>
                      <div>
                        <div className="font-medium">Quick sign-up & welcome reward</div>
                        <div className="text-sm">Scan QR → sign up → get an instant welcome discount.</div>
                      </div>
                    </li>

                    <li className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-amber-600 text-white flex items-center justify-center font-bold">2</div>
                      <div>
                        <div className="font-medium">Earn points & level up</div>
                        <div className="text-sm">Purchase awards points; progress bar gamifies repeat visits.</div>
                      </div>
                    </li>

                    <li className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-amber-600 text-white flex items-center justify-center font-bold">3</div>
                      <div>
                        <div className="font-medium">Missions & social growth</div>
                        <div className="text-sm">Invite friends to unlock group discounts and reach new tiers together.</div>
                      </div>
                    </li>

                    <li className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-amber-600 text-white flex items-center justify-center font-bold">4</div>
                      <div>
                        <div className="font-medium">Tier reward & VIP retention</div>
                        <div className="text-sm">Unlock rewards like free items, discounts and feel like a VIP.</div>
                      </div>
                    </li>
                  </ol>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <Separator />

        <section className="container mx-auto px-6 lg:px-20 py-12">
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch" 
            initial="hidden" 
            animate="show" 
            variants={container}
          >
          <motion.div variants={fadeUp}>
            <Card className="flex flex-col h-full p-4">
              <CardHeader>
                <CardTitle>Loyalty Program</CardTitle>
                <CardDescription>Reward with status, increase retention, simple operation.</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="list-disc ml-5 text-slate-600">
                  <li>Tiered progress: Bronze → Gold</li>
                  <li>Points per ₹ (configurable)</li>
                  <li>Automatic tier upgrades</li>
                </ul>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={fadeUp}>
            <Card className="flex flex-col h-full p-4">
              <CardHeader>
                <CardTitle>Gamified Promotions</CardTitle>
                <CardDescription>Launch missions & tap into the Retenza network.</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="list-disc ml-5 text-slate-600">
                  <li>Squad Goals & group discounts</li>
                  <li>Flash Frenzy & time-limited offers</li>
                  <li>Discoverable campaigns for customers</li>
                </ul>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={fadeUp}>
            <Card className="flex flex-col h-full p-4">
              <CardHeader>
                <CardTitle>Automated Experiences</CardTitle>
                <CardDescription>Personal touches that create loyalty.</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="list-disc ml-5 text-slate-600">
                  <li>Birthday gifts & milestone rewards</li>
                  <li>Instant congratulatory rewards</li>
                  <li>Data-driven insights & dashboard</li>
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </section>

      <Separator />

      <section className="container mx-auto px-6 lg:px-20 py-12">
        <motion.div className="bg-white rounded-2xl shadow-xl p-8 lg:p-12 flex flex-col lg:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-bold">Simple, flat pricing</h2>
            <p className="text-slate-600 mt-2">Get the entire Retenza Pro suite for one flat fee.</p>
            <div className="mt-4 flex items-baseline gap-4">
              <div className="text-4xl font-extrabold">₹2,499</div>
              <div className="text-slate-500">/ month • 30-day money-back guarantee</div>
            </div>
          </div>

          <div className="flex gap-4">
            <Button onClick={() => router.push('/login/business')} className="px-6 py-3">Get Started (Business)</Button>
            <Button variant="ghost" onClick={() => router.push('/login/customer')} className="px-6 py-3">Join as Customer</Button>
          </div>
        </motion.div>
      </section>
    <FooterComp />

    </main>
  );
}
