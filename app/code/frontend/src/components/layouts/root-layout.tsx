import { Outlet } from "react-router-dom";
import { Sidebar } from "../sidebar";

export default function RootLayout() {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
