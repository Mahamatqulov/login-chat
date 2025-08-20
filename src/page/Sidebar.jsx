import { Link, useNavigate } from "react-router-dom";
import { FaHome, FaUser } from "react-icons/fa";
import { LuLogOut } from "react-icons/lu";

export default function Sidebar() {
  const navigate = useNavigate();
  const email = localStorage.getItem("Email");

  const handleLogout = () => {
    localStorage.removeItem("token"); // tokenni o'chiramiz
    window.location.href = "/login"; // login sahifasiga yo'naltiramiz
  };

  return (
    <div className="w-60 bg-white shadow-lg p-4 flex flex-col gap-4">
      <h2 className="text-xl font-bold border-b pb-2">Dashboard</h2>
      <Link
        to="/home"
        className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded"
      >
        <FaHome /> Page 1
      </Link>
      <Link
        to="/page2"
        className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded"
      >
        <FaUser /> Page 2
      </Link>

      <div className="mt-auto">
        <div className="flex items-center justify-between p-2 border-t border-gray-200">
          <div className="text-sm font-medium truncate">{email}</div>
          <button
            onClick={handleLogout}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg px-2 py-2 flex items-center gap-1 justify-center"
          >
            Logout
            <LuLogOut />
          </button>
        </div>
      </div>
    </div>
  );
}
