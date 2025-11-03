import { useState, useEffect } from 'react';
import { orderService } from '../services/orderService';
import OrderDrawer from '../components/Orders/OrderDrawer';
import PendingOrdersSection from '../components/Orders/PendingOrdersSection';
import CompletedOrdersSection from '../components/Orders/CompletedOrdersSection';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showOrderDrawer, setShowOrderDrawer] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

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

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    // TODO: Open order detail modal
    alert(`Sipariş #${order.id} detayları:\n\nToplam: ₺${order.total_amount}\nÜrün Sayısı: ${order.items?.length || 0}`);
  };

  // Filter orders by status
  const pendingOrders = orders.filter(order => order.status === 'pending');
  const completedOrders = orders.filter(order => order.status === 'completed');

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
    </div>
  );
}
