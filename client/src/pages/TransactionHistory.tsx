
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Search, 
  Filter, 
  Calendar,
  TrendingUp,
  TrendingDown,
  Coins,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  ShoppingCart,
  Gamepad2
} from "lucide-react";

interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'game_win' | 'game_loss' | 'referral' | 'farm_harvest' | 'exchange' | 'purchase';
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  createdAt: string;
  description: string;
  reference?: string;
  fromCurrency?: string;
  toCurrency?: string;
}

export default function TransactionHistory() {
  const { getAuthHeaders } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const { data: transactions, isLoading } = useQuery({
    queryKey: ["/api/transactions", filterType, filterStatus],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterType !== "all") params.append("type", filterType);
      if (filterStatus !== "all") params.append("status", filterStatus);
      
      const response = await fetch(`/api/transactions?${params.toString()}`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch transactions");
      return response.json();
    },
  });

  const { data: summary } = useQuery({
    queryKey: ["/api/transactions/summary"],
    queryFn: async () => {
      const response = await fetch("/api/transactions/summary", {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch summary");
      return response.json();
    },
  });

  const filteredTransactions = transactions?.filter((tx: Transaction) =>
    tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tx.reference?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownLeft className="h-4 w-4 text-green-600" />;
      case 'withdrawal':
        return <ArrowUpRight className="h-4 w-4 text-red-600" />;
      case 'game_win':
        return <TrendingUp className="h-4 w-4 text-blue-600" />;
      case 'game_loss':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      case 'referral':
        return <Coins className="h-4 w-4 text-purple-600" />;
      case 'farm_harvest':
        return <Coins className="h-4 w-4 text-green-600" />;
      case 'exchange':
        return <RefreshCw className="h-4 w-4 text-orange-600" />;
      case 'purchase':
        return <ShoppingCart className="h-4 w-4 text-blue-600" />;
      default:
        return <Coins className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'deposit':
      case 'game_win':
      case 'referral':
      case 'farm_harvest':
        return 'text-green-600';
      case 'withdrawal':
      case 'game_loss':
      case 'purchase':
        return 'text-red-600';
      case 'exchange':
        return 'text-orange-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'deposit':
        return 'إيداع';
      case 'withdrawal':
        return 'سحب';
      case 'game_win':
        return 'ربح لعبة';
      case 'game_loss':
        return 'خسارة لعبة';
      case 'referral':
        return 'إحالة';
      case 'farm_harvest':
        return 'حصاد مزرعة';
      case 'exchange':
        return 'تحويل عملة';
      case 'purchase':
        return 'شراء';
      default:
        return 'غير محدد';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'مكتمل';
      case 'pending':
        return 'في الانتظار';
      case 'failed':
        return 'فاشل';
      default:
        return 'غير محدد';
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded-lg"></div>
          <div className="h-16 bg-gray-200 rounded-lg"></div>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 animate-fade-in">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي الإيداعات</p>
                <p className="text-2xl font-bold text-green-600">
                  {summary?.totalDeposits || "0.00"} AC
                </p>
              </div>
              <ArrowDownLeft className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي السحوبات</p>
                <p className="text-2xl font-bold text-red-600">
                  {summary?.totalWithdrawals || "0.00"} AC
                </p>
              </div>
              <ArrowUpRight className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي الأرباح</p>
                <p className="text-2xl font-bold text-blue-600">
                  {summary?.totalEarnings || "0.00"} AC
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            تصفية المعاملات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="البحث في المعاملات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger>
                <SelectValue placeholder="نوع المعاملة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأنواع</SelectItem>
                <SelectItem value="deposit">إيداع</SelectItem>
                <SelectItem value="withdrawal">سحب</SelectItem>
                <SelectItem value="exchange">تحويل عملة</SelectItem>
                <SelectItem value="game_win">ربح لعبة</SelectItem>
                <SelectItem value="game_loss">خسارة لعبة</SelectItem>
                <SelectItem value="referral">إحالة</SelectItem>
                <SelectItem value="farm_harvest">حصاد مزرعة</SelectItem>
                <SelectItem value="purchase">شراء</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="حالة المعاملة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="completed">مكتمل</SelectItem>
                <SelectItem value="pending">في الانتظار</SelectItem>
                <SelectItem value="failed">فاشل</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Transactions List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>تاريخ المعاملات</span>
            <Badge variant="secondary">
              {filteredTransactions.length} معاملة
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-12">
              <Coins className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">لا توجد معاملات مطابقة للمرشحات المحددة</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTransactions.map((transaction: Transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-full">
                      {getTransactionIcon(transaction.type)}
                    </div>
                    <div>
                      <p className="font-semibold">{transaction.description}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(transaction.createdAt).toLocaleDateString('ar-EG')}</span>
                        <span>{new Date(transaction.createdAt).toLocaleTimeString('ar-EG')}</span>
                        {transaction.reference && (
                          <>
                            <span>•</span>
                            <span>المرجع: {transaction.reference}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className={`text-lg font-bold ${getTransactionColor(transaction.type)}`}>
                      {transaction.type.includes('loss') || transaction.type === 'withdrawal' || transaction.type === 'purchase' ? '-' : '+'}
                      {transaction.amount.toFixed(2)} AC
                    </p>
                    <div className="flex items-center gap-2 justify-end">
                      <Badge className={getStatusColor(transaction.status)}>
                        <span className="flex items-center gap-1">
                          {getStatusIcon(transaction.status)}
                          {getStatusLabel(transaction.status)}
                        </span>
                      </Badge>
                      <Badge variant="outline">
                        {getTypeLabel(transaction.type)}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Export Button */}
      <div className="flex justify-center">
        <Button variant="outline">
          <ArrowDownLeft className="h-4 w-4 mr-2" />
          تصدير المعاملات
        </Button>
      </div>
    </div>
  );
}
