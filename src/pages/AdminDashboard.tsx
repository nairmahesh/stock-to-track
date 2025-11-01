import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Users, ShoppingCart, TrendingUp } from "lucide-react";
import { toast } from "sonner";

interface Order {
  id: string;
  order_number: string;
  status: string;
  total_items: number;
  created_at: string;
  dealer: {
    full_name: string;
    company_name: string;
  };
  vendor_comments: string | null;
  tracking_number: string | null;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalDealers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    fetchData();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      toast.error("Access denied");
      navigate("/auth");
    }
  };

  const fetchData = async () => {
    try {
      // Fetch orders
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select(`
          *,
          dealer:profiles!dealer_id (
            full_name,
            company_name
          )
        `)
        .order("created_at", { ascending: false });

      if (ordersError) throw ordersError;
      setOrders(ordersData || []);

      // Fetch stats
      const { count: dealerCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "dealer");

      setStats({
        totalOrders: ordersData?.length || 0,
        pendingOrders: ordersData?.filter((o) => o.status === "pending").length || 0,
        completedOrders: ordersData?.filter((o) => o.status === "delivered").length || 0,
        totalDealers: dealerCount || 0,
      });
    } catch (error: any) {
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
      case "accepted":
        return "bg-green-500/10 text-green-600 border-green-500/20";
      case "rejected":
      case "not_in_stock":
        return "bg-red-500/10 text-red-600 border-red-500/20";
      case "dispatched":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "delivered":
        return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
      default:
        return "bg-gray-500/10 text-gray-600 border-gray-500/20";
    }
  };

  const StatCard = ({ title, value, icon: Icon, description }: any) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );

  const allOrders = orders;
  const pendingOrders = orders.filter((o) => o.status === "pending");
  const activeOrders = orders.filter((o) => ["accepted", "dispatched"].includes(o.status));
  const completedOrders = orders.filter((o) => o.status === "delivered");

  const OrderCard = ({ order }: { order: Order }) => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {order.order_number}
              <Badge variant="outline" className={getStatusColor(order.status)}>
                {order.status.replace("_", " ").toUpperCase()}
              </Badge>
            </CardTitle>
            <CardDescription>
              {order.dealer?.full_name} • {order.dealer?.company_name}
            </CardDescription>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Items</p>
            <p className="text-2xl font-bold">{order.total_items}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Order Date:</span>
          <span>{new Date(order.created_at).toLocaleDateString()}</span>
        </div>
        {order.tracking_number && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Tracking:</span>
            <span className="font-mono">{order.tracking_number}</span>
          </div>
        )}
        {order.vendor_comments && (
          <div className="p-3 bg-muted rounded-lg mt-2">
            <p className="text-sm font-medium mb-1">Vendor Comments:</p>
            <p className="text-sm text-muted-foreground">{order.vendor_comments}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <DashboardLayout title="Admin Dashboard">
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Admin Overview</h2>
          <p className="text-muted-foreground">Monitor all orders and system activity</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Orders"
            value={stats.totalOrders}
            icon={ShoppingCart}
            description="All time orders"
          />
          <StatCard
            title="Pending Orders"
            value={stats.pendingOrders}
            icon={Package}
            description="Awaiting vendor action"
          />
          <StatCard
            title="Completed"
            value={stats.completedOrders}
            icon={TrendingUp}
            description="Delivered orders"
          />
          <StatCard
            title="Dealers"
            value={stats.totalDealers}
            icon={Users}
            description="Active dealers"
          />
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList>
            <TabsTrigger value="all">All Orders</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <div className="grid gap-4">
              {allOrders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="pending" className="mt-6">
            <div className="grid gap-4">
              {pendingOrders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="active" className="mt-6">
            <div className="grid gap-4">
              {activeOrders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="completed" className="mt-6">
            <div className="grid gap-4">
              {completedOrders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
