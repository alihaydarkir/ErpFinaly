import { useState, useEffect } from 'react';
import { orderService } from '../../services/orderService';
import OrderCart from './OrderCart';
import AddProductToOrder from './AddProductToOrder';

export default function OrderDrawer({ isOpen, onClose, onSuccess }) {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchCustomers();
    }
  }, [isOpen]);

  const fetchCustomers = async () => {
    try {
      // Fetch users for customer selection
      const response = await fetch('http://localhost:5000/api/users', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setCustomers(data.data || []);
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    }
  };

  const handleAddToCart = (product) => {
    // Check if product already exists in cart
    const existingIndex = cartItems.findIndex(item => item.id === product.id);

    if (existingIndex !== -1) {
      // Update quantity if product exists
      const newItems = [...cartItems];
      const newQuantity = newItems[existingIndex].quantity + product.quantity;

      if (newQuantity > product.stock_quantity) {
        alert(`Maksimum ${product.stock_quantity} adet ekleyebilirsiniz`);
        return;
      }

      newItems[existingIndex].quantity = newQuantity;
      setCartItems(newItems);
    } else {
      // Add new product
      setCartItems([...cartItems, product]);
    }
  };

  const handleRemoveFromCart = (index) => {
    const newItems = cartItems.filter((_, i) => i !== index);
    setCartItems(newItems);
  };

  const handleUpdateQuantity = (index, newQuantity) => {
    const newItems = [...cartItems];
    newItems[index].quantity = newQuantity;
    setCartItems(newItems);
  };

  const handleSubmit = async () => {
    if (!selectedCustomer) {
      alert('Lütfen müşteri seçin');
      return;
    }

    if (cartItems.length === 0) {
      alert('Sepete en az bir ürün ekleyin');
      return;
    }

    setLoading(true);
    try {
      // Prepare order items
      const items = cartItems.map(item => ({
        product_id: item.id,
        quantity: item.quantity,
        price: item.price
      }));

      const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      // Create order
      await orderService.create({
        user_id: parseInt(selectedCustomer),
        items: items,
        total_amount: totalAmount,
        status: 'pending'
      });

      alert('✅ Sipariş başarıyla oluşturuldu!');
      handleClose();
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Create order error:', error);
      alert('❌ Hata: ' + (error.response?.data?.message || 'Sipariş oluşturulamadı'));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedCustomer('');
    setOrderDate(new Date().toISOString().split('T')[0]);
    setCartItems([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-end z-50">
      <div className="bg-white w-full max-w-2xl h-full overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">✨ Yeni Sipariş Oluştur</h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Customer Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Müşteri
            </label>
            <select
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Müşteri Seçin</option>
              {customers.map(customer => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} ({customer.email})
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Tarih
            </label>
            <input
              type="date"
              value={orderDate}
              onChange={(e) => setOrderDate(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Order Cart */}
          <div>
            <OrderCart
              items={cartItems}
              onRemoveItem={handleRemoveFromCart}
              onUpdateQuantity={handleUpdateQuantity}
            />
          </div>

          {/* Add Product Section */}
          <div>
            <AddProductToOrder onAddToCart={handleAddToCart} />
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t p-6 flex space-x-3">
          <button
            onClick={handleClose}
            className="flex-1 py-3 border rounded-lg hover:bg-gray-50 font-semibold"
          >
            İptal
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || cartItems.length === 0}
            className={`flex-1 py-3 rounded-lg font-semibold transition ${
              loading || cartItems.length === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {loading ? 'Oluşturuluyor...' : '✅ Sipariş Oluştur'}
          </button>
        </div>
      </div>
    </div>
  );
}
