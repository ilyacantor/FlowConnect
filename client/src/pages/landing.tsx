import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Users, MapPin, Trophy, Heart, Calendar, Route } from "lucide-react";

export default function Landing() {
  const features = [
    {
      icon: Heart,
      title: "BuddyMatch",
      description: "FTP match ±20% or weekly hours ±25%. Swipe to connect."
    },
    {
      icon: Users,
      title: "Group Rides",
      description: "A/B/C rides near you. Join rides at your tier."
    },
    {
      icon: Trophy,
      title: "Athlete Passport",
      description: "Your stats, your rides, your training block."
    },
    {
      icon: Calendar,
      title: "Activity Feed",
      description: "Post rides, drop kudos, comment on your crew's progress."
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1517649763962-0c623066013b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=800" 
            alt="Cyclist on mountain road" 
            className="w-full h-full object-cover opacity-30" 
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/90 to-background"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6" data-testid="text-hero-title">
              Find Riders at <span className="text-primary">Your Pace</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed" data-testid="text-hero-description">
              Match with riders in your FTP range or pace band. Join A/B/C rides near you. No-drop groups welcome.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Button 
                size="lg" 
                className="text-lg font-semibold"
                onClick={() => window.location.href = "/api/login"}
                data-testid="button-signup"
              >
                Sign in with Replit
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="text-lg font-semibold"
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                data-testid="button-learn-more"
              >
                Learn More
              </Button>
            </div>
            
            <div className="flex items-center space-x-8 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-secondary" />
                <span data-testid="text-total-users"><span className="font-semibold text-foreground">12,847</span> Active Riders</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-secondary" />
                <span data-testid="text-total-cities"><span className="font-semibold text-foreground">342</span> Cities</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4" data-testid="text-features-title">
              How It Works
            </h2>
            <p className="text-lg text-muted-foreground" data-testid="text-features-description">
              FTP matching. Pace bands. A/B/C rides. Built by riders who get it.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="card-shadow hover:card-shadow-lg transition-shadow" data-testid={`card-feature-${index}`}>
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2" data-testid={`text-feature-title-${index}`}>{feature.title}</h3>
                  <p className="text-sm text-muted-foreground" data-testid={`text-feature-description-${index}`}>{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4" data-testid="text-cta-title">
            Start Matching
          </h2>
          <p className="text-lg text-muted-foreground mb-8" data-testid="text-cta-description">
            12,847 riders across 342 cities. Find yours.
          </p>
          <Button 
            size="lg" 
            className="text-lg font-semibold px-8"
            onClick={() => window.location.href = "/api/login"}
            data-testid="button-join-now"
          >
            Join Now - It's Free
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Route className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold">Flownation</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Matching riders by FTP, pace, and location. No hype, just rides.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3">Features</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>BuddyMatch</li>
                <li>Group Rides</li>
                <li>Activity Feed</li>
                <li>Athlete Passport</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3">Community</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Find Rides</li>
                <li>Safety Guidelines</li>
                <li>Events</li>
                <li>Blog</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Help Center</li>
                <li>Contact Us</li>
                <li>Privacy Policy</li>
                <li>Terms of Service</li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-border text-center">
            <p className="text-sm text-muted-foreground" data-testid="text-copyright">
              © 2024 Flownation. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
