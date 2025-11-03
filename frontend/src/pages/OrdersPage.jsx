import { useState, useEffect } from 'react';
import { orderService } from '../services/orderService';
import OrderDrawer from '../components/Orders/OrderDrawer';
import OrderDetailModal from '../components/Orders/OrderDetailModal';
import PendingOrdersSection from '../components/Orders/PendingOrdersSection';
import CompletedOrdersSection from '../components/Orders/CompletedOrdersSection';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showOrderDrawer, setShowOrderDrawer] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await orderService.getAll({ limit: 100 });
      setOrders(response.data || []);
    } catch (error) {
      console.error('Orders fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteOrder = async (orderId) => {
    if (!confirm('Bu siparişi tamamlamak istediğinize emin misiniz?')) {
      return;
    }

    try {
      await orderService.updateStatus(orderId, 'completed');
      alert('✅ Sipariş tamamlandı!');
      await fetchOrders();
    } catch (error) {
      console.error('Complete order error:', error);
      alert('❌ Hata: Sipariş tamamlanamadı');
    }
  };

  const handleCancelOrder = async (orderId) => {
    const reason = prompt('İptal nedeni (opsiyonel):');
    if (reason === null) return; // User clicked cancel

    try {
      await orderService.cancel(orderId, reason);
      alert('✅ Sipariş iptal edildi!');
      await fetchOrders();
    } catch (error) {
      console.error('Cancel order error:', error);
      alert('❌ Hata: Sipariş iptal edilemedi');
    }
  };

  const handleViewOrder = async (order) => {
    try {
      // Fetch full order details with items
      const response = await orderService.getById(order.id);
      setSelectedOrder(response.data);
      setShowDetailModal(true);
    } catch (error) {
      console.error('Failed to fetch order details:', error);
      alert('❌ Sipariş detayları yüklenemedi');
    }
  };

  // Filter orders by search term
  const filteredOrders = orders.filter(order => {
    if (!searchTerm) return true;

    const searchLower = searchTerm.toLowerCase();
    const orderId = order.id?.toString() || '';
    const orderNumber = order.order_number?.toLowerCase() || '';
    const userName = order.user_name?.toLowerCase() || '';
    const userEmail = order.user_email?.toLowerCase() || '';

    return (
      orderId.includes(searchLower) ||
      orderNumber.includes(searchLower) ||
      userName.includes(searchLower) ||
      userEmail.includes(searchLower)
    );
  });

  // Filter orders by status
  const pendingOrders = filteredOrders.filter(order => order.status === 'pending');
  const completedOrders = filteredOrders.filter(order => order.status === 'completed');

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Siparişler</h1>
          <p className="text-gray-600 mt-2">Sipariş yönetimi ve takibi</p>
        </div>
        <button
          onClick={() => setShowOrderDrawer(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
        >
          + Yeni Sipariş
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Sipariş ara (ID, sipariş no, müşteri adı veya email)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 pl-12 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl">
            🔍
          </span>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>
        {searchTerm && (
          <p className="text-sm text-gray-500 mt-2">
            {filteredOrders.length} sipariş bulundu
          </p>
        )}
      </div>

      {/* Pending Orders Section */}
      <PendingOrdersSection
        orders={pendingOrders}
        onComplete={handleCompleteOrder}
        onCancel={handleCancelOrder}
        onView={handleViewOrder}
        loading={loading}
      />

      {/* Completed Orders Section */}
      <CompletedOrdersSection
        orders={completedOrders}
        onView={handleViewOrder}
        loading={loading}
      />

      {/* Order Drawer */}
      <OrderDrawer
        isOpen={showOrderDrawer}
        onClose={() => setShowOrderDrawer(false)}
        onSuccess={() => {
          fetchOrders();
          setShowOrderDrawer(false);
        }}
      />

      {/* Order Detail Modal */}
      <OrderDetailModal
        order={selectedOrder}
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedOrder(null);
        }}
      />
    </div>
  );
}
