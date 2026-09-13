import React, { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import MessageBubble from "./MessageBubble";
import LoadingAnimation from "./LoadingAnimation";

function MessageList() {
  const { selectedConversation } = useSelector((state) => state.conversation);
  const { messages, isLoading } = useSelector((state) => state.message);
  const bottomRef = useRef(null);

  useEffect(() => {
    requestAnimationFrame(() => {
      bottomRef?.current?.scrollIntoView({
        behavior: "smooth",
        block: "end"
      });
    });
  }, [messages?.length, isLoading]);

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar px-3 sm:px-6 py-4 sm:py-6 radial-bg pb-44">
      <div className="max-w-5xl mx-auto w-full space-y-4">
        {messages?.map((msg, i) => (
          <div key={msg._id || msg.id || i} className="w-full">
            <MessageBubble
              role={msg?.role}
              content={msg?.content}
              images={msg.images || []}
              workflow={msg.workflow}
              metrics={msg.metrics}
              executionId={msg.executionId}
              isLatest={i === messages.length - 1 && msg.role === "assistant"}
              createdAt={msg.createdAt}
            />
          </div>
        ))}

        {isLoading && <LoadingAnimation />}
      </div>
      <div ref={bottomRef} />
    </div>
  );
}

export default MessageList;
