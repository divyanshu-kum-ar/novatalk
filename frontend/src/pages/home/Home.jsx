import MessageContainer from "../../components/messages/MessageContainer";
import Sidebar from "../../components/sidebar/Sidebar";
import useListenMessages from "../../hooks/useListenMessages";
import useConversation from "../../zustand/useConversation";

const Home = () => {
  useListenMessages();
  const { selectedConversation } = useConversation();

  return (
    <div className="flex w-full h-full md:h-[93vh] md:max-w-[93vw] xl:max-w-[1650px] md:rounded-3xl md:shadow-2xl overflow-hidden glass-panel transition-all duration-300">
      {/* Sidebar list */}
      <div
        className={`flex-col h-full border-r border-white/5 bg-slate-950/20 w-full md:w-[380px] md:min-w-[380px] transition-all duration-300 ${
          selectedConversation ? "hidden md:flex" : "flex"
        }`}
      >
        <Sidebar />
      </div>

      {/* Message Feed */}
      <div
        className={`flex-col h-full w-full flex-1 transition-all duration-300 ${
          selectedConversation ? "flex" : "hidden md:flex"
        }`}
      >
        <MessageContainer />
      </div>
    </div>
  );
};
export default Home;
