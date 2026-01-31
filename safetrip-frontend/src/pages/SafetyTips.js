import React, { useState } from "react";
import useGeolocation from "../hooks/useGeolocation";
import "./SafetyTips.css";

const safetyCategories = [
  {
    category: "Before You Travel",
    icon: "✈️",
    color: "#4F46E5",
    tips: [
      {
        title: "Research Your Destination",
        icon: "🔍",
        desc: "Check travel advisories, local laws, customs, and safety ratings. Know areas to avoid and emergency procedures.",
      },
      {
        title: "Share Your Itinerary",
        icon: "📋",
        desc: "Provide a detailed travel plan to trusted family or friends including flights, accommodations, and daily activities.",
      },
      {
        title: "Register with Your Embassy",
        icon: "🏛️",
        desc: "Enroll in your country's travel registration program to receive safety alerts and make evacuation easier.",
      },
      {
        title: "Make Copies of Documents",
        icon: "📄",
        desc: "Scan passport, visas, insurance, and credit cards. Store copies separately and in cloud storage.",
      },
      {
        title: "Get Travel Insurance",
        icon: "🛡️",
        desc: "Ensure coverage includes medical emergencies, evacuation, trip cancellation, and theft protection.",
      },
    ],
  },
  {
    category: "Personal Safety",
    icon: "🔒",
    color: "#DC2626",
    tips: [
      {
        title: "Stay Alert and Aware",
        icon: "👀",
        desc: "Keep your phone charged, avoid distractions in unfamiliar areas, and be mindful of your surroundings at all times.",
      },
      {
        title: "Trust Your Instincts",
        icon: "🧠",
        desc: "If a situation feels unsafe or uncomfortable, leave immediately. Your intuition is a powerful safety tool.",
      },
      {
        title: "Avoid Displaying Valuables",
        icon: "💎",
        desc: "Keep jewelry, expensive watches, and electronics out of sight. Use anti-theft bags and money belts.",
      },
      {
        title: "Use Well-Lit Public Areas",
        icon: "💡",
        desc: "Stick to busy, well-lit streets especially at night. Avoid shortcuts through alleys or isolated areas.",
      },
      {
        title: "Vary Your Routine",
        icon: "🔄",
        desc: "Change your routes and schedules regularly to avoid being predictable and becoming a target.",
      },
      {
        title: "Be Cautious with Strangers",
        icon: "🚫",
        desc: "Don't share personal details, hotel information, or travel plans with people you just met.",
      },
    ],
  },
  {
    category: "Emergency Preparedness",
    icon: "🆘",
    color: "#DC2626",
    tips: [
      {
        title: "Know Emergency Numbers",
        icon: "📞",
        desc: "Save local police (e.g., 911, 112), ambulance, fire, and your embassy numbers in your phone.",
      },
      {
        title: "Use the SOS Feature",
        icon: "🚨",
        desc: "Activate SafeTrip's SOS button to instantly alert emergency contacts with your real-time location.",
      },
      {
        title: "Identify Safe Locations",
        icon: "🏥",
        desc: "Locate nearby police stations, hospitals, and your embassy. Mark them on your map app.",
      },
      {
        title: "Learn Basic Local Phrases",
        icon: "🗣️",
        desc: 'Know how to say "help", "police", "hospital", and "emergency" in the local language.',
      },
      {
        title: "Keep a Safety Kit",
        icon: "🎒",
        desc: "Carry first aid supplies, whistle, flashlight, portable charger, and emergency cash.",
      },
    ],
  },
  {
    category: "Digital Security",
    icon: "🔐",
    color: "#7C3AED",
    tips: [
      {
        title: "Use VPN on Public WiFi",
        icon: "🌐",
        desc: "Always connect through a VPN when using hotel, cafe, or airport WiFi to protect your data.",
      },
      {
        title: "Enable Two-Factor Authentication",
        icon: "🔑",
        desc: "Activate 2FA on email, banking, and social media accounts. Use authenticator apps over SMS.",
      },
      {
        title: "Backup Your Data",
        icon: "☁️",
        desc: "Regularly backup photos, documents, and important files to secure cloud storage.",
      },
      {
        title: "Beware of Scams",
        icon: "⚠️",
        desc: "Watch for fake WiFi networks, phishing emails, and payment scams. Verify before clicking links.",
      },
      {
        title: "Disable Location Sharing",
        icon: "📍",
        desc: "Turn off auto location tagging on social media posts until after you've left a location.",
      },
    ],
  },
  {
    category: "Transportation Safety",
    icon: "🚗",
    color: "#059669",
    tips: [
      {
        title: "Use Licensed Transportation",
        icon: "🚕",
        desc: "Book rides through official apps or reputable companies. Verify driver identity and license plates.",
      },
      {
        title: "Share Trip Details",
        icon: "📲",
        desc: "Send your route and driver info to a friend. Use in-app tracking features when available.",
      },
      {
        title: "Sit in the Back Seat",
        icon: "🪑",
        desc: "In taxis or rideshares, sit in the rear for better exit options and maintain appropriate distance.",
      },
      {
        title: "Keep Valuables Close",
        icon: "👜",
        desc: "Never put bags in the trunk or out of sight. Keep essentials within arm's reach.",
      },
      {
        title: "Know Your Route",
        icon: "🗺️",
        desc: "Follow along on your phone's map. Speak up if the driver takes an unexpected detour.",
      },
    ],
  },
  {
    category: "Health & Wellness",
    icon: "🏥",
    color: "#EA580C",
    tips: [
      {
        title: "Stay Hydrated & Nourished",
        icon: "💧",
        desc: "Drink bottled water in areas with unsafe tap water. Maintain regular meals and rest.",
      },
      {
        title: "Get Required Vaccinations",
        icon: "💉",
        desc: "Consult a travel medicine specialist 4-6 weeks before travel for necessary immunizations.",
      },
      {
        title: "Pack Essential Medications",
        icon: "💊",
        desc: "Bring prescriptions in original containers with extra supply. Carry a doctor's note for controlled substances.",
      },
      {
        title: "Know Medical Facilities",
        icon: "🏨",
        desc: "Research quality hospitals and English-speaking doctors at your destination.",
      },
      {
        title: "Practice Food Safety",
        icon: "🍽️",
        desc: "Eat at busy, reputable establishments. Avoid raw foods, street food if unsure, and ice from unknown sources.",
      },
    ],
  },
];

const SafetyTips = () => {
  const [activeCategory, setActiveCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { location, error, loading, getLocation } = useGeolocation();

  const filteredCategories = safetyCategories
    .map((category) => ({
      ...category,
      tips: category.tips.filter(
        (tip) =>
          tip.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tip.desc.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter((category) => category.tips.length > 0);

  return (
    <div className="safety-tips-page">
      <div className="safety-tips-container">
        <div className="safety-header">
          <h1>Travel Safety Guide</h1>
          <p className="safety-intro">
            Comprehensive safety tips to protect yourself during your travels.
            Stay informed, stay safe.
          </p>
        </div>

        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search safety tips..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="location-section">
          <button
            onClick={getLocation}
            disabled={loading}
            className="location-btn"
          >
            {loading ? "Getting Location..." : "📍 Get Location-Based Tips"}
          </button>
          {location && (
            <div className="location-info">
              <span className="location-icon">📍</span>
              <span>
                Current location: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                {location.accuracy && ` (±${Math.round(location.accuracy)}m)`}
              </span>
            </div>
          )}
          {error && (
            <div className="location-error">
              <span className="error-icon">⚠️</span>
              <span>{error.message}</span>
            </div>
          )}
        </div>

        <div className="category-filters">
          <button
            className={`filter-btn ${activeCategory === null ? "active" : ""}`}
            onClick={() => setActiveCategory(null)}
          >
            All Categories
          </button>
          {safetyCategories.map((cat, idx) => (
            <button
              key={idx}
              className={`filter-btn ${activeCategory === idx ? "active" : ""}`}
              onClick={() => setActiveCategory(idx)}
            >
              <span>{cat.icon}</span> {cat.category}
            </button>
          ))}
        </div>

        <div className="categories-container">
          {filteredCategories
            .filter(
              (_, idx) => activeCategory === null || activeCategory === idx
            )
            .map((category, catIdx) => (
              <div key={catIdx} className="category-section">
                <div
                  className="category-header"
                  style={{ borderLeftColor: category.color }}
                >
                  <span className="category-icon">{category.icon}</span>
                  <div>
                    <h2>{category.category}</h2>
                    <span className="tip-count">
                      {category.tips.length} tips
                    </span>
                  </div>
                </div>
                <div className="tips-grid">
                  {category.tips.map((tip, tipIdx) => (
                    <div key={tipIdx} className="tip-card">
                      <div className="tip-header">
                        <span className="tip-icon">{tip.icon}</span>
                        <h3>{tip.title}</h3>
                      </div>
                      <p>{tip.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>

        {filteredCategories.length === 0 && (
          <div className="no-results">
            <span className="no-results-icon">🔍</span>
            <p>No safety tips found matching "{searchQuery}"</p>
          </div>
        )}

        <div className="emergency-banner">
          <span className="emergency-icon">🚨</span>
          <div className="emergency-content">
            <h3>In Case of Emergency</h3>
            <p>
              Use the SOS button to instantly alert your emergency contacts with
              your location. Your safety is our priority.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SafetyTips;
