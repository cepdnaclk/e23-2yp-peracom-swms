import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import {
  GraduationCap, Users, DollarSign, Heart, ArrowRight,
  BookOpen, FileCheck, Handshake, Menu, X, Facebook,
  Twitter, Linkedin, Youtube, ChevronRight
} from 'lucide-react'
import { UPLogo } from '../components/common/UPLogo'
import api from '../services/api'

function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const links = ['Home', 'Scholarships', 'About', 'Contact']

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white shadow-md' : 'bg-white/95 backdrop-blur-sm'} border-b border-slate-100`}>
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-6">
        <div className="flex items-center gap-3 flex-shrink-0">
          <UPLogo size="sm" />
          <div className="hidden sm:block">
            <p className="text-sm font-bold text-purple-700 leading-tight">University of Peradeniya</p>
            <p className="text-xs text-slate-400 leading-tight">Student Welfare Management</p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-6 flex-1 justify-center">
          {links.map(l => (
            <a key={l} href={`#${l.toLowerCase()}`}
              className="text-sm font-medium text-slate-600 hover:text-purple-700 transition-colors relative group">
              {l}
              <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-purple-600 transition-all group-hover:w-full" />
            </a>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-3">
          <Link to="/login" className="btn-primary text-sm px-5 py-2">Login</Link>
          <button className="md:hidden p-2 rounded-lg text-slate-500" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 py-3 flex flex-col gap-1">
          {links.map(l => (
            <a key={l} href={`#${l.toLowerCase()}`}
              onClick={() => setMobileOpen(false)}
              className="px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-purple-50 hover:text-purple-700">
              {l}
            </a>
          ))}
        </div>
      )}
    </nav>
  )
}

function HeroSection() {
  return (
    <section id="home" className="pt-16 min-h-[560px] relative overflow-hidden flex items-center">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-purple-700 to-purple-500" />
      <div className="absolute inset-0 opacity-10"
        style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1562774053-701939374585?w=1400&q=80")', backgroundSize: 'cover', backgroundPosition: 'center' }} />
      <div className="absolute inset-0 bg-purple-900/60" />

      {/* Decorative circles */}
      <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-purple-400/20 blur-3xl" />
      <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-purple-300/20 blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 py-20 w-full">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-6">
            <GraduationCap size={14} className="text-purple-200" />
            <span className="text-xs font-medium text-purple-100">University of Peradeniya</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-4">
            PeraCom Student Welfare
            <span className="block text-purple-200">Management System</span>
          </h1>

          <p className="text-lg text-purple-200 mb-8 leading-relaxed">
            Supporting students through scholarships and donor partnerships. Transparent, fair, and accountable.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <a href="#scholarships"
              className="inline-flex items-center justify-center gap-2 bg-white text-purple-700 font-bold px-8 py-3.5 rounded-xl hover:bg-purple-50 transition-colors shadow-lg">
              View Scholarships <ArrowRight size={18} />
            </a>
            <a href="#about"
              className="inline-flex items-center justify-center gap-2 bg-white/10 border-2 border-white/40 text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-white/20 transition-colors">
              Learn More
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

function StatsSection() {
  const stats = [
    { value: '1,250+', label: 'Students Supported', icon: Users, color: 'text-purple-600 bg-purple-50' },
    { value: '45', label: 'Active Scholarships', icon: GraduationCap, color: 'text-green-600 bg-green-50' },
    { value: 'LKR 12M+', label: 'Total Funds Awarded', icon: DollarSign, color: 'text-amber-600 bg-amber-50' },
    { value: '180+', label: 'Registered Donors', icon: Heart, color: 'text-blue-600 bg-blue-50' },
  ]

  return (
    <section className="bg-white py-16">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map(({ value, label, icon: Icon, color }) => (
            <div key={label} className="card p-6 text-center hover:shadow-md transition-shadow">
              <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center mx-auto mb-3`}>
                <Icon size={22} />
              </div>
              <p className="text-3xl font-extrabold text-slate-800">{value}</p>
              <p className="text-sm text-slate-500 mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function AboutSection() {
  return (
    <section id="about" className="bg-purple-50 py-20">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <p className="section-label mb-2">About the Program</p>
          <h2 className="text-3xl font-bold text-slate-800">About the Welfare Program</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-10">
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-slate-800">Supporting Student Success</h3>
            <p className="text-slate-600 leading-relaxed">
              The University of Peradeniya Student Welfare Management System connects financially disadvantaged students with scholarship opportunities, ensuring that talent and hard work are never held back by financial barriers.
            </p>
            <ul className="space-y-2">
              {['Browse and apply for scholarships easily', 'Track your application status in real time', 'Receive funded support through verified donors'].map(item => (
                <li key={item} className="flex items-start gap-2 text-sm text-slate-600">
                  <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-bold text-slate-800">Empowering Through Partnerships</h3>
            <p className="text-slate-600 leading-relaxed">
              Donors contribute scholarships that are carefully reviewed by the admin team. Each scholarship is matched to eligible students through a transparent, fair, and accountable process.
            </p>
            <div className="border-l-4 border-purple-500 pl-4 bg-white rounded-r-xl p-4">
              <p className="font-semibold text-purple-700">Transparent · Fair · Accountable</p>
              <p className="text-xs text-slate-500 mt-1">Our three core values guiding every decision</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function FeaturedScholarships() {
  const [scholarships, setScholarships] = useState([])

  useEffect(() => {
    api.get('/scholarships/public?limit=3').catch(() => ({ data: [] })).then(r => {
      setScholarships(r.data?.slice(0, 3) || [])
    })
  }, [])

  const placeholders = [
    { title: 'Merit Fund Scholarship', donor_name: 'Neil Fernando', organization: 'Alumni Association', funding_amount: 50000, eligible_batch: '20/21', application_deadline: '2025-06-30', eligibility_criteria: 'GPA ≥ 3.5, Financial need demonstrated' },
    { title: 'Science Faculty Scholarship', donor_name: 'Sunil Perera', organization: 'Tech Foundation', funding_amount: 40000, eligible_batch: '21/22', application_deadline: '2025-07-15', eligibility_criteria: 'Science faculty students with GPA ≥ 3.0' },
    { title: 'Alumni Support Grant', donor_name: 'Alumni Network', organization: 'PERACOM Alumni', funding_amount: 35000, eligible_batch: '22/23', application_deadline: '2025-08-01', eligibility_criteria: 'Any department, demonstrable financial need' },
  ]

  const display = scholarships.length > 0 ? scholarships : placeholders

  return (
    <section id="scholarships" className="bg-white py-20 scroll-mt-16">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <p className="section-label mb-2">Scholarships</p>
          <h2 className="text-3xl font-bold text-slate-800">Featured Scholarships</h2>
          <p className="text-slate-500 mt-2">Browse available scholarships and apply before the deadline.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {display.map((s, i) => (
            <div key={i} className="card hover:shadow-md transition-all hover:-translate-y-0.5 flex flex-col">
              <div className="p-5 flex-1 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <BookOpen size={18} className="text-purple-600" />
                  </div>
                  <span className="badge-green">Active</span>
                </div>

                <div>
                  <h3 className="font-bold text-slate-800">{s.title}</h3>
                  {s.donor_name && (
                    <p className="text-xs text-purple-600 mt-0.5">by {s.donor_name} · {s.organization}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <span className="text-green-500">💰</span> LKR {Number(s.funding_amount || 0).toLocaleString()} per student
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <span className="text-amber-500">📅</span> Deadline: {s.application_deadline ? new Date(s.application_deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <span className="text-blue-500">👥</span> Batch: {s.eligible_batch || 'All'}
                  </div>
                </div>

                {s.eligibility_criteria && (
                  <div className="bg-purple-50 rounded-xl p-3">
                    <p className="text-xs font-semibold text-purple-700 mb-0.5">Eligibility</p>
                    <p className="text-xs text-purple-600">{s.eligibility_criteria}</p>
                  </div>
                )}
              </div>

              <div className="p-5 pt-0">
                <Link to="/login" className="btn-primary w-full text-center text-sm py-2.5 block">
                  View Details & Apply
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-8">
          <Link to="/login" className="inline-flex items-center gap-1.5 text-purple-600 font-medium hover:text-purple-800 transition-colors">
            View All Scholarships <ChevronRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  )
}

function HowItWorksSection() {
  const steps = [
    { icon: '🎓', bg: 'bg-purple-100', title: 'Students Apply for Scholarships', desc: 'Students create profiles, browse available scholarships, and submit applications with required documents.', step: 'Step 1' },
    { icon: '📄', bg: 'bg-blue-100', title: 'Documents Verified & Applications Reviewed', desc: 'Admin team verifies eligibility criteria, reviews all submitted documents, and approves or requests resubmission.', step: 'Step 2' },
    { icon: '🤝', bg: 'bg-green-100', title: 'Donors Support Selected Students', desc: 'Approved students are assigned to donors who review and confirm. Scholarship funds are then awarded.', step: 'Step 3' },
  ]

  return (
    <section className="bg-slate-50 py-20">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <p className="section-label mb-2">Process</p>
          <h2 className="text-3xl font-bold text-slate-800">How It Works</h2>
          <p className="text-slate-500 mt-2">Simple steps from application to scholarship award.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 relative">
          {steps.map(({ icon, bg, title, desc, step }, i) => (
            <div key={i} className="relative">
              <div className="card p-6 text-center space-y-4 hover:shadow-md transition-shadow h-full">
                <div className={`w-16 h-16 rounded-2xl ${bg} flex items-center justify-center text-3xl mx-auto`}>
                  {icon}
                </div>
                <span className="inline-block badge-purple text-xs">{step}</span>
                <h3 className="font-bold text-slate-800">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
              </div>
              {i < 2 && (
                <div className="hidden md:flex absolute top-1/2 -right-3 -translate-y-1/2 z-10 w-6 h-6 bg-white border border-slate-200 rounded-full items-center justify-center text-purple-600 shadow-sm">
                  <ChevronRight size={14} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function SuccessStoriesSection() {
  const stories = [
    { name: 'Anjana Perera', department: 'Computer Engineering', batch: '20/21', scholarship: 'Merit Fund Scholarship', quote: 'Receiving this scholarship allowed me to focus on my studies without financial stress. I am truly grateful to my donor and the University.' },
    { name: 'Nimali Silva', department: 'Electronic & Telecom', batch: '21/22', scholarship: 'Alumni Support Grant', quote: 'This program changed my life. I can now pursue my passion for engineering knowing that the University stands behind me every step of the way.' },
    { name: 'Kasun Fernando', department: 'Mechanical Engineering', batch: '19/20', scholarship: 'Science Faculty Scholarship', quote: 'The transparent process and timely support made all the difference in my final year. I now work as a software engineer and give back to this program.' },
  ]

  return (
    <section className="bg-white py-20">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <p className="section-label mb-2">Testimonials</p>
          <h2 className="text-3xl font-bold text-slate-800">Student Success Stories</h2>
          <p className="text-slate-500 mt-2">Real students whose lives were changed through scholarships.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {stories.map(({ name, department, batch, scholarship, quote }) => (
            <div key={name} className="card p-6 space-y-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-purple-400 flex items-center justify-center text-white font-bold text-lg">
                  {name[0]}
                </div>
                <div>
                  <p className="font-semibold text-slate-800 text-sm">{name}</p>
                  <p className="text-xs text-slate-500">{department}</p>
                  <span className="badge-purple text-xs">{batch}</span>
                </div>
              </div>
              <span className="inline-block badge-green text-xs">{scholarship}</span>
              <p className="text-sm text-slate-600 italic leading-relaxed">"{quote}"</p>
              <div className="flex gap-0.5 text-amber-400">
                {[...Array(5)].map((_, i) => <span key={i}>★</span>)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function AnnouncementsSection() {
  const announcements = [
    { category: 'Scholarships', title: 'Merit Fund Scholarship Applications Now Open', preview: 'Applications for the 2025/26 Merit Fund Scholarship are now open. Eligible students from batch 20/21 can apply before June 30.', date: 'Jun 1, 2025' },
    { category: 'Deadline', title: 'Application Deadline Reminder', preview: 'Reminder: The deadline for the Alumni Support Grant is July 15, 2025. Make sure all documents are uploaded before the deadline.', date: 'May 28, 2025' },
    { category: 'Results', title: 'Scholarship Results Released', preview: 'Results for the 2024/25 academic year scholarships have been released. Students can view their status in the portal.', date: 'May 20, 2025' },
  ]

  return (
    <section className="bg-purple-50 py-20">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-800">Latest Announcements</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {announcements.map(({ category, title, preview, date }) => (
            <div key={title} className="bg-white rounded-xl border border-purple-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex">
              <div className="w-1 bg-purple-600 flex-shrink-0" />
              <div className="p-5 space-y-3">
                <p className="text-xs text-slate-400">{date}</p>
                <span className="badge-purple text-xs">{category}</span>
                <h3 className="font-semibold text-slate-800 text-sm leading-tight">{title}</h3>
                <p className="text-xs text-slate-500 line-clamp-2">{preview}</p>
                <Link to="/login" className="text-xs text-purple-600 hover:text-purple-800 font-medium inline-flex items-center gap-1">
                  Read more <ChevronRight size={12} />
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-8">
          <Link to="/login" className="btn-secondary inline-flex items-center gap-2">
            View All Announcements <ChevronRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  )
}

function CTASection() {
  return (
    <section className="bg-gradient-to-r from-purple-700 to-purple-500 py-20">
      <div className="max-w-3xl mx-auto px-4 text-center space-y-6">
        <h2 className="text-3xl font-bold text-white">Ready to Apply for a Scholarship?</h2>
        <p className="text-purple-200 text-lg">
          Join hundreds of students who have received financial support through our welfare program.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/register/student"
            className="inline-flex items-center justify-center gap-2 bg-white text-purple-700 font-bold px-8 py-3.5 rounded-xl hover:bg-purple-50 transition-colors">
            Get Started <ArrowRight size={18} />
          </Link>
          <a href="#about"
            className="inline-flex items-center justify-center bg-transparent border-2 border-white text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-white/10 transition-colors">
            Contact Us
          </a>
        </div>
      </div>
    </section>
  )
}

function HomeFooter() {
  return (
    <footer id="contact" className="bg-[#1e1b4b] text-white">
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-10">
          {/* Left */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <UPLogo size="sm" />
              <div>
                <p className="font-bold text-white text-sm">University of Peradeniya</p>
                <p className="text-xs text-purple-300">Student Welfare Management System</p>
              </div>
            </div>
            <p className="text-sm text-purple-300 leading-relaxed">
              Connecting students with scholarship opportunities through transparent and fair processes.
            </p>
          </div>

          {/* Center */}
          <div className="space-y-4">
            <h3 className="font-bold text-white">Quick Links</h3>
            <ul className="space-y-2">
              {[['Home', '#home'], ['Scholarships', '#scholarships'], ['About', '#about'], ['Contact', '#contact'], ['Login', '/login']].map(([label, href]) => (
                <li key={label}>
                  {href.startsWith('/') ? (
                    <Link to={href} className="text-sm text-purple-300 hover:text-white transition-colors">{label}</Link>
                  ) : (
                    <a href={href} className="text-sm text-purple-300 hover:text-white transition-colors">{label}</a>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Right */}
          <div className="space-y-4">
            <h3 className="font-bold text-white">Connect With Us</h3>
            <div className="flex gap-3">
              {[Facebook, Twitter, Linkedin, Youtube].map((Icon, i) => (
                <button key={i} className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-purple-300 hover:text-white transition-colors">
                  <Icon size={16} />
                </button>
              ))}
            </div>
            <div className="space-y-1 text-sm text-purple-300">
              <p>welfare@pdn.ac.lk</p>
              <p>Faculty of Engineering</p>
              <p>University of Peradeniya, Sri Lanka</p>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 bg-[#16124a]">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-purple-400">
          <span>© 2026 PeraCom Student Welfare Management System · All Rights Reserved</span>
          <span>Department of Computer Engineering · University of Peradeniya</span>
        </div>
      </div>
    </footer>
  )
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <HeroSection />
      <StatsSection />
      <AboutSection />
      <FeaturedScholarships />
      <HowItWorksSection />
      <SuccessStoriesSection />
      <AnnouncementsSection />
      <CTASection />
      <HomeFooter />
    </div>
  )
}
