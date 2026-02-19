import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Wallet, BarChart3, PlusCircle, LogIn, LogOut, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { ModeToggle } from "@/components/ModeToggle";


import { User } from "@supabase/supabase-js";

const Navbar = () => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const isLanding = location.pathname === "/";

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const navLinks = [
    { to: "/analytics", label: "Analytics", icon: BarChart3 },
    { to: "/add-transaction", label: "Add Transaction", icon: PlusCircle },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all ${isLanding ? "bg-navy/80 backdrop-blur-xl border-b border-primary/10" : "bg-card/80 backdrop-blur-xl border-b border-border"}`}>
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <Link to="/" className="flex items-center gap-2">
          <img src="/icon_transparent.png" alt="BudgetFlow" className="w-8 h-8 rounded-lg object-contain" />
          <span className={`font-heading font-bold text-lg ${isLanding ? "text-primary-foreground" : "text-foreground"}`}>
            BudgetFlow
          </span>
        </Link>
        <div className="flex items-center gap-2">
            <ModeToggle />
            
            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-1">
          {user && navLinks.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to}>
              <Button
                variant="ghost"
                className={`gap-2 ${isLanding ? "text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary/10" : ""} ${location.pathname === to ? "bg-primary/10 text-primary" : ""}`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Button>
            </Link>
          ))}
          {user ? (
            <Button 
                variant={isLanding ? "default" : "default"} 
                size="sm" 
                className="ml-2 gap-2"
                onClick={handleSignOut}
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          ) : (
            <Link to="/login">
                <Button variant={isLanding ? "default" : "default"} size="sm" className="ml-2 gap-2">
                <LogIn className="w-4 h-4" />
                Sign In
                </Button>
            </Link>
          )}
        </div>

          <div className="md:hidden flex items-center gap-2">
            {!user && (
               <Link to="/login">
                  <Button variant={isLanding ? "default" : "default"} size="sm" className="gap-2">
                  <LogIn className="w-4 h-4" />
                  Sign In
                  </Button>
              </Link>
            )}
            {user && (
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className={isLanding ? "text-primary-foreground" : "text-foreground"}
              >
                {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {mobileOpen && user && (
        <div className={`md:hidden border-t ${isLanding ? "bg-navy border-primary/10" : "bg-card border-border"} px-4 py-3 space-y-1`}>
          {navLinks.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} onClick={() => setMobileOpen(false)}>
              <Button
                variant="ghost"
                className={`w-full justify-start gap-2 ${isLanding ? "text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary/10" : ""}`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Button>
            </Link>
          ))}
            <Button 
                variant="destructive" 
                className="w-full justify-start gap-2 mt-2"
                onClick={() => {
                    handleSignOut();
                    setMobileOpen(false);
                }}
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
