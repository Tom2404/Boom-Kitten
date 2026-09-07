import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { gsap } from 'gsap';
import WardrobeInventory from '../components/wardrobe/WardrobeInventory.jsx';
import WardrobePreview from '../components/wardrobe/WardrobePreview.jsx';
import WardrobeToast from '../components/wardrobe/WardrobeToast.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { EQUIPMENT_SLOTS, TYPE_TO_SLOT } from '../utils/shopEquipment.js';
import {
  filterWardrobeItems,
  getWardrobeCounts,
  mergeWardrobeItems,
  paginateWardrobeItems,
} from '../utils/wardrobeCatalog.js';

const EMPTY_WARDROBE = {
  items: [],
  ownedItemIds: [],
  equipped: { protector: null, avatarFrame: null, field: null },
};

const DEFAULT_FILTERS = { query: '', rarity: 'all', ownership: 'all', sort: 'default' };
const getId = (item) => String(item?.id || item?._id || '');

function getTokenIdentity() {
  try {
    const token = localStorage.getItem('accessToken');
    const encoded = token?.split('.')[1];
    if (!encoded) return { username: 'Boom Kitten', avatar: '' };
    const payload = JSON.parse(window.atob(encoded.replace(/-/g, '+').replace(/_/g, '/')));
    return { username: payload.username || 'Boom Kitten', avatar: '' };
  } catch {
    return { username: 'Boom Kitten', avatar: '' };
  }
}

function WardrobeSkeleton({ label }) {
  return (
    <div className="wardrobe-shell max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6" aria-busy="true" aria-label={label}>
      <div className="mb-6 h-20 animate-pulse border-3 border-[var(--pop-black)] bg-white/60 rounded-2xl" />
      <div className="grid gap-5 lg:grid-cols-[minmax(22rem,38fr)_minmax(0,62fr)]">
        <div className="h-[42rem] animate-pulse border-3 border-[var(--pop-black)] bg-white/60 shadow-[5px_5px_0_var(--pop-black)] rounded-2xl" />
        <div className="h-[42rem] animate-pulse border-3 border-[var(--pop-black)] bg-white/60 shadow-[5px_5px_0_var(--pop-black)] rounded-2xl" />
      </div>
    </div>
  );
}

export default function Wardrobe({ setPage }) {
  const { t } = useLanguage();
  const pageRef = useRef(null);
  const [wardrobe, setWardrobe] = useState(EMPTY_WARDROBE);
  const [catalogItems, setCatalogItems] = useState([]);
  const [catalogAvailable, setCatalogAvailable] = useState(true);
  const [profile, setProfile] = useState(getTokenIdentity);
  const [selectedType, setSelectedType] = useState(EQUIPMENT_SLOTS[0].type);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [page, setPageNumber] = useState(1);
  const [pinnedItemId, setPinnedItemId] = useState('');
  const [transientItemId, setTransientItemId] = useState('');
  const [pendingItemId, setPendingItemId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [toast, setToast] = useState(null);
  const [presets, setPresets] = useState([]);
  const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';

  // Load Presets from LocalStorage
  useEffect(() => {
    try {
      const storageKey = `boom_kitten_wardrobe_presets_${profile.username}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) setPresets(JSON.parse(saved));
    } catch {
      setPresets([]);
    }
  }, [profile.username]);

  const savePresetsToStorage = (updated) => {
    try {
      const storageKey = `boom_kitten_wardrobe_presets_${profile.username}`;
      localStorage.setItem(storageKey, JSON.stringify(updated));
      setPresets(updated);
    } catch {
      setPresets(updated);
    }
  };

  const getRequestError = (data, fallbackKey) => {
    const code = data.error?.code || data.code;
    if (code) {
      const translated = t(`shop_error_${code}`);
      if (translated !== `shop_error_${code}`) return translated;
    }
    return data.error?.message || data.message || t(fallbackKey);
  };

  const requestJson = async (path, options = {}, fallbackKey = 'wardrobe_load_error') => {
    const response = await fetch(`${API_URL}${path}`, options);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(getRequestError(data, fallbackKey));
    return data;
  };

  const fetchWardrobe = async () => {
    const token = localStorage.getItem('accessToken');
    setLoading(true);
    setLoadError('');
    if (!token) {
      setLoadError(t('wardrobe_load_error'));
      setLoading(false);
      return;
    }

    const headers = { Authorization: `Bearer ${token}` };
    const [ownedResult, catalogResult, profileResult] = await Promise.allSettled([
      requestJson('/api/shop/owned', { headers }),
      requestJson('/api/shop/items', { headers }),
      requestJson('/api/users/me', { headers }),
    ]);

    if (ownedResult.status === 'rejected') {
      setLoadError(ownedResult.reason instanceof TypeError ? t('wardrobe_load_error') : ownedResult.reason.message || t('wardrobe_load_error'));
      setLoading(false);
      return;
    }

    const owned = ownedResult.value;
    setWardrobe({
      ...EMPTY_WARDROBE,
      ...owned,
      equipped: { ...EMPTY_WARDROBE.equipped, ...owned.equipped },
    });
    setCatalogAvailable(catalogResult.status === 'fulfilled');
    setCatalogItems(catalogResult.status === 'fulfilled' && Array.isArray(catalogResult.value) ? catalogResult.value : []);
    if (profileResult.status === 'fulfilled') {
      setProfile({ username: profileResult.value.username || getTokenIdentity().username, avatar: profileResult.value.avatar || '' });
    }
    setLoading(false);
  };

  useEffect(() => { fetchWardrobe(); }, []);

  const items = useMemo(() => mergeWardrobeItems({
    catalogItems,
    ownedItems: wardrobe.items,
    ownedItemIds: wardrobe.ownedItemIds,
    equipped: wardrobe.equipped,
  }), [catalogItems, wardrobe]);
  const counts = useMemo(() => getWardrobeCounts(items), [items]);
  const filteredItems = useMemo(() => filterWardrobeItems(items, { ...filters, type: selectedType }), [filters, items, selectedType]);
  const paginated = useMemo(() => paginateWardrobeItems(filteredItems, page, 10), [filteredItems, page]);
  const pinnedItem = items.find((item) => item._id === pinnedItemId) || null;
  const transientItem = items.find((item) => item._id === transientItemId) || null;
  const activePreviewItem = transientItem || pinnedItem;
  const previewLoadout = useMemo(() => {
    const next = { ...wardrobe.equipped };
    if (activePreviewItem) next[TYPE_TO_SLOT[activePreviewItem.type]] = activePreviewItem;
    return next;
  }, [activePreviewItem, wardrobe.equipped]);
  const ownedCount = items.filter((item) => item.isOwned).length;
  const collectionPercent = items.length ? Math.round((ownedCount / items.length) * 100) : 0;

  useEffect(() => {
    if (paginated.page !== page) setPageNumber(paginated.page);
  }, [page, paginated.page]);

  useEffect(() => {
    if (loading || !paginated.items.length || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const context = gsap.context(() => {
      gsap.fromTo('.wardrobe-item', { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.15, stagger: 0.025, ease: 'power1.out' });
    }, pageRef);
    return () => context.revert();
  }, [loading, page, selectedType, paginated.items.length]);

  const updateFilters = (patch) => {
    setFilters((current) => ({ ...current, ...patch }));
    setPageNumber(1);
  };

  const changeType = (type) => {
    setSelectedType(type);
    setPinnedItemId('');
    setTransientItemId('');
    setPageNumber(1);
  };

  const closeToast = useCallback(() => setToast(null), []);

  const performEquipment = async ({ slot, itemId, name, previousItemId = null, previousName = '', allowUndo = true }) => {
    const token = localStorage.getItem('accessToken');
    if (!token || pendingItemId) return;
    const pendingKey = itemId || `unequip:${slot}`;
    setPendingItemId(pendingKey);
    try {
      const data = await requestJson(`/api/shop/equipment/${slot}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ itemId }),
      }, 'shop_equipment_update_fail');
      setWardrobe((current) => ({ ...current, equipped: { ...EMPTY_WARDROBE.equipped, ...data.equipped } }));
      setPinnedItemId('');
      setTransientItemId('');
      setToast({
        id: Date.now(),
        tone: 'success',
        message: itemId ? t('wardrobe_equipped_toast', { name }) : t('wardrobe_unequipped_toast', { name }),
        action: allowUndo ? {
          kind: 'undo',
          request: {
            slot,
            itemId: previousItemId,
            name: previousName || t('shop_default'),
            previousItemId: itemId,
            previousName: name,
            allowUndo: false,
          },
        } : null,
      });
    } catch (error) {
      setToast({
        id: Date.now(),
        tone: 'error',
        message: error instanceof TypeError ? t('shop_equipment_update_fail') : error.message || t('shop_equipment_update_fail'),
        action: { kind: 'retry', request: { slot, itemId, name, previousItemId, previousName, allowUndo } },
      });
    } finally {
      setPendingItemId(null);
    }
  };

  const applyItem = (item) => {
    const slot = TYPE_TO_SLOT[item.type];
    const previous = wardrobe.equipped[slot];
    performEquipment({
      slot,
      itemId: item._id,
      name: item.name,
      previousItemId: getId(previous) || null,
      previousName: previous?.name || t('shop_default'),
    });
  };

  const unequipItem = (slot, item) => performEquipment({
    slot,
    itemId: null,
    name: item?.name || t('shop_default'),
    previousItemId: getId(item) || null,
    previousName: item?.name || t('shop_default'),
  });

  const handleToastAction = (action) => {
    setToast(null);
    performEquipment(action.request);
  };

  // Preset Handlers
  const handleSavePreset = (name) => {
    const newPreset = {
      id: `preset_${Date.now()}`,
      name,
      equipped: {
        protector: getId(wardrobe.equipped.protector) || null,
        avatarFrame: getId(wardrobe.equipped.avatarFrame) || null,
        field: getId(wardrobe.equipped.field) || null,
      },
      createdAt: Date.now(),
    };
    const updated = [newPreset, ...presets];
    savePresetsToStorage(updated);
    setToast({
      id: Date.now(),
      tone: 'success',
      message: t('wardrobe_preset_saved_toast', { name }),
    });
  };

  const handleApplyPreset = async (preset) => {
    const token = localStorage.getItem('accessToken');
    if (!token || pendingItemId) return;
    setPendingItemId('applying_preset');
    try {
      const results = {};
      for (const { slot } of EQUIPMENT_SLOTS) {
        const targetItemId = preset.equipped[slot] || null;
        const currentItemId = getId(wardrobe.equipped[slot]) || null;
        if (targetItemId !== currentItemId) {
          const res = await requestJson(`/api/shop/equipment/${slot}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ itemId: targetItemId }),
          }, 'shop_equipment_update_fail');
          if (res.equipped) results[slot] = res.equipped[slot];
        }
      }
      setWardrobe((current) => ({
        ...current,
        equipped: { ...current.equipped, ...results },
      }));
      setToast({
        id: Date.now(),
        tone: 'success',
        message: t('wardrobe_preset_applied_toast', { name: preset.name }),
      });
    } catch (error) {
      setToast({
        id: Date.now(),
        tone: 'error',
        message: error.message || t('shop_equipment_update_fail'),
      });
    } finally {
      setPendingItemId(null);
    }
  };

  const handleDeletePreset = (presetId) => {
    const target = presets.find((p) => p.id === presetId);
    const updated = presets.filter((p) => p.id !== presetId);
    savePresetsToStorage(updated);
    if (target) {
      setToast({
        id: Date.now(),
        tone: 'success',
        message: t('wardrobe_preset_deleted_toast', { name: target.name }),
      });
    }
  };

  // Randomize Outfit
  const handleRandomize = () => {
    const owned = items.filter((i) => i.isOwned);
    if (!owned.length) return;
    const byType = { protector: [], avatar_frame: [], field: [] };
    owned.forEach((item) => {
      if (byType[item.type]) byType[item.type].push(item);
    });

    const randomProtector = byType.protector[Math.floor(Math.random() * byType.protector.length)] || null;
    const randomFrame = byType.avatar_frame[Math.floor(Math.random() * byType.avatar_frame.length)] || null;
    const randomField = byType.field[Math.floor(Math.random() * byType.field.length)] || null;

    if (randomProtector) applyItem(randomProtector);
    if (randomFrame) applyItem(randomFrame);
    if (randomField) applyItem(randomField);
  };

  if (loading) return <WardrobeSkeleton label={t('wardrobe_loading')} />;

  if (loadError) {
    return (
      <section className="mx-auto max-w-xl border-3 border-[var(--pop-black)] bg-white p-8 text-center shadow-[6px_6px_0_var(--pop-black)] rounded-2xl" role="alert">
        <h1 className="font-pop-display text-3xl font-black uppercase text-[var(--pop-red)]">{t('wardrobe_title')}</h1>
        <p className="mt-3 text-sm font-bold text-slate-800">{loadError}</p>
        <button type="button" onClick={fetchWardrobe} className="wardrobe-primary-button mt-6 rounded-xl cursor-pointer">{t('wardrobe_retry')}</button>
      </section>
    );
  }

  return (
    <div ref={pageRef} className={`wardrobe-shell text-left font-pop-body max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 ${pinnedItem ? 'max-[479px]:pb-24' : ''}`}>
      <header className="mb-5 sm:mb-6">
        <h1 className="wardrobe-page-title font-pop-display font-black uppercase leading-none text-white text-stroke-black-3" style={{ textShadow: '3px 3px 0 var(--pop-orange)' }}>{t('wardrobe_title')}</h1>
        <p className="mt-2 max-w-2xl text-sm font-bold text-slate-800 leading-relaxed">{t('wardrobe_desc')}</p>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(22rem,38fr)_minmax(0,62fr)]">
        <WardrobePreview
          profile={profile}
          equipped={wardrobe.equipped}
          previewLoadout={previewLoadout}
          previewItem={activePreviewItem}
          pinnedItem={pinnedItem}
          pendingItemId={pendingItemId}
          onApply={applyItem}
          onCancelPreview={() => { setPinnedItemId(''); setTransientItemId(''); }}
          onChangeType={changeType}
          onUnequip={unequipItem}
          onShop={() => setPage('Shop')}
          onRandomize={handleRandomize}
          presets={presets}
          onSavePreset={handleSavePreset}
          onApplyPreset={handleApplyPreset}
          onDeletePreset={handleDeletePreset}
        />
        <WardrobeInventory
          selectedType={selectedType}
          onTypeChange={changeType}
          counts={counts}
          items={paginated.items}
          pinnedItemId={pinnedItemId}
          transientItemId={transientItemId}
          pendingItemId={pendingItemId}
          filters={filters}
          onFilterChange={updateFilters}
          page={paginated.page}
          totalPages={paginated.totalPages}
          onPageChange={setPageNumber}
          onPin={(item) => setPinnedItemId(item?._id || '')}
          onTransient={(item) => setTransientItemId(item?._id || '')}
          onShop={() => setPage('Shop')}
          onUnequip={(item) => unequipItem(TYPE_TO_SLOT[item.type], item)}
          catalogAvailable={catalogAvailable}
          ownedCount={ownedCount}
          totalCount={items.length}
          collectionPercent={collectionPercent}
        />
      </div>

      <WardrobeToast toast={toast} onClose={closeToast} onAction={handleToastAction} />
    </div>
  );
}
