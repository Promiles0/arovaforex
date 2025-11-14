import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { FaCompass } from "react-icons/fa"; // Make sure react-icons is installed

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.warn("404: Tried to access", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-blue-50 px-4 relative overflow-hidden">
      {/* Floating Compass */}
      <div className="absolute top-10 left-10 animate-spin-slow text-blue-300 text-6xl opacity-20">
        <FaCompass />
      </div>

      <div className="text-center animate-fade-in">
        <h1 className="text-6xl font-extrabold text-blue-600 mb-4">404</h1>
        <p className="text-2xl text-gray-700 mb-2">Lost in the charts?</p>
        <p className="text-lg text-gray-500 mb-6">
          We couldn’t find the page you were looking for.
        </p>
        <Link
          to="/"
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg shadow hover:bg-blue-700 transition"
        >
          Back to Dashboard
        </Link>
        <div className="mt-6 text-sm text-gray-400">
          <span>Route attempted: </span>
          <code className="bg-gray-200 px-2 py-1 rounded">{location.pathname}</code>
        </div>
      </div>
    </div>
  );
};

export default NotFound;