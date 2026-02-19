import { Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { ArrowRight, BarChart3, Shield, Zap, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import heroBg from "@/assets/hero-bg.jpg";

const features = [
  {
    icon: BarChart3,
    title: "Smart Analytics",
    description: "Visual breakdowns of your spending patterns with interactive charts.",
  },
  {
    icon: Zap,
    title: "Quick Entry",
    description: "Log expenses and income in seconds with our streamlined interface.",
  },
  {
    icon: Shield,
    title: "Secure & Private",
    description: "Your financial data is encrypted and never shared with third parties.",
  },
  {
    icon: TrendingUp,
    title: "Track Growth",
    description: "Monitor your savings and financial goals over time.",
  },
];

const Landing = () => {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/analytics");
      }
    });
  }, [navigate]);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
        style={{ background: "var(--gradient-hero)" }}
      >
        <img
          src={heroBg}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-lighten"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-navy/90" />

        <div className="container relative z-10 mx-auto px-4 pt-24 pb-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <span className="inline-block px-4 py-1.5 rounded-full text-sm font-medium bg-primary/15 text-primary border border-primary/20 mb-6">
              Take control of your finances
            </span>
            <h1 className="font-heading text-4xl md:text-6xl lg:text-7xl font-bold text-primary-foreground mb-6 leading-tight">
              Your money,
              <br />
              <span className="text-primary">crystal clear.</span>
            </h1>
            <p className="text-lg md:text-xl text-primary-foreground/60 max-w-2xl mx-auto mb-10">
              Track every dollar, visualize your spending, and build better financial habits — all in one beautifully simple app.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/login">
                <Button variant="hero" size="lg" className="text-base px-8 gap-2">
                  Get Started
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="hero-outline" size="lg" className="text-base px-8">
                  Sign In
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
              Everything you need
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Powerful features wrapped in a simple interface.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="group p-6 rounded-xl bg-card border border-border hover:border-primary/30 transition-all hover:shadow-[var(--shadow-elevated)]"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-heading font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20" style={{ background: "var(--gradient-hero)" }}>
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
              Ready to take control?
            </h2>
            <p className="text-primary-foreground/60 text-lg mb-8 max-w-lg mx-auto">
              Start tracking your budget today. It's free to get started.
            </p>
            <Link to="/login">
              <Button variant="hero" size="lg" className="text-base px-8 gap-2">
                Start Now <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-background border-t border-border">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © 2026 BudgetFlow. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Landing;
