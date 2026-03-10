'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Progress } from '@/components/ui/progress';
import { 
  Search, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Package, 
  AlertCircle,
  CheckCircle,
  Brain,
  Calculator,
  Target,
  BarChart3,
  PieChart,
  LineChart,
  Download,
  RefreshCw,
  Lightbulb,
  ArrowRight
} from 'lucide-react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

import { useFirestore, useUser } from '@/firebase';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, BarChart, Bar } from 'recharts';

// Form validation schema for margin calculator
const marginCalculatorSchema = z.object({
  sellingPrice: z.number().min(0, "Selling price must be positive"),
  costPrice: z.number().min(0, "Cost price must be positive"),
  shippingCost: z.number().min(0, "Shipping cost must be positive").optional(),
  customsDuty: z.number().min(0, "Customs duty must be positive").optional(),
  insurance: z.number().min(0, "Insurance must be positive").optional(),
  otherCosts: z.number().min(0, "Other costs must be positive").optional()
});

type MarginCalculatorData = z.infer<typeof marginCalculatorSchema>;

interface Order {
  id: string;
  orderNumber: string;
  buyerCompanyName: string;
  totalValue: number;
  status: string;
  createdAt: any;
  lineItems: Array<{
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number
  }>;
}

interface AIInsight {
  type: 'opportunity' | 'risk' | 'trend' | 'recommendation';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  actionable: boolean;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const ExportAnalyzer: React.FC = () => {
  // Check if we're in a browser environment
  const isBrowser = typeof window !== 'undefined';
  
  if (!isBrowser) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='text-muted-foreground'>Loading...</div>
      </div>
    );
  }
  
  const { user, userProfile } = useUser();
  const firestore = useFirestore();
  
  // For now, use user.uid as orgId if userProfile.orgId is not available
  // TODO: Fix orgId assignment in user profile creation
  const orgId = userProfile?.orgId || user?.uid;
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [timeRange, setTimeRange] = useState<'7' | '30' | '90'>('30');
  const [chartData, setChartData] = useState<any[]>([]);
  const [profitabilityData, setProfitabilityData] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [marginResult, setMarginResult] = useState<any>(null);

  const calculatorForm = useForm<MarginCalculatorData>({
    resolver: zodResolver(marginCalculatorSchema),
    defaultValues: {
      sellingPrice: 0,
      costPrice: 0,
      shippingCost: 0,
      customsDuty: 0,
      insurance: 0,
      otherCosts: 0
    }
  });

  // Fetch orders data
  useEffect(() => {
    if (!orgId) return;

    const fetchData = async () => {
      try {
        const daysAgo = parseInt(timeRange);
        const startDate = subDays(new Date(), daysAgo);
        
        const ordersQuery = query(
          collection(firestore, 'exportOrders'),
          where('orgId', '==', user.orgId),
          where('createdAt', '>=', startDate),
          orderBy('createdAt', 'desc'),
          limit(100)
        );
        
        const ordersSnapshot = await getDocs(ordersQuery);
        const ordersData = ordersSnapshot.docs.map(doc => ({
          id: doc.id,
          orderNumber: doc.data().orderNumber || doc.id.slice(-6).toUpperCase(),
          buyerCompanyName: doc.data().buyer.companyName,
          totalValue: doc.data().totalValue,
          status: doc.data().status,
          createdAt: doc.data().createdAt,
          lineItems: doc.data().lineItems || []
        } as Order));
        
        setOrders(ordersData);
        
        // Prepare chart data
        prepareChartData(ordersData);
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching analyzer data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, [orgId, timeRange]);

  // Prepare chart data
  const prepareChartData = (ordersData: Order[]) => {
    // Daily revenue trend
    const dailyData = [];
    for (let i = parseInt(timeRange) - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);
      
      const dayOrders = ordersData.filter(order => 
        order.createdAt.toDate() >= dayStart && order.createdAt.toDate() <= dayEnd
      );
      
      dailyData.push({
        date: format(date, 'MMM dd'),
        orders: dayOrders.length,
        revenue: dayOrders.reduce((sum, order) => sum + order.totalValue, 0),
        avgOrderValue: dayOrders.length > 0 ? dayOrders.reduce((sum, order) => sum + order.totalValue, 0) / dayOrders.length : 0
      });
    }
    setChartData(dailyData);

    // Profitability by customer
    const customerProfitability = ordersData.reduce((acc, order) => {
      if (!acc[order.buyerCompanyName]) {
        acc[order.buyerCompanyName] = {
          name: order.buyerCompanyName,
          orders: 0,
          revenue: 0,
          estimatedCost: 0
        };
      }
      acc[order.buyerCompanyName].orders++;
      acc[order.buyerCompanyName].revenue += order.totalValue;
      acc[order.buyerCompanyName].estimatedCost += order.totalValue * 0.7; // Assume 70% cost
      return acc;
    }, {} as Record<string, any>);

    const profitabilityArray = Object.values(customerProfitability).map((customer: any) => ({
      name: customer.name,
      revenue: customer.revenue,
      profit: customer.revenue - customer.estimatedCost,
      margin: ((customer.revenue - customer.estimatedCost) / customer.revenue * 100).toFixed(1)
    }));

    setProfitabilityData(profitabilityArray);

    // Top products
    const productSales = ordersData.reduce((acc, order) => {
      order.lineItems.forEach(item => {
        if (!acc[item.productName]) {
          acc[item.productName] = {
            name: item.productName,
            quantity: 0,
            revenue: 0
          };
        }
        acc[item.productName].quantity += item.quantity;
        acc[item.productName].revenue += item.totalPrice;
      });
      return acc;
    }, {} as Record<string, any>);

    const topProductsArray = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    setTopProducts(topProductsArray);
  };

  // Generate AI insights (mock implementation)
  const generateAIInsights = async () => {
    setAnalyzing(true);
    
    // Simulate AI analysis
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const insights: AIInsight[] = [
      {
        type: 'opportunity',
        title: 'High-Value Customer Identified',
        description: 'Acme Corporation shows 25% higher order values than average. Consider prioritizing this relationship.',
        impact: 'high',
        actionable: true
      },
      {
        type: 'risk',
        title: 'Shipping Cost Increase Detected',
        description: 'Average shipping costs have increased by 15% in the last 30 days. Review carrier contracts.',
        impact: 'medium',
        actionable: true
      },
      {
        type: 'trend',
        title: 'Product Category Growth',
        description: 'Electronics category shows 35% growth month-over-month. Consider expanding inventory.',
        impact: 'medium',
        actionable: true
      },
      {
        type: 'recommendation',
        title: 'Optimize Order Processing',
        description: 'Orders under $5,000 take 40% longer to process. Consider streamlining small order workflows.',
        impact: 'low',
        actionable: true
      }
    ];
    
    setAiInsights(insights);
    setAnalyzing(false);
  };

  // Margin calculator
  const calculateMargin = (data: MarginCalculatorData) => {
    const totalCosts = data.costPrice + (data.shippingCost || 0) + (data.customsDuty || 0) + (data.insurance || 0) + (data.otherCosts || 0);
    const grossProfit = data.sellingPrice - totalCosts;
    const marginPercentage = data.sellingPrice > 0 ? (grossProfit / data.sellingPrice * 100) : 0;
    const markupPercentage = totalCosts > 0 ? (grossProfit / totalCosts * 100) : 0;

    setMarginResult({
      totalCosts,
      grossProfit,
      marginPercentage: marginPercentage.toFixed(2),
      markupPercentage: markupPercentage.toFixed(2),
      breakEvenPrice: totalCosts,
      recommendedPrice: totalCosts * 1.3 // 30% markup recommendation
    });
  };

  // Filter orders
  const filteredOrders = orders.filter(order => 
    order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.buyerCompanyName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'opportunity': return <TrendingUp className="h-5 w-5 text-green-500" />;
      case 'risk': return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'trend': return <LineChart className="h-5 w-5 text-blue-500" />;
      case 'recommendation': return <Lightbulb className="h-5 w-5 text-yellow-500" />;
      default: return <Brain className="h-5 w-5 text-gray-500" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Export Order Analyzer</h1>
          <p className="text-muted-foreground">AI-powered insights and margin analysis</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-32 bg-gray-100 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Export Order Analyzer</h1>
          <p className="text-muted-foreground">AI-powered insights and margin analysis</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={generateAIInsights} disabled={analyzing}>
            {analyzing ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Brain className="h-4 w-4 mr-2" />
            )}
            {analyzing ? 'Analyzing...' : 'Generate Insights'}
          </Button>
          <Dialog open={showCalculator} onOpenChange={setShowCalculator}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Calculator className="h-4 w-4 mr-2" />
                Margin Calculator
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Margin Calculator</DialogTitle>
              </DialogHeader>
              <Form {...calculatorForm}>
                <form onSubmit={calculatorForm.handleSubmit(calculateMargin)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={calculatorForm.control}
                      name="sellingPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Selling Price</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01"
                              placeholder="0.00"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={calculatorForm.control}
                      name="costPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cost Price</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01"
                              placeholder="0.00"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={calculatorForm.control}
                      name="shippingCost"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Shipping Cost</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01"
                              placeholder="0.00"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={calculatorForm.control}
                      name="customsDuty"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Customs Duty</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01"
                              placeholder="0.00"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={calculatorForm.control}
                      name="insurance"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Insurance</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01"
                              placeholder="0.00"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={calculatorForm.control}
                      name="otherCosts"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Other Costs</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01"
                              placeholder="0.00"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button type="submit" className="w-full">
                    Calculate Margin
                  </Button>

                  {marginResult && (
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-semibold mb-4">Calculation Results</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Total Costs:</span>
                          <div className="font-medium">${marginResult.totalCosts.toFixed(2)}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Gross Profit:</span>
                          <div className={`font-medium ${marginResult.grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ${marginResult.grossProfit.toFixed(2)}
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Margin %:</span>
                          <div className={`font-medium ${parseFloat(marginResult.marginPercentage) >= 20 ? 'text-green-600' : parseFloat(marginResult.marginPercentage) >= 10 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {marginResult.marginPercentage}%
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Markup %:</span>
                          <div className="font-medium">{marginResult.markupPercentage}%</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Break-even Price:</span>
                          <div className="font-medium">${marginResult.breakEvenPrice.toFixed(2)}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Recommended Price:</span>
                          <div className="font-medium text-green-600">${marginResult.recommendedPrice.toFixed(2)}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* AI Insights */}
      {aiInsights.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {aiInsights.map((insight, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  {getInsightIcon(insight.type)}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{insight.title}</h3>
                      <Badge className={getImpactColor(insight.impact)}>
                        {insight.impact} impact
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{insight.description}</p>
                    {insight.actionable && (
                      <Button variant="outline" size="sm">
                        Take Action
                        <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Time Range Selector */}
      <div className="flex items-center space-x-4">
        <span className="text-sm font-medium">Time Range:</span>
        <div className="flex space-x-2">
          <Button
            variant={timeRange === '7' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange('7')}
          >
            7 Days
          </Button>
          <Button
            variant={timeRange === '30' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange('30')}
          >
            30 Days
          </Button>
          <Button
            variant={timeRange === '90' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange('90')}
          >
            90 Days
          </Button>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsLineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} />
                <Line type="monotone" dataKey="avgOrderValue" stroke="#82ca9d" strokeWidth={2} />
              </RechartsLineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Customer Profitability</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={profitabilityData.slice(0, 5)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="revenue" fill="#8884d8" />
                <Bar dataKey="profit" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Products */}
      <Card>
        <CardHeader>
          <CardTitle>Top Products by Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topProducts.slice(0, 5).map((product, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium">{product.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {product.quantity} units sold
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">${product.revenue.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">
                    ${(product.revenue / product.quantity).toFixed(2)} avg price
                  </div>
                </div>
              </div>
            ))}
            {topProducts.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No product data available
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Order Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Order Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="space-y-4">
            {filteredOrders.slice(0, 5).map((order) => (
              <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium">{order.orderNumber}</div>
                  <div className="text-sm text-muted-foreground">{order.buyerCompanyName}</div>
                  <div className="text-xs text-muted-foreground">
                    {format(order.createdAt.toDate(), 'MMM dd, yyyy')}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">${order.totalValue.toLocaleString()}</div>
                  <Badge variant="outline" className="text-xs">
                    {order.status}
                  </Badge>
                </div>
              </div>
            ))}
            {filteredOrders.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No orders found
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExportAnalyzer;









