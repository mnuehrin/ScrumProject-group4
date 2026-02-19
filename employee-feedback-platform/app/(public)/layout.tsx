import { NavbarTitle } from "@/components/layout/NavbarTitle";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { SidebarNavigation } from "@/components/layout/SidebarNavigation";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export default function PublicLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider className="h-screen overflow-hidden">
      <SidebarNavigation />
      <SidebarInset className="flex h-screen flex-col overflow-hidden bg-transparent">
        <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-4 border-b border-border bg-background/85 px-4 backdrop-blur sm:px-6">
          <SidebarTrigger className="border-border bg-card/80" />
          <NavbarTitle />
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </header>
        <main className="mx-auto h-full w-full max-w-6xl overflow-y-auto px-5 py-6 sm:px-7 lg:px-9">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
