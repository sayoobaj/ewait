import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center text-white mb-16">
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            e<span className="text-yellow-400">Wait</span>
          </h1>
          <p className="text-xl md:text-2xl opacity-90 max-w-2xl mx-auto">
            Skip the physical line. Join queues instantly by scanning a QR code.
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Join Queue Card */}
          <Link href="/join" className="block">
            <div className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-shadow cursor-pointer group">
              <div className="text-6xl mb-4">📱</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2 group-hover:text-blue-600">
                Join a Queue
              </h2>
              <p className="text-gray-600">
                Scan a QR code or enter a queue code to join the line
              </p>
            </div>
          </Link>

          {/* Check Position Card */}
          <Link href="/status" className="block">
            <div className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-shadow cursor-pointer group">
              <div className="text-6xl mb-4">🔢</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2 group-hover:text-blue-600">
                Check Your Position
              </h2>
              <p className="text-gray-600">
                See your current position and estimated wait time
              </p>
            </div>
          </Link>
        </div>

        {/* Business Section */}
        <div className="mt-16 text-center">
          <p className="text-white/80 mb-4">Are you a business?</p>
          <Link 
            href="/admin" 
            className="inline-block bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Manage Your Queues →
          </Link>
        </div>

        {/* Features */}
        <div className="mt-20 grid md:grid-cols-3 gap-8 text-center text-white">
          <div>
            <div className="text-4xl mb-3">⚡</div>
            <h3 className="font-semibold text-lg mb-2">Instant Join</h3>
            <p className="opacity-80 text-sm">Scan and join in seconds</p>
          </div>
          <div>
            <div className="text-4xl mb-3">🔔</div>
            <h3 className="font-semibold text-lg mb-2">Get Notified</h3>
            <p className="opacity-80 text-sm">SMS/Push when it&apos;s your turn</p>
          </div>
          <div>
            <div className="text-4xl mb-3">📊</div>
            <h3 className="font-semibold text-lg mb-2">Real-time Updates</h3>
            <p className="opacity-80 text-sm">Live queue position tracking</p>
          </div>
        </div>
      </div>
    </main>
  )
}
