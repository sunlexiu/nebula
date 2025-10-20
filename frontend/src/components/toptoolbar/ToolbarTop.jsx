import React from 'react';
import '../../css/ToolbarTop.css';
import NewFileIcon from '../../public/icons/toptoolbar/new_folder_2_color.svg';
import ConnectIcon from '../../public/icons/toptoolbar/new_connection_3_color.svg';
import QueryIcon from '../../public/icons/toptoolbar/query_3.svg';
import SearchIcon from '../../public/icons/toptoolbar/new_folder_1.svg'; // 假设图标
import ExecuteIcon from '../../public/icons/toptoolbar/new_folder_1.svg'; // 假设图标
import RefreshIcon from '../../public/icons/toptoolbar/refresh.svg'; // 假设刷新图标
import { useTabsStore } from '../../stores/useTabsStore';
import { useTreeStore } from '../../stores/useTreeStore';
import { openNewGroup, openNewConnection } from '../modals/modalActions'; // 导入 actions
import { useModal } from '../modals/ModalProvider'; // 修复：导入 useModal Hook

const ToolbarTop = () => {
  const addTab = useTabsStore((state) => state.addTab);
  const refreshTree = useTreeStore((state) => state.refreshTree);
  const { openModal } = useModal(); // 修复：获取 openModal

  return (
    <div className="toolbar-top">
      <div className="toolbar-top-left">
        <button
          className="btn btn-icon"
          title="新建分组"
          onClick={() => openNewGroup(null, openModal)} // 修复：传递 openModal 参数
        >
          <img src={NewFileIcon} alt="新建分组" className="icon" />
        </button>
        <button
          className="btn btn-icon"
          title="新建连接"
          onClick={() => openNewConnection(null, openModal)} // 修复：传递 openModal 参数
        >
          <img src={ConnectIcon} alt="新建连接" className="icon" />
        </button>
        <button className="btn btn-icon" title="新建查询" onClick={addTab}>
          <img src={QueryIcon} alt="新建查询" className="icon" />
        </button>
        <select className="toolbar-dropdown" title="操作菜单">
          <option>操作</option>
          <option>连接</option>
          <option>导出</option>
        </select>
      </div>
      <div className="toolbar-top-right">
        <button className="btn btn-icon" title="搜索">
          <img src={SearchIcon} alt="搜索" className="icon" />
        </button>
        <button className="btn btn-icon" title="执行">
          <img src={ExecuteIcon} alt="执行" className="icon" />
        </button>
        <button className="btn btn-icon" title="刷新树" onClick={refreshTree}>
          <img src={RefreshIcon} alt="刷新" className="icon" />
        </button>
      </div>
    </div>
  );
};

export default ToolbarTop;