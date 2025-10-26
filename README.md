# 🚍 BU Smart Bus
**Smarter, Friendlier Transit for Terriers**  
A real-time web app that helps the Boston University community move confidently across campus.

---

## 💡 Inspiration
Getting around BU shouldn’t feel like guesswork.  
Every Terrier knows the frustration — waiting at the stop, refreshing an outdated tracker, and wondering *“Is the bus even coming?”*

We asked: what if BU students had an app as smart and intuitive as Uber — but made for our own campus?

That’s how **BU Smart Bus** was born — a real-time, student-built transit assistant designed with empathy and reliability in mind.

---

## 🚀 What It Does
BU Smart Bus is a live transit web app powered by the official **BU Bus API** and **Google Maps Platform**.

### Core Features
- 🗺️ **Interactive Live Map** – Track BU Shuttle locations in real time  
- ⏱️ **Accurate Arrival Predictions** – View upcoming bus times at any stop  
- 🔔 **Smart Alerts** – Get notified about delays, crowding, or reduced service  
- ⭐ **Favorites** – Pin frequently used stops for quick access  
- 🧭 **Journey Planner** – Combines walking + bus routes to reach your destination  
- 🔍 **Search Anywhere** – Search by stop name, route, or destination  

---

## ⚙️ How It Works

### Frontend
- Built with **React + TypeScript**
- Uses **Google Maps JavaScript API** for route visualization
- Fetches live bus data from the backend via REST APIs

### Backend
- Built with **Node.js + Express**
- Integrates with the **BU Shuttle API**
- Provides endpoints for stops, routes, and arrival predictions
- Handles caching and error recovery to keep data fresh

---

## 🧭 Journey Planning Logic

We use Google Maps' **DirectionsService** for walking data, and real BU Bus routes for the mid-segment of the journey.

Key steps in our algorithm:

1. Find the **nearest stops** to the user's current location and destination  
2. Use `getWalkingInfo()` to estimate walking distances to and from stops  
3. Filter only **available bus routes** that actually connect the two stops  
4. Compute total time and distance (walk + bus)  
5. Return an optimized route breakdown:

```ts
{
  totalDuration: 14,
  totalDistance: "3.2",
  segments: [
    { type: "walk", title: "Walk to Stop", duration: "5 min" },
    { type: "bus", title: "Take Route A", duration: "6 min" },
    { type: "walk", title: "Walk to Destination", duration: "3 min" }
  ]
}
```

---

## 🧠 Tech Stack

| Layer | Technology |
|-------|-------------|
| **Frontend** | React, TypeScript, TailwindCSS |
| **Backend** | Node.js, Express, Render Hosting |
| **Data/API** | BU Shuttle API, Google Maps API |
| **Deployment** | Render (Frontend + Backend), Render |

---

## 🛠️ Local Setup

### 1. Clone the repo
```bash
git clone https://github.com/<your-username>/bu-smart-bus.git
cd bu-smart-bus
```

### 2. Frontend setup
```bash
cd frontend
npm install
npm run dev
```

### 3. Backend setup
```bash
cd backend
npm install
npm start
```

> Make sure to add your Google Maps API key and BU API URL in `.env`  
> Example:
> ```
> VITE_GOOGLE_MAPS_API_KEY=YOUR_KEY_HERE
> SERVER_URL=https://bu-transit-server.onrender.com
> ```

---

## 🌍 Deployment

- **Frontend** → [Vercel](https://vercel.com/) or [Render](https://render.com/)  
- **Backend** → [Render Web Service](https://render.com/docs/web-services)

To connect them:
- In your frontend `.env`, set  
  ```bash
  VITE_API_URL=https://<your-backend>.onrender.com
  ```
- Redeploy the frontend

---

## 🔮 Future Additions

| Feature | Description |
|----------|--------------|
| 🔑 **BU Login Integration** | Secure access using BU credentials (OAuth / Shibboleth) |
| 🚇 **MBTA Line Access** | Extend journey planner to include MBTA buses & trains |
| 🧠 **AI Route Suggestions** | Personalized transit tips based on time & weather |
| 📱 **Mobile App (React Native)** | Dedicated mobile version for iOS & Android |

---

## 🌟 Impact

BU Smart Bus helps thousands of students save time and stress every day by:
- Reducing uncertainty with live, trustworthy updates  
- Encouraging sustainable campus transit over car use  
- Showcasing student-led innovation in real-world systems

---

## 👩‍💻 Team

**Developers:** Harini Saravanan and Team  
**Built for:** Boston University DS+X Hackathon 2025  
**Inspiration:** Reliability, Empathy, and Hufflepuff-style collaboration 💛  

---

## 🏁 Summary

> “We built BU Smart Bus so every Terrier can move confidently across campus — no more guessing, just go.”

📍 [Frontend Demo](https://bu-transit.onrender.com)  
🖥️ [Backend API](https://bu-transit-server.onrender.com)

---
