import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Rocket,
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
import './FeaturesPage.css';

function generateCSRFToken(): string {
  const tokenData = {
    timestamp: Date.now(),
    random: Math.random().toString(36).substring(2)
  };
  return btoa(JSON.stringify(tokenData));
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidWhatsApp(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-()+]/g, '');
  const phoneRegex = /^(\+?62|0)[0-9]{9,13}$/;
  return phoneRegex.test(cleaned);
}

function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

export default function FeaturesPage() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [scrollY, setScrollY] = useState(0);
  const [showFormModal, setShowFormModal] = useState(false);
  const [csrfToken, setCsrfToken] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    whatsapp: '',
    message: '',
    website: ''
  });
  const [errors, setErrors] = useState<{ email?: string; whatsapp?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [lastSubmitTime, setLastSubmitTime] = useState(0);

  const submitTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (showFormModal) {
      setCsrfToken(generateCSRFToken());
    }
  }, [showFormModal]);

  useEffect(() => {
    return () => {
      if (submitTimeoutRef.current) {
        clearTimeout(submitTimeoutRef.current);
      }
    };
  }, []);

  const openFormModal = () => setShowFormModal(true);

  const closeFormModal = () => {
    setShowFormModal(false);
    setSubmitSuccess(false);
    setSubmitError('');
    setErrors({});
    setFormData({ email: '', whatsapp: '', message: '', website: '' });
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { email?: string; whatsapp?: string } = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email wajib diisi';
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = 'Format email tidak valid';
    }

    if (!formData.whatsapp.trim()) {
      newErrors.whatsapp = 'Nomor WhatsApp wajib diisi';
    } else if (!isValidWhatsApp(formData.whatsapp)) {
      newErrors.whatsapp = 'Format nomor WhatsApp tidak valid (gunakan 08xxx atau 628xxx)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const now = Date.now();
    if (now - lastSubmitTime < 3000) {
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setLastSubmitTime(now);

    try {
      const sanitizedData = {
        email: sanitizeInput(formData.email),
        whatsapp: sanitizeInput(formData.whatsapp),
        message: sanitizeInput(formData.message),
        website: formData.website,
        csrfToken
      };

      console.log('Form data (submit-interest endpoint not yet available):', sanitizedData);

      setSubmitSuccess(true);

      submitTimeoutRef.current = setTimeout(() => {
        closeFormModal();
      }, 2000);
    } catch (error: any) {
      console.error('Error submitting form:', error);

      if (error.name === 'AbortError') {
        setSubmitError('Request timeout. Silakan coba lagi.');
      } else {
        setSubmitError(error.message || 'Terjadi kesalahan saat mengirim data. Silakan coba lagi.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const features = [
    {
      icon: Target,
      title: 'Smart Lead Management',
      description: 'Track every lead from first contact to closing. Organize, prioritize, and never miss an opportunity.',
      color: '#3B6FE0',
      items: ['Add unlimited leads', 'Custom lead stages', 'Detailed lead profiles', 'Quick filters & search']
    },
    {
      icon: Flame,
      title: 'Visual Pipeline',
      description: 'Drag-and-drop leads through your sales funnel. See exactly where every prospect stands.',
      color: '#2F5CC4',
      items: ['Kanban-style board', 'Drag & drop updates', 'Stage tracking', 'Visual progress']
    },
    {
      icon: BarChart3,
      title: 'Powerful Analytics',
      description: 'Make data-driven decisions with comprehensive insights into your sales performance.',
      color: '#7C9DE8',
      items: ['Sales metrics dashboard', 'Trend analysis', 'Funnel visualization', 'Source tracking']
    },
    {
      icon: Bell,
      title: 'Smart Reminders',
      description: 'Never forget a follow-up. Set reminders and get notified at the perfect time.',
      color: '#5479C8',
      items: ['Custom reminders', 'Follow-up scheduling', 'Activity tracking', 'Automated alerts']
    },
    {
      icon: Building2,
      title: 'Property Catalog',
      description: 'Manage your property listings and link them to interested leads effortlessly.',
      color: '#A8C0F2',
      items: ['Property database', 'Link to leads', 'Details & specs', 'Quick access']
    },
    {
      icon: Smartphone,
      title: 'WhatsApp Quick Connect',
      description: 'Reach leads instantly on WhatsApp. One-click access from lead information.',
      color: '#3B6FE0',
      items: ['Direct WhatsApp access', 'One-click messaging', 'Phone integration', 'Fast response']
    }
  ];

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
      answer: 'Ya! Kami menawarkan masa percobaan gratis 7 hari dengan akses penuh ke semua fitur. Tidak perlu kartu kredit untuk memulai.'
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
    <div className="features-page">
      <div className="features-page__bg">
        <div className="features-page__bg-glow">
          <div className="features-page__bg-glow-blue" />
          <div className="features-page__bg-glow-slate" />
        </div>
        <div
          className="features-page__bg-grid"
          style={{
            backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }}
        />
      </div>

      <nav className={`features-page__nav ${showFormModal ? 'features-page__nav--hidden' : ''} ${scrollY > 50 ? 'features-page__nav--scrolled' : ''}`}>
        <div className="features-page__nav-inner">
          <div className="features-page__nav-row">
            <Link to="/" className="features-page__nav-logo">
              <img src="/sforce-logo.webp" alt="Sales CRM Pro" className="features-page__nav-logo-img" />
            </Link>
            <button onClick={openFormModal} className="features-page__nav-cta">
              Saya Tertarik
            </button>
          </div>
        </div>
      </nav>

      <div className="features-page__content">
        <header id="hero" className="features-page__hero">
          <div className="features-page__container">
            <div className="features-page__hero-inner">
              <h1 className="features-page__hero-title">
                Ubah Lebih Banyak Lead
                <span className="features-page__hero-title-accent">
                  Menjadi Penjualan
                </span>
              </h1>

              <p className="features-page__hero-subtitle">
                Platform manajemen penjualan all-in-one yang dirancang khusus untuk profesional real estate dan tim sales modern.
                Lacak lead, kelola pipeline, dan tutup lebih banyak deal dengan lebih cepat.
              </p>

              <div className="features-page__hero-actions">
                <button onClick={openFormModal} className="features-page__hero-cta">
                  Saya Tertarik
                  <ArrowRight className="features-page__hero-cta-icon" />
                </button>
                <a href="#features" className="features-page__hero-secondary">
                  <Play className="features-page__hero-secondary-icon" />
                  Lihat Fitur
                </a>
              </div>

              <div className="features-page__hero-trust">
                <div className="features-page__hero-trust-item">
                  <CheckCircle2 className="features-page__check-icon" />
                  <span>Tidak perlu kartu kredit</span>
                </div>
                <div className="features-page__hero-trust-item">
                  <CheckCircle2 className="features-page__check-icon" />
                  <span>Setup dalam 5 menit</span>
                </div>
                <div className="features-page__hero-trust-item">
                  <CheckCircle2 className="features-page__check-icon" />
                  <span>Batalkan kapan saja</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <section className="features-page__benefits">
          <div className="features-page__container">
            <div className="features-page__benefits-grid">
              {benefits.map((benefit, index) => (
                <div key={index} className="features-page__benefit">
                  <div className="features-page__benefit-number">{benefit.number}</div>
                  <div className="features-page__benefit-label">{benefit.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="features" className="features-page__features">
          <div className="features-page__container">
            <div className="features-page__section-header">
              <div className="features-page__badge features-page__badge--blue">
                <Sparkles className="features-page__badge-icon" />
                <span>Fitur Unggulan</span>
              </div>
              <h2 className="features-page__section-title">
                Semua yang Anda Butuhkan untuk
                <span className="features-page__section-title-accent">
                  Memenangkan Penjualan
                </span>
              </h2>
              <p className="features-page__section-subtitle">
                Fitur-fitur powerful yang dibangun khusus untuk profesional sales yang serius tentang hasil
              </p>
            </div>

            <div className="features-page__showcase">
              <div className="features-page__showcase-inner">
                <div className="features-page__showcase-glow" />

                <div className="features-page__showcase-card">
                  <div className="features-page__showcase-bar" />

                  <div className="features-page__showcase-content">
                    <div className="features-page__showcase-header">
                      <div className="features-page__badge features-page__badge--blue">
                        <Sparkles className="features-page__badge-icon" />
                        <span>Akses Di Mana Saja</span>
                      </div>
                      <h3 className="features-page__showcase-title">
                        Satu Aplikasi, Semua Perangkat
                      </h3>
                      <p className="features-page__showcase-subtitle">
                        Nikmati pengalaman yang seamless di semua perangkat dengan teknologi cloud-based
                      </p>
                    </div>

                    <div className="features-page__devices">
                      <div className="features-page__device">
                        <div className="features-page__device-overlay" />
                        <div className="features-page__device-inner">
                          <div className="features-page__device-icon">
                            <Smartphone className="features-page__device-icon-svg" />
                          </div>
                          <h4 className="features-page__device-title">Mobile</h4>
                          <p className="features-page__device-sub">iOS & Android</p>
                        </div>
                      </div>

                      <div className="features-page__device">
                        <div className="features-page__device-overlay" />
                        <div className="features-page__device-inner">
                          <div className="features-page__device-icon">
                            <Tablet className="features-page__device-icon-svg" />
                          </div>
                          <h4 className="features-page__device-title">Tablet</h4>
                          <p className="features-page__device-sub">iPad & Android Tab</p>
                        </div>
                      </div>

                      <div className="features-page__device">
                        <div className="features-page__device-overlay" />
                        <div className="features-page__device-inner">
                          <div className="features-page__device-icon">
                            <Monitor className="features-page__device-icon-svg" />
                          </div>
                          <h4 className="features-page__device-title">Desktop</h4>
                          <p className="features-page__device-sub">Windows & Mac</p>
                        </div>
                      </div>

                      <div className="features-page__device">
                        <div className="features-page__device-overlay" />
                        <div className="features-page__device-inner">
                          <div className="features-page__device-icon">
                            <Cloud className="features-page__device-icon-svg" />
                          </div>
                          <h4 className="features-page__device-title">Cloud</h4>
                          <p className="features-page__device-sub">Instant Access</p>
                        </div>
                      </div>
                    </div>

                    <div className="features-page__showcase-footer">
                      <div className="features-page__showcase-trust">
                        <div className="features-page__showcase-trust-item">
                          <CheckCircle2 className="features-page__check-icon" />
                          <span>Sync real-time</span>
                        </div>
                        <div className="features-page__showcase-trust-item">
                          <CheckCircle2 className="features-page__check-icon" />
                          <span>Data aman & terbackup</span>
                        </div>
                        <div className="features-page__showcase-trust-item">
                          <CheckCircle2 className="features-page__check-icon" />
                          <span>Server Indonesia</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="features-page__showcases">
              {featureShowcases.map((showcase) => (
                <div key={showcase.id} className="features-page__showcase-item">
                  <div className={`features-page__showcase-image-wrapper ${showcase.reverse ? 'features-page__showcase-image-wrapper--reverse' : ''}`}>
                    <div className="features-page__showcase-image-frame">
                      <div className="features-page__browser-bar">
                        <div className="features-page__browser-dots">
                          <div className="features-page__browser-dot features-page__browser-dot--red" />
                          <div className="features-page__browser-dot features-page__browser-dot--yellow" />
                          <div className="features-page__browser-dot features-page__browser-dot--green" />
                        </div>
                        <div className="features-page__browser-url">
                          <div className="features-page__browser-url-text">
                            {showcase.id}.example.com
                          </div>
                        </div>
                      </div>

                      <div className="features-page__showcase-image">
                        <img
                          src={showcase.image}
                          alt={showcase.imageAlt}
                          className="features-page__showcase-img"
                        />

                        <div className="features-page__showcase-image-bar" />
                      </div>
                    </div>
                  </div>

                  <div className={`features-page__showcase-text ${showcase.reverse ? 'features-page__showcase-text--reverse' : ''}`}>
                    <div className="features-page__badge features-page__badge--blue">
                      <Sparkles className="features-page__badge-icon" />
                      <span>Feature Showcase</span>
                    </div>
                    <h3 className="features-page__showcase-item-title">
                      {showcase.title}
                    </h3>
                    <p className="features-page__showcase-item-desc">
                      {showcase.description}
                    </p>

                    <div className="features-page__showcase-badges">
                      {showcase.badges.map((badge, i) => (
                        <div key={i} className="features-page__showcase-badge-item">
                          <CheckCircle2 className="features-page__check-icon" />
                          <span className="features-page__showcase-badge-text">{badge}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="features-page__more">
          <div className="features-page__container">
            <div className="features-page__more-header">
              <h3 className="features-page__more-title">
                Dan Masih Banyak Lagi
              </h3>
              <p className="features-page__more-subtitle">
                Semua fitur yang Anda butuhkan untuk mengelola sales dengan efisien
              </p>
            </div>

            <div className="features-page__more-grid">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div key={index} className="features-page__feature">
                    <div className="features-page__feature-icon"
                      style={{ backgroundColor: `color-mix(in srgb, ${feature.color} 12%, transparent)`, color: feature.color }}>
                      <Icon className="features-page__feature-icon-svg" />
                    </div>
                    <h4 className="features-page__feature-title">{feature.title}</h4>
                    <p className="features-page__feature-desc">{feature.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="features-page__how">
          <div className="features-page__container">
            <div className="features-page__section-header">
              <div className="features-page__badge features-page__badge--green">
                <Rocket className="features-page__badge-icon" />
                <span>Mudah Dimulai</span>
              </div>
              <h2 className="features-page__section-title">
                Mulai Menutup Deal dalam
                <span className="features-page__section-title-accent">
                  3 Langkah Sederhana
                </span>
              </h2>
            </div>

            <div className="features-page__how-grid">
              {[
                {
                  step: '01',
                  icon: Users,
                  title: 'Tambah Lead Anda',
                  description: 'Tambahkan lead. Sertakan info kontak, minat properti, dan sumber lead.'
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
                  <div key={index} className="features-page__step">
                    <div className="features-page__step-number">{step.step}</div>

                    <div className="features-page__step-card">
                      <div className="features-page__step-icon">
                        <Icon className="features-page__step-icon-svg" />
                      </div>
                      <h3 className="features-page__step-title">{step.title}</h3>
                      <p className="features-page__step-desc">{step.description}</p>
                    </div>

                    {index < 2 && (
                      <div className="features-page__step-connector" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section id="pricing" className="features-page__pricing">
          <div className="features-page__container">
            <div className="features-page__section-header">
              <div className="features-page__pricing-badge">
                <Award className="features-page__pricing-badge-icon" />
                <span>Pricing</span>
              </div>
              <h2 className="features-page__pricing-title">
                Satu Harga,<br />Semua Fitur
              </h2>
              <p className="features-page__pricing-subtitle">
                Investasi cerdas untuk pertumbuhan bisnis Anda. Tanpa biaya tersembunyi, tanpa kompromi.
              </p>
            </div>

            <div className="features-page__pricing-inner">
              <div className="features-page__pricing-card">
                <div className="features-page__pricing-grid">
                  <div className="features-page__pricing-left">
                    <div className="features-page__pricing-popular">
                      <span className="features-page__pricing-popular-dot"></span>
                      <span>Most Popular</span>
                    </div>

                    <div className="features-page__pricing-plan">
                      <p className="features-page__pricing-plan-label">DRM Subscription</p>
                      <h3 className="features-page__pricing-plan-title">Dynamic Revenue Management</h3>
                    </div>

                    <div className="features-page__pricing-price-block">
                      <div className="features-page__pricing-price-row">
                        <span className="features-page__pricing-price">60</span>
                        <span className="features-page__pricing-price-decimal">.000</span>
                      </div>
                      <p className="features-page__pricing-price-note">per bulan • Rp 600.000/tahun</p>
                    </div>

                    <button onClick={openFormModal} className="features-page__pricing-cta">
                      Get Started
                      <ArrowRight className="features-page__pricing-cta-icon" />
                    </button>
                  </div>

                  <div className="features-page__pricing-right">
                    <div className="features-page__pricing-features-heading">
                      <h4 className="features-page__pricing-features-title">Everything Included</h4>
                      <p className="features-page__pricing-features-subtitle">Full access to all features</p>
                    </div>

                    <div className="features-page__pricing-list">
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
                          <div key={index} className="features-page__pricing-item">
                            <div className="features-page__pricing-item-icon">
                              <Icon className="features-page__pricing-item-icon-svg" />
                            </div>
                            <span className="features-page__pricing-item-text">{feature.text}</span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="features-page__pricing-stats">
                      <div className="features-page__pricing-stats-grid">
                        <div className="features-page__pricing-stat">
                          <p className="features-page__pricing-stat-value">5<span className="features-page__pricing-stat-accent">min</span></p>
                          <p className="features-page__pricing-stat-label">Setup time</p>
                        </div>
                        <div className="features-page__pricing-stat">
                          <p className="features-page__pricing-stat-value">24<span className="features-page__pricing-stat-accent">/7</span></p>
                          <p className="features-page__pricing-stat-label">Support</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="features-page__pricing-enterprise">
                <p className="features-page__pricing-enterprise-text">Need custom solutions for your enterprise?</p>
                <a
                  href="https://wa.me/6281234567890"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="features-page__pricing-contact"
                >
                  <MessageCircle className="features-page__pricing-contact-icon" />
                  Contact our sales team
                </a>
              </div>
            </div>
          </div>
        </section>

        <section id="faq" className="features-page__faq">
          <div className="features-page__faq-inner">
            <div className="features-page__faq-header">
              <div className="features-page__badge features-page__badge--cyan">
                <HelpCircle className="features-page__badge-icon" />
                <span>FAQ</span>
              </div>
              <h2 className="features-page__section-title">
                Pertanyaan yang
                <span className="features-page__section-title-accent">
                  Sering Diajukan
                </span>
              </h2>
            </div>

            <div className="features-page__faq-list">
              {faqs.map((faq, index) => (
                <div key={index} className="features-page__faq-item">
                  <button
                    onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                    className="features-page__faq-button"
                  >
                    <span className="features-page__faq-question">{faq.question}</span>
                    <ChevronDown
                      className={`features-page__faq-chevron ${activeFaq === index ? 'features-page__faq-chevron--open' : ''}`}
                    />
                  </button>
                  {activeFaq === index && (
                    <div className="features-page__faq-answer">
                      <p className="features-page__faq-answer-text">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="features-page__cta-section">
          <div className="features-page__cta-inner">
            <div className="features-page__cta-card">
              <div className="features-page__cta-glow">
                <div className="features-page__cta-glow-circle features-page__cta-glow-circle--top" />
                <div className="features-page__cta-glow-circle features-page__cta-glow-circle--bottom" />
              </div>

              <div className="features-page__cta-content">
                <Rocket className="features-page__cta-icon" />
                <h2 className="features-page__cta-title">
                  Siap untuk Meningkatkan Penjualan Anda?
                </h2>
                <p className="features-page__cta-subtitle">
                  Tutup lebih banyak deal. Mulai trial gratis!
                </p>
                <div className="features-page__cta-actions">
                  <button onClick={openFormModal} className="features-page__cta-button">
                    Saya Tertarik
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <footer className="features-page__footer">
          <div className="features-page__container">
            <div className="features-page__footer-grid">
              <div>
                <div className="features-page__footer-brand">
                  <Link to="/" className="features-page__footer-logo">
                    <img src="/sforce-logo.webp" alt="Sales CRM Pro" className="features-page__footer-logo-img" />
                  </Link>
                </div>
                <p className="features-page__footer-desc">
                  Platform CRM terbaik untuk profesional real estate dan sales di Indonesia.
                </p>
              </div>
              <div>
                <h4 className="features-page__footer-title">Produk</h4>
                <ul className="features-page__footer-list">
                  <li><a href="#features" className="features-page__footer-link">Fitur</a></li>
                  <li><a href="#pricing" className="features-page__footer-link">Harga</a></li>
                </ul>
              </div>
              <div>
                <h4 className="features-page__footer-title">Perusahaan</h4>
                <ul className="features-page__footer-list">
                  <li><a href="#faq" className="features-page__footer-link">FAQ</a></li>
                </ul>
              </div>
            </div>
            <div className="features-page__footer-bottom">
              <p>&copy; {new Date().getFullYear()} SForce CRM. Dibuat dengan hati di Indonesia. Semua hak dilindungi.</p>
            </div>
          </div>
        </footer>

        {showFormModal && (
          <div className="features-page__modal">
            <div className="features-page__modal-backdrop" onClick={closeFormModal} />

            <div className="features-page__modal-panel">
              <div className="features-page__modal-header">
                <div className="features-page__modal-header-row">
                  <div>
                    <h3 className="features-page__modal-title">Saya Tertarik!</h3>
                    <p className="features-page__modal-subtitle">Kami akan menghubungi Anda segera</p>
                  </div>
                  <button onClick={closeFormModal} className="features-page__modal-close">
                    <CloseIcon className="features-page__modal-close-icon" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="features-page__modal-form">
                {/* Honeypot field */}
                <input
                  type="text"
                  name="website"
                  id="website"
                  value={formData.website}
                  onChange={handleFormChange}
                  className="features-page__modal-honeypot"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                />

                <div>
                  <label htmlFor="email" className="features-page__modal-label">
                    Email <span className="features-page__modal-required">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleFormChange}
                    required
                    placeholder="nama@email.com"
                    className={`features-page__modal-input ${errors.email ? 'features-page__modal-input--error' : ''}`}
                    disabled={isSubmitting || submitSuccess}
                  />
                  {errors.email && <p className="features-page__modal-error">{errors.email}</p>}
                </div>

                <div>
                  <label htmlFor="whatsapp" className="features-page__modal-label">
                    No. WhatsApp <span className="features-page__modal-required">*</span>
                  </label>
                  <input
                    type="tel"
                    id="whatsapp"
                    name="whatsapp"
                    value={formData.whatsapp}
                    onChange={handleFormChange}
                    required
                    placeholder="08123456789"
                    className={`features-page__modal-input ${errors.whatsapp ? 'features-page__modal-input--error' : ''}`}
                    disabled={isSubmitting || submitSuccess}
                  />
                  {errors.whatsapp && <p className="features-page__modal-error">{errors.whatsapp}</p>}
                </div>

                <div>
                  <label htmlFor="message" className="features-page__modal-label">
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
                    className="features-page__modal-textarea"
                    disabled={isSubmitting || submitSuccess}
                  />
                  <div className="features-page__modal-char-count">
                    {formData.message.length}/200
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || submitSuccess}
                  className="features-page__modal-submit"
                >
                  {isSubmitting ? (
                    <>
                      <div className="features-page__modal-spinner" />
                      <span>Mengirim...</span>
                    </>
                  ) : submitSuccess ? (
                    <>
                      <CheckCircle2 className="features-page__modal-submit-icon" />
                      <span>Berhasil Terkirim!</span>
                    </>
                  ) : (
                    <>
                      <Send className="features-page__modal-submit-icon" />
                      <span>Kirim Pesan</span>
                    </>
                  )}
                </button>

                <p className="features-page__modal-note">
                  Data Anda aman dan akan kami gunakan untuk menghubungi Anda tentang produk kami.
                </p>

                {submitError && (
                  <p className="features-page__modal-submit-error">{submitError}</p>
                )}
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Play({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}
