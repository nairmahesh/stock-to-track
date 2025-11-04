import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Package, Clock, CheckCircle, XCircle, Truck, ShoppingCart, TrendingUp, Heart } from "lucide-react";
import { toast } from "sonner";

interface Order {
  id: string;
  order_number: string;
  status: string;
  total_items: number;
  created_at: string;
  vendor_comments: string | null;
  courier_details: string | null;
  tracking_number: string | null;
}

interface Product {
  id: string;
  name: string;
  category: string | null;
  sku: string | null;
  description: string | null;
  image_url: string | null;
  unit_type: string | null;
  min_quantity: number | null;
  requires_dimensions: boolean | null;
}

const DealerDashboard = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());

  useEffect(() => {
    checkAuth();
    fetchOrders();
    fetchProducts();
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

    if (profile?.role !== "dealer") {
      toast.error("Access denied");
      navigate("/auth");
    }
  };

  const fetchOrders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("dealer_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error: any) {
      toast.error("Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("name")
        .limit(6);

      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      console.error("Failed to fetch products:", error);
    }
  };

  const toggleWishlist = (productId: string) => {
    setWishlist(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
        toast.success("Removed from wishlist");
      } else {
        newSet.add(productId);
        toast.success("Added to wishlist");
      }
      return newSet;
    });
  };

  const isMostPurchased = (productName: string) => {
    // Simulate most purchased items - in real app, this would come from analytics
    const popularItems = ['business cards', 'pens', 't-shirts', 'banners'];
    return popularItems.some(item => productName.toLowerCase().includes(item));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "accepted":
        return <CheckCircle className="h-4 w-4" />;
      case "rejected":
      case "not_in_stock":
        return <XCircle className="h-4 w-4" />;
      case "dispatched":
      case "delivered":
        return <Truck className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
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

  return (
    <DashboardLayout title="Dealer Dashboard">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
            <p className="text-muted-foreground">Manage your merchandise orders</p>
          </div>
          <Button onClick={() => navigate("/dealer/new-order")} size="lg">
            <ShoppingCart className="h-5 w-5 mr-2" />
            New Order
          </Button>
        </div>

        {products.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Available Merchandise
                  </CardTitle>
                  <CardDescription>Browse our product catalog</CardDescription>
                </div>
                <Button variant="outline" onClick={() => navigate("/dealer/new-order")}>
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                {products.map((product) => (
                  <Card 
                    key={product.id} 
                    className="group hover:shadow-lg transition-all cursor-pointer relative overflow-hidden border hover:border-primary/50"
                    onClick={() => navigate(`/dealer/order/${product.id}`)}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWishlist(product.id);
                      }}
                      className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-colors"
                    >
                      <Heart 
                        className={`h-3 w-3 transition-colors ${
                          wishlist.has(product.id) ? 'fill-red-500 text-red-500' : 'text-muted-foreground'
                        }`} 
                      />
                    </button>
                    
                    {isMostPurchased(product.name) && (
                      <div className="absolute top-2 left-2 z-10">
                        <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 text-xs px-1.5 py-0.5">
                          <TrendingUp className="h-2.5 w-2.5 mr-0.5" />
                          Popular
                        </Badge>
                      </div>
                    )}

                    <div className="aspect-square relative overflow-hidden bg-muted">
                      {product.image_url ? (
                        <img 
                          src={product.image_url} 
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-8 w-8 text-muted-foreground/40" />
                        </div>
                      )}
                    </div>

                    <CardHeader className="p-3 pb-2">
                      <CardTitle className="text-xs line-clamp-1">
                        {product.name}
                      </CardTitle>
                      {product.category && (
                        <Badge variant="secondary" className="text-[10px] w-fit px-1.5 py-0">
                          {product.category}
                        </Badge>
                      )}
                    </CardHeader>
                    
                    <CardContent className="p-3 pt-0">
                      {product.min_quantity && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          Min: {product.min_quantity}
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold">Your Orders</h3>
            {orders.length > 0 && (
              <Badge variant="secondary">{orders.length} total</Badge>
            )}
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading...</p>
            </div>
          ) : orders.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No orders yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start by placing your first order
                </p>
                <Button onClick={() => navigate("/dealer/new-order")}>
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Place Order
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {orders.map((order) => (
                <Card key={order.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {order.order_number}
                          <Badge variant="outline" className={getStatusColor(order.status)}>
                            {getStatusIcon(order.status)}
                            <span className="ml-1 capitalize">{order.status.replace("_", " ")}</span>
                          </Badge>
                        </CardTitle>
                        <CardDescription>
                          Placed on {new Date(order.created_at).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Items</p>
                        <p className="text-2xl font-bold">{order.total_items}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {order.vendor_comments && (
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-sm font-medium mb-1">Vendor Comments:</p>
                        <p className="text-sm text-muted-foreground">{order.vendor_comments}</p>
                      </div>
                    )}
                    {order.tracking_number && (
                      <div className="flex items-center gap-2 text-sm">
                        <Truck className="h-4 w-4 text-primary" />
                        <span className="font-medium">Tracking:</span>
                        <span className="font-mono">{order.tracking_number}</span>
                      </div>
                    )}
                    {order.courier_details && (
                      <div className="text-sm">
                        <span className="font-medium">Courier:</span> {order.courier_details}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DealerDashboard;
