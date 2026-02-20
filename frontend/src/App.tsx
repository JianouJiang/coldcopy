import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Generate from "./pages/Generate";
import Output from "./pages/Output";
import { ToastContainer } from "./components/Toast";

function App() {
  return (
    <Router>
      <div className="dark min-h-screen">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/generate" element={<Generate />} />
          <Route path="/output" element={<Output />} />
        </Routes>
        <ToastContainer />
      </div>
    </Router>
  );
}

export default App;
