import { HiOutlineChatBubbleOvalLeftEllipsis } from "react-icons/hi2";
import { useNavigate } from "react-router-dom";
import { FaUser } from "react-icons/fa";
export default function Page2() {
  const navigate = useNavigate();

  const goToChat = () => {
    navigate("/Chat");
  };
  const goToGruop = () => {
    navigate("/GroupChat");
  };
  return (
    <div className=" flex justify-around gap-5 p-10 text-2xl font-bold">
      <button onClick={goToChat} className="cursor-pointer">
        <FaUser />
      </button>
      <button onClick={goToGruop} className="cursor-pointer">
        <HiOutlineChatBubbleOvalLeftEllipsis />
      </button>
    </div>
  );
}
