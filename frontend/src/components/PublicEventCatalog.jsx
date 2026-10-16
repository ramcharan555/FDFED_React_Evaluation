import { useEffect, useState } from 'react';

export default function PublicEventCatalog() {
  const [events, setEvents] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  useEffect(() => {
    let active = true;
    async function refresh() {
      try {
        const response = await fetch('http://localhost:3001/api/public/events');
        if (!response.ok) throw new Error('Events could not be loaded. Please try again.');
        const result = await response.json();
        if (active) { setEvents((result.data ?? result).filter(event => new Date(`${event.date}T23:59:59`) >= new Date())); setError(''); }
      } catch (error) { if (active) setError(error.message); }
      finally { if (active) setLoading(false); }
    }
    refresh();
    const interval = setInterval(refresh, 15000);
    window.addEventListener('focus', refresh);
    return () => { active = false; clearInterval(interval); window.removeEventListener('focus', refresh); };
  }, []);
  return <>
    <input className="form-control mb-20" type="search" aria-label="Search events" placeholder="Search events by name, city, or category…" value={query} onChange={event => setQuery(event.target.value)} />
    {loading && <p role="status">Loading events…</p>}
    {error && <p role="status">{error}</p>}
    <div className="fe-grid">
      {events.filter(event => `${event.name} ${event.city} ${event.location} ${event.category}`.toLowerCase().includes(query.toLowerCase())).map(event => <article className="fe-card" key={event.eventId}>
        <div className="fe-card-img"><div className="fe-card-img-fallback" style={{ display: 'flex' }}>📅</div><span className="fe-card-price">{event.ticketPrice ? `₹${event.ticketPrice.toLocaleString('en-IN')}` : 'Free'}</span></div>
        <div className="fe-card-body">
          <div className="fe-card-title">{event.name}</div>
          <div className="fe-card-meta"><span>📅 {event.date}</span><span>📍 {event.city || event.location}</span></div>
          <p className="fe-card-desc">{event.description}</p>
          <p className="small muted">{event.registered} / {event.capacity} places booked · {event.category}</p>
          <div className="fe-card-actions"><button className="btn btn-ghost btn-xs w-full" onClick={() => window.openModal(event.name, `<p>${String(event.description || '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char])}</p>`, [{ lbl: 'Close', cls: 'btn-ghost', fn: 'closeModal()' }])}>Details</button><button className="btn btn-primary btn-xs w-full" onClick={() => window.gotoLogin('attendee')}>Register</button></div>
        </div>
      </article>)}
    </div>
    {!loading && !error && !events.length && <p>No upcoming events are available.</p>}
  </>;
}
