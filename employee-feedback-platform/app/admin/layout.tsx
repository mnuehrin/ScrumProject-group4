import Link from "next/link";
import { SidebarNavigation } from "@/components/layout/SidebarNavigation";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export default function AdminLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <SidebarNavigation />
      <SidebarInset className="bg-slate-50">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-slate-200 bg-slate-50/95 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="border-slate-300 bg-white" />
            <p className="text-sm font-medium text-slate-700">Admin dashboard</p>
          </div>
          <Link href="/" className="text-sm text-slate-600 hover:text-slate-900">
            Back to home
          </Link>
        </header>
        <main className="mx-auto w-full max-w-6xl px-5 py-6 sm:px-7 lg:px-9">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
