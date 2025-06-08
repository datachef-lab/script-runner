import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  FileCode,
  Download,
  Webhook,
  CheckCircle,
  FileSpreadsheet,
  Home,
  TerminalSquare,
} from "lucide-react";

const navigation = [
  { name: "Home", href: "/", icon: Home },
  { name: "College Approval", href: "/college-approval", icon: FileCode },
  { name: "Combine Marks", href: "/combine-marks", icon: FileSpreadsheet },
  { name: "Download Marksheets", href: "/download-marksheets", icon: Download },
  { name: "Web Scrape Marks", href: "/webscrape-marks", icon: Webhook },
  { name: "Marks Upload", href: "/marks-verification", icon: CheckCircle },
];

export function Sidebar() {
  return (
    <div className="flex h-full w-64 flex-col border-r bg-card">
      <div className="flex h-14 items-center border-b px-4">
        <TerminalSquare className="h-6 w-6 mr-2 text-primary" />
        <h1 className="text-lg font-semibold">Script Runner</h1>
      </div>
      <nav className="flex-1 space-y-1 p-2">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-primary/30 text-primary font-semibold"
                  : "hover:bg-muted"
              )
            }
          >
            <item.icon className="h-4 w-4" />
            {item.name}
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto p-4 text-center text-xs text-muted-foreground flex flex-wrap justify-center gap-1">
        <p>#datachef</p>
        <p>#datachef-internal</p>
        <p className="text-xs lowercase">#tECH-SAHYOGI-INNOVENTURE</p>
      </div>
    </div>
  );
} 