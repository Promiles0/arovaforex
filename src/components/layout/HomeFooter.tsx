import { Link } from "react-router-dom";

export const HomeFooter = () => {
  return (
    <footer className="bg-card border-t border-border">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-success rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">A</span>
              </div>
              <span className="text-2xl font-bold">
                <span className="text-foreground">Arova</span>
                <span className="text-primary">Forex</span>
              </span>
            </Link>
            <p className="text-muted-foreground max-w-md">
              Professional Forex trading platform providing premium market forecasts, 
              exclusive trading signals, and institutional-level analysis.
            </p>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <div className="space-y-2">
              <Link to="#" className="block text-muted-foreground hover:text-primary transition-colors">
                Privacy Policy
              </Link>
              <Link to="#" className="block text-muted-foreground hover:text-primary transition-colors">
                Terms of Service
              </Link>
              <Link to="#" className="block text-muted-foreground hover:text-primary transition-colors">
                Risk Disclosure
              </Link>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <div className="space-y-2">
              <Link to="#" className="block text-muted-foreground hover:text-primary transition-colors">
                Support
              </Link>
              <Link to="#" className="block text-muted-foreground hover:text-primary transition-colors">
                Contact Us
              </Link>
              <Link to="#" className="block text-muted-foreground hover:text-primary transition-colors">
                About
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-border mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground">
            <p>&copy; 2024 ArovaForex. All rights reserved.</p>
            <p className="mt-2 md:mt-0">
              Trading involves risk. Past performance does not guarantee future results.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};