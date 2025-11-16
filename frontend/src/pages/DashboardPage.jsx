import { useState, useEffect } from 'react';
import { productService } from '../services/productService';
import { orderService } from '../services/orderService';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    lowStockProducts: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    loading: true,
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch products
      const productsRes = await productService.getAll({ limit: 100 });
      const totalProducts = productsRes.data?.length || 0;

      // Get low stock products
      const lowStockRes = await productService.getAll({ lowStock: 10, limit: 100 });
      const lowStockProducts = lowStockRes.data?.length || 0;

      // Fetch orders
      const ordersRes = await orderService.getAll({ limit: 100 });
      const ordersData = ordersRes.data || [];
      const totalOrders = ordersData.length || 0;
      const pendingOrders = ordersData.filter(o => o.status === 'pending').length || 0;

      // Calculate revenue
      const completedOrders = ordersData.filter(o => o.status === 'completed') || [];
      const totalRevenue = completedOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);

      setStats({
        totalProducts,
        totalOrders,
        lowStockProducts,
        pendingOrders,
        totalRevenue,
        loading: false,
      });
    } catch (error) {
      console.error('Dashboard data fetch error:', error);
      setStats(prev => ({ ...prev, loading: false }));
    }
  };

  const kpiCards = [
    {
      title: 'Toplam Ürün',
      value: stats.totalProducts,
      icon: '📦',
      gradient: 'from-blue-500 to-blue-600',
    },
    {
      title: 'Toplam Sipariş',
      value: stats.totalOrders,
      icon: '🛒',
      gradient: 'from-green-500 to-green-600',
    },
    {
      title: 'Düşük Stok Uyarısı',
      value: stats.lowStockProducts,
      icon: '⚠️',
      gradient: 'from-yellow-500 to-yellow-600',
    },
    {
      title: 'Toplam Gelir',
      value: `₺${stats.totalRevenue.toFixed(2)}`,
      icon: '💰',
      gradient: 'from-purple-500 to-purple-600',
    },
  ];

  if (stats.loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Veriler yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-600 mt-2">Sistem özeti ve istatistikler</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((card, index) => (
          <div
            key={index}
            className={`bg-gradient-to-br ${card.gradient} p-6 rounded-xl text-white shadow-lg hover:shadow-xl transition`}
          >
            <div className="text-3xl mb-2">{card.icon}</div>
            <h3 className="text-sm font-medium opacity-90 mb-1">{card.title}</h3>
            <p className="text-3xl font-bold">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Stats */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Hızlı İstatistikler</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-600">Bekleyen Siparişler</span>
              <span className="font-semibold text-yellow-600">{stats.pendingOrders}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-600">Düşük Stok Ürünler</span>
              <span className="font-semibold text-red-600">{stats.lowStockProducts}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-600">Tamamlanan Siparişler</span>
              <span className="font-semibold text-green-600">
                {stats.totalOrders - stats.pendingOrders}
              </span>
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl p-6 text-white">
          <h2 className="text-xl font-bold mb-4">Sistem Durumu</h2>
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-300 rounded-full animate-pulse"></div>
              <span>Backend API: Aktif</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-300 rounded-full animate-pulse"></div>
              <span>Database: Bağlı</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-yellow-300 rounded-full"></div>
              <span>Redis Cache: Kapalı</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-300 rounded-full animate-pulse"></div>
              <span>Frontend: Çalışıyor</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
