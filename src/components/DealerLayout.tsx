import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DealerSidebar } from "./DealerSidebar";
import DashboardLayout from "./DashboardLayout";

interface DealerLayoutProps {
  children: React.ReactNode;
  title: string;
}

const DealerLayout = ({ children, title }: DealerLayoutProps) => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <DealerSidebar />
        <div className="flex-1 flex flex-col">
          <DashboardLayout title={title}>
            <div className="mb-4">
              <SidebarTrigger />
            </div>
            {children}
          </DashboardLayout>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DealerLayout;
