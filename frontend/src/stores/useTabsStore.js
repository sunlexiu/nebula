import { create } from 'zustand';
import { format } from 'sql-formatter';
import toast from 'react-hot-toast';

export const useTabsStore = create((set, get) => ({
  tabs: [{ id: 1, title: 'Query 1', query: '', results: [] }],
  activeTabId: 1,
  setTabs: (tabs) => set({ tabs }),
  setActiveTabId: (id) => set({ activeTabId: id }),
  updateQuery: (newQuery) => {
    set((state) => ({
      tabs: state.tabs.map((t) => (t.id === state.activeTabId ? { ...t, query: newQuery } : t)),
    }));
  },
  executeQuery: async (query) => {
    if (!query.trim()) return [];
    try {
      // 未来替换为真实 API: const res = await fetch('/api/query/execute', { body: JSON.stringify({ query }) });
      // return res.json().results;
      toast.loading('执行查询中...');
      // Mock 延迟
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast.success('查询执行成功');
      return [
        { id: 1, name: 'Alice', age: 20, email: 'alice@example.com' },
        { id: 2, name: 'Bob', age: 25, email: 'bob@example.com' },
        { id: 3, name: 'Charlie', age: 30, email: 'charlie@example.com' },
      ];
    } catch (error) {
      toast.error('查询执行失败');
      return [];
    }
  },
  addTab: () => {
    const newId = Date.now();
    set((state) => ({
      tabs: [
        ...state.tabs,
        { id: newId, title: `Query ${state.tabs.length + 1}`, query: '', results: [] },
      ],
      activeTabId: newId,
    }));
  },
  closeTab: (id) => {
    set((state) => {
      const newTabs = state.tabs.filter((t) => t.id !== id);
      let nextId = state.activeTabId;
      if (state.activeTabId === id) {
        nextId = newTabs.length > 0 ? newTabs[0].id : null;
      }
      return { tabs: newTabs, activeTabId: nextId };
    });
  },
  formatQuery: () => {
    set((state) => ({
      tabs: state.tabs.map((t) =>
        t.id === state.activeTabId
          ? {
              ...t,
              query: format(t.query, {
                language: 'sql',
                tabWidth: 2,
                linesBetweenQueries: 2,
              }),
            }
          : t
      ),
    }));
  },
  checkTabOverflow: (containerRef) => {
    if (containerRef.current) {
      const { scrollWidth, clientWidth } = containerRef.current;
      return scrollWidth > clientWidth;
    }
    return false;
  },
  handleTabScroll: (direction, containerRef) => {
    if (containerRef.current) {
      const container = containerRef.current;
      const scrollAmount = 200;
      if (direction === 'left') {
        container.scrollLeft = Math.max(0, container.scrollLeft - scrollAmount);
      } else {
        container.scrollLeft = Math.min(
          container.scrollWidth - container.clientWidth,
          container.scrollLeft + scrollAmount
        );
      }
    }
  },
}));