"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Home,
  BookOpen,
  ChartBar,
  LogOut,
  Menu,
  ChevronLeft,
  UsersRound,
  ClipboardCheck,
  ClipboardList,
  UserCog,
} from "lucide-react";
import { useAuth, useTenant } from "@/components/providers";

// Menu items for teachers - only Home and My Students
const teacherMenuItems = [
  { title: "الرئيسية", href: "/home", icon: Home },
  { title: "طلابي", href: "/my-students", icon: UsersRound },
];

// Menu items for HalaqaSupervisors - can manage their assigned halaqas including teacher attendance
const halaqaSupervisorMenuItems = [
  { title: "الرئيسية", href: "/home", icon: Home },
  { title: "إدارة الحلقات", href: "/halaqat", icon: BookOpen },
  { title: "المتابعة", href: "/follow-up", icon: ClipboardList },
  { title: "حضور المعلمين", href: "/teacher-attendance", icon: ClipboardCheck },
  { title: "التقارير", href: "/reports", icon: ChartBar },
];

// Menu items for full supervisors - full access including teacher attendance
const supervisorMenuItems = [
  { title: "الرئيسية", href: "/home", icon: Home },
  { title: "إدارة الحلقات", href: "/halaqat", icon: BookOpen },
  { title: "مشرفو الحلقات", href: "/manage-supervisors", icon: UserCog },
  { title: "المتابعة", href: "/follow-up", icon: ClipboardList },
  { title: "حضور المعلمين", href: "/teacher-attendance", icon: ClipboardCheck },
  { title: "التقارير", href: "/reports", icon: ChartBar },
];

interface SidebarContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isMobile: boolean;
}

const SidebarContext = React.createContext<SidebarContextType | null>(null);

function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within AppSidebarProvider");
  }
  return context;
}

export function AppSidebarProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <SidebarContext.Provider value={{ isOpen, setIsOpen, isCollapsed, setIsCollapsed, isMobile }}>
      {children}
    </SidebarContext.Provider>
  );
}

function SidebarContent({ onItemClick }: { onItemClick?: () => void }) {
  const { user, logout } = useAuth();
  const { tenant } = useTenant();
  const pathname = usePathname();
  const { isCollapsed, isMobile } = useSidebar();
  const [logoError, setLogoError] = React.useState(false);

  // Reset logo error when tenant changes
  React.useEffect(() => {
    setLogoError(false);
  }, [tenant?.logoUrl]);

  // Memoize menu items based on user role
  const menuItems = React.useMemo(() => {
    switch (user?.role) {
      case "Supervisor":
        return supervisorMenuItems;
      case "HalaqaSupervisor":
        return halaqaSupervisorMenuItems;
      case "Teacher":
      default:
        return teacherMenuItems;
    }
  }, [user?.role]);
  
  const showText = isMobile || !isCollapsed;
  
  // Get role display name
  const getRoleDisplayName = React.useCallback((role?: string) => {
    switch (role) {
      case 'Supervisor': return 'مشرف';
      case 'HalaqaSupervisor': return 'مشرف حلقة';
      case 'Teacher': return 'معلم';
      default: return role ?? '';
    }
  }, []);

  // Memoize tenant display values
  const tenantDisplayName = React.useMemo(
    () => tenant?.displayName || tenant?.name || 'نظام الحلقات',
    [tenant?.displayName, tenant?.name]
  );
  const tenantInitial = tenantDisplayName.charAt(0);
  const showLogo = tenant?.logoUrl && !logoError;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-border p-4">
        <div className="flex items-center gap-3">
          {showLogo ? (
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg">
              <Image 
                src={tenant.logoUrl!}
                alt={tenantDisplayName}
                fill
                sizes="40px"
                className="object-contain"
                onError={() => setLogoError(true)}
                unoptimized // Allow external URLs without domain config
              />
            </div>
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-lg">
              {tenantInitial}
            </div>
          )}
          {showText && (
            <div className="flex flex-col">
              <h2 className="text-lg font-bold">{tenantDisplayName}</h2>
              <p className="text-xs text-muted-foreground">نظام إدارة الحلقات</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-2" aria-label="القائمة الرئيسية">
        <ul className="space-y-1" role="list">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onItemClick}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                  aria-current={isActive ? "page" : undefined}
                  aria-label={item.title}
                >
                  <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                  {showText && <span>{item.title}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer - User */}
      <div className="border-t border-border p-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "flex w-full items-center gap-3 h-auto py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                showText ? "justify-start px-3" : "justify-center px-0"
              )}
              aria-label={`قائمة المستخدم: ${user?.fullName}`}
            >
              <Avatar className="h-9 w-9 shrink-0">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {user?.fullName?.charAt(0) || "م"}
                </AvatarFallback>
              </Avatar>
              {showText && (
                <div className="flex flex-col items-start text-right">
                  <span className="text-sm font-medium">{user?.fullName}</span>
                  <span className="text-xs text-muted-foreground">
                    {getRoleDisplayName(user?.role)}
                  </span>
                </div>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>حسابي</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => logout()}>
              <LogOut className="ml-2 h-4 w-4" aria-hidden="true" />
              <span>تسجيل الخروج</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export function AppSidebar() {
  const { isOpen, setIsOpen, isCollapsed, setIsCollapsed, isMobile } = useSidebar();

  // Mobile: Sheet sidebar
  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="right" className="w-72 p-0 [&>button]:hidden">
          <SheetHeader className="sr-only">
            <SheetTitle>القائمة</SheetTitle>
          </SheetHeader>
          <SidebarContent onItemClick={() => setIsOpen(false)} />
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: Fixed sidebar
  return (
    <aside
      className={cn(
        "fixed top-0 right-0 z-40 h-screen border-l border-border bg-background transition-all duration-300",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      <SidebarContent />
      
      {/* Collapse toggle button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -left-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-background shadow-sm hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        title={isCollapsed ? "توسيع" : "طي"}
        aria-label={isCollapsed ? "توسيع القائمة الجانبية" : "طي القائمة الجانبية"}
        aria-expanded={!isCollapsed}
      >
        <ChevronLeft
          className={cn(
            "h-4 w-4 transition-transform",
            isCollapsed ? "rotate-180" : ""
          )}
          aria-hidden="true"
        />
      </button>
    </aside>
  );
}

export function AppSidebarTrigger() {
  const { setIsOpen, isMobile } = useSidebar();

  if (!isMobile) return null;

  return (
    <Button variant="ghost" size="icon" onClick={() => setIsOpen(true)}>
      <Menu className="h-5 w-5" />
      <span className="sr-only">القائمة</span>
    </Button>
  );
}

export function AppSidebarLayout({ children }: { children: React.ReactNode }) {
  const { isCollapsed, isMobile } = useSidebar();

  return (
    <div
      className={cn(
        "min-h-screen transition-all duration-300",
        !isMobile && (isCollapsed ? "mr-16" : "mr-64")
      )}
    >
      {children}
    </div>
  );
}




