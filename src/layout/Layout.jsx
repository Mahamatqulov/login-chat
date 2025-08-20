import { Outlet } from "react-router-dom";
import Sidebar from "../page/Sidebar";

function Layaut() {
  return (
    <>
      <div className="flex h-screen">
        <Sidebar />
        <main>
          <Outlet />
        </main>
      </div>
    </>
  );
}

export default Layaut;
