import { ChevronRight, Home } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

const routeLabels: Record<string, string> = {
  "/doctor-dashboard": "Home",
  "/consultation": "New Consultation",
  "/consultations": "Patients",
  "/doctor-appointments": "Appointments",
  "/shared-records": "Shared Records",
};

const DoctorBreadcrumb = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  // Build breadcrumb items
  const items: BreadcrumbItem[] = [
    { label: "Home", href: "/doctor-dashboard" },
  ];

  // Handle patient profile routes
  if (currentPath.startsWith("/patient/")) {
    items.push({ label: "Patients", href: "/consultations" });
    const healthId = decodeURIComponent(currentPath.split("/patient/")[1]);
    items.push({ label: `Patient ${healthId.slice(0, 8)}...` });
  } else if (currentPath !== "/doctor-dashboard") {
    const label = routeLabels[currentPath] || currentPath.split("/").pop() || "";
    items.push({ label });
  }

  // Don't show breadcrumb on dashboard (it's the root)
  if (currentPath === "/doctor-dashboard") {
    return null;
  }

  return (
    <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-1">
          {index > 0 && <ChevronRight className="h-4 w-4" />}
          {item.href && index < items.length - 1 ? (
            <Link
              to={item.href}
              className="hover:text-foreground transition-colors flex items-center gap-1"
            >
              {index === 0 && <Home className="h-3.5 w-3.5" />}
              {item.label}
            </Link>
          ) : (
            <span className="text-foreground font-medium">
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
};

export default DoctorBreadcrumb;
