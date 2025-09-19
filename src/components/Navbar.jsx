import { Link } from "react-router-dom";
import logo from "../assets/image.png";

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-gradient-to-r from-purple-500/15 via-purple-400/20 to-purple-600/15 backdrop-blur-xl border border-purple-300/30 shadow-[0_8px_32px_rgba(128,0,128,0.15)] px-8 py-4 flex justify-between items-center">
      {/* Logo + Brand */}
      <h1 className="text-2xl font-extrabold flex items-center gap-4 text-black tracking-wide drop-shadow-[0_0_12px_rgba(147,51,234,0.8)] filter brightness-110">
        <img
          src={logo}
          alt="SCORGAL Logo"
          className="h-12 w-12 object-contain rounded-xl shadow-[0_0_16px_rgba(147,51,234,0.4)] border border-purple-300/20"
        />
        SCORGAL
      </h1>

      {/* Links */}
      <div className="space-x-8 font-medium">
        <Link
          to="/"
          className="text-black90 drop-shadow-[0_0_8px_rgba(147,51,234,0.7)] hover:text-purple-200 hover:drop-shadow-[0_0_12px_rgba(147,51,234,1)] transition-all duration-300 ease-out relative before:absolute before:bottom-0 before:left-0 before:w-0 before:h-0.5 before:bg-gradient-to-r before:from-purple-400 before:to-purple-300 before:transition-all before:duration-300 hover:before:w-full"
        >
          Home
        </Link>
        <Link
          to="/assistant"
          className="text-black/90 drop-shadow-[0_0_8px_rgba(147,51,234,0.7)] hover:text-purple-200 hover:drop-shadow-[0_0_12px_rgba(147,51,234,1)] transition-all duration-300 ease-out relative before:absolute before:bottom-0 before:left-0 before:w-0 before:h-0.5 before:bg-gradient-to-r before:from-purple-400 before:to-purple-300 before:transition-all before:duration-300 hover:before:w-full"
        >
          Assistant
        </Link>
      </div>
    </nav>
  );
}