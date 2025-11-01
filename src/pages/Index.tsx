import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Users, TrendingUp } from "lucide-react";
import logo from "@/assets/logo.png";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-16 pt-8">
          <img src={logo} alt="Motilal Oswal" className="h-20 mx-auto mb-6" />
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Collateral Ordering System
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Streamline your merchandise ordering process with our comprehensive platform
          </p>
        </header>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Package className="h-10 w-10 text-primary mb-2" />
              <CardTitle>For Dealers</CardTitle>
              <CardDescription>
                Place orders for merchandise and track their status in real-time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Browse available products</li>
                <li>• Create orders easily</li>
                <li>• Track delivery status</li>
                <li>• View order history</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <TrendingUp className="h-10 w-10 text-primary mb-2" />
              <CardTitle>For Vendors</CardTitle>
              <CardDescription>
                Manage incoming orders and update delivery information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Receive order notifications</li>
                <li>• Accept or reject orders</li>
                <li>• Update delivery details</li>
                <li>• Raise invoices</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Users className="h-10 w-10 text-primary mb-2" />
              <CardTitle>For Admins</CardTitle>
              <CardDescription>
                Oversee all operations and monitor system activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• View all orders</li>
                <li>• Monitor order status</li>
                <li>• Track system metrics</li>
                <li>• Manage users</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <Button onClick={() => navigate("/auth")} size="lg" className="px-8">
            Get Started
          </Button>
          <p className="text-sm text-muted-foreground mt-4">
            Already have an account? Click above to login
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
