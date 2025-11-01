import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, FileText } from "lucide-react";
import { toast } from "sonner";

interface Order {
  id: string;
  order_number: string;
  status: "pending" | "accepted" | "rejected" | "not_in_stock" | "dispatched" | "delivered";
  total_items: number;
  created_at: string;
  notes: string | null;
  dealer_id: string;
  profiles: {
    full_name: string;
    company_name: string;
  } | null;
}

const VendorDashboard = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updateData, setUpdateData] = useState<{
    status: "pending" | "accepted" | "rejected" | "not_in_stock" | "dispatched" | "delivered";
    vendor_comments: string;
    courier_details: string;
    tracking_number: string;
  }>({
    status: "pending",
    vendor_comments: "",
    courier_details: "",
    tracking_number: "",
  });

  useEffect(() => {
    checkAuth();
    fetchOrders();
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

    if (profile?.role !== "vendor") {
      toast.error("Access denied");
      navigate("/auth");
    }
  };

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          profiles!orders_dealer_id_fkey (
            full_name,
            company_name
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error: any) {
      toast.error("Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrder = async () => {
    if (!selectedOrder) return;

    try {
      const { error } = await supabase
        .from("orders")
        .update({
          status: updateData.status,
          vendor_comments: updateData.vendor_comments,
          courier_details: updateData.courier_details,
          tracking_number: updateData.tracking_number,
        })
        .eq("id", selectedOrder.id);

      if (error) throw error;

      toast.success("Order updated successfully");
      fetchOrders();
      setSelectedOrder(null);
    } catch (error: any) {
      toast.error("Failed to update order");
    }
  };

  const pendingOrders = orders.filter((o) => o.status === "pending");
  const activeOrders = orders.filter((o) => ["accepted", "dispatched"].includes(o.status));
  const completedOrders = orders.filter((o) => ["delivered", "rejected", "not_in_stock"].includes(o.status));

  const OrderCard = ({ order }: { order: Order }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {order.order_number}
              <Badge variant="outline" className="capitalize">
                {order.status.replace("_", " ")}
              </Badge>
            </CardTitle>
            <CardDescription>
              {order.profiles?.full_name} • {order.profiles?.company_name}
            </CardDescription>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Items</p>
            <p className="text-2xl font-bold">{order.total_items}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {order.notes && (
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm font-medium mb-1">Order Notes:</p>
            <p className="text-sm text-muted-foreground">{order.notes}</p>
          </div>
        )}
        <Dialog>
          <DialogTrigger asChild>
            <Button
              className="w-full"
              onClick={() => {
                setSelectedOrder(order);
                setUpdateData({
                  status: order.status as "pending" | "accepted" | "rejected" | "not_in_stock" | "dispatched" | "delivered",
                  vendor_comments: "",
                  courier_details: "",
                  tracking_number: "",
                });
              }}
            >
              Update Order
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Update Order {order.order_number}</DialogTitle>
              <DialogDescription>
                Update order status and add delivery details
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={updateData.status} onValueChange={(value) => setUpdateData({ ...updateData, status: value as "pending" | "accepted" | "rejected" | "not_in_stock" | "dispatched" | "delivered" })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="accepted">Accept Order</SelectItem>
                    <SelectItem value="rejected">Reject Order</SelectItem>
                    <SelectItem value="not_in_stock">Not in Stock</SelectItem>
                    <SelectItem value="dispatched">Dispatched</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Comments</Label>
                <Textarea
                  placeholder="Add comments for the dealer..."
                  value={updateData.vendor_comments}
                  onChange={(e) => setUpdateData({ ...updateData, vendor_comments: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Courier Details</Label>
                <Input
                  placeholder="e.g., Blue Dart, FedEx"
                  value={updateData.courier_details}
                  onChange={(e) => setUpdateData({ ...updateData, courier_details: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Tracking Number</Label>
                <Input
                  placeholder="e.g., BD123456789"
                  value={updateData.tracking_number}
                  onChange={(e) => setUpdateData({ ...updateData, tracking_number: e.target.value })}
                />
              </div>
              <Button onClick={handleUpdateOrder} className="w-full">
                Update Order
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );

  return (
    <DashboardLayout title="Vendor Dashboard">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Manage Orders</h2>
            <p className="text-muted-foreground">Review and update order status</p>
          </div>
          <Button variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            Raise Invoice
          </Button>
        </div>

        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending">
              Pending <Badge className="ml-2">{pendingOrders.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="active">
              Active <Badge className="ml-2">{activeOrders.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-6">
            {pendingOrders.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No pending orders</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {pendingOrders.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="active" className="mt-6">
            {activeOrders.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No active orders</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {activeOrders.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed" className="mt-6">
            {completedOrders.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No completed orders</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {completedOrders.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default VendorDashboard;
