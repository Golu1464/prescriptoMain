// src/App.jsx
import React from "react";
import { Route, Routes } from "react-router-dom";
import Home from "./pages/Home.jsx";
import About from "./pages/About.jsx";
import Doctors from "./pages/Doctors.jsx";
import MyAppointments from "./pages/MyAppointments.jsx";
import MyProfile from "./pages/MyProfile.jsx";
import Login from "./pages/Login.jsx";
import Contact from "./pages/Contact.jsx";
import Appointments from "./pages/MyAppointments.jsx";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import HealthcareChatbot from "./components/HealthcareChatbot.jsx";


const App = () => {
  // ⚠️ Use your OpenAI API key here (for testing only)
  const openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY;

  return (
    <div className="mx-4 sm:mx-[10%]">
      <ToastContainer />
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/doctors" element={<Doctors />} />
        <Route path="/doctors/:speciality" element={<Doctors />} />
        <Route path="/login" element={<Login />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/my-profile" element={<MyProfile />} />
        <Route path="/my-appointments" element={<MyAppointments />} />
        <Route path="/appointment/:docId" element={<Appointments />} />
      </Routes>
      <Footer />

      {/* Healthcare Chatbot (bottom-right corner) */}
      <HealthcareChatbot openaiApiKey={openaiApiKey} />

     
    </div>
  );
};

export default App;