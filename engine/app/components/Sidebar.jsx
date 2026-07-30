import React, { useState } from "react";
import SearchBar from "./SearchBar.jsx";
import Tree from "./Tree.jsx";
import IndexList from "./IndexList.jsx";

// Persistent left rail: search + a Tree/Index tab switch.
export default function Sidebar({ route }) {
  const [tab, setTab] = useState("tree");
  return (
    <aside className="sidebar">
      <div className="sidebar-search">
        <SearchBar />
      </div>
      <div className="sidebar-tabs" role="tablist">
        <button
          role="tab"
          className={"tab" + (tab === "tree" ? " active" : "")}
          onClick={() => setTab("tree")}
        >
          🌳 Tree
        </button>
        <button
          role="tab"
          className={"tab" + (tab === "index" ? " active" : "")}
          onClick={() => setTab("index")}
        >
          🔤 Index
        </button>
      </div>
      <div className="sidebar-scroll">
        {tab === "tree" ? <Tree route={route} /> : <IndexList />}
      </div>
    </aside>
  );
}
