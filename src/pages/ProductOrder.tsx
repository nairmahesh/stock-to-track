import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import DealerLayout from "@/components/DealerLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, ShoppingCart, Ruler, TrendingUp } from "lucide-react";
import { toast } from "sonner";

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

const ProductOrder = () => {
  const navigate = useNavigate();
  const { productId } = useParams<{ productId: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Order form state
  const [quantity, setQuantity] = useState<number>(1);
  const [width, setWidth] = useState<string>("");
  const [height, setHeight] = useState<string>("");
  const [dimensionUnit, setDimensionUnit] = useState<string>("feet");
  const [notes, setNotes] = useState<string>("");

  useEffect(() => {
    checkAuth();
    if (productId) {
      fetchProduct();
    }
  }, [productId]);

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

  const fetchProduct = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", productId)
        .eq("is_active", true)
        .single();

      if (error) throw error;
      
      setProduct(data);
      if (data.min_quantity) {
        setQuantity(data.min_quantity);
      }
    } catch (error: any) {
      toast.error("Failed to load product");
      navigate("/dealer");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!product) return;

    // Validation
    if (product.requires_dimensions) {
      if (!width || !height) {
        toast.error("Please enter dimensions");
        return;
      }
      if (parseFloat(width) <= 0 || parseFloat(height) <= 0) {
        toast.error("Dimensions must be greater than 0");
        return;
      }
    }

    if (!product.requires_dimensions && quantity < (product.min_quantity || 1)) {
      toast.error(`Minimum quantity is ${product.min_quantity}`);
      return;
    }

    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Prepare order notes
      let orderNotes = notes;
      if (product.requires_dimensions) {
        orderNotes = `Dimensions: ${width} x ${height} ${dimensionUnit}${notes ? '\n' + notes : ''}`;
      }

      // Create order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          dealer_id: user.id,
          total_items: product.requires_dimensions ? 1 : quantity,
          notes: orderNotes,
          order_number: "",
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order item
      const { error: itemError } = await supabase
        .from("order_items")
        .insert({
          order_id: order.id,
          product_id: product.id,
          quantity: product.requires_dimensions ? 1 : quantity,
        });

      if (itemError) throw itemError;

      toast.success("Order placed successfully!");
      navigate("/dealer");
    } catch (error: any) {
      toast.error(error.message || "Failed to place order");
    } finally {
      setSubmitting(false);
    }
  };

  const isMostPurchased = (productName: string) => {
    const popularItems = ['business cards', 'pens', 't-shirts', 'banners'];
    return popularItems.some(item => productName.toLowerCase().includes(item));
  };

  if (loading) {
    return (
      <DealerLayout title="Order Product">
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </DealerLayout>
    );
  }

  if (!product) {
    return (
      <DealerLayout title="Product Not Found">
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Product not found</h3>
            <Button onClick={() => navigate("/dealer")}>Back to Dashboard</Button>
          </CardContent>
        </Card>
      </DealerLayout>
    );
  }

  return (
    <DealerLayout title="Order Form">
      <div className="max-w-4xl mx-auto space-y-6">
        <Button variant="outline" onClick={() => navigate("/dealer")}>
          ← Back to Dashboard
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-3">
                  {product.name}
                  {isMostPurchased(product.name) && (
                    <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Popular Item
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  {product.category && `Category: ${product.category}`}
                  {product.sku && ` • SKU: ${product.sku}`}
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Product Image */}
              <div className="aspect-square relative overflow-hidden rounded-lg bg-muted">
                {product.image_url ? (
                  <img 
                    src={product.image_url} 
                    alt={product.name}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="h-24 w-24 text-muted-foreground/40" />
                  </div>
                )}
              </div>

              {/* Order Form */}
              <div className="space-y-4">
                {product.description && (
                  <div>
                    <h4 className="font-semibold mb-2">Description</h4>
                    <p className="text-sm text-muted-foreground">{product.description}</p>
                  </div>
                )}

                {/* Dynamic Input Fields */}
                {product.requires_dimensions ? (
                  <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                    <div className="flex items-center gap-2 mb-3">
                      <Ruler className="h-5 w-5 text-primary" />
                      <h4 className="font-semibold">Specify Dimensions</h4>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="width">Width</Label>
                        <Input
                          id="width"
                          type="number"
                          min="0"
                          step="0.1"
                          value={width}
                          onChange={(e) => setWidth(e.target.value)}
                          placeholder="Enter width"
                        />
                      </div>
                      <div>
                        <Label htmlFor="height">Height</Label>
                        <Input
                          id="height"
                          type="number"
                          min="0"
                          step="0.1"
                          value={height}
                          onChange={(e) => setHeight(e.target.value)}
                          placeholder="Enter height"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="unit">Unit</Label>
                      <Select value={dimensionUnit} onValueChange={setDimensionUnit}>
                        <SelectTrigger id="unit">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="feet">Feet</SelectItem>
                          <SelectItem value="cm">Centimeters</SelectItem>
                          <SelectItem value="inch">Inches</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Badge variant="outline" className="w-fit">
                      Quantity: 1 unit
                    </Badge>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="quantity">
                      Quantity {product.min_quantity && `(Min: ${product.min_quantity})`}
                    </Label>
                    <Input
                      id="quantity"
                      type="number"
                      min={product.min_quantity || 1}
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                      placeholder="Enter quantity"
                    />
                    <p className="text-xs text-muted-foreground">
                      {product.unit_type ? `Unit type: ${product.unit_type}` : 'Units'}
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="notes">Additional Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any special requirements or instructions..."
                    rows={3}
                  />
                </div>

                <div className="pt-4 space-y-3">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm font-medium">Order Summary</p>
                    <p className="text-sm text-muted-foreground">
                      {product.name} • {product.requires_dimensions 
                        ? `${width && height ? `${width}x${height} ${dimensionUnit}` : 'Custom size'}`
                        : `${quantity} ${product.unit_type || 'units'}`
                      }
                    </p>
                  </div>

                  <Button 
                    onClick={handleSubmit} 
                    disabled={submitting}
                    className="w-full"
                    size="lg"
                  >
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    {submitting ? "Placing Order..." : "Place Order"}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DealerLayout>
  );
};

export default ProductOrder;
