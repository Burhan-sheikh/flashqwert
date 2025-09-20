import React from "react";
import { motion } from "framer-motion";
import {
  Link,
  Route,
  Routes,
  useLocation,
  Outlet,
} from "react-router-dom"; // Import necessary components

// Lazy load components
const ContactSharing = React.lazy(() => import("../components/LearningCenter/ContactSharing"));
const Packaging = React.lazy(() => import("../components/LearningCenter/Packaging"));
const WebIntegration = React.lazy(() => import("../components/LearningCenter/WebIntegration"));
const AppDownload = React.lazy(() => import("../components/LearningCenter/AppDownload"));
const ContactlessEntry = React.lazy(() => import("../components/LearningCenter/ContactlessEntry"));

// Define a type for the guide
interface Guide {
  title: string;
  description: string;
  path: string; // Use 'path' instead of 'link' to align with React Router
  component: React.LazyExoticComponent<React.ComponentType<any>>;
}

const guides: Guide[] = [
  {
    title: "Packaging",
    description:
      "Learn how to add QR codes to your product packaging to engage customers.",
    path: "packaging", // Consistent path naming (relative to /learning-center)
    component: Packaging,
  },
  {
    title: "Contact Sharing",
    description:
      "Create QR codes that share your contact information instantly and professionally.",
    path: "contact-sharing", // Consistent path naming (relative to /learning-center)
    component: ContactSharing,
  },
  {
    title: "Web Integration",
    description: "Connect your QR codes to the web with static QR codes.",
    path: "web-integration",
    component: WebIntegration,
  },
  {
    title: "App Download",
    description: "Share your app with QR codes for easy downloads.",
    path: "app-download",
    component: AppDownload,
  },
  {
    title: "Contactless Entry",
    description: "Enable seamless access with static QR codes.",
    path: "contactless-entry",
    component: ContactlessEntry,
  },
  // Add more guides here as needed
];

const LearningCenter: React.FC = () => {
  const location = useLocation(); // Get the current location

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation Sidebar */}
      <div className="md:flex h-full">
        <aside className="bg-white shadow-md w-25 p-4">
          <nav>
            <h2 className="font-semibold text-lg text-gray-800 mb-4">
              Learning Center
            </h2>
            <ul>
              {guides.map((guide) => (
                <li key={guide.path} className="mb-2">
                  <Link
                    to={`/learning-center/${guide.path}`} // Updated link
                    className={`block px-4 py-2 rounded-md hover:bg-gray-200 transition-colors ${
                      location.pathname === `/learning-center/${guide.path}`
                        ? "bg-blue-100 text-blue-600 font-semibold"
                        : "text-gray-700 text-xs"
                    }`}
                  >
                    {guide.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-2">
          <motion.div
            className="container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {/* React Router Outlet - where the content will be rendered */}
            <React.Suspense fallback={<div>Loading...</div>}>
              <Outlet />
            </React.Suspense>
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export const LearningCenterRoutes = () => (
  <Routes>
    <Route path="/" element={<LearningCenter />}>
      <Route
        index
        element={
          <motion.div
            className="text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <h1 className="text-4xl font-bold text-slate-900 mb-4">
              Welcome to the Learning Center!
            </h1>
            <p className="text-lg text-slate-700">
              Select a guide from the sidebar to get started.
            </p>
          </motion.div>
        }
      />
      <Route
        path="packaging"
        element={<React.Suspense fallback={<div>Loading...</div>}><Packaging /></React.Suspense>}
      />
      <Route
        path="contact-sharing"
        element={<React.Suspense fallback={<div>Loading...</div>}><ContactSharing /></React.Suspense>}
      />
       <Route
        path="web-integration"
        element={<React.Suspense fallback={<div>Loading...</div>}><WebIntegration /></React.Suspense>}
      />
       <Route
        path="app-download"
        element={<React.Suspense fallback={<div>Loading...</div>}><AppDownload /></React.Suspense>}
      />
      <Route
        path="contactless-entry"
        element={<React.Suspense fallback={<div>Loading...</div>}><ContactlessEntry /></React.Suspense>}
      />
    </Route>
  </Routes>
);

export default LearningCenter;
