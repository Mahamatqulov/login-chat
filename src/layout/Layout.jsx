import { Outlet } from "react-router-dom";
import Sidebar from "../page/Sidebar";

function Layaut() {
  return (
    <>
      <div className="flex h-screen gap-2">
        <Sidebar />
        <main>
          <Outlet />
        </main>
      </div>
    </>
  );
}

export default Layaut;
