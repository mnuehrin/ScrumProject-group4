import { SidebarNavigation } from "@/components/layout/SidebarNavigation";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export default function PublicLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <SidebarNavigation />
      <SidebarInset className="bg-slate-50">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-slate-200 bg-slate-50/95 px-4 backdrop-blur sm:px-6">
          <SidebarTrigger className="border-slate-300 bg-white" />
          <p className="text-sm font-medium text-slate-700">Public workspace</p>
        </header>
        <main className="mr-auto w-full max-w-[1200px] px-5 py-6 sm:px-7 lg:px-9">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
