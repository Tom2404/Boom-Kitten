import React, { useState } from 'react';
import { PixelFilterIcon, PixelSearchIcon, PixelWardrobeIcon } from '../PixelIcons.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { EQUIPMENT_SLOTS, TYPE_TO_SLOT } from '../../utils/shopEquipment.js';
import { WARDROBE_ITEM_META } from './WardrobeAsset.jsx';
import WardrobeItemCard from './WardrobeItemCard.jsx';

export default function WardrobeInventory({
  selectedType,
  onTypeChange,
  counts,
  items,
  pinnedItemId,
  transientItemId,
  pendingItemId,
  filters,
  onFilterChange,
  page,
  totalPages,
  onPageChange,
  onPin,
  onTransient,
  onShop,
  onUnequip,
  catalogAvailable,
  ownedCount,
  totalCount,
  collectionPercent,
}) {
  const { t } = useLanguage();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const selectAdjacentTab = (event, index) => {
    const direction = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (!direction) return;
    event.preventDefault();
    const nextIndex = (index + direction + EQUIPMENT_SLOTS.length) % EQUIPMENT_SLOTS.length;
    const nextType = EQUIPMENT_SLOTS[nextIndex].type;
    onTypeChange(nextType);
    document.getElementById(`wardrobe-tab-${nextType}`)?.focus();
  };

  const clearFilters = () => {
    onFilterChange({ query: '', rarity: 'all', ownership: 'all', sort: 'default' });
  };

  const categoryIsEmpty = counts[selectedType] === 0;
  const EmptyIcon = WARDROBE_ITEM_META[selectedType].Icon;

  return (
    <section className="wardrobe-panel min-w-0 overflow-hidden" aria-label={t('wardrobe_inventory_title')}>
      <div className="wardrobe-inventory-heading">
        <div className="flex min-w-0 items-center gap-3">
          <PixelWardrobeIcon size={28} className="shrink-0 text-[var(--pop-red)]" aria-hidden="true" />
          <div className="min-w-0">
            <h2 className="font-pixel text-sm font-black uppercase">{t('wardrobe_inventory_title')}</h2>
            <p className="text-xs font-bold text-[var(--pop-black)]/60">
              {catalogAvailable ? t('wardrobe_collection_count', { owned: ownedCount, total: totalCount }) : t('wardrobe_owned_count', { owned: ownedCount })}
            </p>
          </div>
        </div>
        {catalogAvailable && (
          <div className="wardrobe-collection-progress" aria-label={t('wardrobe_collection')}>
            <span className="font-pixel text-[10px] font-black uppercase">{t('wardrobe_collection')}</span>
            <span className="h-2.5 w-28 overflow-hidden border-2 border-[var(--pop-black)] bg-[var(--pop-black)]" aria-hidden="true">
              <span className="block h-full bg-[var(--pop-red)]" style={{ width: `${collectionPercent}%` }} />
            </span>
          </div>
        )}
      </div>

      <div className="hide-scroll flex overflow-x-auto border-b-3 border-[var(--pop-black)]" role="tablist" aria-label={t('wardrobe_inventory_title')}>
        {EQUIPMENT_SLOTS.map(({ type }, index) => {
          const meta = WARDROBE_ITEM_META[type];
          const active = selectedType === type;
          return (
            <button
              key={type}
              id={`wardrobe-tab-${type}`}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls={`wardrobe-panel-${type}`}
              tabIndex={active ? 0 : -1}
              onKeyDown={(event) => selectAdjacentTab(event, index)}
              onClick={() => onTypeChange(type)}
              className={`wardrobe-category-tab flex min-w-max flex-1 items-center justify-center gap-2 border-r-2 border-[var(--pop-black)] px-4 font-pixel text-[13px] font-black uppercase transition-[transform,background-color] duration-150 last:border-r-0 focus-visible:outline focus-visible:outline-3 focus-visible:outline-inset focus-visible:outline-cyan-600 ${active ? 'wardrobe-category-tab--active' : 'bg-[var(--wardrobe-surface)] hover:bg-[var(--pop-cream)]'}`}
            >
              <meta.Icon size={18} aria-hidden="true" />
              {t(meta.labelKey)}
              <span className="border-2 border-[var(--pop-black)] bg-white px-1.5 py-0.5 text-[10px] text-[var(--pop-black)]">{counts[type]}</span>
            </button>
          );
        })}
      </div>

      <div className="border-b-3 border-[var(--pop-black)] bg-[var(--pop-cream)] p-3">
        {!catalogAvailable && (
          <p role="status" className="mb-3 border-2 border-[var(--pop-black)] bg-[var(--pop-amber)] px-3 py-2 text-xs font-bold shadow-[2px_2px_0_var(--pop-black)]">
            {t('wardrobe_catalog_warning')}
          </p>
        )}
        <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 md:grid-cols-[minmax(12rem,1.3fr)_1fr_1fr_auto]">
          <label className="relative min-w-0">
            <span className="sr-only">{t('wardrobe_search_label')}</span>
            <input
              type="search"
              value={filters.query}
              onChange={(event) => onFilterChange({ query: event.target.value })}
              placeholder={t('wardrobe_search_placeholder')}
              className="h-10 w-full border-2 border-[var(--pop-black)] bg-[var(--wardrobe-surface)] px-3 pr-10 text-sm font-bold outline-none focus-visible:ring-3 focus-visible:ring-cyan-600"
            />
            <PixelSearchIcon size={17} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
          </label>
          <button
            type="button"
            onClick={() => setFiltersOpen((value) => !value)}
            className="flex h-10 items-center gap-2 border-2 border-[var(--pop-black)] bg-[var(--wardrobe-surface)] px-3 font-pixel text-xs font-black uppercase md:hidden"
            aria-expanded={filtersOpen}
            aria-controls="wardrobe-filter-controls"
          >
            <PixelFilterIcon size={15} aria-hidden="true" /> {t('wardrobe_filters')}
          </button>

          <div id="wardrobe-filter-controls" className={`${filtersOpen ? 'col-span-2 grid' : 'hidden'} grid-cols-1 gap-2 sm:grid-cols-3 md:col-span-3 md:grid`}>
            <label>
              <span className="sr-only">{t('wardrobe_rarity_label')}</span>
              <select value={filters.rarity} onChange={(event) => onFilterChange({ rarity: event.target.value })} className="h-10 w-full border-2 border-[var(--pop-black)] bg-[var(--wardrobe-surface)] px-3 text-xs font-bold">
                <option value="all">{t('wardrobe_rarity_all')}</option>
                {['common', 'rare', 'epic', 'legendary'].map((rarity) => <option key={rarity} value={rarity}>{t(`wardrobe_rarity_${rarity}`)}</option>)}
              </select>
            </label>
            <label>
              <span className="sr-only">{t('wardrobe_ownership_label')}</span>
              <select value={filters.ownership} onChange={(event) => onFilterChange({ ownership: event.target.value })} className="h-10 w-full border-2 border-[var(--pop-black)] bg-[var(--wardrobe-surface)] px-3 text-xs font-bold">
                <option value="all">{t('wardrobe_filter_all')}</option>
                <option value="owned">{t('wardrobe_filter_owned')}</option>
                <option value="locked">{t('wardrobe_filter_locked')}</option>
                <option value="equipped">{t('wardrobe_filter_equipped')}</option>
              </select>
            </label>
            <label>
              <span className="sr-only">{t('wardrobe_sort_label')}</span>
              <select value={filters.sort} onChange={(event) => onFilterChange({ sort: event.target.value })} className="h-10 w-full border-2 border-[var(--pop-black)] bg-[var(--wardrobe-surface)] px-3 text-xs font-bold">
                <option value="default">{t('wardrobe_sort_default')}</option>
                <option value="rarity">{t('wardrobe_sort_rarity')}</option>
                <option value="name">{t('wardrobe_sort_name')}</option>
              </select>
            </label>
          </div>
        </div>
      </div>

      <div id={`wardrobe-panel-${selectedType}`} role="tabpanel" aria-labelledby={`wardrobe-tab-${selectedType}`} className="p-3 sm:p-4">
        {items.length === 0 ? (
          <div className="flex min-h-80 flex-col items-center justify-center border-3 border-dashed border-[var(--pop-black)]/40 bg-[var(--wardrobe-surface)] px-6 text-center">
            <EmptyIcon size={48} className="text-[var(--pop-black)]/25" aria-hidden="true" />
            <h2 className="mt-4 font-pop-display text-xl font-black uppercase">
              {categoryIsEmpty ? t('wardrobe_empty_title') : t('wardrobe_no_results_title')}
            </h2>
            <p className="mt-2 max-w-sm text-xs font-bold text-[var(--pop-black)]/60">
              {categoryIsEmpty ? t('wardrobe_empty_desc') : t('wardrobe_no_results_desc')}
            </p>
            <button type="button" onClick={categoryIsEmpty ? onShop : clearFilters} className="wardrobe-primary-button mt-5">
              {categoryIsEmpty ? t('wardrobe_shop_cta') : t('wardrobe_clear_filters')}
            </button>
          </div>
        ) : (
          <div className="wardrobe-inventory-grid">
            {items.map((item) => (
              <WardrobeItemCard
                key={item._id}
                item={item}
                isPinned={pinnedItemId === item._id}
                isTransient={transientItemId === item._id}
                onPin={onPin}
                onTransient={onTransient}
                onShop={onShop}
                onUnequip={onUnequip}
                pending={pendingItemId === item._id || (item.isEquipped && pendingItemId === `unequip:${TYPE_TO_SLOT[item.type]}`)}
              />
            ))}
          </div>
        )}

        {items.length > 0 && counts[selectedType] <= 3 && catalogAvailable && (
          <aside className="wardrobe-inventory-discovery">
            <div>
              <h3 className="font-pixel text-sm font-black uppercase">{t('wardrobe_discover_title')}</h3>
              <p className="mt-1 text-xs font-bold text-[var(--pop-black)]/60">{t('wardrobe_discover_desc', { count: counts[selectedType] })}</p>
            </div>
            <button type="button" onClick={onShop} className="wardrobe-secondary-button shrink-0">{t('wardrobe_shop_cta')}</button>
          </aside>
        )}

        {totalPages > 1 && (
          <nav className="mt-5 flex items-center justify-center gap-2" aria-label={t('wardrobe_pagination')}>
            <button type="button" onClick={() => onPageChange(page - 1)} disabled={page === 1} className="wardrobe-page-button" aria-label={t('wardrobe_previous_page')}>←</button>
            {Array.from({ length: totalPages }, (_, index) => index + 1).map((number) => (
              <button key={number} type="button" onClick={() => onPageChange(number)} aria-current={number === page ? 'page' : undefined} className={`wardrobe-page-button ${number === page ? 'bg-[var(--pop-red)] text-white' : ''}`}>{number}</button>
            ))}
            <button type="button" onClick={() => onPageChange(page + 1)} disabled={page === totalPages} className="wardrobe-page-button" aria-label={t('wardrobe_next_page')}>→</button>
          </nav>
        )}
      </div>
    </section>
  );
}
