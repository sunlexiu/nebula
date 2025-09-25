import React from "react";
import "../../css/ToolbarTop.css";

const ToolbarTop = () => {
  return (
    <div className="toolbar-top">
      <div className="toolbar-top-left">
        <button className="btn btn-icon" title="新建文件">
          📄
        </button>
        <button className="btn btn-icon" title="连接">
          🔗
        </button>
        <button className="btn btn-icon" title="设置">
          ⚙️
        </button>
        <select className="toolbar-dropdown" title="操作菜单">
          <option>操作</option>
          <option>连接</option>
          <option>导出</option>
        </select>
      </div>
      <div className="toolbar-top-right">
        <button className="btn btn-icon" title="搜索">
          🔍
        </button>
        <button className="btn btn-icon" title="执行">
          ⚡
        </button>
      </div>
    </div>
  );
};

export default ToolbarTop;