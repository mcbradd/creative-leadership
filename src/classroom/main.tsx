import { createRoot } from "react-dom/client";
import "@fontsource-variable/mona-sans";
import Classroom from "./Classroom";
import "./classroom.css";

createRoot(document.getElementById("root")!).render(<Classroom />);
