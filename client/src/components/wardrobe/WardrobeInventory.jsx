import React, { useState } from 'react';
import { PixelFilterIcon, PixelSearchIcon, PixelStarIcon, PixelTrophyIcon, PixelWardrobeIcon } from '../PixelIcons.jsx';
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

  // Compute collector tier name
  let collectorRankKey = 'wardrobe_rank_novice';
  if (collectionPercent >= 75) collectorRankKey = 'wardrobe_rank_master';
  else if (collectionPercent >= 50) collectorRankKey = 'wardrobe_rank_collector';
  else if (collectionPercent >= 25) collectorRankKey = 'wardrobe_rank_stylist';

  return (
    <section className="wardrobe-panel min-w-0 overflow-hidden rounded-2xl flex flex-col" aria-label={t('wardrobe_inventory_title')}>
      {/* Header with Collector Mastery Bar */}
      <div className="wardrobe-inventory-heading flex-wrap gap-3 bg-[var(--wardrobe-surface)] p-3.5 sm:p-4 border-b-3 border-[var(--pop-black)]">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center border-2 border-[var(--pop-black)] bg-[var(--pop-red)] text-white shadow-[2px_2px_0_var(--pop-black)] rounded-xl">
            <PixelWardrobeIcon size={24} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="font-pixel text-sm sm:text-base font-black uppercase text-[var(--pop-black)]">{t('wardrobe_inventory_title')}</h2>
              <span className="border-2 border-[var(--pop-black)] bg-[var(--pop-amber)] px-2 py-0.5 font-pixel text-xs font-black uppercase text-[var(--pop-black)] rounded-md shadow-[1px_1px_0_var(--pop-black)]">
                {t(collectorRankKey)}
              </span>
            </div>
            <p className="text-xs sm:text-sm font-bold text-slate-800 mt-0.5">
              {catalogAvailable ? t('wardrobe_collection_count', { owned: ownedCount, total: totalCount }) : t('wardrobe_owned_count', { owned: ownedCount })}
            </p>
          </div>
        </div>

        {catalogAvailable && (
          <div className="wardrobe-collection-progress flex flex-col items-end gap-1.5" aria-label={t('wardrobe_collection')}>
            <div className="flex items-center gap-1.5 font-pixel text-xs font-black uppercase text-slate-800">
              <PixelTrophyIcon size={14} className="text-amber-500" />
              <span>{t('wardrobe_collection')}</span>
              <span className="text-[var(--pop-red)] font-black text-sm">{collectionPercent}%</span>
            </div>
            <div className="h-3.5 w-36 overflow-hidden border-2 border-[var(--pop-black)] bg-stone-200 rounded-full shadow-[1px_1px_0_var(--pop-black)]" aria-hidden="true">
              <div
                className="h-full rounded-full bg-gradient-to-r from-orange-500 via-[var(--pop-red)] to-rose-600 transition-all duration-300"
                style={{ width: `${collectionPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Category Tabs */}
      <div className="hide-scroll flex overflow-x-auto border-b-3 border-[var(--pop-black)] bg-[var(--pop-cream)]" role="tablist" aria-label={t('wardrobe_inventory_title')}>
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
              className={`wardrobe-category-tab flex min-w-max flex-1 items-center justify-center gap-2.5 border-r-3 border-[var(--pop-black)] px-4 font-pixel text-xs sm:text-sm font-black uppercase transition-all duration-150 last:border-r-0 focus-visible:outline focus-visible:outline-3 focus-visible:outline-inset focus-visible:outline-cyan-600 cursor-pointer ${
                active
                  ? 'wardrobe-category-tab--active bg-[#fbe1d8] text-[var(--pop-black)] shadow-[inset_0_-4px_0_var(--pop-red)]'
                  : 'bg-[var(--wardrobe-surface)] text-slate-700 hover:bg-stone-100 hover:text-[var(--pop-black)]'
              }`}
            >
              <meta.Icon size={18} aria-hidden="true" />
              <span>{t(meta.labelKey)}</span>
              <span className={`border-2 border-[var(--pop-black)] px-2 py-0.5 font-pixel text-xs font-black rounded-md ${active ? 'bg-[var(--pop-red)] text-white' : 'bg-white text-[var(--pop-black)]'}`}>
                {counts[type]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filter and Search Bar with Quick Pills */}
      <div className="border-b-3 border-[var(--pop-black)] bg-[var(--pop-cream)] p-3 sm:p-4">
        {!catalogAvailable && (
          <p role="status" className="mb-3 border-2 border-[var(--pop-black)] bg-amber-300 px-3 py-2 text-xs font-bold text-neutral-950 rounded-lg shadow-[2px_2px_0_var(--pop-black)]">
            {t('wardrobe_catalog_warning')}
          </p>
        )}

        {/* Search row */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">{t('wardrobe_search_label')}</span>
            <input
              type="search"
              value={filters.query}
              onChange={(event) => onFilterChange({ query: event.target.value })}
              placeholder={t('wardrobe_search_placeholder')}
              className="h-10 w-full border-2 border-[var(--pop-black)] bg-white px-3 pr-10 font-bold text-sm outline-none shadow-[2px_2px_0_var(--pop-black)] focus-visible:ring-2 focus-visible:ring-cyan-600 rounded-xl"
            />
            {filters.query ? (
              <button
                type="button"
                onClick={() => onFilterChange({ query: '' })}
                className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-sm text-slate-600 hover:text-[var(--pop-red)] cursor-pointer"
                aria-label={t('wardrobe_clear_filters')}
              >
                ✕
              </button>
            ) : (
              <PixelSearchIcon size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" aria-hidden="true" />
            )}
          </label>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <label className="shrink-0">
              <span className="sr-only">{t('wardrobe_sort_label')}</span>
              <select
                value={filters.sort}
                onChange={(event) => onFilterChange({ sort: event.target.value })}
                className="h-10 border-2 border-[var(--pop-black)] bg-white px-3 font-pixel text-xs font-bold shadow-[2px_2px_0_var(--pop-black)] outline-none rounded-xl cursor-pointer"
              >
                <option value="default">{t('wardrobe_sort_default')}</option>
                <option value="rarity">{t('wardrobe_sort_rarity')}</option>
                <option value="name">{t('wardrobe_sort_name')}</option>
              </select>
            </label>

            <button
              type="button"
              onClick={() => setFiltersOpen((value) => !value)}
              className="flex h-10 items-center gap-1.5 border-2 border-[var(--pop-black)] bg-white px-3 font-pixel text-xs font-black uppercase shadow-[2px_2px_0_var(--pop-black)] rounded-xl md:hidden cursor-pointer"
              aria-expanded={filtersOpen}
              aria-controls="wardrobe-filter-controls"
            >
              <PixelFilterIcon size={15} aria-hidden="true" /> {t('wardrobe_filters')}
            </button>
          </div>
        </div>

        {/* Quick Filter Pill Chips */}
        <div id="wardrobe-filter-controls" className={`mt-3 flex flex-wrap items-center gap-2 ${filtersOpen ? 'flex' : 'hidden md:flex'}`}>
          {/* Ownership Chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { key: 'all', labelKey: 'wardrobe_filter_all' },
              { key: 'owned', labelKey: 'wardrobe_filter_owned' },
              { key: 'locked', labelKey: 'wardrobe_filter_locked' },
              { key: 'equipped', labelKey: 'wardrobe_filter_equipped' },
            ].map(({ key, labelKey }) => {
              const active = filters.ownership === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onFilterChange({ ownership: key })}
                  className={`wardrobe-filter-pill rounded-lg cursor-pointer ${active ? 'wardrobe-filter-pill--active' : ''}`}
                >
                  {t(labelKey)}
                </button>
              );
            })}
          </div>

          <div className="hidden h-5 w-[2px] bg-[var(--pop-black)]/20 md:block" />

          {/* Rarity Chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { key: 'all', label: t('wardrobe_rarity_filter_all') },
              { key: 'legendary', label: `🌟 ${t('wardrobe_rarity_legendary')}` },
              { key: 'epic', label: `💜 ${t('wardrobe_rarity_epic')}` },
              { key: 'rare', label: `💙 ${t('wardrobe_rarity_rare')}` },
              { key: 'common', label: `⚪ ${t('wardrobe_rarity_common')}` },
            ].map(({ key, label }) => {
              const active = filters.rarity === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onFilterChange({ rarity: key })}
                  className={`wardrobe-filter-pill rounded-lg cursor-pointer ${active ? 'wardrobe-filter-pill--active' : ''}`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Item Grid & States */}
      <div id={`wardrobe-panel-${selectedType}`} role="tabpanel" aria-labelledby={`wardrobe-tab-${selectedType}`} className="flex-1 p-3.5 sm:p-5">
        {items.length === 0 ? (
          <div className="flex min-h-80 flex-col items-center justify-center border-3 border-dashed border-[var(--pop-black)]/40 bg-[var(--wardrobe-surface)] p-8 text-center rounded-2xl shadow-inner">
            <div className="flex h-20 w-20 items-center justify-center rounded-full border-3 border-[var(--pop-black)] bg-[var(--pop-cream)] shadow-[3px_3px_0_var(--pop-black)]">
              <EmptyIcon size={44} className="text-[var(--pop-black)]/40" aria-hidden="true" />
            </div>
            <h3 className="mt-4 font-pop-display text-2xl font-black uppercase text-[var(--pop-black)]">
              {categoryIsEmpty ? t('wardrobe_empty_title') : t('wardrobe_no_results_title')}
            </h3>
            <p className="mt-2 max-w-sm text-sm font-bold text-slate-800">
              {categoryIsEmpty ? t('wardrobe_empty_desc') : t('wardrobe_no_results_desc')}
            </p>
            <button
              type="button"
              onClick={categoryIsEmpty ? onShop : clearFilters}
              className="wardrobe-primary-button mt-6 text-sm rounded-xl cursor-pointer"
            >
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

        {/* Discovery Box when category has few items */}
        {items.length > 0 && counts[selectedType] <= 3 && catalogAvailable && (
          <aside className="wardrobe-inventory-discovery mt-6 border-3 border-dashed border-[var(--pop-black)]/50 bg-[#fbf0dc] p-4 shadow-[3px_3px_0_var(--pop-black)] rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-[var(--pop-black)] bg-[var(--pop-amber)] shadow-[2px_2px_0_var(--pop-black)] rounded-lg">
                <PixelStarIcon size={18} className="text-[var(--pop-black)]" />
              </div>
              <div>
                <h3 className="font-pixel text-sm font-black uppercase text-[var(--pop-black)]">{t('wardrobe_discover_title')}</h3>
                <p className="mt-0.5 text-xs sm:text-sm font-bold text-slate-800">{t('wardrobe_discover_desc', { count: counts[selectedType] })}</p>
              </div>
            </div>
            <button type="button" onClick={onShop} className="wardrobe-secondary-button shrink-0 border-2 bg-white hover:bg-[var(--pop-red)] hover:text-white rounded-xl cursor-pointer">
              {t('wardrobe_shop_cta')}
            </button>
          </aside>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <nav className="mt-6 flex items-center justify-center gap-2" aria-label={t('wardrobe_pagination')}>
            <button type="button" onClick={() => onPageChange(page - 1)} disabled={page === 1} className="wardrobe-page-button rounded-lg cursor-pointer" aria-label={t('wardrobe_previous_page')}>←</button>
            {Array.from({ length: totalPages }, (_, index) => index + 1).map((number) => (
              <button key={number} type="button" onClick={() => onPageChange(number)} aria-current={number === page ? 'page' : undefined} className={`wardrobe-page-button rounded-lg cursor-pointer ${number === page ? 'bg-[var(--pop-red)] text-white' : ''}`}>{number}</button>
            ))}
            <button type="button" onClick={() => onPageChange(page + 1)} disabled={page === totalPages} className="wardrobe-page-button rounded-lg cursor-pointer" aria-label={t('wardrobe_next_page')}>→</button>
          </nav>
        )}
      </div>
    </section>
  );
}
