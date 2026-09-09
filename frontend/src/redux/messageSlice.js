import { createSlice } from "@reduxjs/toolkit";

const messageSlice = createSlice({
  name: "message",
  initialState: {
    messages: [],
    artifacts: [],
    isLoading: false,
    isStopping: false,
    currentExecutionId: null,
    currentLiveExecution: null
  },
  reducers: {
    setMessages: (state, action) => {
      state.messages = action.payload || [];
    },
    addMessage: (state, action) => {
      state.messages.push(action.payload);
    },
    setArtifacts: (state, action) => {
      state.artifacts = action.payload || [];
    },
    setIsLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setIsStopping: (state, action) => {
      state.isStopping = action.payload;
    },
    setCurrentExecutionId: (state, action) => {
      state.currentExecutionId = action.payload;
    },
    setCurrentLiveExecution: (state, action) => {
      state.currentLiveExecution = action.payload;
    },
    clearLiveExecution: (state) => {
      state.currentLiveExecution = null;
      state.currentExecutionId = null;
      state.isStopping = false;
    },
    updateLastAssistantMessage: (state, action) => {
      for (let i = state.messages.length - 1; i >= 0; i--) {
        if (state.messages[i].role === "assistant") {
          state.messages[i] = { ...state.messages[i], ...action.payload };
          break;
        }
      }
    }
  }
});

export const {
  setMessages,
  addMessage,
  setArtifacts,
  setIsLoading,
  setIsStopping,
  setCurrentExecutionId,
  setCurrentLiveExecution,
  clearLiveExecution,
  updateLastAssistantMessage
} = messageSlice.actions;

export default messageSlice.reducer;
