import React from "react";
import { FaChartBar, FaDoorOpen, FaChair, FaCalendarAlt, FaFilm, FaUsers, FaUserCircle, FaMoneyBillWave } from "react-icons/fa";

interface SidebarProps {
  activeSubTab: string;
  onTabChange: (tab: "revenue" | "movies" | "genres" | "rooms" | "seats" | "showtimes" | "prices" | "staff" | "accounts") => void;
  onResetForms: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeSubTab, onTabChange, onResetForms }) => {
  const menuItems = [
    { icon: <FaChartBar />, label: "Quản lý doanh thu", tab: "revenue" as const },
    { icon: <FaDoorOpen />, label: "Quản lý phòng & Rạp", tab: "rooms" as const },
    { icon: <FaChair />, label: "Quản lý ghế", tab: "seats" as const },
    { icon: <FaCalendarAlt />, label: "Quản lý suất chiếu", tab: "showtimes" as const },
    { icon: <FaMoneyBillWave />, label: "Quản lý giá vé", tab: "prices" as const },
    { icon: <FaFilm />, label: "Phim & Thể loại", tab: "movies" as const },
    { icon: <FaUsers />, label: "Quản lý nhân sự", tab: "staff" as const },
    { icon: <FaUserCircle />, label: "Quản lý tài khoản", tab: "accounts" as const },
  ];

  return (
    <aside className="admin-sidebar">
      {menuItems.map((item, index) => {
        const isActive = (() => {
          if (!item.tab) return false;
          if (item.tab === "movies") return activeSubTab === "movies" || activeSubTab === "genres";
          return item.tab === activeSubTab;
        })();

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
