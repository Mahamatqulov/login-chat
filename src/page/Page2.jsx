import { HiOutlineChatBubbleOvalLeftEllipsis } from "react-icons/hi2";
import { useNavigate } from "react-router-dom";
export default function Page2() {
  const navigate = useNavigate();

  const goToChat = () => {
    navigate("/Chat");
  };
  return (
    <h1 className="text-2xl font-bold">
      <button onClick={goToChat} className="cursor-pointer">
        <HiOutlineChatBubbleOvalLeftEllipsis />
      </button>
    </h1>
  );
}
