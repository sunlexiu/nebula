// ToolbarTop.jsx
import React, { useState } from 'react';
import '../../css/ToolbarTop.css';
import NewGroupModal from './NewGroupModal';
import NewConnectionModal from './NewConnectionModal';

// Import your static icon assets
import NewFileIcon from '../../public/icons/toptoolbar/new_folder_2_color.svg';
import ConnectIcon from '../../public/icons/toptoolbar/new_connection_3_color.svg';
import QueryIcon from '../../public/icons/toptoolbar/query_3.svg';
import SettingsIcon from '../../public/icons/toptoolbar/setting_2_color.svg';
import SearchIcon from '../../public/icons/toptoolbar/new_folder_1.svg';
import ExecuteIcon from '../../public/icons/toptoolbar/new_folder_1.svg';

const ToolbarTop = ({ addTab, refreshTree }) => {
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isConnectionModalOpen, setIsConnectionModalOpen] = useState(false);

  const handleNewGroupSubmit = (groupName, data) => {
    console.log('New Group:', groupName, data);
    // 提交成功后刷新树
    refreshTree();
  };

  const handleNewConnectionSubmit = (connectionData) => {
    console.log('New Connection:', connectionData);
    // 在这里实现连接创建逻辑，例如调用 API 或更新状态
  };

  return (
    <div className="toolbar-top">
      <div className="toolbar-top-left">
        <button
          className="btn btn-icon"
          title="新建分组"
          onClick={() => setIsGroupModalOpen(true)}
        >
          <img src={NewFileIcon} alt="新建分组" className="icon" />
        </button>
        <button
          className="btn btn-icon"
          title="新建连接"
          onClick={() => setIsConnectionModalOpen(true)}
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
      </div>
      <NewGroupModal
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
        onSubmit={handleNewGroupSubmit}
        refreshTree={refreshTree}
      />
      <NewConnectionModal
        isOpen={isConnectionModalOpen}
        onClose={() => setIsConnectionModalOpen(false)}
        onSubmit={handleNewConnectionSubmit}
      />
    </div>
  );
};

export default ToolbarTop;