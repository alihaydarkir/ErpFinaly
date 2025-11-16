import React, { useState, useEffect } from 'react';
import useChequeStore from '../store/chequeStore';
import chequeService from '../services/chequeService';
import ChequeStatistics from '../components/Cheques/ChequeStatistics';
import ChequeList from '../components/Cheques/ChequeList';
import ChequeForm from '../components/Cheques/ChequeForm';
import ChequeDetailView from '../components/Cheques/ChequeDetailView';
import ChequeExcelImport from '../components/Cheques/ChequeExcelImport';
import DueSoonAlert from '../components/Cheques/DueSoonAlert';

const ChequesPage = () => {
  const {
    setCheques,
    addCheque,
    updateCheque,
    deleteCheque,
    setStatistics,
    setDueSoonCheques,
    setOverdueCheques,
    setPagination,
    setLoading,
    setError,
    getQueryParams
  } = useChequeStore();

  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [selectedCheque, setSelectedCheque] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [editingCheque, setEditingCheque] = useState(null);

  // Load data on mount and when filters/pagination change
  useEffect(() => {
    loadCheques();
    loadStatistics();
    loadDueSoon();
  }, []);

  // Reload cheques when filters or pagination change
  const store = useChequeStore();
  useEffect(() => {
    loadCheques();
  }, [store.filters, store.pagination.page, store.pagination.limit, store.sorting]);

  const loadCheques = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = getQueryParams();
      const response = await chequeService.getAll(params);

      if (response.success) {
        setCheques(response.data);
        setPagination({
          page: response.page,
          limit: response.limit,
          total: response.total
        });
      }
    } catch (error) {
      console.error('Failed to load cheques:', error);
      setError('Çekler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const response = await chequeService.getStatistics();
      if (response.success) {
        setStatistics(response.data);
      }
    } catch (error) {
      console.error('Failed to load statistics:', error);
    }
  };

  const loadDueSoon = async () => {
    try {
      const response = await chequeService.getDueSoon(7);
      if (response.success) {
        setDueSoonCheques(response.data.dueSoon || []);
        setOverdueCheques(response.data.overdue || []);
      }
    } catch (error) {
      console.error('Failed to load due soon cheques:', error);
    }
  };

  const handleCreateCheque = async (data) => {
    try {
      const response = await chequeService.create(data);
      if (response.success) {
        addCheque(response.data);
        setShowForm(false);
        loadCheques();
        loadStatistics();
        loadDueSoon();
        alert('Çek başarıyla eklendi');
      }
    } catch (error) {
      console.error('Failed to create cheque:', error);
      alert('Çek eklenirken hata oluştu');
    }
  };

  const handleUpdateCheque = async (data) => {
    try {
      const response = await chequeService.update(editingCheque.id, data);
      if (response.success) {
        updateCheque(editingCheque.id, response.data);
        setEditingCheque(null);
        setShowForm(false);
        loadCheques();
        loadStatistics();
        alert('Çek başarıyla güncellendi');
      }
    } catch (error) {
      console.error('Failed to update cheque:', error);
      alert('Çek güncellenirken hata oluştu');
    }
  };

  const handleDeleteCheque = async (cheque) => {
    if (!confirm(`${cheque.check_serial_no} numaralı çeki silmek istediğinizden emin misiniz?`)) {
      return;
    }

    try {
      const response = await chequeService.delete(cheque.id);
      if (response.success) {
        deleteCheque(cheque.id);
        loadCheques();
        loadStatistics();
        loadDueSoon();
        alert('Çek başarıyla silindi');
      }
    } catch (error) {
      console.error('Failed to delete cheque:', error);
      alert('Çek silinirken hata oluştu');
    }
  };

  const handleChangeStatus = async (chequeId, newStatus, notes) => {
    try {
      const response = await chequeService.changeStatus(chequeId, newStatus, notes);
      if (response.success) {
        updateCheque(chequeId, response.data);
        setShowDetail(false);
        setSelectedCheque(null);
        loadCheques();
        loadStatistics();
        loadDueSoon();
        alert('Çek durumu başarıyla güncellendi');
      }
    } catch (error) {
      console.error('Failed to change status:', error);
      alert('Durum değiştirirken hata oluştu');
    }
  };

  const handleChequeClick = async (cheque) => {
    try {
      const response = await chequeService.getById(cheque.id);
      if (response.success) {
        setSelectedCheque(response.data);
        setShowDetail(true);
      }
    } catch (error) {
      console.error('Failed to load cheque details:', error);
      alert('Çek detayları yüklenemedi');
    }
  };

  const handleEditClick = (cheque) => {
    setEditingCheque(cheque);
    setShowForm(true);
  };

  const handleStatusClick = async (cheque) => {
    try {
      const response = await chequeService.getById(cheque.id);
      if (response.success) {
        setSelectedCheque(response.data);
        setShowDetail(true);
      }
    } catch (error) {
      console.error('Failed to load cheque details:', error);
    }
  };

  const handleImportComplete = () => {
    setShowImport(false);
    loadCheques();
    loadStatistics();
    loadDueSoon();
  };

  const handleExportToExcel = async () => {
    try {
      const params = getQueryParams();
      await chequeService.exportToExcel(params);
    } catch (error) {
      console.error('Failed to export:', error);
      alert('Excel export sırasında hata oluştu');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Çek Yönetimi</h1>
              <p className="text-gray-600 mt-1">Müşterilerden alınan çekleri yönetin</p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleExportToExcel}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center space-x-2"
              >
                <span>📊</span>
                <span>Excel'e Aktar</span>
              </button>

              <button
                onClick={() => setShowImport(true)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center space-x-2"
              >
                <span>📥</span>
                <span>Excel'den Yükle</span>
              </button>

              <button
                onClick={() => {
                  setEditingCheque(null);
                  setShowForm(true);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center space-x-2"
              >
                <span>➕</span>
                <span>Yeni Çek</span>
              </button>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <ChequeStatistics />

        {/* Due Soon Alerts */}
        <DueSoonAlert onChequeClick={handleChequeClick} />

        {/* Cheques List */}
        <ChequeList
          onChequeClick={handleChequeClick}
          onEditCheque={handleEditClick}
          onDeleteCheque={handleDeleteCheque}
          onChangeStatus={handleStatusClick}
        />

        {/* Modals */}
        {showForm && (
          <ChequeForm
            cheque={editingCheque}
            onSubmit={editingCheque ? handleUpdateCheque : handleCreateCheque}
            onCancel={() => {
              setShowForm(false);
              setEditingCheque(null);
            }}
          />
        )}

        {showDetail && selectedCheque && (
          <ChequeDetailView
            cheque={selectedCheque}
            onClose={() => {
              setShowDetail(false);
              setSelectedCheque(null);
            }}
            onChangeStatus={handleChangeStatus}
          />
        )}

        {showImport && (
          <ChequeExcelImport
            onClose={() => setShowImport(false)}
            onImportComplete={handleImportComplete}
          />
        )}
      </div>
    </div>
  );
};

export default ChequesPage;
