import React from "react";
import { FaChartBar, FaDoorOpen, FaChair, FaCalendarAlt, FaFilm, FaUsers, FaUserCircle } from "react-icons/fa";

interface SidebarProps {
  activeSubTab: string;
  onTabChange: (tab: "movies" | "genres" | "rooms") => void;
  onResetForms: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeSubTab, onTabChange, onResetForms }) => {
  const menuItems = [
    { icon: <FaChartBar />, label: "Quản lý doanh thu" },
    { icon: <FaDoorOpen />, label: "Quản lý phòng & Rạp", tab: "rooms" as const },
    { icon: <FaChair />, label: "Quản lý ghế" },
    { icon: <FaCalendarAlt />, label: "Quản lý suất chiếu" },
    { icon: <FaFilm />, label: "Phim & Thể loại", tab: "movies" as const },
    { icon: <FaUsers />, label: "Quản lý nhân sự" },
    { icon: <FaUserCircle />, label: "Quản lý tài khoản" },
  ];

  return (
    <aside className="admin-sidebar">
      {menuItems.map((item, index) => {
        const isActive = item.tab ? (item.tab === "rooms" ? activeSubTab === "rooms" : (activeSubTab === "movies" || activeSubTab === "genres")) : false;
        
        return (
          <div
            key={index}
            onClick={() => {
              if (item.tab) {
                onTabChange(item.tab);
                onResetForms();
              }
            }}
            className={`sidebar-item ${isActive ? "active" : ""}`}
          >
            <span className="sidebar-icon">{item.icon}</span>
            <span className="sidebar-label">{item.label}</span>
          </div>
        );
      })}
    </aside>
  );
};

export default Sidebar;
