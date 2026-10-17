import React from 'react';
import LegacyRuntime from '../../components/LegacyRuntime.jsx';
import { legacyEvent } from '../../services/legacyEvents.js';
import source from './runtime.js?raw';
import './staff.css';

export default function Staff() {
  return <>

<div id="landing">
<nav className="l-nav">
<span className="l-nav-logo"><span className="brand-logo"><span className="brand-logo-art"><img src="/images/eventflow-logo.svg" alt="EventFlow" width="2172" height="724" decoding="async" /></span></span></span>
<div className="l-nav-links">
<a href="#" onClick={event => legacyEvent("event.preventDefault();showPage('find-events');", event)}>Find Events</a>
<a href="#" onClick={event => legacyEvent("event.preventDefault();showPage('gallery');", event)}>Gallery</a>
<a href="#" onClick={event => legacyEvent("event.preventDefault();showPage('about');", event)}>About Us</a>
<a href="#" onClick={event => legacyEvent("event.preventDefault();showPage('contact');", event)}>Contact</a>
</div>
<div className="l-nav-actions">
<button className="btn btn-ghost btn-sm" onClick={event => legacyEvent("gotoLogin('attendee')", event)}>Sign In</button>
</div>
</nav>
<section className="hero">
<div className="hero-bg">
<div className="orb1"></div>
<div className="orb2"></div>
<div className="grid-lines"></div>
</div>
<div className="hero-content">
<div className="hero-pill"> Event Registration &amp; Attendee Management Platform</div>
<h1 className="hero-h1">The Smartest Way to<br /><span className="grad">Manage Events</span></h1>
<p className="hero-p">EventFlow unifies event planning, attendee registration, staff coordination, and real-time
          on-site verification in one centralized platform.</p>
<div className="hero-btns">
<button className="btn btn-primary btn-lg" onClick={event => legacyEvent("showPage('find-events')", event)}>🎟️ Explore Events</button>
</div>
<div className="hero-stats">
<div className="hero-stat">
<div className="hero-stat-val" style={{"color": "var(--accent)"}}>2,400+</div>
<div className="hero-stat-lbl">Events Managed</div>
</div>
<div className="hero-stat">
<div className="hero-stat-val" style={{"color": "var(--green)"}}>98K+</div>
<div className="hero-stat-lbl">Attendees Registered</div>
</div>
<div className="hero-stat">
<div className="hero-stat-val" style={{"color": "var(--yellow)"}}>500+</div>
<div className="hero-stat-lbl">Organizers Onboard</div>
</div>
<div className="hero-stat">
<div className="hero-stat-val" style={{"color": "var(--blue)"}}>99.8%</div>
<div className="hero-stat-lbl">Platform Uptime</div>
</div>
</div>
</div>
</section>
<section className="l-section l-section-alt" id="features">
<div className="l-eyebrow">Platform Features</div>
<h2 className="l-heading">Everything You Need</h2>
<p className="l-desc">A complete toolkit designed for every role in the event ecosystem.</p>
<div className="features-grid">
<div className="feat-card">
<div className="feat-icon" style={{"background": "var(--accent-dim)", "color": "var(--accent)"}}>📋</div>
<div className="feat-title">Smart Registration</div>
<p className="feat-desc">Streamlined attendee registration with instant QR ticket generation, automated email
            confirmations, and real-time capacity tracking.</p>
</div>
<div className="feat-card">
<div className="feat-icon" style={{"background": "var(--green-dim)", "color": "var(--green)"}}>👥</div>
<div className="feat-title">Staff Coordination</div>
<p className="feat-desc">Assign staff with availability tracking, role management, and budget controls. Staff can
            accept or decline assignments in real time.</p>
</div>
<div className="feat-card">
<div className="feat-icon" style={{"background": "var(--blue-dim)", "color": "var(--blue)"}}>✅</div>
<div className="feat-title">Live Verification</div>
<p className="feat-desc">On-site QR code scanning for fast and accurate attendee check-in. Eliminate queues and
            manual entry errors completely.</p>
</div>
<div className="feat-card">
<div className="feat-icon" style={{"background": "var(--yellow-dim)", "color": "var(--yellow)"}}>💳</div>
<div className="feat-title">Secure Payments</div>
<p className="feat-desc">Integrated payment processing for paid events with instant receipt generation, refund
            workflows, and revenue reporting.</p>
</div>
<div className="feat-card">
<div className="feat-icon" style={{"background": "var(--orange-dim)", "color": "var(--orange)"}}>📊</div>
<div className="feat-title">Analytics &amp; Reports</div>
<p className="feat-desc">Live dashboards with registration rates, revenue breakdowns, attendance heat maps, and
            post-event performance summaries.</p>
</div>
<div className="feat-card">
<div className="feat-icon" style={{"background": "var(--red-dim)", "color": "var(--red)"}}>🔔</div>
<div className="feat-title">Smart Notifications</div>
<p className="feat-desc">Automated reminders, status updates, and confirmations keep clients, attendees, and staff
            informed throughout the event lifecycle.</p>
</div>
</div>
</section>
<section className="l-section" id="roles">
<div className="text-center">
<div className="l-eyebrow">Role-Based Access Control</div>
<h2 className="l-heading">Built for Every Stakeholder</h2>
<p className="l-desc" style={{"margin": "0 auto"}}>Each actor gets a tailored interface with precisely the permissions they
          need.</p>
</div>
<div className="roles-grid">
<div className="role-card" onClick={event => legacyEvent("gotoLogin('superuser')", event)}>
<div className="role-card-emoji">🛡️</div>
<div className="role-card-title">Super Admin</div>
<p className="role-card-desc">Full CRUD access across all modules. Manage users, roles, events, and system
            settings.</p>
<span className="badge badge-red">Full Control</span>
</div>
<div className="role-card" onClick={event => legacyEvent("gotoLogin('organizer')", event)}>
<div className="role-card-emoji">🎯</div>
<div className="role-card-title">Event Organizer</div>
<p className="role-card-desc">Plan events, manage staff assignments, coordinate with clients, and generate event
            reports.</p>
<span className="badge badge-purple">Operational</span>
</div>
<div className="role-card" onClick={event => legacyEvent("gotoLogin('client')", event)}>
<div className="role-card-emoji">💼</div>
<div className="role-card-title">Client</div>
<p className="role-card-desc">Submit event requests, review proposals, approve plans, and receive post-event
            reports.</p>
<span className="badge badge-yellow">Requestor</span>
</div>
<div className="role-card" onClick={event => legacyEvent("gotoLogin('attendee')", event)}>
<div className="role-card-emoji">🎟️</div>
<div className="role-card-title">Attendee</div>
<p className="role-card-desc">Browse events, register, make payments, receive digital tickets, and verify
            attendance on-site.</p>
<span className="badge badge-green">End User</span>
</div>
</div>
</section>
<section className="l-section l-section-alt" id="how">
<div className="l-eyebrow">How It Works</div>
<h2 className="l-heading">Simple. Fast. Reliable.</h2>
<div className="grid-3" style={{"marginTop": "48px", "gap": "28px"}}>
<div style={{"textAlign": "center"}}>
<div style={{"width": "64px", "height": "64px", "background": "var(--accent-dim)", "border": "1px solid rgba(124,111,247,.3)", "borderRadius": "20px", "display": "flex", "alignItems": "center", "justifyContent": "center", "fontSize": "28px", "margin": "0 auto 18px"}}>
            📋</div>
<div className="h4 mb-8">1. Request or Create</div>
<p className="muted">Clients submit event requests. Organizers create and plan events with full detail.</p>
</div>
<div style={{"textAlign": "center"}}>
<div style={{"width": "64px", "height": "64px", "background": "var(--green-dim)", "border": "1px solid rgba(34,211,165,.3)", "borderRadius": "20px", "display": "flex", "alignItems": "center", "justifyContent": "center", "fontSize": "28px", "margin": "0 auto 18px"}}>
            🎟️</div>
<div className="h4 mb-8">2. Register &amp; Pay</div>
<p className="muted">Attendees browse, register, and pay securely. Instant ticket generation with unique QR codes.
          </p>
</div>
<div style={{"textAlign": "center"}}>
<div style={{"width": "64px", "height": "64px", "background": "var(--blue-dim)", "border": "1px solid rgba(66,153,225,.3)", "borderRadius": "20px", "display": "flex", "alignItems": "center", "justifyContent": "center", "fontSize": "28px", "margin": "0 auto 18px"}}>
            ✅</div>
<div className="h4 mb-8">3. Attend &amp; Verify</div>
<p className="muted">On-site QR scanning for instant check-in. Real-time attendance tracking and reporting.</p>
</div>
</div>
</section>
<section className="l-section" style={{"textAlign": "center", "paddingTop": "80px", "paddingBottom": "80px"}}>
<h2 className="l-heading">Ready to Transform Your Events?</h2>
<p className="l-desc" style={{"margin": "0 auto 32px"}}>Join thousands of organizers and attendees already using EventFlow.
      </p>
<div style={{"display": "flex", "gap": "14px", "justifyContent": "center"}}>
<button className="btn btn-primary btn-lg" onClick={event => legacyEvent("gotoLogin('organizer')", event)}>Start Organizing →</button>
<button className="btn btn-ghost btn-lg" onClick={event => legacyEvent("gotoLogin('attendee')", event)}>Browse Events</button>
</div>
</section>
<footer className="l-footer">
<div>
<span style={{"fontFamily": "var(--font-head)", "fontWeight": "700", "display": "block", "marginBottom": "12px"}}><span className="brand-logo"><span className="brand-logo-art"><img src="/images/eventflow-logo.svg" alt="EventFlow" width="2172" height="724" decoding="async" /></span></span></span>
<div className="small" style={{"color": "var(--text2)", "lineHeight": "1.6", "marginBottom": "8px"}}>
<div>📧 support@eventflow.com</div>
<div>📞 +1 (555) 123-4567</div>
<div>📍 123 Event Boulevard, Chennai, CA 94105</div>
</div>
</div>
<span className="small">© 2026 EventFlow Inc. — Event Registration &amp; Attendee Management Platform</span>
<div style={{"display": "flex", "gap": "16px"}}>
<a className="small" href="#" style={{"color": "var(--text3)"}} onClick={event => legacyEvent("event.preventDefault();showPage('contact');", event)}>Contact Us</a>
<a className="small" href="#" style={{"color": "var(--text3)"}} onClick={event => legacyEvent("event.preventDefault();showPage('about');", event)}>About</a>
<a className="small" href="#" style={{"color": "var(--text3)"}}>Privacy</a>
<a className="small" href="#" style={{"color": "var(--text3)"}}>Terms</a>
</div>
</footer>
</div>

<div id="login">
<div className="login-card">
<div className="login-logo"><span className="brand-logo"><span className="brand-logo-art"><img src="/images/eventflow-logo.svg" alt="EventFlow" width="2172" height="724" decoding="async" /></span></span></div>
<p className="login-sub" id="login-subtitle">Sign in to your dashboard</p>
<div className="login-hint" id="login-hint">📝 Demo credentials available below</div>
<div className="form-group">
<label className="form-label">Email Address</label>
<div className="input-group">
<span className="input-icon">✉️</span>
<input className="form-control" id="l-email" placeholder="you@example.com" type="email" />
</div>
<span className="form-error" id="l-email-err">Enter a valid email address</span>
</div>
<div className="form-group" style={{"marginBottom": "20px"}}>
<label className="form-label">Password</label>
<div className="input-group">
<span className="input-icon">🔒</span>
<input className="form-control" id="l-pass" onKeyDown={event => legacyEvent("if(event.key==='Enter')doLogin()", event)} placeholder="••••••••" type="password" />
</div>
<span className="form-error" id="l-pass-err">Password must be at least 4 characters</span>
</div>
<button className="btn btn-primary btn-lg w-full" onClick={event => legacyEvent("doLogin()", event)}>Sign In →</button>
<div className="divider">Demo Credentials (Click to Auto-Fill)</div>
<div style={{"background": "var(--surface2)", "borderRadius": "10px", "padding": "14px", "marginBottom": "16px", "fontSize": "12.5px", "display": "flex", "flexDirection": "column", "gap": "8px", "maxHeight": "210px", "overflowY": "auto"}}>
<div onClick={event => legacyEvent("fillLogin('staff@example.com', 'Staff@123')", event)} style={{"cursor": "pointer", "display": "flex", "justifyContent": "space-between", "alignItems": "center", "padding": "4px 6px", "borderRadius": "6px", "background": "var(--surface)"}}>
<span><span className="badge badge-green" style={{"marginRight": "4px"}}>Staff</span> <strong>James Wilson:</strong>
            staff@example.com</span>
<span style={{"color": "var(--accent)", "fontFamily": "monospace", "fontSize": "11px"}}>Staff@123</span>
</div>
<div onClick={event => legacyEvent("fillLogin('arjun.events@eventflow.com', 'Employee@123')", event)} style={{"cursor": "pointer", "display": "flex", "justifyContent": "space-between", "alignItems": "center", "padding": "4px 6px", "borderRadius": "6px", "background": "var(--surface)"}}>
<span><span className="badge badge-purple" style={{"marginRight": "4px"}}>Employee</span> <strong>User Executive:</strong> arjun.events@eventflow.com</span>
<span style={{"color": "var(--accent)", "fontFamily": "monospace", "fontSize": "11px"}}>Employee@123</span>
</div>
<div onClick={event => legacyEvent("fillLogin('employee@example.com', 'Employee@123')", event)} style={{"cursor": "pointer", "display": "flex", "justifyContent": "space-between", "alignItems": "center", "padding": "4px 6px", "borderRadius": "6px", "background": "var(--surface)"}}>
<span><span className="badge badge-purple" style={{"marginRight": "4px"}}>Employee</span> <strong>Event Executive:</strong> employee@example.com</span>
<span style={{"color": "var(--accent)", "fontFamily": "monospace", "fontSize": "11px"}}>Employee@123</span>
</div>
<div onClick={event => legacyEvent("fillLogin('marcus.ops@eventflow.com', 'Employee@123')", event)} style={{"cursor": "pointer", "display": "flex", "justifyContent": "space-between", "alignItems": "center", "padding": "4px 6px", "borderRadius": "6px", "background": "var(--surface)"}}>
<span><span className="badge badge-purple" style={{"marginRight": "4px"}}>Employee</span> <strong>Support &amp; Finance:</strong> marcus.ops@eventflow.com</span>
<span style={{"color": "var(--accent)", "fontFamily": "monospace", "fontSize": "11px"}}>Employee@123</span>
</div>
<div onClick={event => legacyEvent("fillLogin('organizer@example.com', 'Organizer@123')", event)} style={{"cursor": "pointer", "display": "flex", "justifyContent": "space-between", "alignItems": "center", "padding": "4px 6px", "borderRadius": "6px", "background": "var(--surface)"}}>
<span><span className="badge badge-purple" style={{"marginRight": "4px"}}>Organizer</span> <strong>Sarah Chen:</strong>
            organizer@example.com</span>
<span style={{"color": "var(--accent)", "fontFamily": "monospace", "fontSize": "11px"}}>Organizer@123</span>
</div>
<div onClick={event => legacyEvent("fillLogin('client@example.com', 'Client@123')", event)} style={{"cursor": "pointer", "display": "flex", "justifyContent": "space-between", "alignItems": "center", "padding": "4px 6px", "borderRadius": "6px", "background": "var(--surface)"}}>
<span><span className="badge badge-yellow" style={{"marginRight": "4px"}}>Client</span> <strong>Michael Torres:</strong>
            client@example.com</span>
<span style={{"color": "var(--accent)", "fontFamily": "monospace", "fontSize": "11px"}}>Client@123</span>
</div>
<div onClick={event => legacyEvent("fillLogin('attendee@example.com', 'Attendee@123')", event)} style={{"cursor": "pointer", "display": "flex", "justifyContent": "space-between", "alignItems": "center", "padding": "4px 6px", "borderRadius": "6px", "background": "var(--surface)"}}>
<span><span className="badge badge-blue" style={{"marginRight": "4px"}}>Attendee</span> <strong>Priya Patel:</strong>
            attendee@example.com</span>
<span style={{"color": "var(--accent)", "fontFamily": "monospace", "fontSize": "11px"}}>Attendee@123</span>
</div>
<div onClick={event => legacyEvent("fillLogin('superadmin@example.com', 'Admin@123')", event)} style={{"cursor": "pointer", "display": "flex", "justifyContent": "space-between", "alignItems": "center", "padding": "4px 6px", "borderRadius": "6px", "background": "var(--surface)"}}>
<span><span className="badge badge-red" style={{"marginRight": "4px"}}>Super Admin</span> <strong>Alex Johnson:</strong> superadmin@example.com</span>
<span style={{"color": "var(--accent)", "fontFamily": "monospace", "fontSize": "11px"}}>Admin@123</span>
</div>
</div>
<p style={{"textAlign": "center", "fontSize": "13px", "color": "var(--text2)"}}>Don't have an account? <a href="#" onClick={event => legacyEvent("openRegisterModal()", event)} style={{"color": "var(--accent)"}}>Create one</a></p>
<p style={{"textAlign": "center", "fontSize": "13px", "color": "var(--text2)", "marginTop": "12px"}}><a href="#" style={{"color": "var(--text2)"}} onClick={event => legacyEvent("event.preventDefault();showPage('landing');", event)}>← Back to Home</a></p>
</div>
</div>

<div id="find-events" style={{"background": "var(--bg)", "minHeight": "100vh", "padding": "80px 20px 20px", "display": "none"}}>
<nav className="l-nav" style={{"zIndex": "300"}}>
<span className="l-nav-logo"><span className="brand-logo"><span className="brand-logo-art"><img src="/images/eventflow-logo.svg" alt="EventFlow" width="2172" height="724" decoding="async" /></span></span></span>
<div className="l-nav-links">
<a href="#" style={{"color": "var(--accent)"}} onClick={event => legacyEvent("event.preventDefault();showPage('landing');", event)}>← Home</a>
<a href="#" onClick={event => legacyEvent("event.preventDefault();showPage('find-events');", event)}>Find Events</a>
<a href="#" onClick={event => legacyEvent("event.preventDefault();showPage('gallery');", event)}>Gallery</a>
<a href="#" onClick={event => legacyEvent("event.preventDefault();showPage('about');", event)}>About Us</a>
<a href="#" onClick={event => legacyEvent("event.preventDefault();showPage('contact');", event)}>Contact</a>
</div>
<div className="l-nav-actions">
<button className="btn btn-ghost btn-sm" onClick={event => legacyEvent("gotoLogin('attendee')", event)}>Sign In</button>
</div>
</nav>
<div style={{"maxWidth": "1200px", "margin": "0 auto"}}>
<div style={{"marginBottom": "40px"}}>
<a href="#" style={{"color": "var(--text2)", "fontSize": "13px"}} onClick={event => legacyEvent("event.preventDefault();showPage('landing');", event)}>← Back to Home</a>
<h1 className="h1" style={{"marginTop": "12px"}}>Explore Events</h1>
<p className="muted">Discover upcoming events and register for ones that interest you.</p>
</div>

<style>
        .fe-grid {'{'}
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 22px;
        {'}'}

        .fe-card {'{'}
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          overflow: hidden;
          transition: transform .2s, box-shadow .2s;
          cursor: pointer;
          display: flex;
          flex-direction: column;
        {'}'}

        .fe-card:hover {'{'}
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.18);
        {'}'}

        .fe-card-img {'{'}
          position: relative;
          height: 160px;
          overflow: hidden;
          background: var(--surface2);
          flex-shrink: 0;
        {'}'}

        .fe-card-img img {'{'}
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform .3s;
        {'}'}

        .fe-card:hover .fe-card-img img {'{'}
          transform: scale(1.06);
        {'}'}

        .fe-card-img-fallback {'{'}
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 52px;
        {'}'}

        .fe-card-img-overlay {'{'}
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(0, 0, 0, 0.55) 0%, transparent 55%);
        {'}'}

        .fe-card-price {'{'}
          position: absolute;
          top: 10px;
          right: 10px;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(6px);
          color: #fff;
          font-weight: 700;
          font-size: 12px;
          padding: 3px 10px;
          border-radius: 20px;
        {'}'}

        .fe-card-body {'{'}
          padding: 16px;
          flex: 1;
          display: flex;
          flex-direction: column;
        {'}'}

        .fe-card-title {'{'}
          font-weight: 700;
          font-size: 15px;
          margin-bottom: 4px;
          line-height: 1.3;
        {'}'}

        .fe-card-meta {'{'}
          font-size: 12px;
          color: var(--text2);
          margin-bottom: 8px;
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        {'}'}

        .fe-card-desc {'{'}
          font-size: 12.5px;
          color: var(--text2);
          line-height: 1.55;
          flex: 1;
          margin-bottom: 12px;
        {'}'}

        .fe-card-actions {'{'}
          display: flex;
          gap: 8px;
          margin-top: auto;
        {'}'}
      </style>
<div className="fe-grid">

<div className="fe-card">
<div className="fe-card-img">
<img alt="Tech Innovation Summit 2026" onError={event => legacyEvent("this.style.display='none';this.nextElementSibling.style.display='flex'", event)} src="/images/events/event-tech-summit.jpg" />
<div className="fe-card-img-fallback" style={{"display": "none"}}>💻</div>
<div className="fe-card-img-overlay"></div>
<span className="fe-card-price">₹150</span>
</div>
<div className="fe-card-body">
<div className="fe-card-title">Tech Innovation Summit 2026</div>
<div className="fe-card-meta"><span>📅 2026-04-15</span><span>📍 Bangalore</span></div>
<p className="fe-card-desc">Annual technology conference featuring keynotes from industry leaders and live
              demos.</p>
<div className="fe-card-actions">
<button className="btn btn-ghost btn-xs w-full" onClick={event => legacyEvent("viewPublicEventDetails(1)", event)}>👁️ Details</button>
<button className="btn btn-primary btn-xs w-full" onClick={event => legacyEvent("gotoLogin('attendee')", event)}>Register</button>
</div>
</div>
</div>

<div className="fe-card">
<div className="fe-card-img">
<img alt="Corporate Annual Gala 2026" onError={event => legacyEvent("this.style.display='none';this.nextElementSibling.style.display='flex'", event)} src="/images/events/event-annual-gala.jpg" />
<div className="fe-card-img-fallback" style={{"display": "none"}}>🥂</div>
<div className="fe-card-img-overlay"></div>
<span className="fe-card-price">₹250</span>
</div>
<div className="fe-card-body">
<div className="fe-card-title">Corporate Annual Gala 2026</div>
<div className="fe-card-meta"><span>📅 2026-04-22</span><span>📍 Delhi</span></div>
<p className="fe-card-desc">Exclusive annual corporate dinner and awards ceremony for top performers.</p>
<div className="fe-card-actions">
<button className="btn btn-ghost btn-xs w-full" onClick={event => legacyEvent("viewPublicEventDetails(2)", event)}>👁️ Details</button>
<button className="btn btn-primary btn-xs w-full" onClick={event => legacyEvent("gotoLogin('attendee')", event)}>Register</button>
</div>
</div>
</div>

<div className="fe-card">
<div className="fe-card-img">
<img alt="Spring Music Festival" onError={event => legacyEvent("this.style.display='none';this.nextElementSibling.style.display='flex'", event)} src="/images/events/event-music-fest.jpg" />
<div className="fe-card-img-fallback" style={{"display": "none"}}>🎵</div>
<div className="fe-card-img-overlay"></div>
<span className="fe-card-price">₹75</span>
</div>
<div className="fe-card-body">
<div className="fe-card-title">Spring Music Festival</div>
<div className="fe-card-meta"><span>📅 2026-05-01</span><span>📍 Pune</span></div>
<p className="fe-card-desc">Outdoor music festival featuring 15+ artists across multiple genres.</p>
<div className="fe-card-actions">
<button className="btn btn-ghost btn-xs w-full" onClick={event => legacyEvent("viewPublicEventDetails(3)", event)}>👁️ Details</button>
<button className="btn btn-primary btn-xs w-full" onClick={event => legacyEvent("gotoLogin('attendee')", event)}>Register</button>
</div>
</div>
</div>

<div className="fe-card">
<div className="fe-card-img">
<img alt="Digital Marketing Workshop" onError={event => legacyEvent("this.style.display='none';this.nextElementSibling.style.display='flex'", event)} src="/images/events/event-marketing-workshop.jpg" />
<div className="fe-card-img-fallback" style={{"display": "none"}}>📱</div>
<div className="fe-card-img-overlay"></div>
<span className="fe-card-price">₹80</span>
</div>
<div className="fe-card-body">
<div className="fe-card-title">Digital Marketing Workshop</div>
<div className="fe-card-meta"><span>📅 2026-05-10</span><span>📍 Hyderabad</span></div>
<p className="fe-card-desc">Hands-on full-day workshop on modern digital marketing strategies and tools.</p>
<div className="fe-card-actions">
<button className="btn btn-ghost btn-xs w-full" onClick={event => legacyEvent("viewPublicEventDetails(4)", event)}>👁️ Details</button>
<button className="btn btn-primary btn-xs w-full" onClick={event => legacyEvent("gotoLogin('attendee')", event)}>Register</button>
</div>
</div>
</div>

<div className="fe-card">
<div className="fe-card-img">
<img alt="Startup Pitch Night" onError={event => legacyEvent("this.style.display='none';this.nextElementSibling.style.display='flex'", event)} src="/images/events/event-pitch-night.jpg" />
<div className="fe-card-img-fallback" style={{"display": "none"}}>🚀</div>
<div className="fe-card-img-overlay"></div>
<span className="fe-card-price">FREE</span>
</div>
<div className="fe-card-body">
<div className="fe-card-title">Startup Pitch Night</div>
<div className="fe-card-meta"><span>📅 2026-05-15</span><span>📍 Chennai</span></div>
<p className="fe-card-desc">Monthly startup pitch competition with VC judges and networking opportunities.</p>
<div className="fe-card-actions">
<button className="btn btn-ghost btn-xs w-full" onClick={event => legacyEvent("viewPublicEventDetails(5)", event)}>👁️ Details</button>
<button className="btn btn-primary btn-xs w-full" onClick={event => legacyEvent("gotoLogin('attendee')", event)}>Register</button>
</div>
</div>
</div>

<div className="fe-card">
<div className="fe-card-img">
<img alt="Photography Masterclass" onError={event => legacyEvent("this.style.display='none';this.nextElementSibling.style.display='flex'", event)} src="/images/events/event-photography.jpg" />
<div className="fe-card-img-fallback" style={{"display": "none"}}>📷</div>
<div className="fe-card-img-overlay"></div>
<span className="fe-card-price">₹120</span>
</div>
<div className="fe-card-body">
<div className="fe-card-title">Photography Masterclass</div>
<div className="fe-card-meta"><span>📅 2026-06-01</span><span>📍 Pune</span><span className="badge badge-green" style={{"fontSize": "10px"}}>12/30 spots</span></div>
<p className="fe-card-desc">Hands-on photography workshop for intermediate photographers with pro mentors.</p>
<div className="fe-card-actions">
<button className="btn btn-ghost btn-xs w-full" onClick={event => legacyEvent("viewPublicEventDetails(7)", event)}>👁️ Details</button>
<button className="btn btn-primary btn-xs w-full" onClick={event => legacyEvent("gotoLogin('attendee')", event)}>Register</button>
</div>
</div>
</div>
</div>
</div>
</div>

<div id="gallery" style={{"background": "var(--bg)", "minHeight": "100vh", "padding": "60px 20px", "display": "none"}}>
<nav className="l-nav" style={{"zIndex": "300"}}>
<span className="l-nav-logo"><span className="brand-logo"><span className="brand-logo-art"><img src="/images/eventflow-logo.svg" alt="EventFlow" width="2172" height="724" decoding="async" /></span></span></span>
<div className="l-nav-links">
<a href="#" style={{"color": "var(--accent)"}} onClick={event => legacyEvent("event.preventDefault();showPage('landing');", event)}>← Home</a>
<a href="#" onClick={event => legacyEvent("event.preventDefault();showPage('find-events');", event)}>Find Events</a>
<a href="#" onClick={event => legacyEvent("event.preventDefault();showPage('gallery');", event)}>Gallery</a>
<a href="#" onClick={event => legacyEvent("event.preventDefault();showPage('about');", event)}>About Us</a>
<a href="#" onClick={event => legacyEvent("event.preventDefault();showPage('contact');", event)}>Contact</a>
</div>
<div className="l-nav-actions">
<button className="btn btn-ghost btn-sm" onClick={event => legacyEvent("gotoLogin('attendee')", event)}>Sign In</button>
</div>
</nav>
<div className="l-container" style={{"maxWidth": "1200px", "margin": "0 auto"}}>
<div style={{"marginBottom": "40px"}}>
<a href="#" style={{"color": "var(--text2)", "fontSize": "13px"}} onClick={event => legacyEvent("event.preventDefault();showPage('landing');", event)}>← Back to Home</a>
<h1 className="h1" style={{"marginTop": "12px"}}>Event Gallery</h1>
<p className="muted">Showcase of our successful events and happy attendees.</p>
</div>
<style>
        .gallery-grid {'{'}
          columns: 3;
          column-gap: 16px;
        {'}'}

        @media(max-width:900px) {'{'}
          .gallery-grid {'{'}
            columns: 2;
          {'}'}
        {'}'}

        @media(max-width:560px) {'{'}
          .gallery-grid {'{'}
            columns: 1;
          {'}'}
        {'}'}

        .gallery-item {'{'}
          break-inside: avoid;
          margin-bottom: 16px;
          border-radius: 14px;
          overflow: hidden;
          position: relative;
          cursor: pointer;
          display: block;
        {'}'}

        .gallery-item img {'{'}
          width: 100%;
          display: block;
          transition: transform .35s;
        {'}'}

        .gallery-item:hover img {'{'}
          transform: scale(1.05);
        {'}'}

        .gallery-item-overlay {'{'}
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(0, 0, 0, 0.65) 0%, transparent 50%);
          opacity: 0;
          transition: opacity .3s;
          display: flex;
          align-items: flex-end;
          padding: 14px;
        {'}'}

        .gallery-item:hover .gallery-item-overlay {'{'}
          opacity: 1;
        {'}'}

        .gallery-item-label {'{'}
          color: #fff;
          font-weight: 600;
          font-size: 13px;
          line-height: 1.3;
        {'}'}
      </style>
<div className="gallery-grid">
<div className="gallery-item">
<img alt="Tech Innovation Summit" onError={event => legacyEvent("this.parentElement.style.background='var(--surface2)';this.style.display='none'", event)} src="/images/events/event-tech-summit.jpg" />
<div className="gallery-item-overlay">
<div className="gallery-item-label">Tech Innovation Summit 2026</div>
</div>
</div>
<div className="gallery-item">
<img alt="Spring Music Festival" onError={event => legacyEvent("this.parentElement.style.background='var(--surface2)';this.style.display='none'", event)} src="/images/events/event-music-fest.jpg" />
<div className="gallery-item-overlay">
<div className="gallery-item-label">Spring Music Festival</div>
</div>
</div>
<div className="gallery-item">
<img alt="Corporate Annual Gala" onError={event => legacyEvent("this.parentElement.style.background='var(--surface2)';this.style.display='none'", event)} src="/images/events/event-annual-gala.jpg" />
<div className="gallery-item-overlay">
<div className="gallery-item-label">Corporate Annual Gala 2026</div>
</div>
</div>
<div className="gallery-item">
<img alt="Hackathon" onError={event => legacyEvent("this.parentElement.style.background='var(--surface2)';this.style.display='none'", event)} src="/images/events/event-hackathon.jpg" />
<div className="gallery-item-overlay">
<div className="gallery-item-label">DevSprint Hackathon</div>
</div>
</div>
<div className="gallery-item">
<img alt="Photography Masterclass" onError={event => legacyEvent("this.parentElement.style.background='var(--surface2)';this.style.display='none'", event)} src="/images/events/event-photography.jpg" />
<div className="gallery-item-overlay">
<div className="gallery-item-label">Photography Masterclass</div>
</div>
</div>
<div className="gallery-item">
<img alt="FinTech Summit" onError={event => legacyEvent("this.parentElement.style.background='var(--surface2)';this.style.display='none'", event)} src="/images/events/event-fintech.jpg" />
<div className="gallery-item-overlay">
<div className="gallery-item-label">FinTech Innovation Summit</div>
</div>
</div>
<div className="gallery-item">
<img alt="Startup Pitch Night" onError={event => legacyEvent("this.parentElement.style.background='var(--surface2)';this.style.display='none'", event)} src="/images/events/event-pitch-night.jpg" />
<div className="gallery-item-overlay">
<div className="gallery-item-label">Startup Pitch Night</div>
</div>
</div>
<div className="gallery-item">
<img alt="Digital Marketing Workshop" onError={event => legacyEvent("this.parentElement.style.background='var(--surface2)';this.style.display='none'", event)} src="/images/events/event-marketing-workshop.jpg" />
<div className="gallery-item-overlay">
<div className="gallery-item-label">Digital Marketing Workshop</div>
</div>
</div>
<div className="gallery-item">
<img alt="AI Summit" onError={event => legacyEvent("this.parentElement.style.background='var(--surface2)';this.style.display='none'", event)} src="/images/events/event-ai-summit.jpg" />
<div className="gallery-item-overlay">
<div className="gallery-item-label">AI &amp; Machine Learning Summit</div>
</div>
</div>
<div className="gallery-item">
<img alt="Wedding Gala" onError={event => legacyEvent("this.parentElement.style.background='var(--surface2)';this.style.display='none'", event)} src="/images/events/event-wedding.jpg" />
<div className="gallery-item-overlay">
<div className="gallery-item-label">Grand Wedding Celebration</div>
</div>
</div>
<div className="gallery-item">
<img alt="Healthcare Forum" onError={event => legacyEvent("this.parentElement.style.background='var(--surface2)';this.style.display='none'", event)} src="/images/events/event-healthcare-forum.jpg" />
<div className="gallery-item-overlay">
<div className="gallery-item-label">Healthcare Innovation Forum</div>
</div>
</div>
<div className="gallery-item">
<img alt="Cybersecurity Conference" onError={event => legacyEvent("this.parentElement.style.background='var(--surface2)';this.style.display='none'", event)} src="/images/events/event-cybersecurity.jpg" />
<div className="gallery-item-overlay">
<div className="gallery-item-label">Cybersecurity Conference</div>
</div>
</div>
</div>
</div>
</div>

<div id="about" style={{"background": "var(--bg)", "minHeight": "100vh", "padding": "60px 20px", "display": "none"}}>
<nav className="l-nav" style={{"zIndex": "300"}}>
<span className="l-nav-logo"><span className="brand-logo"><span className="brand-logo-art"><img src="/images/eventflow-logo.svg" alt="EventFlow" width="2172" height="724" decoding="async" /></span></span></span>
<div className="l-nav-links">
<a href="#" style={{"color": "var(--accent)"}} onClick={event => legacyEvent("event.preventDefault();showPage('landing');", event)}>← Home</a>
<a href="#" onClick={event => legacyEvent("event.preventDefault();showPage('find-events');", event)}>Find Events</a>
<a href="#" onClick={event => legacyEvent("event.preventDefault();showPage('gallery');", event)}>Gallery</a>
<a href="#" onClick={event => legacyEvent("event.preventDefault();showPage('about');", event)}>About Us</a>
<a href="#" onClick={event => legacyEvent("event.preventDefault();showPage('contact');", event)}>Contact</a>
</div>
<div className="l-nav-actions">
<button className="btn btn-ghost btn-sm" onClick={event => legacyEvent("gotoLogin('attendee')", event)}>Sign In</button>
</div>
</nav>
<div className="l-container" style={{"maxWidth": "800px", "margin": "0 auto"}}>
<div style={{"marginBottom": "40px"}}>
<a href="#" style={{"color": "var(--text2)", "fontSize": "13px"}} onClick={event => legacyEvent("event.preventDefault();showPage('landing');", event)}>← Back to Home</a>
<h1 className="h1" style={{"marginTop": "12px"}}>About EventFlow</h1>
</div>
<div style={{"background": "var(--surface2)", "borderRadius": "12px", "padding": "24px", "lineHeight": "1.8", "color": "var(--text2)"}}>
<p style={{"marginBottom": "16px"}}>EventFlow is a comprehensive event management and attendee registration platform
          designed to simplify every aspect of event planning and execution.</p>
<p style={{"marginBottom": "16px"}}><strong style={{"color": "var(--text)"}}>Our Mission:</strong> To empower event
          organizers, clients, and attendees with intelligent tools that make event management seamless, secure, and
          delightful.</p>
<p style={{"marginBottom": "16px"}}><strong style={{"color": "var(--text)"}}>What We Offer:</strong></p>
<ul style={{"marginLeft": "20px", "marginBottom": "16px"}}>
<li style={{"marginBottom": "8px"}}>✨ Smart registration with instant QR ticket generation</li>
<li style={{"marginBottom": "8px"}}>🎯 Staff coordination and assignment management</li>
<li style={{"marginBottom": "8px"}}>✅ Live verification and on-site check-in</li>
<li style={{"marginBottom": "8px"}}>💰 Secure payment processing</li>
<li style={{"marginBottom": "8px"}}>📊 Real-time analytics and reporting</li>
</ul>
<p><strong style={{"color": "var(--text)"}}>Founded in 2026</strong>, EventFlow has grown to manage 2,400+ events with
          98,000+ attendees and 500+ organizers worldwide.</p>
</div>
</div>
</div>

<div id="contact" style={{"background": "var(--bg)", "minHeight": "100vh", "padding": "60px 20px", "display": "none"}}>
<nav className="l-nav" style={{"zIndex": "300"}}>
<span className="l-nav-logo"><span className="brand-logo"><span className="brand-logo-art"><img src="/images/eventflow-logo.svg" alt="EventFlow" width="2172" height="724" decoding="async" /></span></span></span>
<div className="l-nav-links">
<a href="#" style={{"color": "var(--accent)"}} onClick={event => legacyEvent("event.preventDefault();showPage('landing');", event)}>← Home</a>
<a href="#" onClick={event => legacyEvent("event.preventDefault();showPage('find-events');", event)}>Find Events</a>
<a href="#" onClick={event => legacyEvent("event.preventDefault();showPage('gallery');", event)}>Gallery</a>
<a href="#" onClick={event => legacyEvent("event.preventDefault();showPage('about');", event)}>About Us</a>
<a href="#" onClick={event => legacyEvent("event.preventDefault();showPage('contact');", event)}>Contact</a>
</div>
<div className="l-nav-actions">
<button className="btn btn-ghost btn-sm" onClick={event => legacyEvent("gotoLogin('attendee')", event)}>Sign In</button>
</div>
</nav>
<div className="l-container" style={{"maxWidth": "800px", "margin": "0 auto"}}>
<div style={{"marginBottom": "40px"}}>
<a href="#" style={{"color": "var(--text2)", "fontSize": "13px"}} onClick={event => legacyEvent("event.preventDefault();showPage('landing');", event)}>← Back to Home</a>
<h1 className="h1" style={{"marginTop": "12px"}}>Contact Us</h1>
</div>
<div style={{"display": "grid", "gridTemplateColumns": "1fr 1fr", "gap": "20px", "marginBottom": "40px"}}>
<div style={{"background": "var(--surface2)", "borderRadius": "12px", "padding": "24px"}}>
<div style={{"fontSize": "28px", "marginBottom": "12px"}}>📧</div>
<div style={{"fontWeight": "700", "marginBottom": "4px"}}>Email</div>
<p style={{"color": "var(--text2)", "fontSize": "13px"}}>support@eventflow.com</p>
</div>
<div style={{"background": "var(--surface2)", "borderRadius": "12px", "padding": "24px"}}>
<div style={{"fontSize": "28px", "marginBottom": "12px"}}>📞</div>
<div style={{"fontWeight": "700", "marginBottom": "4px"}}>Phone</div>
<p style={{"color": "var(--text2)", "fontSize": "13px"}}>+1 (555) 123-4567</p>
</div>
<div style={{"background": "var(--surface2)", "borderRadius": "12px", "padding": "24px"}}>
<div style={{"fontSize": "28px", "marginBottom": "12px"}}>📍</div>
<div style={{"fontWeight": "700", "marginBottom": "4px"}}>Address</div>
<p style={{"color": "var(--text2)", "fontSize": "13px"}}>123 Event Boulevard, Chennai, CA 94105</p>
</div>
<div style={{"background": "var(--surface2)", "borderRadius": "12px", "padding": "24px"}}>
<div style={{"fontSize": "28px", "marginBottom": "12px"}}>🕐</div>
<div style={{"fontWeight": "700", "marginBottom": "4px"}}>Hours</div>
<p style={{"color": "var(--text2)", "fontSize": "13px"}}>Mon-Fri: 9AM - 6PM PT</p>
</div>
</div>
<div style={{"background": "var(--surface2)", "borderRadius": "12px", "padding": "24px"}}>
<div style={{"fontWeight": "700", "marginBottom": "16px"}}>Send us a message</div>
<div className="form-group">
<label className="form-label">Name</label>
<input className="form-control" id="contact-name" placeholder="Your name" />
</div>
<div className="form-group">
<label className="form-label">Email</label>
<input className="form-control" id="contact-email" placeholder="your@email.com" type="email" />
</div>
<div className="form-group">
<label className="form-label">Message</label>
<textarea className="form-control" id="contact-message" placeholder="Your message…" style={{"minHeight": "100px"}}></textarea>
</div>
<button className="btn btn-primary btn-lg w-full" onClick={event => legacyEvent("sendContactMessage()", event)}>Send Message</button>
</div>
</div>
</div>

<div id="app">
<div className="app-shell">

<aside className="sidebar">
<div className="sb-logo">
<div className="sb-logo-mark"><span className="brand-logo"><span className="brand-logo-art"><img src="/images/eventflow-logo.svg" alt="EventFlow" width="2172" height="724" decoding="async" /></span></span></div>
</div>
<nav className="sb-nav" id="sb-nav"></nav>
<div className="sb-bottom">
<div className="sb-user" onClick={event => legacyEvent("goNav('settings')", event)}>
<div className="av" id="sb-av">?</div>
<div className="sb-user-info">
<div className="sb-user-name" id="sb-name">User</div>
<div className="sb-user-role" id="sb-role-lbl">Role</div>
</div>
<span style={{"color": "var(--text3)", "fontSize": "12px"}}>⚙</span>
</div>
</div>
</aside>

<div className="main">
<div className="topbar">
<div className="topbar-title" id="topbar-title">User</div>
<div className="topbar-right">
<button className="notif-trigger" onClick={event => legacyEvent("goNav('notifications')", event)}>🔔<span className="notif-badge" id="notif-count-dot"></span></button>
<button className="btn btn-ghost btn-sm" onClick={event => legacyEvent("doLogout()", event)}>Sign Out</button>
</div>
</div>
<div className="page" id="page-content"></div>
</div>
</div>
</div>

<div className="overlay" id="modal-overlay" onClick={event => legacyEvent("closeModalOnBg(event)", event)}>
<div className="modal-box" id="modal-box">
<div className="modal-head">
<span className="modal-title" id="modal-title"></span>
<button className="modal-close-btn" onClick={event => legacyEvent("closeModal()", event)}>✕</button>
</div>
<div className="modal-body" id="modal-body"></div>
<div className="modal-foot" id="modal-foot"></div>
</div>
</div>

<div className="overlay" id="confirm-overlay" onClick={event => legacyEvent("closeConfirmOnBg(event)", event)}>
<div className="modal-box" style={{"maxWidth": "360px"}}>
<div className="modal-head">
<span className="modal-title" id="confirm-title">Confirm Action</span>
<button className="modal-close-btn" onClick={event => legacyEvent("closeConfirm()", event)}>✕</button>
</div>
<div className="modal-body">
<p id="confirm-msg" style={{"color": "var(--text2)", "fontSize": "13.5px", "lineHeight": "1.6"}}></p>
</div>
<div className="modal-foot">
<button className="btn btn-ghost" onClick={event => legacyEvent("closeConfirm()", event)}>Cancel</button>
<button className="btn btn-danger" id="confirm-ok" onClick={event => legacyEvent("runConfirm()", event)}>Confirm</button>
</div>
</div>
</div>

<div className="drawer-overlay" id="drawer-overlay" onClick={event => legacyEvent("closeDrawer()", event)}></div>

<div className="drawer" id="drawer">
<div className="drawer-head">
<span className="h4" id="drawer-title">Details</span>
<button className="modal-close-btn" onClick={event => legacyEvent("closeDrawer()", event)}>✕</button>
</div>
<div className="drawer-body" id="drawer-body"></div>
</div>

<div id="toasts"></div>

  
  
  
  
  

<LegacyRuntime source={source} role="staff" />
</>;
}
