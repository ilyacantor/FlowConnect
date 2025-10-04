import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Bike } from "lucide-react";

export default function Navigation() {
  const [location] = useLocation();
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) return null;

  const navItems = [
    { path: "/", label: "Discover", icon: "fas fa-compass" },
    { path: "/buddy-match", label: "BuddyMatch", icon: "fas fa-heart" },
    { path: "/buddy-preferences", label: "Buddy Preferences", icon: "fas fa-sliders-h" },
    { path: "/buddy-finder", label: "Buddy Finder", icon: "fas fa-search" },
    { path: "/group-rides", label: "Group Rides", icon: "fas fa-users" },
    { path: "/activity", label: "Activity", icon: "fas fa-feed" },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-card border-b border-border backdrop-blur-sm bg-opacity-95" data-testid="navigation">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" data-testid="link-home">
              <div className="flex items-center space-x-2 cursor-pointer">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Bike className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold">Flownation</span>
              </div>
            </Link>
            
            {isAuthenticated && (
              <div className="hidden md:flex space-x-6">
                {navItems.map((item) => (
                  <Link key={item.path} href={item.path} data-testid={`link-${item.label.toLowerCase().replace(' ', '-')}`}>
                    <span className={`transition-colors font-medium cursor-pointer ${
                      location === item.path 
                        ? "text-primary" 
                        : "text-muted-foreground hover:text-foreground"
                    }`}>
                      {item.label}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                {user && (
                  <Link href="/profile" data-testid="link-profile">
                    <div className="flex items-center space-x-2 cursor-pointer">
                      <img
                        src={user.profileImageUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face"}
                        alt="Profile"
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <span className="hidden md:inline text-sm font-medium">
                        {user.firstName} {user.lastName}
                      </span>
                    </div>
                  </Link>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.href = "/api/logout"}
                  data-testid="button-logout"
                >
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.href = "/api/login"}
                  data-testid="button-signin"
                >
                  Sign In
                </Button>
                <Button
                  size="sm"
                  onClick={() => window.location.href = "/api/login"}
                  data-testid="button-getstarted"
                >
                  Get Started
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
