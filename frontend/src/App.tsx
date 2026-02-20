import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";

function App() {
  return (
    <Router>
      <div className="dark min-h-screen">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/generate" element={<div className="p-8 text-center text-foreground">Generate Page (Coming Soon)</div>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
