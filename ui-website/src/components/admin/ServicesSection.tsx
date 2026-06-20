import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Users,
  UserPlus,
  AlertCircle,
  CheckCircle2,
  XCircle,
  X,
  Eye,
  EyeOff
} from 'lucide-react';
import { adminApi } from '../../lib/api';
import { useToast } from '../ui/Toast';

type ServiceStatus = 'Active' | 'Maintenance' | 'Down';
type AccountStatus = 'Valid' | 'Expired' | 'Missing';

interface Service {
  id: string;
  name: string;
  website_url: string;
  icon_url: string | null;
  category: string;
  is_folder: boolean;
  folder_id: string | null;
  display_order: number;
  cookie_count: number;
  active_cookie_count: number;
}

const PALETTE = [
  '#E50914',
  '#10A37F',
  '#1DB954',
  '#113CCF',
  '#5865F2',
  '#00C4CC',
  '#00A8E1',
  '#FFFFFF',
  '#1CE783',
  '#5A0E8B',
  '#D97757',
  '#24292F'
];

const CATEGORIES = [
  'Entertainment',
  'AI Tools',
  'Audio & Music',
  'Productivity',
  'Design'
];

export function ServicesSection() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Add/Edit service modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Partial<Service> | null>(null);
  
  // Accounts manager modal
  const [isAccountsModalOpen, setIsAccountsModalOpen] = useState(false);
  const [activeService, setActiveService] = useState<Service | null>(null);
  
  // Delete service modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);

  const { showToast } = useToast();

  const loadServices = async () => {
    try {
      const res = await adminApi.getServices();
      setServices(res.services || []);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to fetch services');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService?.name || !editingService?.website_url) {
      showToast('error', 'Service name and website URL are required');
      return;
    }

    try {
      if (editingService.id) {
        await adminApi.updateService(editingService.id, {
          name: editingService.name,
          website_url: editingService.website_url,
          icon_url: editingService.icon_url || null,
          category: editingService.category || CATEGORIES[0],
          is_folder: editingService.is_folder ?? false,
          display_order: editingService.display_order ?? 0,
        });
        showToast('success', 'Service updated successfully');
      } else {
        await adminApi.createService({
          name: editingService.name,
          website_url: editingService.website_url,
          icon_url: editingService.icon_url || null,
          category: editingService.category || CATEGORIES[0],
          is_folder: editingService.is_folder ?? false,
          display_order: editingService.display_order ?? 0,
        });
        showToast('success', 'Service created successfully');
      }
      setIsEditModalOpen(false);
      loadServices();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to save service');
    }
  };

  const handleDeleteService = async () => {
    if (!serviceToDelete) return;
    try {
      await adminApi.deleteService(serviceToDelete.id);
      showToast('success', 'Service deleted successfully');
      setIsDeleteModalOpen(false);
      setServiceToDelete(null);
      loadServices();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to delete service');
    }
  };

  const filteredServices = services.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const StatusBadge = ({ status }: { status: ServiceStatus }) => {
    const colors = {
      Active: 'bg-lime-400/10 text-lime-400 border-lime-400/20',
      Maintenance: 'bg-amber-400/10 text-amber-400 border-amber-400/20',
      Down: 'bg-red-400/10 text-red-400 border-red-400/20'
    };
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${colors[status]}`}>
        {status}
      </span>
    );
  };

  const AccountsCell = ({ service }: { service: Service }) => {
    const total = service.cookie_count ?? 0;
    const valid = service.active_cookie_count ?? 0;
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10">
          <Users className="w-3.5 h-3.5 text-zinc-400" />
          <span className="text-sm font-semibold text-white">{total}</span>
          <span className="text-xs text-zinc-500">
            {total === 1 ? 'slot' : 'slots'}
          </span>
        </div>
        {total > 0 ? (
          <span className="text-xs text-zinc-500">
            <span className="text-lime-400 font-medium">{valid}</span> active
          </span>
        ) : (
          <span className="text-xs text-red-400">none added</span>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search services..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-lime-400/50 transition-colors"
          />
        </div>
        <button
          onClick={() => {
            setEditingService({
              name: '',
              website_url: '',
              icon_url: '',
              category: CATEGORIES[0],
              display_order: 0,
              is_folder: false,
            });
            setIsEditModalOpen(true);
          }}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-lime-400 text-black font-bold rounded-xl hover:bg-lime-500 transition-colors">
          <Plus className="w-4 h-4" />
          Add Service
        </button>
      </div>

      {/* Services Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-lime-400 border-t-transparent animate-spin" />
            <span className="text-sm text-zinc-400">Loading services...</span>
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="text-center py-20 text-zinc-500">No services found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02]">
                  <th className="px-6 py-4 text-sm font-semibold text-zinc-400">Service</th>
                  <th className="px-6 py-4 text-sm font-semibold text-zinc-400">Category</th>
                  <th className="px-6 py-4 text-sm font-semibold text-zinc-400">Status</th>
                  <th className="px-6 py-4 text-sm font-semibold text-zinc-400">Accounts</th>
                  <th className="px-6 py-4 text-sm font-semibold text-zinc-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredServices.map((service) => {
                  const status = service.active_cookie_count > 0 ? 'Active' : 'Down';
                  const serviceColor = PALETTE[service.name.charCodeAt(0) % PALETTE.length];
                  return (
                    <tr key={service.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center font-bold shadow-lg shrink-0 text-white overflow-hidden"
                            style={{ backgroundColor: serviceColor }}>
                            {service.icon_url ? (
                              <img
                                src={service.icon_url}
                                alt={service.name}
                                className="w-full h-full object-cover rounded-lg"
                              />
                            ) : (
                              service.name.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-white">{service.name}</span>
                            <span className="text-xs text-zinc-500 font-mono truncate max-w-[200px]">
                              {service.website_url}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-zinc-400">{service.category}</td>
                      <td className="px-6 py-4">
                        <StatusBadge status={status} />
                      </td>
                      <td className="px-6 py-4">
                        <AccountsCell service={service} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setActiveService(service);
                              setIsAccountsModalOpen(true);
                            }}
                            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-lime-400 hover:bg-lime-400/10 rounded-lg transition-colors"
                            title="Manage accounts">
                            <UserPlus className="w-4 h-4" />
                            <span className="hidden lg:inline">Accounts</span>
                          </button>
                          <button
                            onClick={() => {
                              setEditingService(service);
                              setIsEditModalOpen(true);
                            }}
                            className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                            title="Edit Service">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setServiceToDelete(service);
                              setIsDeleteModalOpen(true);
                            }}
                            className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                            title="Delete Service">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Service Modal */}
      <AnimatePresence>
        {isEditModalOpen && editingService && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setIsEditModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg glass-card rounded-2xl overflow-hidden shadow-2xl z-10">
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <h2 className="text-xl font-bold">
                  {editingService.id ? 'Edit Service' : 'Add New Service'}
                </h2>
                <button onClick={() => setIsEditModalOpen(false)} className="text-zinc-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSaveService} className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                    Service Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editingService.name || ''}
                    onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-lime-400/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                    Website URL
                  </label>
                  <input
                    type="url"
                    required
                    value={editingService.website_url || ''}
                    onChange={(e) => setEditingService({ ...editingService, website_url: e.target.value })}
                    placeholder="https://example.com"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-lime-400/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                    Icon Image URL (optional)
                  </label>
                  <input
                    type="url"
                    value={editingService.icon_url || ''}
                    onChange={(e) => setEditingService({ ...editingService, icon_url: e.target.value })}
                    placeholder="https://example.com/logo.png"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-lime-400/50"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-1.5">Category</label>
                    <select
                      value={editingService.category || CATEGORIES[0]}
                      onChange={(e) => setEditingService({ ...editingService, category: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-lime-400/50 appearance-none">
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c} className="bg-zinc-900">
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-1.5">Display Order</label>
                    <input
                      type="number"
                      value={editingService.display_order ?? 0}
                      onChange={(e) => setEditingService({ ...editingService, display_order: parseInt(e.target.value, 10) })}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-lime-400/50"
                    />
                  </div>
                </div>

                <div className="pt-6 flex justify-end gap-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl font-medium hover:bg-white/5 transition-colors">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-lime-400 text-black rounded-xl font-bold hover:bg-lime-500 transition-colors">
                    Save Service
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Accounts Manager Modal */}
      <AnimatePresence>
        {isAccountsModalOpen && activeService && (
          <AccountsManager
            service={activeService}
            onClose={() => {
              setIsAccountsModalOpen(false);
              loadServices(); // reload parent to sync cookie counts
            }}
          />
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && serviceToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setIsDeleteModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md glass-card rounded-2xl overflow-hidden shadow-2xl p-6 text-center z-10">
              <div className="w-16 h-16 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold mb-2">Delete {serviceToDelete.name}?</h2>
              <p className="text-zinc-400 mb-8">
                This will remove the service and all of its associated session cookie slots. This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-6 py-2.5 rounded-xl font-medium hover:bg-white/5 transition-colors border border-white/10">
                  Cancel
                </button>
                <button
                  onClick={handleDeleteService}
                  className="px-6 py-2.5 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-colors">
                  Yes, Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---- Accounts Manager Modal Subcomponent ----
function AccountsManager({ service, onClose }: { service: Service; onClose: () => void }) {
  const [cookies, setCookies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [accountSlot, setAccountSlot] = useState(1);
  const [newCookie, setNewCookie] = useState('');
  const [newExpiry, setNewExpiry] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCookie, setEditCookie] = useState('');
  const [editExpiry, setEditExpiry] = useState('');

  const { showToast } = useToast();

  const loadCookies = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getCookies(service.id);
      setCookies(res.cookies || []);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to fetch cookies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCookies();
  }, [service.id]);

  const handleAdd = async () => {
    if (!newCookie.trim()) {
      showToast('error', 'Cookie value is required');
      return;
    }
    try {
      JSON.parse(newCookie);
    } catch (e) {
      showToast('error', 'Invalid cookie format. Cookies must be a valid JSON array.');
      return;
    }
    try {
      await adminApi.createCookie({
        service_id: service.id,
        account_slot: accountSlot,
        cookie_data: newCookie,
        expires_at: new Date(newExpiry).toISOString(),
      });
      showToast('success', 'Cookie added successfully');
      setNewCookie('');
      setIsAdding(false);
      loadCookies();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to create cookie');
    }
  };

  const handleSaveCookieEdit = async (id: string) => {
    if (editCookie.trim()) {
      try {
        JSON.parse(editCookie);
      } catch (e) {
        showToast('error', 'Invalid cookie format. Cookies must be a valid JSON array.');
        return;
      }
    }
    try {
      await adminApi.updateCookie(id, {
        cookie_data: editCookie ? editCookie : undefined,
        expires_at: editExpiry ? new Date(editExpiry).toISOString() : undefined,
      });
      showToast('success', 'Cookie updated successfully');
      setEditingId(null);
      setEditCookie('');
      setEditExpiry('');
      loadCookies();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to update cookie');
    }
  };

  const handleDeleteCookie = async (id: string) => {
    try {
      await adminApi.deleteCookie(id);
      showToast('success', 'Cookie deleted successfully');
      loadCookies();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to delete cookie');
    }
  };

  const totalSlots = cookies.length;
  const activeSlots = cookies.filter(c => c.is_active && new Date(c.expires_at) > new Date()).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-2xl glass-card rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] z-10">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center font-bold shadow-lg shrink-0 text-white"
              style={{ backgroundColor: PALETTE[service.name.charCodeAt(0) % PALETTE.length] }}>
              {service.icon_url ? (
                <img src={service.icon_url} alt={service.name} className="w-full h-full object-cover rounded-xl" />
              ) : (
                service.name.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold leading-tight">{service.name}</h2>
              <p className="text-sm text-zinc-400">
                <span className="text-white font-semibold">{totalSlots}</span> slots total
                {totalSlots > 0 && (
                  <>
                    {' · '}
                    <span className="text-lime-400">{activeSlots} active</span>
                  </>
                )}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 rounded-full border-2 border-lime-400 border-t-transparent animate-spin" />
            </div>
          ) : cookies.length === 0 && !isAdding ? (
            <div className="text-center py-10">
              <Users className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
              <p className="text-zinc-400 text-sm font-medium">No cookie slots added yet.</p>
            </div>
          ) : (
            cookies.map((cookie, idx) => {
              const isValid = cookie.is_active && new Date(cookie.expires_at) > new Date();
              const isRevealed = !!revealed[cookie.id];
              const isEditing = editingId === cookie.id;
              
              return (
                <div key={cookie.id} className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
                  <div className="flex items-center justify-between p-4 gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-zinc-400 shrink-0 font-bold font-mono">
                        {cookie.account_slot}
                      </div>
                      <div>
                        <div className="font-semibold text-white">Slot {cookie.account_slot}</div>
                        <div className="flex items-center gap-2 text-xs mt-0.5">
                          <span className={`px-2 py-0.5 rounded font-semibold text-[10px] ${
                            isValid ? 'bg-lime-400/10 text-lime-400' : 'bg-red-400/10 text-red-400'
                          }`}>
                            {isValid ? 'Valid' : 'Expired'}
                          </span>
                          <span className="text-zinc-500">
                            Expires: {new Date(cookie.expires_at).toLocaleDateString('id-ID')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setRevealed(prev => ({ ...prev, [cookie.id]: !prev[cookie.id] }))}
                        className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-white/5"
                        title={isRevealed ? 'Hide Cookie' : 'Show Cookie'}>
                        {isRevealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => {
                          setEditingId(isEditing ? null : cookie.id);
                          setEditCookie('');
                          setEditExpiry(cookie.expires_at.split('T')[0]);
                        }}
                        className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-white/5"
                        title="Edit Slot">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCookie(cookie.id)}
                        className="p-2 text-zinc-400 hover:text-red-400 rounded-lg hover:bg-red-400/10"
                        title="Delete Slot">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {(isRevealed || isEditing) && (
                    <div className="px-4 pb-4 border-t border-white/5 pt-3 space-y-3">
                      {isEditing ? (
                        <>
                          <div>
                            <label className="block text-[10px] text-zinc-500 font-medium mb-1">
                              New JSON Cookie Data (leave blank to keep current)
                            </label>
                            <textarea
                              rows={3}
                              value={editCookie}
                              onChange={(e) => setEditCookie(e.target.value)}
                              placeholder='[{"name": "cookie_name", "value": "..."}]'
                              className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white font-mono text-xs focus:outline-none focus:border-lime-400/50 resize-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-zinc-500 font-medium mb-1">Expiry Date</label>
                            <input
                              type="date"
                              value={editExpiry}
                              onChange={(e) => setEditExpiry(e.target.value)}
                              className="bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:border-lime-400/50"
                            />
                          </div>
                          <div className="flex justify-end gap-2 pt-2">
                            <button
                              onClick={() => setEditingId(null)}
                              className="px-3 py-1.5 text-xs rounded-lg hover:bg-white/5 text-zinc-400 font-semibold">
                              Cancel
                            </button>
                            <button
                              onClick={() => handleSaveCookieEdit(cookie.id)}
                              className="px-3 py-1.5 text-xs bg-lime-400 text-black font-extrabold rounded-lg hover:bg-lime-500">
                              Save
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="text-[10px] text-zinc-500 font-mono bg-black/40 rounded-lg p-3 select-all overflow-x-auto whitespace-pre-wrap break-all">
                          Encrypted token slot (Active: {isValid ? 'Yes' : 'No'}). Last sync: {new Date(cookie.generated_at).toLocaleString()}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}

          {isAdding && (
            <div className="rounded-xl border border-lime-400/30 bg-lime-400/5 p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">Account Slot Number</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={accountSlot}
                    onChange={(e) => setAccountSlot(parseInt(e.target.value, 10))}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-lime-400/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">Expiry Date</label>
                  <input
                    type="date"
                    required
                    value={newExpiry}
                    onChange={(e) => setNewExpiry(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-lime-400/50"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">JSON Cookie Content</label>
                <textarea
                  rows={4}
                  required
                  value={newCookie}
                  onChange={(e) => setNewCookie(e.target.value)}
                  placeholder='[{"name": "cookie_name", "value": "..."}]'
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white font-mono text-xs focus:outline-none focus:border-lime-400/50 resize-none"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1.5 text-xs rounded-lg hover:bg-white/5 text-zinc-400 font-semibold">
                  Cancel
                </button>
                <button
                  onClick={handleAdd}
                  className="px-3 py-1.5 text-xs bg-lime-400 text-black font-extrabold rounded-lg hover:bg-lime-500">
                  Add slot
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-white/10 shrink-0">
          <button
            onClick={() => setIsAdding(true)}
            disabled={isAdding}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-lime-400 text-black font-bold rounded-xl hover:bg-lime-500 disabled:opacity-40">
            <Plus className="w-4 h-4" />
            Add account slot
          </button>
        </div>
      </motion.div>
    </div>
  );
}