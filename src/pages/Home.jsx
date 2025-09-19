import { Link } from "react-router-dom";

function Home() {
  return (
    <div className="bg-gradient-to-br from-gray-100 via-slate-200 to-gray-300 min-h-screen relative overflow-hidden font-sans">
      
      {/* --- HERO SECTION --- */}
      <section className="flex flex-col items-center justify-center text-center min-h-screen px-4 sm:px-6 lg:px-8 py-20 relative z-10">
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-12 lg:p-20 max-w-6xl w-full mx-auto border border-purple-200/40">
          
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent mb-8">
            Welcome to SCORGAL
          </h1>

          <div className="max-w-3xl mx-auto mb-12">
            <p className="text-gray-800 text-xl sm:text-2xl leading-relaxed font-light mb-4">
              Because legal shouldn't feel lethal.
            </p>
            <p className="text-lg sm:text-xl text-purple-700 font-semibold">
              Upload your contracts, NDAs, or terms — and let SCORGAL simplify them clause by clause.
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 mt-10 mb-12">
            
            <div className="bg-purple-50 p-6 rounded-2xl shadow hover:shadow-lg transition-all">
              <h4 className="font-bold text-purple-800 text-lg mb-3">⚡ Lightning Fast</h4>
              <p className="text-purple-700 text-base lg:text-lg font-medium leading-relaxed">
                Get simplified explanations in seconds
              </p>
            </div>

            <div className="bg-blue-50 p-6 rounded-2xl shadow hover:shadow-lg transition-all">
              <h4 className="font-bold text-blue-800 text-lg mb-3">✅ Accurate</h4>
              <p className="text-blue-700 text-base lg:text-lg font-medium leading-relaxed">
                AI-powered legal analysis you can trust
              </p>
            </div>

            <div className="bg-indigo-50 p-6 rounded-2xl shadow hover:shadow-lg transition-all">
              <h4 className="font-bold text-indigo-800 text-lg mb-3">🔒 Secure</h4>
              <p className="text-indigo-700 text-base lg:text-lg font-medium leading-relaxed">
                Your documents stay private and protected
              </p>
            </div>

            <div className="bg-pink-50 p-6 rounded-2xl shadow hover:shadow-lg transition-all">
              <h4 className="font-bold text-pink-800 text-lg mb-3">💬 Interactive Chat</h4>
              <p className="text-pink-700 text-base lg:text-lg font-medium leading-relaxed">
                Ask about any clause and get instant answers
              </p>
            </div>
          </div>

          {/* 🔹 Button updated to Link */}
          <Link
            to="/assistant"
            className="inline-block px-10 py-4 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 text-white font-bold text-lg rounded-2xl shadow-lg hover:scale-105 transition-transform"
          >
            Try Clause Chatbot →
          </Link>
        </div>
      </section>

      {/* --- WHY CHOOSE SCORGAL --- */}
      <section className="flex flex-col items-center justify-center text-center min-h-screen px-4 sm:px-6 lg:px-8 py-20 relative z-10">
        <div className="bg-white rounded-3xl shadow-2xl p-12 lg:p-20 max-w-6xl mx-auto">
          
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-6">
            Why Choose SCORGAL?
          </h2>
          <p className="text-gray-700 text-xl sm:text-2xl mb-10">
            We help you cut through the jargon, so you understand every agreement you sign. <br />
            <span className="text-blue-700 font-bold">Transparency, simplicity, and trust — all in one platform.</span>
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <div className="bg-green-50 p-6 rounded-2xl shadow hover:shadow-lg transition-all">
              <h4 className="font-bold text-green-800 text-lg mb-3">🌍 Transparency</h4>
              <p className="text-green-700 text-base lg:text-lg font-medium leading-relaxed">
                See exactly what you're agreeing to
              </p>
            </div>

            <div className="bg-blue-50 p-6 rounded-2xl shadow hover:shadow-lg transition-all">
              <h4 className="font-bold text-blue-800 text-lg mb-3">📘 Simplicity</h4>
              <p className="text-blue-700 text-base lg:text-lg font-medium leading-relaxed">
                Complex legal terms made simple
              </p>
            </div>

            <div className="bg-purple-50 p-6 rounded-2xl shadow hover:shadow-lg transition-all">
              <h4 className="font-bold text-purple-800 text-lg mb-3">🤝 Trust</h4>
              <p className="text-purple-700 text-base lg:text-lg font-medium leading-relaxed">
                Reliable analysis you can depend on
              </p>
            </div>

            <div className="bg-orange-50 p-6 rounded-2xl shadow hover:shadow-lg transition-all">
              <h4 className="font-bold text-orange-800 text-lg mb-3">⚙️ Efficiency</h4>
              <p className="text-orange-700 text-base lg:text-lg font-medium leading-relaxed">
                Save time on legal document review
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- FINAL CTA --- */}
      <section className="flex flex-col items-center justify-center text-center py-24 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 p-12 lg:p-20 rounded-3xl shadow-2xl max-w-4xl mx-auto">
          
          <h3 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-6">
            Ready to Simplify Your Legal Documents?
          </h3>
          <p className="text-white/90 text-lg sm:text-xl mb-8 max-w-2xl mx-auto">
            Get instant explanations and clarity with SCORGAL’s AI-powered assistant.
          </p>

          {/* 🔹 Button updated to Link */}
          <Link
            to="/assistant"
            className="inline-block px-10 py-4 bg-white text-purple-700 font-bold text-lg rounded-2xl shadow hover:scale-105 transition-transform"
          >
            Go to Assistant →
          </Link>
        </div>
      </section>
    </div>
  );
}

export default Home;
