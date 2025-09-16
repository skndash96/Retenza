import React from "react"
import { ShoppingBag, Target, Gift } from "lucide-react"
import { motion } from "framer-motion"

export default function MissionExplanation() {
  const steps = [
    {
      icon: ShoppingBag,
      title: "Shop",
      description: "Pick what you love"
    },
    {
      icon: Target,
      title: "Mission",
      description: "Show your purpose"
    },
    {
      icon: Gift,
      title: "Reward",
      description: "Redeem instantly"
    },
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  }

  return (
    <div className="mt-4 mb-8 px-4 sm:px-6 lg:px-8">
      <motion.div
        className="relative flex flex-col md:flex-row gap-6 w-fit md:mx-auto"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        viewport={{ once: true }}
      >
        {steps.map((step, index) => {
          const Icon = step.icon
          return (
            <motion.div
              key={index}
              variants={itemVariants}
              className="flex items-start gap-3"
            >
              {/* Icon circle */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 flex items-center justify-center rounded-full shadow`}
                >
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              {/* Text */}
              <div>
                <h3 className="font-semibold text-gray-800 text-sm">
                  {step.title}
                </h3>
                <p className="text-gray-600 text-xs">{step.description}</p>
              </div>
            </motion.div>
          )
        })}
      </motion.div>
    </div>
  )
}
