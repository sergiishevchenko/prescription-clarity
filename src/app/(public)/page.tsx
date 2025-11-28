"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import Image from "next/image";
import {
  Sparkles,
  CheckCircle2,
  Calendar,
  Users,
  Stethoscope,
  BarChart3,
  Bell,
  Shield,
  TrendingUp,
  Star,
  Zap,
  ArrowRight,
  Pill,
  ChevronDown,
  Clock,
} from "lucide-react";
import { useState, useEffect } from "react";

export default function HomePage() {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">(
    "monthly",
  );
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const testimonials = [
    {
      quote:
        '"Prescription Clarity has transformed how I manage my medications. The reminders are perfectly timed, and I haven\'t missed a dose in months."',
      author: "Margaret Williams",
      role: "Patient • 3 months using the platform",
      avatar: "/images/testimonial-1.jpg",
    },
    {
      quote:
        '"As a caregiver for my elderly parents, this app is a lifesaver. I can manage both their medications from anywhere and get notified if they miss a dose."',
      author: "Michael O'Brien",
      role: "Caregiver • Managing 2 family members",
      avatar: "/images/testimonial-2.jpg",
    },
    {
      quote:
        '"The analytics dashboard helps me monitor patient adherence patterns. I can intervene early when I see someone struggling with their medication schedule."',
      author: "Dr. Sarah Mitchell",
      role: "Family Physician • 12 patients on platform",
      avatar: "/images/testimonial-3.jpg",
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial(
        (prev) => (prev + 1) % testimonials.length,
      );
    }, 6000);
    return () => clearInterval(interval);
  }, [testimonials.length]);

  return (
    <div className="min-h-screen bg-white" style={{ backgroundColor: 'white' }}>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 sm:py-16 lg:py-20 xl:py-24">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-purple-500/10 blur-3xl animate-pulse delay-1000" />
        </div>

        <div className="max-w-7xl mx-auto px-2 sm:px-3 lg:px-4 relative z-10">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 xl:gap-16 items-center">
            {/* Left Content */}
            <div className="text-center xl:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-blue-100 border border-blue-200 mb-4 sm:mb-6">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                <span className="text-xs sm:text-sm lg:text-base font-medium text-blue-900">
                  Trusted by 10,000+ users worldwide
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-6xl font-bold mb-4 sm:mb-6 leading-tight text-slate-900">
                Stay on Track
                <br />
                <span className="text-blue-600 whitespace-nowrap">With Your Medications</span>
            </h1>

              <p className="text-sm sm:text-base lg:text-lg xl:text-xl mb-4 sm:mb-6 leading-relaxed text-slate-600">
                The complete medication management platform trusted by patients,
                caregivers, and healthcare professionals.
              </p>

              <div className="flex flex-wrap gap-2 sm:gap-3 justify-center xl:justify-start mb-6 sm:mb-8">
                <div className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg bg-green-50 border border-green-200">
                  <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                  <span className="text-xs sm:text-sm lg:text-base text-green-700">
                    95% Adherence Rate
                  </span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg bg-green-50 border border-green-200">
                  <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                  <span className="text-xs sm:text-sm lg:text-base text-green-700">
                    GDPR & HIPAA Compliant
                  </span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg bg-green-50 border border-green-200">
                  <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                  <span className="text-xs sm:text-sm lg:text-base text-green-700">
                    Free 30-Day Trial
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center xl:justify-start">
                <Link href="/register" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto h-12 sm:h-14 lg:h-16 px-6 sm:px-8 lg:px-12 text-base sm:text-lg lg:text-xl bg-blue-600 hover:bg-blue-700 shadow-xl hover:shadow-2xl transition-all rounded-lg text-white flex items-center justify-center gap-2 group"
                  >
                    <span className="xl:hidden">Start</span>
                    <span className="hidden xl:inline">Start Free Trial</span>
                    <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              <Link href="/login" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="lg"
                    className="w-full sm:w-auto h-12 sm:h-14 lg:h-16 px-6 sm:px-8 lg:px-12 text-base sm:text-lg lg:text-xl border-2 border-slate-300 text-slate-900 rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <Pill className="w-5 h-5 sm:w-6 sm:h-6" />
                    Try Demo
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right Image */}
            <div className="relative hidden xl:block">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                <Image
                  src="/images/hero-medication-dashboard.jpg"
                  alt="Medication management dashboard"
                  width={800}
                  height={600}
                  className="w-full h-auto object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-blue-900/30 to-transparent" />
              </div>

              <div className="absolute -bottom-6 left-8 right-8 p-6 rounded-2xl backdrop-blur-xl bg-white/90 border border-slate-200 shadow-2xl">
                <div className="grid grid-cols-2 gap-6">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-900">95%</p>
                      <p className="text-sm text-slate-600">Adherence</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-900">10K+</p>
                      <p className="text-sm text-slate-600">Users</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Section */}
          <div className="mt-16 sm:mt-20 lg:mt-32">
            <p className="text-center text-sm sm:text-base lg:text-lg mb-6 sm:mb-8 px-4 text-slate-600">
              Trusted by healthcare providers and patients worldwide
            </p>
            <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
              {[
                { icon: Users, value: "10,000+", label: "Active Users" },
                { icon: CheckCircle2, value: "95%", label: "Adherence Rate" },
                { icon: Star, value: "4.9/5", label: "User Rating" },
                { icon: Shield, value: "50+", label: "Countries" },
              ].map((stat, index) => (
                <div
                  key={index}
                  className="p-3 sm:p-4 lg:p-6 rounded-2xl bg-white border border-slate-200 shadow-lg hover:shadow-xl transition-all"
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="h-10 w-10 sm:h-12 sm:w-12 lg:h-14 lg:w-14 rounded-xl bg-blue-100 flex items-center justify-center mb-2 sm:mb-3 lg:mb-4">
                      <stat.icon className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-blue-600" />
                    </div>
                    <p className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold mb-1 sm:mb-2 text-slate-900">
                      {stat.value}
                    </p>
                    <p className="text-xs sm:text-sm lg:text-base text-slate-600">
                      {stat.label}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-2xl md:text-3xl xl:text-5xl font-bold mb-4 text-slate-900">
              Everything You Need to Stay on Track
            </h2>
            <p className="text-lg lg:text-xl max-w-3xl mx-auto text-slate-600">
              Powerful features designed for patients, caregivers, and
              healthcare professionals
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[
              {
                icon: Calendar,
                iconBg: "bg-blue-50",
                iconColor: "text-blue-600",
                iconBorder: "border-blue-200",
                title: "Smart Scheduling",
                description:
                  "Stay on track with intelligent time-based reminders. Coordinate with meals and track adherence automatically.",
                badge: "95% adherence rate",
              },
              {
                icon: Users,
                iconBg: "bg-orange-50",
                iconColor: "text-orange-600",
                iconBorder: "border-orange-200",
                title: "Family Care",
                description:
                  "Manage medications for your entire family from one dashboard. Perfect for caregivers managing elderly parents.",
                badge: "Manage unlimited family members",
              },
              {
                icon: Stethoscope,
                iconBg: "bg-purple-50",
                iconColor: "text-purple-600",
                iconBorder: "border-purple-200",
                title: "Healthcare Integration",
                description:
                  "Doctors can monitor patient adherence in real-time and adjust prescriptions directly through the platform.",
                badge: "Real-time provider collaboration",
              },
              {
                icon: BarChart3,
                iconBg: "bg-green-50",
                iconColor: "text-green-600",
                iconBorder: "border-green-200",
                title: "Analytics & Insights",
                description:
                  "Visual reports, trend analysis, and streak counters help identify patterns and celebrate consistency.",
                badge: "Data-driven health decisions",
              },
              {
                icon: Bell,
                iconBg: "bg-amber-50",
                iconColor: "text-amber-600",
                iconBorder: "border-amber-200",
                title: "Smart Notifications",
                description:
                  "Customizable push notifications with sound alerts ensure medications are taken at the right time.",
                badge: "99.9% notification reliability",
              },
              {
                icon: Shield,
                iconBg: "bg-slate-50",
                iconColor: "text-slate-600",
                iconBorder: "border-slate-200",
                title: "Secure & Private",
                description:
                  "End-to-end encryption with full GDPR and HIPAA compliance. Your health data is always protected.",
                badge: "Bank-level security",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="p-5 sm:p-6 lg:p-8 rounded-2xl border shadow-lg hover:shadow-xl transition-all bg-slate-50 border-slate-200 hover:border-slate-300"
              >
                <div
                  className={`h-12 w-12 sm:h-[52px] sm:w-[52px] lg:h-14 lg:w-14 rounded-xl flex items-center justify-center mb-4 sm:mb-5 ${feature.iconBg} ${feature.iconColor} border ${feature.iconBorder}`}
                >
                  <feature.icon className="w-6 h-6 sm:w-[26px] sm:h-[26px] lg:w-7 lg:h-7" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 text-slate-900">
                  {feature.title}
                </h3>
                <p className="text-sm sm:text-base leading-relaxed mb-3 sm:mb-4 text-slate-600">
                  {feature.description}
                </p>
                <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm bg-green-100 text-green-700">
                  <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  {feature.badge}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 lg:py-24 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-2xl md:text-3xl xl:text-5xl font-bold mb-4 text-slate-900">
              Loved by Users Worldwide
            </h2>
            <p className="text-base md:text-lg xl:text-xl text-slate-600">
              See what our community has to say
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="p-10 lg:p-12 rounded-3xl border shadow-2xl bg-white border-slate-200">
              <div className="min-h-[300px] relative">
                {testimonials.map((testimonial, index) => (
                  <div
                    key={`${currentTestimonial}-${index}`}
                    className={`${
                      currentTestimonial === index
                        ? "block animate-fade-up"
                        : "hidden"
                    }`}
                  >
                    <div className="flex gap-2 mb-6">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className="w-6 h-6 md:w-7 md:h-7 xl:w-8 xl:h-8 text-amber-400 fill-current"
                        />
                      ))}
                    </div>
                    <blockquote>
                      <p className="text-base sm:text-lg md:text-2xl xl:text-3xl mb-6 sm:mb-8 leading-relaxed text-slate-700">
                        {testimonial.quote}
                      </p>
                      <footer className="flex items-center gap-3 sm:gap-4 md:gap-5">
                        <Image
                          src={testimonial.avatar}
                          alt={testimonial.author}
                          width={80}
                          height={80}
                          className="h-12 w-12 sm:h-14 sm:w-14 md:h-[72px] md:w-[72px] xl:h-20 xl:w-20 rounded-full border-2 border-blue-600 object-cover"
                        />
                        <div>
                          <p className="text-base sm:text-lg md:text-xl xl:text-2xl font-bold mb-0.5 sm:mb-1 text-slate-900">
                            {testimonial.author}
                          </p>
                          <p className="text-xs sm:text-sm md:text-base xl:text-lg text-slate-600">
                            {testimonial.role}
                          </p>
                        </div>
                      </footer>
                    </blockquote>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-center gap-2 mt-6">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    currentTestimonial === index
                      ? "w-8 bg-blue-600"
                      : "w-2 bg-slate-300"
                  }`}
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-12 sm:py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl md:text-3xl xl:text-5xl font-bold mb-3 sm:mb-4 text-slate-900">
              Choose Your Plan
            </h2>
            <p className="text-base md:text-lg xl:text-xl mb-6 sm:mb-8 text-slate-600">
              Start free, upgrade when you need more
            </p>

            <div className="inline-flex items-center gap-1 sm:gap-3 p-1 rounded-full bg-slate-100 border border-slate-200">
              <button
                onClick={() => setBillingPeriod("monthly")}
                className={`px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base rounded-full transition-all ${
                  billingPeriod === "monthly"
                    ? "bg-blue-600 text-white shadow-lg"
                    : "text-slate-600"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingPeriod("yearly")}
                className={`px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base rounded-full transition-all relative ${
                  billingPeriod === "yearly"
                    ? "bg-blue-600 text-white shadow-lg"
                    : "text-slate-600"
                }`}
              >
                Yearly
                <span className="absolute -top-2 -right-1 sm:-right-2 bg-green-500 text-white text-xs px-1.5 sm:px-2 py-0.5 rounded-full">
                  Save 17%
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
            {[
              {
                name: "Free",
                description: "Perfect for individuals managing their own medications",
                monthlyPrice: "€0.00",
                yearlyPrice: "€0.00",
                features: [
                  "Up to 5 medications",
                  "Basic reminders",
                  "Daily schedule view",
                  "Adherence tracking",
                  "Mobile & web access",
                ],
                buttonText: "Get Started Free",
                highlighted: false,
              },
              {
                name: "Personal",
                description: "For patients who need advanced medication management",
                monthlyPrice: "€8.99",
                yearlyPrice: "€7.42",
                yearlyNote: "€89/year billed annually",
                features: [
                  "Unlimited medications",
                  "Smart notifications",
                  "Weekly analytics",
                  "Medication database",
                  "Print schedules",
                  "Photo uploads",
                  "Achievement system",
                  "Priority support",
                ],
                buttonText: "Start Free Trial",
                highlighted: false,
              },
              {
                name: "Family",
                description: "Best for caregivers managing multiple family members",
                monthlyPrice: "€17.99",
                yearlyPrice: "€14.92",
                yearlyNote: "€179/year billed annually",
                features: [
                  "Everything in Personal",
                  "Manage up to 5 family members",
                  "Caregiver dashboard",
                  "Cross-user analytics",
                  "Shared medication history",
                  "Email notifications",
                  "Multi-device sync",
                  "Family insights",
                ],
                buttonText: "Start Free Trial",
                highlighted: true,
              },
              {
                name: "Professional",
                description: "For healthcare providers managing patient cohorts",
                monthlyPrice: "€44.99",
                yearlyPrice: "€37.42",
                yearlyNote: "€449/year billed annually",
                features: [
                  "Everything in Family",
                  "Manage unlimited patients",
                  "Doctor dashboard",
                  "Cohort analytics",
                  "At-risk patient alerts",
                  "Prescribing tools",
                  "Medication interaction checker",
                  "HIPAA compliance tools",
                  "Priority support",
                ],
                buttonText: "Start Free Trial",
                highlighted: false,
              },
            ].map((plan, index) => (
              <div
                key={index}
                className={`relative p-6 sm:p-8 rounded-2xl border-2 shadow-xl transition-all ${
                  plan.highlighted
                    ? "border-orange-500 bg-orange-50/20"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 sm:-top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-3 sm:px-4 py-1 rounded-full text-xs sm:text-sm font-bold shadow-lg">
                    Most Popular
                  </div>
                )}

                <div className="text-center mb-5 sm:mb-6">
                  <h3 className="text-xl sm:text-2xl font-bold mb-2 text-slate-900">
                    {plan.name}
                  </h3>
                  <p className="text-xs sm:text-sm mb-3 sm:mb-4 text-slate-600">
                    {plan.description}
                  </p>
                  <div className="mb-2">
                    <span className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900">
                      {billingPeriod === "monthly"
                        ? plan.monthlyPrice
                        : plan.yearlyPrice}
                    </span>
                    <span className="text-base sm:text-lg text-slate-600">
                      /month
                    </span>
                  </div>
                  {plan.yearlyNote && billingPeriod === "yearly" && (
                    <p className="text-xs sm:text-sm text-slate-500">
                      {plan.yearlyNote}
                    </p>
                  )}
                </div>

                <Link href="/register" className="block mb-5 sm:mb-6">
                  <Button
                    className={`w-full h-12 sm:h-14 text-sm sm:text-base ${
                      plan.highlighted
                        ? "bg-orange-600 hover:bg-orange-700"
                        : "bg-blue-600 hover:bg-blue-700"
                    } text-white rounded-lg transition-colors`}
                  >
                    {plan.buttonText}
                </Button>
              </Link>

                <div className="space-y-2 sm:space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-start gap-2 sm:gap-3">
                      <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm sm:text-base text-slate-700">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <p className="text-center text-base mt-8 text-slate-600">
            All plans include a 30-day free trial. No credit card required.
          </p>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-16 lg:py-24 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-2xl md:text-3xl xl:text-5xl font-bold mb-4 text-slate-900">
              Frequently Asked Questions
            </h2>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-slate-600">
              Everything you need to know about Prescription Clarity
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                question: "How does the free trial work?",
                answer:
                  "All paid plans include a 30-day free trial with full access to features. No credit card required to start. Cancel anytime during the trial without being charged.",
              },
              {
                question: "Is my health data secure?",
                answer:
                  "Yes! We use bank-level 256-bit encryption for all data. We're fully GDPR and HIPAA compliant. Your data is never shared with third parties without your explicit consent.",
              },
              {
                question: "Can I switch plans later?",
                answer:
                  "Absolutely! You can upgrade or downgrade your plan at any time. If you upgrade, you'll get immediate access to new features. If you downgrade, changes take effect at the end of your billing cycle.",
              },
              {
                question: "Do you offer refunds?",
                answer:
                  "Yes, we offer a 30-day money-back guarantee on all paid plans. If you're not satisfied for any reason, contact us within 30 days for a full refund.",
              },
              {
                question: "How do notifications work?",
                answer:
                  "You can receive notifications via push (mobile), email, and SMS. Set custom reminder times before each dose. Notifications are smart - they adapt to your adherence patterns over time.",
              },
              {
                question: "Can family members share a subscription?",
                answer:
                  "Yes! The Family plan allows up to 5 family members under one subscription. Each member gets their own secure account with privacy controls.",
              },
              {
                question: "Is there a mobile app?",
                answer:
                  "Yes! Our web app works seamlessly on all devices and is optimized for mobile. We also have native iOS and Android apps (coming soon) with offline support.",
              },
              {
                question: "What if I need help?",
                answer:
                  "We offer comprehensive support via email, live chat, and our help center. Personal and higher plans get priority support with faster response times.",
              },
            ].map((faq, index) => (
              <div
                key={index}
                className="rounded-2xl border overflow-hidden bg-white border-slate-200"
              >
                <button
                  onClick={() =>
                    setOpenFaq(openFaq === index ? null : index)
                  }
                  className="w-full p-4 sm:p-5 md:p-6 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
                >
                  <span className="text-sm sm:text-base md:text-lg font-bold pr-6 sm:pr-8 text-slate-900">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 text-slate-600 transition-transform ${
                      openFaq === index ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {openFaq === index && (
                  <div className="px-4 sm:px-6 pb-4 sm:pb-6 text-sm sm:text-base leading-relaxed text-slate-600">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 py-16 sm:py-20 lg:py-32 relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-2xl md:text-3xl xl:text-5xl font-bold text-white mb-6 sm:mb-8 leading-tight px-4">
            Ready to Transform Your Medication Management?
          </h2>
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-blue-100 mb-8 sm:mb-10 lg:mb-12 leading-relaxed max-w-3xl mx-auto px-4">
            Join thousands of users managing their medications with confidence.
            Start your free 30-day trial today.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center px-4">
              <Link href="/register">
                <Button
                  size="lg"
                className="w-full sm:w-auto h-14 sm:h-16 px-8 sm:px-10 lg:px-12 text-base sm:text-lg lg:text-xl bg-white text-blue-600 hover:bg-blue-50 shadow-2xl rounded-lg transition-all flex items-center justify-center gap-2 group"
              >
                Start Your Free Trial
                <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/login">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto h-14 sm:h-16 px-8 sm:px-10 lg:px-12 text-base sm:text-lg lg:text-xl border-2 border-white text-white hover:bg-white/20 bg-white/10 rounded-lg transition-colors"
              >
                Try Demo
                </Button>
              </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 mt-12 sm:mt-14 lg:mt-16 pt-10 sm:pt-12 border-t border-blue-500/30">
            <div className="flex flex-col items-center gap-2 sm:gap-3">
              <Shield className="w-10 h-10 sm:w-12 sm:h-12 text-blue-200" />
              <p className="text-sm sm:text-base lg:text-lg text-blue-100">
                GDPR & HIPAA Compliant
              </p>
            </div>
            <div className="flex flex-col items-center gap-2 sm:gap-3">
              <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12 text-blue-200" />
              <p className="text-sm sm:text-base lg:text-lg text-blue-100">
                No Credit Card Required
              </p>
            </div>
            <div className="flex flex-col items-center gap-2 sm:gap-3">
              <Clock className="w-10 h-10 sm:w-12 sm:h-12 text-blue-200" />
              <p className="text-sm sm:text-base lg:text-lg text-blue-100">
                Free 30-Day Trial
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 sm:py-16 bg-white border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 md:gap-10 lg:gap-12 mb-8 sm:mb-10 md:mb-12">
            <div>
              <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold mb-3 sm:mb-4 md:mb-6 text-slate-900">
                Product
              </h3>
              <ul className="space-y-2 sm:space-y-3 md:space-y-4">
                <li>
                  <Link
                    href="#"
                    className="text-sm sm:text-sm md:text-base lg:text-lg hover:text-blue-600 transition-colors text-slate-600"
                  >
                    Features
                  </Link>
                </li>
                <li>
                  <Link
                    href="#pricing"
                    className="text-sm sm:text-sm md:text-base lg:text-lg hover:text-blue-600 transition-colors text-slate-600"
                  >
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-sm sm:text-sm md:text-base lg:text-lg hover:text-blue-600 transition-colors text-slate-600"
                  >
                    Security
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold mb-3 sm:mb-4 md:mb-6 text-slate-900">
                Company
              </h3>
              <ul className="space-y-2 sm:space-y-3 md:space-y-4">
                <li>
                  <Link
                    href="#"
                    className="text-sm sm:text-sm md:text-base lg:text-lg hover:text-blue-600 transition-colors text-slate-600"
                  >
                    About
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-sm sm:text-sm md:text-base lg:text-lg hover:text-blue-600 transition-colors text-slate-600"
                  >
                    Blog
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-sm sm:text-sm md:text-base lg:text-lg hover:text-blue-600 transition-colors text-slate-600"
                  >
                    Careers
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold mb-3 sm:mb-4 md:mb-6 text-slate-900">
                Resources
              </h3>
              <ul className="space-y-2 sm:space-y-3 md:space-y-4">
                <li>
                  <Link
                    href="#"
                    className="text-sm sm:text-sm md:text-base lg:text-lg hover:text-blue-600 transition-colors text-slate-600"
                  >
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-sm sm:text-sm md:text-base lg:text-lg hover:text-blue-600 transition-colors text-slate-600"
                  >
                    Community
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-sm sm:text-sm md:text-base lg:text-lg hover:text-blue-600 transition-colors text-slate-600"
                  >
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold mb-3 sm:mb-4 md:mb-6 text-slate-900">
                Legal
              </h3>
              <ul className="space-y-2 sm:space-y-3 md:space-y-4">
                <li>
                  <Link
                    href="#"
                    className="text-sm sm:text-sm md:text-base lg:text-lg hover:text-blue-600 transition-colors text-slate-600"
                  >
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-sm sm:text-sm md:text-base lg:text-lg hover:text-blue-600 transition-colors text-slate-600"
                  >
                    Terms
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-sm sm:text-sm md:text-base lg:text-lg hover:text-blue-600 transition-colors text-slate-600"
                  >
                    GDPR & HIPAA
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-6 sm:pt-8 md:pt-10 border-t border-slate-200">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6">
              <div className="flex items-center gap-3 sm:gap-4">
                <Image
                  src="/logo.svg"
                  alt="Prescription Clarity Logo"
                  width={40}
                  height={40}
                  className="h-8 w-8 sm:h-10 sm:w-10"
                />
                <span className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-slate-900">
                  Prescription Clarity
                </span>
              </div>
              <p className="text-xs sm:text-sm md:text-base lg:text-lg text-slate-600">
                © 2025 Prescription Clarity. All rights reserved.
              </p>
          </div>
        </div>
      </div>
      </footer>
    </div>
  );
}