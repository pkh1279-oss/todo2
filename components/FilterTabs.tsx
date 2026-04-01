type Filter = 'all' | 'active' | 'completed';

interface FilterTabsProps {
  currentFilter: Filter;
  activeCount: number;
  completedCount: number;
  onFilterChange: (filter: Filter) => void;
}

export function FilterTabs({ currentFilter, activeCount, completedCount, onFilterChange }: FilterTabsProps) {
  const tabs: { key: Filter; label: string }[] = [
    { key: 'all', label: '전체' },
    { key: 'active', label: `진행 중 (${activeCount})` },
    { key: 'completed', label: `완료 (${completedCount})` },
  ];

  return (
    <div className="filter-tabs">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          className={`filter-tab ${currentFilter === tab.key ? 'active' : ''}`}
          onClick={() => onFilterChange(tab.key)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
