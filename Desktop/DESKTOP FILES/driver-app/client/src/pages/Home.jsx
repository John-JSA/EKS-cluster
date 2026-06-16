import { Link } from 'react-router-dom';
import { Car, Users, DollarSign, Shield, Clock, Star } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-green-600 via-green-500 to-emerald-400 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur px-4 py-2 rounded-full text-sm font-medium mb-6">
            <DollarSign size={14} /> 100% Free for passengers — always
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Rides for Everyone.<br />
            <span className="text-green-200">Completely Free.</span>
          </h1>
          <p className="text-xl text-green-100 mb-10 max-w-2xl mx-auto">
            DriveFree connects passengers with drivers at zero cost. No surge pricing, no hidden fees, no tricks — just community-powered transportation.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/passenger/register" className="bg-white text-green-600 font-bold py-4 px-8 rounded-2xl hover:bg-green-50 transition-all text-lg shadow-lg">
              Get a Free Ride
            </Link>
            <Link to="/driver/register" className="bg-green-700 text-white font-bold py-4 px-8 rounded-2xl hover:bg-green-800 transition-all text-lg border-2 border-white/30">
              Become a Driver
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 grid grid-cols-3 gap-8 text-center">
          {[
            { value: '$0', label: 'Cost to passengers' },
            { value: '24/7', label: 'Service availability' },
            { value: '100%', label: 'Community driven' },
          ].map(s => (
            <div key={s.label}>
              <div className="text-3xl font-bold text-green-500">{s.value}</div>
              <div className="text-gray-500 text-sm mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-3">How DriveFree Works</h2>
          <p className="text-center text-gray-500 mb-12">Simple, fast, and completely free</p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Users, title: 'Sign Up Free', desc: 'Create your passenger account in under a minute. No credit card needed — ever.', color: 'bg-blue-100 text-blue-600' },
              { icon: Car, title: 'Request a Ride', desc: 'Enter your pickup and drop-off location. Nearby drivers get notified instantly.', color: 'bg-green-100 text-green-600' },
              { icon: Star, title: 'Ride & Rate', desc: 'Your driver arrives and takes you to your destination. Rate your experience.', color: 'bg-yellow-100 text-yellow-600' },
            ].map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="card text-center">
                <div className={`${color} w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                  <Icon size={24} />
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why free */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why is it free?</h2>
            <p className="text-gray-600 mb-6 leading-relaxed">
              We believe transportation is a basic need. DriveFree is built on the principle that everyone deserves to get where they're going — regardless of their financial situation.
            </p>
            <ul className="space-y-3">
              {[
                { icon: Shield, text: 'No commission taken from drivers' },
                { icon: DollarSign, text: 'Zero fare charged to passengers' },
                { icon: Clock, text: 'No surge pricing ever' },
                { icon: Star, text: 'Community-verified drivers' },
              ].map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3 text-gray-700">
                  <div className="bg-green-100 rounded-lg p-1.5">
                    <Icon size={14} className="text-green-600" />
                  </div>
                  {text}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-3xl p-8 text-center">
            <div className="text-6xl font-black text-green-500 mb-2">$0.00</div>
            <div className="text-gray-600 font-medium">Every ride. Every time.</div>
            <div className="mt-6 space-y-2 text-sm text-gray-500">
              <div className="flex justify-between border-b border-green-200 pb-2"><span>Booking fee</span><span className="text-green-600 font-bold">FREE</span></div>
              <div className="flex justify-between border-b border-green-200 pb-2"><span>Surge pricing</span><span className="text-green-600 font-bold">NONE</span></div>
              <div className="flex justify-between"><span>Cancellation fee</span><span className="text-green-600 font-bold">FREE</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* Driver CTA */}
      <section className="py-16 px-4 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Drive with DriveFree</h2>
          <p className="text-gray-400 mb-8 max-w-xl mx-auto">
            Join our network of community drivers. Set your own hours, help people in your area, and be part of something meaningful.
          </p>
          <Link to="/driver/register" className="inline-block bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-10 rounded-2xl text-lg transition-all">
            Register as a Driver
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-100 py-8 px-4 text-center text-sm text-gray-400">
        <p>&copy; 2024 DriveFree. Rides for the community, by the community.</p>
      </footer>
    </div>
  );
}
