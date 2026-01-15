import { ExternalLink } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-border mt-12 py-6">
      <div className="container mx-auto px-4 text-center space-y-2">
        <div className="text-sm text-muted-foreground">
          <span className="text-gradient font-semibold">Team WolfPack</span> Sales Dashboard • {new Date().getFullYear()}
        </div>
        <div className="text-xs text-muted-foreground">
          <span>Imagined, Designed and Developed by </span>
          <a
            href="https://abhishekh.tech"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:text-primary/80 font-medium inline-flex items-center gap-1 transition-colors"
          >
            Abhishekh Dey
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </footer>
  );
}
