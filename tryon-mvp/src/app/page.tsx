import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
      <main className="mx-auto max-w-6xl px-4 py-16 md:py-24">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 tracking-tight">
            AI Closet
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Try on any outfit instantly with AI-powered virtual fitting
          </p>
          <Link
            href="/try-on"
            className="inline-block px-8 py-4 bg-purple-600 text-white text-lg font-semibold rounded-full hover:bg-purple-700 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            Start Virtual Try-On
          </Link>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mt-20">
          <FeatureCard
            icon="📸"
            title="Upload Your Photo"
            description="Take or upload a full-body photo. Our AI analyzes your proportions instantly."
          />
          <FeatureCard
            icon="👕"
            title="Browse Outfits"
            description="Discover outfits from across the web, or search for specific styles you love."
          />
          <FeatureCard
            icon="✨"
            title="See Yourself"
            description="Get a realistic preview of how any outfit looks on you with AI magic."
          />
        </div>

        {/* How It Works */}
        <div className="mt-24 bg-white rounded-3xl shadow-xl p-8 md:p-12">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">How It Works</h2>
          <div className="space-y-8">
            <Step
              number={1}
              title="AI Analysis"
              description="Gemini Nano runs locally on your device to analyze your photo privately - no cloud processing needed for this step."
            />
            <Step
              number={2}
              title="Smart Search"
              description="Based on your body type and preferences, we search for outfits that match your style."
            />
            <Step
              number={3}
              title="Virtual Try-On"
              description="Our AI composites the outfit onto your photo, showing you a realistic preview in seconds."
            />
          </div>
        </div>

        {/* Tech Stack */}
        <div className="mt-20 text-center">
          <h3 className="text-2xl font-semibold mb-6 text-gray-800">Powered By</h3>
          <div className="flex flex-wrap justify-center gap-6 text-gray-600">
            <TechBadge>Gemini Nano</TechBadge>
            <TechBadge>Banana.dev</TechBadge>
            <TechBadge>Firebase</TechBadge>
            <TechBadge>Next.js</TechBadge>
            <TechBadge>Tailwind CSS</TechBadge>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-24 text-center">
          <Link
            href="/try-on"
            className="inline-block px-10 py-5 bg-gray-900 text-white text-xl font-bold rounded-full hover:bg-gray-800 transition-all transform hover:scale-105 shadow-xl"
          >
            Try It Now
          </Link>
          <p className="mt-6 text-gray-500 text-sm">
            No account needed • Works on mobile • Privacy-first
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8 mt-20">
        <div className="max-w-6xl mx-auto px-4 text-center text-gray-500 text-sm">
          <p>AI Closet MVP • Built with Next.js, Firebase, and AI</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-3 text-gray-900">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

function Step({ number, title, description }: { number: number; title: string; description: string }) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex-shrink-0 w-12 h-12 bg-purple-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
        {number}
      </div>
      <div>
        <h4 className="text-xl font-semibold mb-2 text-gray-900">{title}</h4>
        <p className="text-gray-600">{description}</p>
      </div>
    </div>
  );
}

function TechBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="px-4 py-2 bg-gray-100 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors">
      {children}
    </span>
  );
}
