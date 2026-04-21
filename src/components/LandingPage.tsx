import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Shield, Zap, Globe, Star } from 'lucide-react';
import { Link } from 'react-router-dom';

export const LandingPage = () => {
  return (
    <div className="relative overflow-hidden">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 px-4">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand/20 blur-[120px] rounded-full" />
          <div className="absolute bottom-[10%] right-[-10%] w-[30%] h-[30%] bg-blue-500/10 blur-[120px] rounded-full" />
        </div>

        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-brand/10 text-brand text-xs font-bold uppercase tracking-widest mb-6 border border-brand/20">
              The Future of Digital Services
            </span>
            <h1 className="text-5xl md:text-7xl font-display font-bold tracking-tight mb-8 leading-[1.1]">
              Scale Your Creative <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand to-orange-400">
                Business Faster
              </span>
            </h1>
            <p className="text-text-secondary text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed">
              Connect with top-tier talent or sell your specialized services on the world's most modern marketplace. Built for creators, by creators.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/marketplace"
                className="w-full sm:w-auto bg-brand hover:bg-brand-hover text-white px-8 py-4 rounded-full font-bold text-lg transition-all flex items-center justify-center gap-2 group shadow-xl shadow-brand/20"
              >
                Explore Marketplace
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/sell"
                className="w-full sm:w-auto glass hover:bg-white/10 text-white px-8 py-4 rounded-full font-bold text-lg transition-all"
              >
                Become a Seller
              </Link>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-8 border-y border-border-subtle py-12"
          >
            {[
              { label: 'Active Users', value: '50K+' },
              { label: 'Services Sold', value: '120K+' },
              { label: 'Total Payouts', value: '$12M+' },
              { label: 'Avg. Rating', value: '4.9/5' },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-3xl font-display font-bold mb-1">{stat.value}</div>
                <div className="text-text-muted text-sm uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32 bg-bg-surface relative">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-display font-bold mb-6">Built for Excellence</h2>
            <p className="text-text-secondary max-w-2xl mx-auto">
              We've reimagined the marketplace experience with a focus on speed, security, and seamless collaboration.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Shield className="w-8 h-8 text-brand" />,
                title: 'Secure Payments',
                desc: 'Escrow-protected transactions ensure both buyers and sellers are protected throughout the process.'
              },
              {
                icon: <Zap className="w-8 h-8 text-brand" />,
                title: 'Instant Delivery',
                desc: 'Automated delivery systems for digital assets and streamlined workflows for custom services.'
              },
              {
                icon: <Globe className="w-8 h-8 text-brand" />,
                title: 'Global Reach',
                desc: 'Connect with clients and talent from all over the world with localized payment support.'
              }
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="p-8 rounded-3xl bg-bg-elevated border border-border-subtle hover:border-brand/30 transition-all group"
              >
                <div className="mb-6 p-4 rounded-2xl bg-brand/5 w-fit group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-4">{feature.title}</h3>
                <p className="text-text-secondary leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-4">
        <div className="max-w-5xl mx-auto rounded-[3rem] bg-gradient-to-br from-brand to-orange-600 p-12 md:p-20 text-center relative overflow-hidden shadow-2xl shadow-brand/30">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
          <div className="relative z-10">
            <h2 className="text-4xl md:text-6xl font-display font-bold text-white mb-8">Ready to get started?</h2>
            <p className="text-white/80 text-lg mb-12 max-w-xl mx-auto">
              Join thousands of creators who are already scaling their businesses on Indiy.
            </p>
            <Link
              to="/register"
              className="inline-block bg-white text-brand px-10 py-4 rounded-full font-bold text-lg hover:bg-gray-100 transition-all shadow-xl"
            >
              Create Your Account
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
