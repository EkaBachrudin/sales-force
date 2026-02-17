'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Rocket,
  Zap,
  Target,
  BarChart3,
  Smartphone,
  CheckCircle2,
  Sparkles,
  TrendingUp,
  Users,
  Bell,
  Building2,
  Shield,
  ArrowRight,
  Flame,
  Award,
  MessageCircle,
  HelpCircle,
  ChevronDown,
  X as CloseIcon,
  Send,
  Monitor,
  Tablet,
  Cloud
} from 'lucide-react';

export default function FeaturesPage() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [scrollY, setScrollY] = useState(0);
  const [showFormModal, setShowFormModal] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    whatsapp: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const openFormModal = () => setShowFormModal(true);
  const closeFormModal = () => {
    setShowFormModal(false);
    setSubmitSuccess(false);
    setFormData({ email: '', whatsapp: '', message: '' });
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call - replace with actual API endpoint
    await new Promise(resolve => setTimeout(resolve, 1500));


    setIsSubmitting(false);
    setSubmitSuccess(true);

    // Close modal after success message
    setTimeout(() => {
      closeFormModal();
    }, 2000);
  };

  const features = [
    {
      icon: Target,
      title: 'Smart Lead Management',
      description: 'Track every lead from first contact to closing. Organize, prioritize, and never miss an opportunity.',
      color: '#2563EB',
      items: ['Add unlimited leads', 'Custom lead stages', 'Detailed lead profiles', 'Quick filters & search']
    },
    {
      icon: Flame,
      title: 'Visual Pipeline',
      description: 'Drag-and-drop leads through your sales funnel. See exactly where every prospect stands.',
      color: '#F59E0B',
      items: ['Kanban-style board', 'Drag & drop updates', 'Stage tracking', 'Visual progress']
    },
    {
      icon: BarChart3,
      title: 'Powerful Analytics',
      description: 'Make data-driven decisions with comprehensive insights into your sales performance.',
      color: '#8B5CF6',
      items: ['Sales metrics dashboard', 'Trend analysis', 'Funnel visualization', 'Source tracking']
    },
    {
      icon: Bell,
      title: 'Smart Reminders',
      description: 'Never forget a follow-up. Set reminders and get notified at the perfect time.',
      color: '#EC4899',
      items: ['Custom reminders', 'Follow-up scheduling', 'Activity tracking', 'Automated alerts']
    },
    {
      icon: Building2,
      title: 'Property Catalog',
      description: 'Manage your property listings and link them to interested leads effortlessly.',
      color: '#10B981',
      items: ['Property database', 'Link to leads', 'Details & specs', 'Quick access']
    },
    {
      icon: Smartphone,
      title: 'WhatsApp Quick Connect',
      description: 'Reach leads instantly on WhatsApp. One-click access from lead information.',
      color: '#25D366',
      items: ['Direct WhatsApp access', 'One-click messaging', 'Phone integration', 'Fast response']
    }
  ];

  // Feature showcases with screenshots
  const featureShowcases = [
    {
      id: 'lead-management',
      title: 'Smart Lead Management',
      description: 'Kelola semua lead Anda dalam satu tempat yang terpusat. Tambah, edit, dan lacak setiap lead dari kontak pertama hingga penutupan deal.',
      image: '/features/dashboard.png',
      imageAlt: 'Lead Management Dashboard',
      badges: ['Unlimited Leads', 'Custom Fields', 'Quick Search'],
      color: 'blue',
      reverse: false
    },
    {
      id: 'visual-pipeline',
      title: 'Visual Pipeline Kanban',
      description: 'Lihat seluruh sales pipeline Anda dalam tampilan Kanban yang intuitif. Drag & drop lead antar stage dan monitor progress secara real-time.',
      image: '/features/pipeline.png',
      imageAlt: 'Visual Pipeline Kanban Board',
      badges: ['Drag & Drop', 'Real-time Updates'],
      color: 'orange',
      reverse: true
    },
    {
      id: 'analytics-dashboard',
      title: 'Analytics Dashboard',
      description: 'Dapatkan wawasan mendalam tentang performa sales Anda dengan dashboard analitik yang komprehensif dan visualisasi data yang interaktif.',
      image: '/features/analytic.png',
      imageAlt: 'Analytics Dashboard with Charts',
      badges: ['Sales Metrics', 'Trend Analysis'],
      color: 'purple',
      reverse: false
    },
    {
      id: 'whatsapp-integration',
      title: 'WhatsApp Integration',
      description: 'Hubungi lead langsung melalui WhatsApp dengan satu klik. Integrasi seamless yang mempercepat respons dan meningkatkan konversi.',
      image: '/features/wa-integration.png',
      imageAlt: 'WhatsApp Quick Connect Feature',
      badges: ['One-Click Connect'],
      color: 'green',
      reverse: true
    }
  ];

  const benefits = [
    { number: '10x', label: 'Faster Lead Response' },
    { number: '40%', label: 'Increase in Conversions' },
    { number: '0', label: 'Leads Forgotten' },
    { number: '24/7', label: 'Access Anywhere' }
  ];

  const faqs = [
    {
      question: 'Apakah ada masa percobaan gratis?',
      answer: 'Ya! Kami menawarkan masa percobaan gratis 14 hari dengan akses penuh ke semua fitur. Tidak perlu kartu kredit untuk memulai.'
    },
    {
      question: 'Apakah data saya aman?',
      answer: 'Keamanan data adalah prioritas utama kami. Kami menggunakan enkripsi 256-bit, backup harian, dan server yang terletak di Indonesia. Data Anda 100% milik Anda.'
    },
    {
      question: 'Berapa lama waktu yang dibutuhkan untuk setup?',
      answer: 'Setup awal hanya membutuhkan waktu kurang dari 5 menit. Anda bisa mulai menambahkan leads dan menggunakan sistem segera setelah registrasi.'
    },
    {
      question: 'Apakah ada integrasi dengan WhatsApp?',
      answer: 'Ya, integrasi WhatsApp adalah salah satu fitur unggulan kami. Anda bisa langsung menghubungi leads dengan satu klik dari dalam sistem.'
    },
    {
      question: 'Bagaimana dengan support pelanggan?',
      answer: 'Kami menyediakan support melalui WhatsApp, email, dan telepon selama jam kerja. Untuk paket Enterprise. '
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      {/* Subtle Background Pattern */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-100/60 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-slate-100/60 rounded-full blur-3xl" />
        </div>
        {/* Grid Pattern Overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }}
        />
      </div>

      {/* Floating Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrollY > 50 ? 'bg-white/90 backdrop-blur-xl border-b border-gray-200 shadow-sm' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <img src="/sforce-logo.webp" alt="Sales CRM Pro" className="h-15" />
            </Link>
            <button
              onClick={openFormModal}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white text-sm font-semibold rounded-lg shadow-md shadow-blue-500/25 transition-all duration-300 transform hover:-translate-y-0.5"
            >
              Saya Tertarik
            </button>
          </div>
        </div>
      </nav>

      <div className="relative z-10">
        {/* Hero Section */}
        <header id="hero" className="pt-32 pb-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center">
              {/* Main Title */}
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 tracking-tight leading-tight">
                Ubah Lebih Banyak Lead
                <span className="block mt-2 bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                  Menjadi Penjualan
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto mb-10 leading-relaxed">
                Platform manajemen penjualan all-in-one yang dirancang khusus untuk profesional real estate dan tim sales modern.
                Lacak lead, kelola pipeline, dan tutup lebih banyak deal dengan lebih cepat.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
                <button
                  onClick={openFormModal}
                  className="group inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 transform hover:-translate-y-1"
                >
                  Saya Tertarik
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <a
                  href="#features"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-xl border border-gray-300 shadow-sm transition-all duration-300"
                >
                  <Play className="w-5 h-5 text-blue-600" />
                  Lihat Fitur
                </a>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap items-center justify-center gap-6 text-gray-500 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>Tidak perlu kartu kredit</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>Setup dalam 5 menit</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>Batalkan kapan saja</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Stats Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {benefits.map((benefit, index) => (
                <div
                  key={index}
                  className="text-center p-6 rounded-2xl bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 group"
                >
                  <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-br from-blue-600 to-blue-700 bg-clip-text text-transparent mb-2">
                    {benefit.number}
                  </div>
                  <div className="text-sm text-gray-600">{benefit.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {/* Section Header */}
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 border border-blue-200 text-blue-700 text-sm mb-4">
                <Sparkles className="w-4 h-4" />
                <span>Fitur Unggulan</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                Semua yang Anda Butuhkan untuk
                <span className="block bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                  Memenangkan Penjualan
                </span>
              </h2>
              <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                Fitur-fitur powerful yang dibangun khusus untuk profesional sales yang serius tentang hasil
              </p>
            </div>

            {/* Device Compatibility Section - Modern Style */}
            <div className="mb-20">
              <div className="relative">
                {/* Gradient Background */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-700 rounded-3xl opacity-10 blur-2xl" />

                {/* Main Card */}
                <div className="relative bg-gradient-to-br from-white via-slate-50/50 to-white rounded-3xl border border-gray-200 shadow-2xl overflow-hidden">
                  {/* Animated Top Border */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-blue-600 animate-gradient" />

                  {/* Content */}
                  <div className="p-8 sm:p-12">
                    {/* Section Title */}
                    <div className="text-center mb-10">
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 border border-blue-200 text-blue-700 text-sm font-medium mb-4">
                        <Sparkles className="w-4 h-4" />
                        <span>Akses Di Mana Saja</span>
                      </div>
                      <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
                        Satu Aplikasi, Semua Perangkat
                      </h3>
                      <p className="text-gray-600 max-w-2xl mx-auto">
                        Nikmati pengalaman yang seamless di semua perangkat dengan teknologi cloud-based
                      </p>
                    </div>

                    {/* Device Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                      {/* Mobile Card */}
                      <div className="group relative bg-white rounded-2xl border border-gray-200 p-6 text-center hover:shadow-xl hover:border-blue-300 hover:-translate-y-1 transition-all duration-300">
                        <div className="absolute inset-0 bg-blue-50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative">
                          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
                            <Smartphone className="w-8 h-8 text-white" />
                          </div>
                          <h4 className="font-bold text-gray-900 mb-1">Mobile</h4>
                          <p className="text-xs text-gray-500">iOS & Android</p>
                        </div>
                      </div>

                      {/* Tablet Card */}
                      <div className="group relative bg-white rounded-2xl border border-gray-200 p-6 text-center hover:shadow-xl hover:border-blue-300 hover:-translate-y-1 transition-all duration-300">
                        <div className="absolute inset-0 bg-blue-50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative">
                          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
                            <Tablet className="w-8 h-8 text-white" />
                          </div>
                          <h4 className="font-bold text-gray-900 mb-1">Tablet</h4>
                          <p className="text-xs text-gray-500">iPad & Android Tab</p>
                        </div>
                      </div>

                      {/* Desktop Card */}
                      <div className="group relative bg-white rounded-2xl border border-gray-200 p-6 text-center hover:shadow-xl hover:border-blue-300 hover:-translate-y-1 transition-all duration-300">
                        <div className="absolute inset-0 bg-blue-50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative">
                          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
                            <Monitor className="w-8 h-8 text-white" />
                          </div>
                          <h4 className="font-bold text-gray-900 mb-1">Desktop</h4>
                          <p className="text-xs text-gray-500">Windows & Mac</p>
                        </div>
                      </div>

                      {/* Cloud Card */}
                      <div className="group relative bg-white rounded-2xl border border-gray-200 p-6 text-center hover:shadow-xl hover:border-blue-300 hover:-translate-y-1 transition-all duration-300">
                        <div className="absolute inset-0 bg-blue-50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative">
                          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
                            <Cloud className="w-8 h-8 text-white" />
                          </div>
                          <h4 className="font-bold text-gray-900 mb-1">Cloud</h4>
                          <p className="text-xs text-gray-500">Instant Access</p>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Info Bar */}
                    <div className="mt-8 pt-6 border-t border-gray-200">
                      <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          <span>Sync real-time</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          <span>Data aman & terbackup</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          <span>Server Indonesia</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature Showcases */}
            <div className="space-y-24">
              {featureShowcases.map((showcase) => (
                <div
                  key={showcase.id}
                  className={`grid lg:grid-cols-2 gap-12 items-center ${showcase.reverse ? 'lg:flex-row-reverse' : ''}`}
                >
                  {/* Image/Screen Shot */}
                  <div className={`${showcase.reverse ? 'lg:order-2' : ''}`}>
                    {/* Browser Window Frame */}
                    <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-gray-200 bg-white">
                      {/* Browser Header */}
                      <div className="bg-gray-100 px-4 py-3 flex items-center gap-2 border-b border-gray-200">
                        <div className="flex gap-2">
                          <div className="w-3 h-3 rounded-full bg-red-400" />
                          <div className="w-3 h-3 rounded-full bg-yellow-400" />
                          <div className="w-3 h-3 rounded-full bg-green-400" />
                        </div>
                        <div className="flex-1 mx-4">
                          <div className="bg-white rounded-md px-3 py-1 text-xs text-gray-400 text-center">
                            {showcase.id}.salescrmpro.com
                          </div>
                        </div>
                      </div>

                      {/* Screenshot Container */}
                      <div className="relative aspect-[16/10] bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
                        {/* Screenshot Image */}
                        <img
                          src={showcase.image}
                          alt={showcase.imageAlt}
                          className="w-full object-cover"
                        />

                        {/* Color Accent Bar */}
                        <div className={`absolute top-0 left-0 right-0 h-1 ${
                          showcase.color === 'blue' ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                          showcase.color === 'orange' ? 'bg-gradient-to-r from-orange-500 to-amber-500' :
                          showcase.color === 'purple' ? 'bg-gradient-to-r from-purple-500 to-violet-600' :
                          showcase.color === 'green' ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                          'bg-gradient-to-r from-blue-500 to-purple-500'
                        }`} />
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className={`${showcase.reverse ? 'lg:order-1' : ''}`}>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 border border-blue-200 text-blue-700 text-sm mb-4">
                                                      <Sparkles className="w-4 h-4" />
                                                      <span>Feature Showcase</span>
                                                    </div>
                                                    <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
                                                      {showcase.title}
                                                    </h3>
                                                    <p className="text-gray-600 text-lg leading-relaxed mb-6">
                                                      {showcase.description}
                                                    </p>

                                                    {/* Feature Badges */}
                                                    <div className="flex flex-wrap gap-2">
                                                      {showcase.badges.map((badge, i) => (
                                                        <div
                                                          key={i}
                                                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 border border-gray-200"
                                                        >
                                                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                                                          <span className="text-sm font-medium text-gray-700">{badge}</span>
                                                        </div>
                                                      ))}
                                                    </div>
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
          </div>
        </section>

        {/* All Features Grid - Compact Version */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50/50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
                Dan Masih Banyak Lagi
              </h3>
              <p className="text-gray-600">
                Semua fitur yang Anda butuhkan untuk mengelola sales dengan efisien
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={index}
                    className="p-5 rounded-xl bg-white border border-gray-200 hover:shadow-lg hover:border-blue-200 transition-all duration-300 cursor-pointer group"
                  >
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
                      style={{ backgroundColor: `${feature.color}15`, color: feature.color }}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-1 text-sm">{feature.title}</h4>
                    <p className="text-gray-600 text-xs leading-relaxed line-clamp-2">{feature.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent to-gray-100/50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 border border-green-200 text-green-700 text-sm mb-4">
                <Rocket className="w-4 h-4" />
                <span>Mudah Dimulai</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                Mulai Menutup Deal dalam
                <span className="block bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                  3 Langkah Sederhana
                </span>
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  step: '01',
                  icon: Users,
                  title: 'Tambah Lead Anda',
                  description: 'ambahkan lead. Sertakan info kontak, minat properti, dan sumber lead.'
                },
                {
                  step: '02',
                  icon: Target,
                  title: 'Lacak & Bina',
                  description: 'Pindahkan lead melalui pipeline. Atur pengingat dan jangan pernah melewatkan follow-up.'
                },
                {
                  step: '03',
                  icon: TrendingUp,
                  title: 'Tutup & Analisis',
                  description: 'Tutup deal dan gunakan analitik untuk terus meningkatkan proses penjualan Anda.'
                }
              ].map((step, index) => {
                const Icon = step.icon;
                return (
                  <div key={index} className="relative">
                    {/* Step Number */}
                    <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white font-bold text-sm shadow-lg">
                      {step.step}
                    </div>

                    {/* Card */}
                    <div className="relative pt-8 p-6 rounded-2xl bg-white border border-gray-200 hover:shadow-lg transition-all duration-300 group">
                      <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Icon className="w-6 h-6 text-blue-600" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
                      <p className="text-gray-600 text-sm leading-relaxed">{step.description}</p>
                    </div>

                    {/* Connector Line */}
                    {index < 2 && (
                      <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-blue-300 to-blue-400" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-50">
          <div className="max-w-7xl mx-auto">
            {/* Section Header */}
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-gray-200 text-gray-700 text-xs font-medium tracking-wide uppercase mb-6">
                <Award className="w-3.5 h-3.5" />
                <span>Pricing</span>
              </div>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 tracking-tight">
                Satu Harga,<br />Semua Fitur
              </h2>
              <p className="text-gray-500 text-lg max-w-xl mx-auto">
                Investasi cerdas untuk pertumbuhan bisnis Anda. Tanpa biaya tersembunyi, tanpa kompromi.
              </p>
            </div>

            {/* Modern Split Card */}
            <div className="max-w-5xl mx-auto">
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="grid lg:grid-cols-5">
                  {/* Left Side - Pricing */}
                  <div className="lg:col-span-2 bg-gray-900 p-8 sm:p-10 lg:p-12">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/10 text-white text-xs font-medium tracking-wide mb-8">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                      <span>Most Popular</span>
                    </div>

                    {/* Plan Name */}
                    <div className="mb-8">
                      <p className="text-gray-400 text-sm font-medium tracking-wide uppercase mb-2">DRM Subscription</p>
                      <h3 className="text-white text-xl font-semibold">Dynamic Revenue Management</h3>
                    </div>

                    {/* Price */}
                    <div className="mb-8">
                      <div className="flex items-baseline gap-1 mb-2">
                        <span className="text-5xl sm:text-6xl font-bold text-white tracking-tight">60</span>
                        <span className="text-3xl font-bold text-white">.000</span>
                      </div>
                      <p className="text-gray-400 text-sm">per bulan • Rp 600.000/tahun</p>
                    </div>

                    {/* Guarantee */}
                    <div className="pt-6 border-t border-white/10">
                      <div className="flex items-center gap-3 text-gray-300 text-sm">
                        <Shield className="w-5 h-5 text-blue-400" />
                        <span>30-day money-back guarantee</span>
                      </div>
                    </div>

                    {/* CTA Button */}
                    <button
                      onClick={openFormModal}
                      className="w-full mt-8 py-4 px-6 bg-white text-gray-900 font-semibold rounded-xl hover:bg-gray-50 transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      Get Started
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Right Side - Features */}
                  <div className="lg:col-span-3 p-8 sm:p-10 lg:p-12">
                    <div className="mb-8">
                      <h4 className="text-gray-900 font-semibold mb-1">Everything Included</h4>
                      <p className="text-gray-500 text-sm">Full access to all features</p>
                    </div>

                    {/* Features List */}
                    <div className="space-y-3 mb-8">
                      {[
                        { icon: Target, text: 'Unlimited leads & pipeline stages' },
                        { icon: BarChart3, text: 'Advanced analytics & reporting' },
                        { icon: Bell, text: 'Smart reminders & automation' },
                        { icon: Building2, text: 'Property catalog management' },
                        { icon: Smartphone, text: 'WhatsApp one-click integration' },
                        { icon: Shield, text: 'Enterprise-grade security' },
                        { icon: Monitor, text: 'Desktop, tablet & mobile apps' },
                        { icon: Cloud, text: 'Cloud-based, always accessible' }
                      ].map((feature, index) => {
                        const Icon = feature.icon;
                        return (
                          <div
                            key={index}
                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                              <Icon className="w-4.5 h-4.5 text-blue-600" />
                            </div>
                            <span className="text-gray-700 text-sm font-medium">{feature.text}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Trust Badges */}
                    <div className="pt-6 border-t border-gray-100">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-gray-900">5<span className="text-blue-500">min</span></p>
                          <p className="text-xs text-gray-500 mt-1">Setup time</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-gray-900">24<span className="text-blue-500">/7</span></p>
                          <p className="text-xs text-gray-500 mt-1">Support</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Enterprise CTA */}
              <div className="mt-8 text-center">
                <p className="text-gray-500 text-sm mb-3">Need custom solutions for your enterprise?</p>
                <a
                  href="https://wa.me/6281234567890"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-gray-900 font-medium text-sm hover:text-blue-600 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  Contact our sales team
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent to-gray-100/50">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-100 border border-cyan-200 text-cyan-700 text-sm mb-4">
                <HelpCircle className="w-4 h-4" />
                <span>FAQ</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Pertanyaan yang
                <span className="block bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                  Sering Diajukan
                </span>
              </h2>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className="rounded-xl bg-white border border-gray-200 overflow-hidden"
                >
                  <button
                    onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                    className="w-full p-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-gray-900 font-medium pr-4">{faq.question}</span>
                    <ChevronDown
                      className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ${activeFaq === index ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {activeFaq === index && (
                    <div className="px-6 pb-6">
                      <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="relative p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-blue-600 to-blue-700 overflow-hidden">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
              </div>

              {/* Content */}
              <div className="relative z-10 text-center">
                <Rocket className="w-16 h-16 text-white/80 mx-auto mb-6" />
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                  Siap untuk Meningkatkan Penjualan Anda?
                </h2>
                <p className="text-white/90 mb-8 max-w-2xl mx-auto">
                  Bergabunglah dengan ribuan profesional sales yang telah menutup lebih banyak deal dengan SForce CRM Pro.
                  Mulai trial gratis Anda hari ini.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <button
                    onClick={openFormModal}
                    className="group inline-flex items-center gap-3 px-8 py-4 bg-white text-blue-600 font-semibold rounded-xl hover:bg-gray-50 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
                  >
                    Saya Tertarik
                    <Zap className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-gray-200 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8 mb-8">
              <div>
                <div className="flex items-center gap-2 mb-4">
                    <Link href="/" className="flex items-center gap-2">
                      <img src="/sforce-logo.webp" alt="Sales CRM Pro" className="h-18 ml-[-10px]" />
                    </Link>
                </div>
                <p className="text-gray-600 text-sm">
                  Platform CRM terbaik untuk profesional real estate dan sales di Indonesia.
                </p>
              </div>
              <div>
                <h4 className="text-gray-900 font-semibold mb-4">Produk</h4>
                <ul className="space-y-2 text-gray-600 text-sm">
                  <li><a href="#features" className="hover:text-gray-900 transition-colors">Fitur</a></li>
                  <li><a href="#pricing" className="hover:text-gray-900 transition-colors">Harga</a></li>
                </ul>
              </div>
              <div>
                <h4 className="text-gray-900 font-semibold mb-4">Perusahaan</h4>
                <ul className="space-y-2 text-gray-600 text-sm">
                  <li><a href="#" className="hover:text-gray-900 transition-colors">Tentang Kami</a></li>
                  <li><a href="#faq" className="hover:text-gray-900 transition-colors">FAQ</a></li>
                </ul>
              </div>
            </div>
            <div className="pt-8 border-t border-gray-200 text-center text-gray-500 text-sm">
              <p>© {new Date().getFullYear()} SForce CRM. Dibuat dengan ❤️ di Indonesia. Semua hak dilindungi.</p>
            </div>
          </div>
        </footer>

        {/* Lead Capture Form Modal */}
        {showFormModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={closeFormModal}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white">Saya Tertarik!</h3>
                    <p className="text-white/80 text-sm">Kami akan menghubungi Anda segera</p>
                  </div>
                  <button
                    onClick={closeFormModal}
                    className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                  >
                    <CloseIcon className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleFormChange}
                    required
                    placeholder="nama@email.com"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    disabled={isSubmitting || submitSuccess}
                  />
                </div>

                {/* WhatsApp Field */}
                <div>
                  <label htmlFor="whatsapp" className="block text-sm font-medium text-gray-700 mb-1">
                    No. WhatsApp <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    id="whatsapp"
                    name="whatsapp"
                    value={formData.whatsapp}
                    onChange={handleFormChange}
                    required
                    placeholder="08123456789"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    disabled={isSubmitting || submitSuccess}
                  />
                </div>

                {/* Message Field */}
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                    Pesan
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleFormChange}
                    maxLength={200}
                    rows={3}
                    placeholder="Ceritakan kebutuhan Anda..."
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all resize-none"
                    disabled={isSubmitting || submitSuccess}
                  />
                  <div className="text-right text-xs text-gray-500 mt-1">
                    {formData.message.length}/200
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || submitSuccess}
                  className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold rounded-lg shadow-lg shadow-blue-500/25 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Mengirim...</span>
                    </>
                  ) : submitSuccess ? (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Berhasil Terkirim!</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span>Kirim Pesan</span>
                    </>
                  )}
                </button>

                {/* Privacy Note */}
                <p className="text-xs text-gray-500 text-center">
                  Data Anda aman dan akan kami gunakan untuk menghubungi Anda tentang produk kami.
                </p>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper component for Play icon
function Play({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}
