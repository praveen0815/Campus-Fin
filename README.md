# 🏟️ Campus Sports Booking System

Campus Sports Booking System is a modern, full-stack campus sports booking platform that digitizes facility reservations, eliminates scheduling conflicts, and provides real-time visibility into sports infrastructure usage.

It empowers both **students** and **administrators** through a seamless, responsive, and scalable web application.

---

# 🌟 What Makes Unique

* ⚡ Real-time slot booking with conflict prevention
* 🎯 Role-based access (Student / Admin)
* 🔐 Secure authentication using Supabase
* 📊 Built-in analytics for decision making
* 🔔 Live notification system
* 🧩 Modular and scalable architecture

---

# 🚀 Feature Overview

## 👨‍🎓 Student Experience

* Browse sports and venues
* 📅 Book slots using Book Slot page
* Select date, venue, and time
* View “My Bookings” with full details
* Cancel bookings instantly
* Receive real-time updates

---

## 👨‍💼 Admin Experience

* Manage sports, venues, and slots
* Control booking flow
* Monitor all reservations
* Access analytics dashboard
* Maintain system integrity

---

## ⏰ Smart Slot System

* Session-based slots (Morning / Evening)
* Hour-wise booking system
* Prevents overlapping bookings
* Dynamic availability updates

---

## 🔔 Real-Time Notifications

* Booking confirmations
* Admin alerts
* System updates using Supabase Realtime

---

# 📊 Analytics & Insights

* 📈 Total bookings
* 🏆 Popular sports
* ⏰ Peak usage hours
* 📊 Venue utilization

---

# 🏗️ System Architecture Overview

<img width="984" height="594" alt="Screenshot 2026-03-30 201418" src="https://github.com/user-attachments/assets/28a2ea72-7e4e-4323-8a4e-0e0f1cc77ac2" />

SlotSphere follows a **Three-Tier Architecture**:

## 🖥️ Presentation Layer
<img width="1098" height="412" alt="image" src="https://github.com/user-attachments/assets/6d21b826-48eb-4d80-9126-4c959164fb93" />


## ⚙️ Application Layer
<img width="866" height="439" alt="image" src="https://github.com/user-attachments/assets/c64a7d46-2102-4452-9bab-a5df57ec5f0b" />


## 🗄️ Data Layer
<img width="865" height="373" alt="image" src="https://github.com/user-attachments/assets/1a8c8c42-2452-4d41-a1af-815f857556fd" />


---

## 🔄 System Flow

<img width="1115" height="546" alt="image" src="https://github.com/user-attachments/assets/1a9622f9-4b84-4dfe-b53a-8f309e05b476" />


---

# 🧠 Technical Architecture (Deep Dive)

<img width="864" height="381" alt="image" src="https://github.com/user-attachments/assets/57fb2983-e203-465a-a550-f201396c5e4c" />

---

## Key Capabilities

### 🔐 Secure Authentication

* Google OAuth
* Role-based access control

### ⚡ Real-Time Sync

* Supabase subscriptions
* Instant UI updates

### 🧩 Modular Design

* Component-based frontend
* Service-based backend

---

# 🗄️ Database Design

<img width="1074" height="524" alt="image" src="https://github.com/user-attachments/assets/b4ff0136-d6c8-4faf-b2dc-7ba1cd6d609e" />


---

## Relationships
<img width="982" height="503" alt="image" src="https://github.com/user-attachments/assets/c2f702b6-bb22-4b01-b76e-e2158b3bd484" />


---

# 🔍 ER vs Schema
<img width="1018" height="586" alt="image" src="https://github.com/user-attachments/assets/15750432-f94e-48ff-98c3-97b52b4c92a0" />


| ER Model       | Database Schema   |
| -------------- | ----------------- |
| Conceptual     | Implementation    |
| Visual         | Technical         |
| Planning stage | Development stage |

---

## 👨‍🎓 Student Dashboard

<img width="1904" height="946" alt="Student Dashboard" src="https://github.com/user-attachments/assets/081f2027-196c-4b47-a037-78b659082aca" />


**Features:**

* Displays available sports
* Shows venues and quick actions
* Clean UI with card layout
* Easy navigation

---

## 📅 My Bookings
<img width="1897" height="963" alt="Student Mybookings" src="https://github.com/user-attachments/assets/9dd7ade2-6cd3-4f20-aaba-1fe496ca897e" />


**Features:**

* Shows booked slots with date & time
* Displays sport and venue
* Booking status tracking
* Cancel option

---

## 📸 Book Slot Page

<img width="1900" height="1074" alt="Book-Slot" src="https://github.com/user-attachments/assets/a6d8fd12-3835-4fee-ad19-4c66fba28eba" />


**Features:**

* Select sport and venue
* Choose date and time slot
* Real-time availability
* Prevents double booking

---

## 👨‍💼 Admin Dashboard

<img width="1919" height="1076" alt="Admin-Dashboard" src="https://github.com/user-attachments/assets/2fd37b5a-7643-47ff-92c3-52611688ba0f" />


**Features:**

* System overview
* Total bookings count
* Quick navigation
* Central control panel

---

## 🏅 Manage Sports
<img width="1917" height="1079" alt="Admin-Manage Sports" src="https://github.com/user-attachments/assets/0e840738-6de7-4d70-89d2-97207c65265c" />


**Features:**

* Add / Edit / Delete sports
* Maintain sports list

---

## 🏟️ Manage Venues

<img width="1902" height="1067" alt="Admin-ManageVenues" src="https://github.com/user-attachments/assets/8e657a46-5970-4729-93ff-1d19fc9b2689" />


**Features:**

* Assign venues
* Manage locations

---

## ⏰ Manage Slots
<img width="1896" height="939" alt="Manage-slot" src="https://github.com/user-attachments/assets/a507eab5-9c22-4a42-8d50-c296d1b758be" />


**Features:**

* Create hourly slots
* Session-based control
* Prevent overlaps

---

## 📋 Manage Bookings

<img width="1906" height="939" alt="Admin-Bookings" src="https://github.com/user-attachments/assets/067e2e66-9ed3-427e-a80b-d375a6ee6945" />


**Features:**

* View all bookings
* Monitor usage
* Manage booking status

---

## 📊 Analytics Dashboard

<img width="1913" height="1079" alt="Analytics" src="https://github.com/user-attachments/assets/b23f1547-c2ff-46a5-b8ff-8d4809254785" />


**Features:**

* Booking statistics
* Popular sports analysis
* Peak usage timing
* Graph-based insights

---

# 📁 Full Project Structure (Enterprise Level)

```id="l2d9sk"
slot-sphere/
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   ├── pages/
│   ├── services/
│   ├── hooks/
│   ├── context/
│   ├── utils/
│   ├── types/
│   ├── layouts/
│   ├── routes/
│   ├── App.tsx
│   └── main.tsx
│
├── supabase/
├── docs/screenshots/
├── .env
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

# ⚙️ Technology Stack

<img width="1077" height="739" alt="Screenshot 2026-03-30 220358" src="https://github.com/user-attachments/assets/f5544294-6867-4fba-ba70-8ef699a1d3cb" />


---

# 🧪 Testing & Validation

<img width="1105" height="678" alt="image" src="https://github.com/user-attachments/assets/5e693e0d-8c62-4e35-bb32-34bf369b2520" />

* Input validation
* Slot conflict prevention
* Role-based access testing
* UI responsiveness checks

---

# 🚀 Deployment

<img width="1133" height="561" alt="Screenshot 2026-03-30 221903" src="https://github.com/user-attachments/assets/6406d446-81bd-4a5f-8e11-d13a8a57208b" />


---

# 🔮 Future Enhancements

* 🤖 AI slot recommendation
* 📱 Mobile app
* 📊 Advanced analytics
* 📥 Report export

---

# 👨‍💻 Developer

**PRAVEENKUMAR R**
📧 [praveen72696@gmail.com](mailto:praveen72696@gmail.com)

---

# 📜 License

Academic Project – Open for learning

