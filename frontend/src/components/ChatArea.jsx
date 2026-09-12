import React, { useEffect, useRef } from 'react'
import Nav from './Nav'
import MessageList from './MessageList'
import ChatInput from './ChatInput'
import { useDispatch, useSelector } from 'react-redux'
import getMessages from '../features/getMessages'
import { setArtifacts, setMessages } from '../redux/messageSlice'

function ChatArea() {
  const { selectedConversation } = useSelector(state => state.conversation)
  const { isLoading, messages } = useSelector(state => state.message)
  const dispatch = useDispatch()
  const loadedConvIdRef = useRef(null)

  useEffect(() => {
    const getMesg = async () => {
      if (!selectedConversation?._id) {
        loadedConvIdRef.current = null;
        return;
      }

      // If we already loaded this conversation, don't re-fetch and wipe out in-memory messages
      if (loadedConvIdRef.current === selectedConversation._id) {
        return;
      }

      // If a message is actively being processed for a newly created chat, do not wipe out in-memory messages
      if (isLoading && messages.length > 0) {
        loadedConvIdRef.current = selectedConversation._id;
        return;
      }

      if (selectedConversation.title === "New Chat" && messages.length > 0) {
        loadedConvIdRef.current = selectedConversation._id;
        return;
      }

      try {
        loadedConvIdRef.current = selectedConversation._id;
        const data = await getMessages(selectedConversation._id);
        dispatch(setMessages(data || []));
        const latestArtifactMessage = [...(data || [])].reverse().find(msg => msg.artifacts && msg.artifacts.length > 0);
        dispatch(setArtifacts(latestArtifactMessage?.artifacts || []));
      } catch (err) {
        console.error("[getMesg Error]", err);
      }
    };

    getMesg();
  }, [selectedConversation?._id]);

  return (
    <div className='flex-1 flex flex-col min-w-0'>
      <Nav/>
      <MessageList/>
      <ChatInput/>
    </div>
  )
}

export default ChatArea
