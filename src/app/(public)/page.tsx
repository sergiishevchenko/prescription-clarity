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
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [testimonials.length]);

  return (
    <div className="min-h-screen bg-white" style={{ backgroundColor: "white" }}>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 sm:py-16 lg:py-20 xl:py-24">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 h-96 w-96 animate-pulse rounded-full bg-blue-500/10 blur-3xl" />
          <div className="absolute right-1/4 bottom-1/4 h-96 w-96 animate-pulse rounded-full bg-purple-500/10 blur-3xl delay-1000" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-2 sm:px-3 lg:px-4">
          <div className="grid grid-cols-1 items-center gap-8 xl:grid-cols-2 xl:gap-16">
            {/* Left Content */}
            <div className="text-center xl:text-left">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-100 px-3 py-1.5 sm:mb-6 sm:px-4 sm:py-2">
                <Sparkles className="h-4 w-4 text-blue-600 sm:h-5 sm:w-5" />
                <span className="text-xs font-medium text-blue-900 sm:text-sm lg:text-base">
                  Trusted by 10,000+ users worldwide
                </span>
              </div>

              <h1 className="mb-4 text-2xl leading-tight font-bold text-slate-900 sm:mb-6 sm:text-3xl lg:text-4xl xl:text-6xl">
                Stay on Track
                <br />
                <span className="whitespace-nowrap text-blue-600">
                  With Your Medications
                </span>
              </h1>

              <p className="mb-4 text-sm leading-relaxed text-slate-600 sm:mb-6 sm:text-base lg:text-lg xl:text-xl">
                The complete medication management platform trusted by patients,
                caregivers, and healthcare professionals.
              </p>

              <div className="mb-6 flex flex-wrap justify-center gap-2 sm:mb-8 sm:gap-3 xl:justify-start">
                <div className="flex items-center gap-1.5 rounded-lg border border-green-200 bg-green-50 px-3 py-1.5 sm:gap-2 sm:px-4 sm:py-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 sm:h-5 sm:w-5" />
                  <span className="text-xs text-green-700 sm:text-sm lg:text-base">
                    95% Adherence Rate
                  </span>
                </div>
                <div className="flex items-center gap-1.5 rounded-lg border border-green-200 bg-green-50 px-3 py-1.5 sm:gap-2 sm:px-4 sm:py-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 sm:h-5 sm:w-5" />
                  <span className="text-xs text-green-700 sm:text-sm lg:text-base">
                    GDPR & HIPAA Compliant
                  </span>
                </div>
                <div className="flex items-center gap-1.5 rounded-lg border border-green-200 bg-green-50 px-3 py-1.5 sm:gap-2 sm:px-4 sm:py-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 sm:h-5 sm:w-5" />
                  <span className="text-xs text-green-700 sm:text-sm lg:text-base">
                    Free 30-Day Trial
                  </span>
                </div>
              </div>

              <div className="flex flex-col justify-center gap-3 sm:flex-row sm:gap-4 xl:justify-start">
                <Link href="/register" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    className="group flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 text-base text-white shadow-xl transition-all hover:bg-blue-700 hover:shadow-2xl sm:h-14 sm:w-auto sm:px-8 sm:text-lg lg:h-16 lg:px-12 lg:text-xl"
                  >
                    <span className="xl:hidden">Start</span>
                    <span className="hidden xl:inline">Start Free Trial</span>
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1 sm:h-6 sm:w-6" />
                  </Button>
                </Link>
                <Link href="/login" className="w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="lg"
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-lg border-2 border-slate-300 px-6 text-base text-slate-900 transition-colors hover:bg-slate-50 sm:h-14 sm:w-auto sm:px-8 sm:text-lg lg:h-16 lg:px-12 lg:text-xl"
                  >
                    <Pill className="h-5 w-5 sm:h-6 sm:w-6" />
                    Try Demo
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right Image */}
            <div className="relative hidden xl:block">
              <div className="relative overflow-hidden rounded-3xl shadow-2xl">
                <Image
                  src="/images/hero-medication-dashboard.jpg"
                  alt="Medication management dashboard"
                  width={800}
                  height={600}
                  className="h-auto w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-blue-900/30 to-transparent" />
              </div>

              <div className="absolute right-8 -bottom-6 left-8 rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-2xl backdrop-blur-xl">
                <div className="grid grid-cols-2 gap-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
                      <TrendingUp className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-900">95%</p>
                      <p className="text-sm text-slate-600">Adherence</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
                      <Users className="h-6 w-6 text-blue-600" />
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
            <p className="mb-6 px-4 text-center text-sm text-slate-600 sm:mb-8 sm:text-base lg:text-lg">
              Trusted by healthcare providers and patients worldwide
            </p>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-2 lg:gap-6 xl:grid-cols-4">
              {[
                { icon: Users, value: "10,000+", label: "Active Users" },
                { icon: CheckCircle2, value: "95%", label: "Adherence Rate" },
                { icon: Star, value: "4.9/5", label: "User Rating" },
                { icon: Shield, value: "50+", label: "Countries" },
              ].map((stat, index) => (
                <div
                  key={index}
                  className="rounded-2xl border border-slate-200 bg-white p-3 shadow-lg transition-all hover:shadow-xl sm:p-4 lg:p-6"
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 sm:mb-3 sm:h-12 sm:w-12 lg:mb-4 lg:h-14 lg:w-14">
                      <stat.icon className="h-5 w-5 text-blue-600 sm:h-6 sm:w-6 lg:h-7 lg:w-7" />
                    </div>
                    <p className="mb-1 text-xl font-bold text-slate-900 sm:mb-2 sm:text-2xl lg:text-3xl xl:text-4xl">
                      {stat.value}
                    </p>
                    <p className="text-xs text-slate-600 sm:text-sm lg:text-base">
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
        <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-2xl font-bold text-slate-900 md:text-3xl xl:text-5xl">
              Everything You Need to Stay on Track
            </h2>
            <p className="mx-auto max-w-3xl text-lg text-slate-600 lg:text-xl">
              Powerful features designed for patients, caregivers, and
              healthcare professionals
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
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
                className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-lg transition-all hover:border-slate-300 hover:shadow-xl sm:p-6 lg:p-8"
              >
                <div
                  className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl sm:mb-5 sm:h-[52px] sm:w-[52px] lg:h-14 lg:w-14 ${feature.iconBg} ${feature.iconColor} border ${feature.iconBorder}`}
                >
                  <feature.icon className="h-6 w-6 sm:h-[26px] sm:w-[26px] lg:h-7 lg:w-7" />
                </div>
                <h3 className="mb-2 text-lg font-bold text-slate-900 sm:mb-3 sm:text-xl">
                  {feature.title}
                </h3>
                <p className="mb-3 text-sm leading-relaxed text-slate-600 sm:mb-4 sm:text-base">
                  {feature.description}
                </p>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-0.5 text-xs text-green-700 sm:gap-2 sm:px-3 sm:py-1 sm:text-sm">
                  <Zap className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  {feature.badge}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="bg-gradient-to-b from-slate-50 to-white py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-2xl font-bold text-slate-900 md:text-3xl xl:text-5xl">
              Loved by Users Worldwide
            </h2>
            <p className="text-base text-slate-600 md:text-lg xl:text-xl">
              See what our community has to say
            </p>
          </div>

          <div className="mx-auto max-w-4xl">
            <div className="rounded-3xl border border-slate-200 bg-white p-10 shadow-2xl lg:p-12">
              <div className="relative min-h-[300px]">
                {testimonials.map((testimonial, index) => (
                  <div
                    key={`${currentTestimonial}-${index}`}
                    className={`${
                      currentTestimonial === index
                        ? "animate-fade-up block"
                        : "hidden"
                    }`}
                  >
                    <div className="mb-6 flex gap-2">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className="h-6 w-6 fill-current text-amber-400 md:h-7 md:w-7 xl:h-8 xl:w-8"
                        />
                      ))}
                    </div>
                    <blockquote>
                      <p className="mb-6 text-base leading-relaxed text-slate-700 sm:mb-8 sm:text-lg md:text-2xl xl:text-3xl">
                        {testimonial.quote}
                      </p>
                      <footer className="flex items-center gap-3 sm:gap-4 md:gap-5">
                        <Image
                          src={testimonial.avatar}
                          alt={testimonial.author}
                          width={80}
                          height={80}
                          className="h-12 w-12 rounded-full border-2 border-blue-600 object-cover sm:h-14 sm:w-14 md:h-[72px] md:w-[72px] xl:h-20 xl:w-20"
                        />
                        <div>
                          <p className="mb-0.5 text-base font-bold text-slate-900 sm:mb-1 sm:text-lg md:text-xl xl:text-2xl">
                            {testimonial.author}
                          </p>
                          <p className="text-xs text-slate-600 sm:text-sm md:text-base xl:text-lg">
                            {testimonial.role}
                          </p>
                        </div>
                      </footer>
                    </blockquote>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 flex justify-center gap-2">
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
      <section id="pricing" className="bg-white py-12 sm:py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
          <div className="mb-8 text-center sm:mb-12">
            <h2 className="mb-3 text-2xl font-bold text-slate-900 sm:mb-4 md:text-3xl xl:text-5xl">
              Choose Your Plan
            </h2>
            <p className="mb-6 text-base text-slate-600 sm:mb-8 md:text-lg xl:text-xl">
              Start free, upgrade when you need more
            </p>

            <div className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 p-1 sm:gap-3">
              <button
                onClick={() => setBillingPeriod("monthly")}
                className={`rounded-full px-4 py-2 text-sm transition-all sm:px-6 sm:py-3 sm:text-base ${
                  billingPeriod === "monthly"
                    ? "bg-blue-600 text-white shadow-lg"
                    : "text-slate-600"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingPeriod("yearly")}
                className={`relative rounded-full px-4 py-2 text-sm transition-all sm:px-6 sm:py-3 sm:text-base ${
                  billingPeriod === "yearly"
                    ? "bg-blue-600 text-white shadow-lg"
                    : "text-slate-600"
                }`}
              >
                Yearly
                <span className="absolute -top-2 -right-1 rounded-full bg-green-500 px-1.5 py-0.5 text-xs text-white sm:-right-2 sm:px-2">
                  Save 17%
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-4">
            {[
              {
                name: "Free",
                description:
                  "Perfect for individuals managing their own medications",
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
                description:
                  "For patients who need advanced medication management",
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
                description:
                  "Best for caregivers managing multiple family members",
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
                description:
                  "For healthcare providers managing patient cohorts",
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
                className={`relative rounded-2xl border-2 p-6 shadow-xl transition-all sm:p-8 ${
                  plan.highlighted
                    ? "border-orange-500 bg-orange-50/20"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 px-3 py-1 text-xs font-bold text-white shadow-lg sm:-top-4 sm:px-4 sm:text-sm">
                    Most Popular
                  </div>
                )}

                <div className="mb-5 text-center sm:mb-6">
                  <h3 className="mb-2 text-xl font-bold text-slate-900 sm:text-2xl">
                    {plan.name}
                  </h3>
                  <p className="mb-3 text-xs text-slate-600 sm:mb-4 sm:text-sm">
                    {plan.description}
                  </p>
                  <div className="mb-2">
                    <span className="text-3xl font-bold text-slate-900 sm:text-4xl lg:text-5xl">
                      {billingPeriod === "monthly"
                        ? plan.monthlyPrice
                        : plan.yearlyPrice}
                    </span>
                    <span className="text-base text-slate-600 sm:text-lg">
                      /month
                    </span>
                  </div>
                  {plan.yearlyNote && billingPeriod === "yearly" && (
                    <p className="text-xs text-slate-500 sm:text-sm">
                      {plan.yearlyNote}
                    </p>
                  )}
                </div>

                <Link href="/register" className="mb-5 block sm:mb-6">
                  <Button
                    className={`h-12 w-full text-sm sm:h-14 sm:text-base ${
                      plan.highlighted
                        ? "bg-orange-600 hover:bg-orange-700"
                        : "bg-blue-600 hover:bg-blue-700"
                    } rounded-lg text-white transition-colors`}
                  >
                    {plan.buttonText}
                  </Button>
                </Link>

                <div className="space-y-2 sm:space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <div
                      key={featureIndex}
                      className="flex items-start gap-2 sm:gap-3"
                    >
                      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600 sm:h-5 sm:w-5" />
                      <span className="text-sm text-slate-700 sm:text-base">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <p className="mt-8 text-center text-base text-slate-600">
            All plans include a 30-day free trial. No credit card required.
          </p>
        </div>
      </section>

      {/* FAQ Section */}
      <section
        id="faq"
        className="bg-gradient-to-b from-slate-50 to-white py-16 lg:py-24"
      >
        <div className="mx-auto max-w-4xl px-3 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-2xl font-bold text-slate-900 md:text-3xl xl:text-5xl">
              Frequently Asked Questions
            </h2>
            <p className="text-sm text-slate-600 sm:text-base md:text-lg lg:text-xl">
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
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-slate-50 sm:p-5 md:p-6"
                >
                  <span className="pr-6 text-sm font-bold text-slate-900 sm:pr-8 sm:text-base md:text-lg">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`h-5 w-5 flex-shrink-0 text-slate-600 transition-transform sm:h-6 sm:w-6 ${
                      openFaq === index ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {openFaq === index && (
                  <div className="px-4 pb-4 text-sm leading-relaxed text-slate-600 sm:px-6 sm:pb-6 sm:text-base">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 py-16 sm:py-20 lg:py-32">
        <div className="relative z-10 mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="mb-6 px-4 text-2xl leading-tight font-bold text-white sm:mb-8 md:text-3xl xl:text-5xl">
            Ready to Transform Your Medication Management?
          </h2>
          <p className="mx-auto mb-8 max-w-3xl px-4 text-base leading-relaxed text-blue-100 sm:mb-10 sm:text-lg md:text-xl lg:mb-12 lg:text-2xl">
            Join thousands of users managing their medications with confidence.
            Start your free 30-day trial today.
          </p>
          <div className="flex flex-col items-center justify-center gap-3 px-4 sm:flex-row sm:gap-4">
            <Link href="/register">
              <Button
                size="lg"
                className="group flex h-14 w-full items-center justify-center gap-2 rounded-lg bg-white px-8 text-base text-blue-600 shadow-2xl transition-all hover:bg-blue-50 sm:h-16 sm:w-auto sm:px-10 sm:text-lg lg:px-12 lg:text-xl"
              >
                Start Your Free Trial
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1 sm:h-6 sm:w-6 lg:h-7 lg:w-7" />
              </Button>
            </Link>
            <Link href="/login">
              <Button
                variant="outline"
                size="lg"
                className="h-14 w-full rounded-lg border-2 border-white bg-white/10 px-8 text-base text-white transition-colors hover:bg-white/20 sm:h-16 sm:w-auto sm:px-10 sm:text-lg lg:px-12 lg:text-xl"
              >
                Try Demo
              </Button>
            </Link>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 border-t border-blue-500/30 pt-10 sm:mt-14 sm:grid-cols-3 sm:gap-8 sm:pt-12 lg:mt-16">
            <div className="flex flex-col items-center gap-2 sm:gap-3">
              <Shield className="h-10 w-10 text-blue-200 sm:h-12 sm:w-12" />
              <p className="text-sm text-blue-100 sm:text-base lg:text-lg">
                GDPR & HIPAA Compliant
              </p>
            </div>
            <div className="flex flex-col items-center gap-2 sm:gap-3">
              <CheckCircle2 className="h-10 w-10 text-blue-200 sm:h-12 sm:w-12" />
              <p className="text-sm text-blue-100 sm:text-base lg:text-lg">
                No Credit Card Required
              </p>
            </div>
            <div className="flex flex-col items-center gap-2 sm:gap-3">
              <Clock className="h-10 w-10 text-blue-200 sm:h-12 sm:w-12" />
              <p className="text-sm text-blue-100 sm:text-base lg:text-lg">
                Free 30-Day Trial
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 grid grid-cols-2 gap-6 sm:mb-10 sm:grid-cols-2 sm:gap-8 md:mb-12 md:grid-cols-4 md:gap-10 lg:gap-12">
            <div>
              <h3 className="mb-3 text-sm font-bold text-slate-900 sm:mb-4 sm:text-base md:mb-6 md:text-lg lg:text-xl">
                Product
              </h3>
              <ul className="space-y-2 sm:space-y-3 md:space-y-4">
                <li>
                  <Link
                    href="#"
                    className="text-sm text-slate-600 transition-colors hover:text-blue-600 sm:text-sm md:text-base lg:text-lg"
                  >
                    Features
                  </Link>
                </li>
                <li>
                  <Link
                    href="#pricing"
                    className="text-sm text-slate-600 transition-colors hover:text-blue-600 sm:text-sm md:text-base lg:text-lg"
                  >
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-sm text-slate-600 transition-colors hover:text-blue-600 sm:text-sm md:text-base lg:text-lg"
                  >
                    Security
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="mb-3 text-sm font-bold text-slate-900 sm:mb-4 sm:text-base md:mb-6 md:text-lg lg:text-xl">
                Company
              </h3>
              <ul className="space-y-2 sm:space-y-3 md:space-y-4">
                <li>
                  <Link
                    href="#"
                    className="text-sm text-slate-600 transition-colors hover:text-blue-600 sm:text-sm md:text-base lg:text-lg"
                  >
                    About
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-sm text-slate-600 transition-colors hover:text-blue-600 sm:text-sm md:text-base lg:text-lg"
                  >
                    Blog
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-sm text-slate-600 transition-colors hover:text-blue-600 sm:text-sm md:text-base lg:text-lg"
                  >
                    Careers
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="mb-3 text-sm font-bold text-slate-900 sm:mb-4 sm:text-base md:mb-6 md:text-lg lg:text-xl">
                Resources
              </h3>
              <ul className="space-y-2 sm:space-y-3 md:space-y-4">
                <li>
                  <Link
                    href="#"
                    className="text-sm text-slate-600 transition-colors hover:text-blue-600 sm:text-sm md:text-base lg:text-lg"
                  >
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-sm text-slate-600 transition-colors hover:text-blue-600 sm:text-sm md:text-base lg:text-lg"
                  >
                    Community
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-sm text-slate-600 transition-colors hover:text-blue-600 sm:text-sm md:text-base lg:text-lg"
                  >
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="mb-3 text-sm font-bold text-slate-900 sm:mb-4 sm:text-base md:mb-6 md:text-lg lg:text-xl">
                Legal
              </h3>
              <ul className="space-y-2 sm:space-y-3 md:space-y-4">
                <li>
                  <Link
                    href="#"
                    className="text-sm text-slate-600 transition-colors hover:text-blue-600 sm:text-sm md:text-base lg:text-lg"
                  >
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-sm text-slate-600 transition-colors hover:text-blue-600 sm:text-sm md:text-base lg:text-lg"
                  >
                    Terms
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-sm text-slate-600 transition-colors hover:text-blue-600 sm:text-sm md:text-base lg:text-lg"
                  >
                    GDPR & HIPAA
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-6 sm:pt-8 md:pt-10">
            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row sm:gap-6">
              <div className="flex items-center gap-3 sm:gap-4">
                <Image
                  src="/logo.svg"
                  alt="Prescription Clarity Logo"
                  width={40}
                  height={40}
                  className="h-8 w-8 sm:h-10 sm:w-10"
                />
                <span className="text-sm font-bold text-slate-900 sm:text-base md:text-lg lg:text-xl">
                  Prescription Clarity
                </span>
              </div>
              <p className="text-xs text-slate-600 sm:text-sm md:text-base lg:text-lg">
                © 2025 Prescription Clarity. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
