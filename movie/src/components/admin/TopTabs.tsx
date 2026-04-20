import React from "react";

interface TopTabsProps {
  activeSubTab: "movies" | "genres" | "rooms" | "seats" | "showtimes" | "prices";
  activeRoomTab: "cinemas" | "rooms" | "roomTypes";
  onSubTabChange: (tab: "movies" | "genres" | "rooms" | "seats" | "showtimes" | "prices") => void;
  onRoomTabChange: (tab: "cinemas" | "rooms" | "roomTypes") => void;
  onResetGenreForm: () => void;
  onResetCinemaForm: () => void;
  onResetForm: () => void;
  onResetRoomForm: () => void;
  onResetRoomTypeForm: () => void;
}

const TopTabs: React.FC<TopTabsProps> = ({
  activeSubTab,
  activeRoomTab,
  onSubTabChange,
  onRoomTabChange,
  onResetGenreForm,
  onResetCinemaForm,
  onResetForm,
  onResetRoomForm,
  onResetRoomTypeForm,
}) => {
  if (activeSubTab === "seats" || activeSubTab === "showtimes" || activeSubTab === "prices") {
    return <div className="top-tabs-container" />;
  }

  return (
    <div className="top-tabs-container">
      {activeSubTab !== "rooms" ? (
        <div className="sub-tabs">
          <button
            onClick={() => {
              onSubTabChange("movies");
              onResetGenreForm();
              onResetCinemaForm();
            }}
            className={`tab-button ${activeSubTab === "movies" ? "active" : ""}`}
          >
            Quản lý phim
          </button>
          <button
            onClick={() => {
              onSubTabChange("genres");
              onResetForm();
              onResetCinemaForm();
            }}
            className={`tab-button ${activeSubTab === "genres" ? "active" : ""}`}
          >
            Quản lý thể loại
          </button>
        </div>
      ) : (
        <div className="sub-tabs">
          <button
            onClick={() => {
              onRoomTabChange("cinemas");
              onResetRoomForm();
            }}
            className={`tab-button ${activeRoomTab === "cinemas" ? "active" : ""}`}
          >
            Quản lý rạp
          </button>
          <button
            onClick={() => {
              onRoomTabChange("rooms");
            }}
            className={`tab-button ${activeRoomTab === "rooms" ? "active" : ""}`}
          >
            Quản lý phòng
          </button>
          <button
            onClick={() => {
              onRoomTabChange("roomTypes");
              onResetRoomTypeForm();
            }}
            className={`tab-button ${activeRoomTab === "roomTypes" ? "active" : ""}`}
          >
            Quản lý loại phòng
          </button>
        </div>
      )}
    </div>
  );
};

export default TopTabs;
