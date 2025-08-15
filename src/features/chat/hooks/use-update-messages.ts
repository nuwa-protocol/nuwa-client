import { ChatStateStore } from '../stores';

export const useUpdateMessages = () => {
  const { updateMessages } = ChatStateStore.getState();
  return updateMessages;
};
