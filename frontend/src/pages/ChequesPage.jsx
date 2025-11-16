import { useState, useEffect } from 'react';
import { chequeService } from '../services/chequeService';

export default function ChequesPage() {
  const [cheques, setCheques] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [editingCheque, setEditingCheque] = useState(null);
  const [selectedCheque, setSelectedCheque] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [formData, setFormData] = useState({
    cheque_number: '',
    amount: '',
    currency: 'TRY',
    issue_date: '',
    due_date: '',
    drawer_name: '',
    drawer_tax_number: '',
    bank_name: '',
    bank_branch: '',
    account_number: '',
    payee_name: '',
    type: 'receivable',
    notes: '',
  });
  const [statusFormData, setStatusFormData] = useState({
    status: '',
    notes: '',
  });

  useEffect(() => {
    fetchCheques();
  }, [filterType, filterStatus]);

  const fetchCheques = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterType !== 'all') params.type = filterType;
      if (filterStatus !== 'all') params.status = filterStatus;

      const response = await chequeService.getAll(params);
      setCheques(response.data || []);
    } catch (error) {
      console.error('Cheques fetch error:', error);
      alert('❌ Çekler yüklenemedi!');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCheque) {
        await chequeService.update(editingCheque.id, formData);
        alert('✅ Çek başarıyla güncellendi!');
      } else {
        await chequeService.create(formData);
        alert('✅ Çek başarıyla eklendi!');
      }
      setShowModal(false);
      resetForm();
      await fetchCheques();
    } catch (error) {
      alert('❌ Hata: ' + (error.response?.data?.message || 'İşlem başarısız!'));
    }
  };

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    try {
      await chequeService.updateStatus(
        selectedCheque.id,
        statusFormData.status,
        statusFormData.notes
      );
      alert('✅ Çek durumu başarıyla güncellendi!');
      setShowStatusModal(false);
      setSelectedCheque(null);
      setStatusFormData({ status: '', notes: '' });
      await fetchCheques();
    } catch (error) {
      alert('❌ Hata: ' + (error.response?.data?.message || 'İşlem başarısız!'));
    }
  };

  const handleEdit = (cheque) => {
    setEditingCheque(cheque);
    setFormData({
      cheque_number: cheque.cheque_number,
      amount: cheque.amount,
      currency: cheque.currency,
      issue_date: cheque.issue_date?.split('T')[0],
      due_date: cheque.due_date?.split('T')[0],
      drawer_name: cheque.drawer_name,
      drawer_tax_number: cheque.drawer_tax_number || '',
      bank_name: cheque.bank_name,
      bank_branch: cheque.bank_branch || '',
      account_number: cheque.account_number || '',
      payee_name: cheque.payee_name || '',
      type: cheque.type,
      notes: cheque.notes || '',
    });
    setShowModal(true);
  };

  const handleChangeStatus = (cheque) => {
    setSelectedCheque(cheque);
    setStatusFormData({ status: cheque.status, notes: '' });
    setShowStatusModal(true);
  };

  const handleDelete = async (id, chequeNumber) => {
    if (window.confirm(`"${chequeNumber}" numaralı çeki silmek istediğinize emin misiniz?`)) {
      try {
        await chequeService.delete(id);
        alert('✅ Çek başarıyla silindi!');
        await fetchCheques();
      } catch (error) {
        alert('❌ Hata: ' + (error.response?.data?.message || 'Silme işlemi başarısız!'));
      }
    }
  };

  const resetForm = () => {
    setFormData({
      cheque_number: '',
      amount: '',
      currency: 'TRY',
      issue_date: '',
      due_date: '',
      drawer_name: '',
      drawer_tax_number: '',
      bank_name: '',
      bank_branch: '',
      account_number: '',
      payee_name: '',
      type: 'receivable',
      notes: '',
    });
    setEditingCheque(null);
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      deposited: 'bg-blue-100 text-blue-800',
      cashed: 'bg-green-100 text-green-800',
      bounced: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status) => {
    const texts = {
      pending: 'Beklemede',
      deposited: 'Yatırıldı',
      cashed: 'Tahsil Edildi',
      bounced: 'Karşılıksız',
      cancelled: 'İptal Edildi',
    };
    return texts[status] || status;
  };

  const getTypeText = (type) => {
    return type === 'receivable' ? 'Alacak Çek' : 'Borç Çek';
  };

  const getTypeColor = (type) => {
    return type === 'receivable' ? 'text-green-600' : 'text-red-600';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  const formatCurrency = (amount, currency = 'TRY') => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Çek Yönetimi</h1>
          <p className="text-gray-600 mt-2">Alacak ve borç çeklerini yönetin</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          + Yeni Çek Ekle
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-md flex gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Tür</label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="border rounded px-3 py-2"
          >
            <option value="all">Tümü</option>
            <option value="receivable">Alacak Çekler</option>
            <option value="payable">Borç Çekler</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Durum</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border rounded px-3 py-2"
          >
            <option value="all">Tümü</option>
            <option value="pending">Beklemede</option>
            <option value="deposited">Yatırıldı</option>
            <option value="cashed">Tahsil Edildi</option>
            <option value="bounced">Karşılıksız</option>
            <option value="cancelled">İptal Edildi</option>
          </select>
        </div>
      </div>

      {/* Cheques Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Yükleniyor...</div>
        ) : cheques.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Henüz çek bulunmuyor</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Çek No</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tür</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Keşideci</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Banka</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tutar</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vade Tarihi</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Durum</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">İşlemler</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {cheques.map((cheque) => (
                  <tr key={cheque.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {cheque.cheque_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`font-semibold ${getTypeColor(cheque.type)}`}>
                        {getTypeText(cheque.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {cheque.drawer_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {cheque.bank_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {formatCurrency(cheque.amount, cheque.currency)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(cheque.due_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(cheque.status)}`}>
                        {getStatusText(cheque.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleChangeStatus(cheque)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Durum Değiştir
                      </button>
                      <button
                        onClick={() => handleEdit(cheque)}
                        className="text-yellow-600 hover:text-yellow-900"
                        disabled={['cashed', 'cancelled'].includes(cheque.status)}
                      >
                        Düzenle
                      </button>
                      <button
                        onClick={() => handleDelete(cheque.id, cheque.cheque_number)}
                        className="text-red-600 hover:text-red-900"
                        disabled={!['pending', 'cancelled'].includes(cheque.status)}
                      >
                        Sil
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">
                {editingCheque ? 'Çek Düzenle' : 'Yeni Çek Ekle'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Çek Numarası *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.cheque_number}
                      onChange={(e) => setFormData({ ...formData, cheque_number: e.target.value })}
                      className="w-full border rounded px-3 py-2"
                      disabled={editingCheque}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tür *</label>
                    <select
                      required
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full border rounded px-3 py-2"
                    >
                      <option value="receivable">Alacak Çek</option>
                      <option value="payable">Borç Çek</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tutar *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Para Birimi</label>
                    <select
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                      className="w-full border rounded px-3 py-2"
                    >
                      <option value="TRY">TRY</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Keşide Tarihi *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.issue_date}
                      onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Vade Tarihi *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.due_date}
                      onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Keşideci Adı *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.drawer_name}
                    onChange={(e) => setFormData({ ...formData, drawer_name: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vergi/TC Numarası
                  </label>
                  <input
                    type="text"
                    value={formData.drawer_tax_number}
                    onChange={(e) => setFormData({ ...formData, drawer_tax_number: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Banka *</label>
                    <input
                      type="text"
                      required
                      value={formData.bank_name}
                      onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Şube</label>
                    <input
                      type="text"
                      value={formData.bank_branch}
                      onChange={(e) => setFormData({ ...formData, bank_branch: e.target.value })}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hesap Numarası
                  </label>
                  <input
                    type="text"
                    value={formData.account_number}
                    onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lehdar</label>
                  <input
                    type="text"
                    value={formData.payee_name}
                    onChange={(e) => setFormData({ ...formData, payee_name: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notlar</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                    rows="3"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {editingCheque ? 'Güncelle' : 'Ekle'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Status Change Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">Durum Değiştir</h2>
              <form onSubmit={handleStatusUpdate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Yeni Durum *
                  </label>
                  <select
                    required
                    value={statusFormData.status}
                    onChange={(e) => setStatusFormData({ ...statusFormData, status: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="">Seçiniz</option>
                    <option value="pending">Beklemede</option>
                    <option value="deposited">Yatırıldı</option>
                    <option value="cashed">Tahsil Edildi</option>
                    <option value="bounced">Karşılıksız</option>
                    <option value="cancelled">İptal Edildi</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notlar</label>
                  <textarea
                    value={statusFormData.notes}
                    onChange={(e) => setStatusFormData({ ...statusFormData, notes: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                    rows="3"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowStatusModal(false);
                      setSelectedCheque(null);
                      setStatusFormData({ status: '', notes: '' });
                    }}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Güncelle
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
