import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import About from "./pages/About";
import Play from "./pages/Play";
import Rules from "./pages/Rules";
import CreateGame from "./pages/CreateGame";
import Multiplayer from "./pages/Multiplayer";
import "./App.css";

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/play" element={<Play />} />
        <Route path="/rules" element={<Rules />} />
        <Route path="/create-game" element={<CreateGame />} />
        <Route path="/multiplayer/:gameId" element={<Multiplayer />} />
      </Routes>
    </Router>
  );
}

export default App;
