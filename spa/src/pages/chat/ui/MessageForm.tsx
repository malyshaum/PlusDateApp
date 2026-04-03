import { TextareaField } from "@/shared/ui"
import IconArrow from "@/shared/assets/icons/icon-arrow-up.svg"
import { type ChatMessageForm, useChatForm } from "@/pages/chat/lib"
import { type IMessage, useSendMessage } from "@/entities/chats"
import { motion, AnimatePresence } from "framer-motion"

interface Props {
  chatId?: string
  onSuccess: (message: IMessage) => void
  onInputFocus?: () => void
}

export const MessageForm = ({ chatId, onSuccess, onInputFocus }: Props) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setFocus,
    setValue,
    messageText,
  } = useChatForm()

  const sendMessageMutation = useSendMessage({
    onSuccess,
  })

  const handleSendMessage = (data: ChatMessageForm) => {
    if (data.content.trim() && chatId) {
      const messageToSend = data.content

      sendMessageMutation.mutate({
        chat_id: parseInt(chatId),
        message: messageToSend,
      })

      setValue("content", "")
      setFocus("content")
    }
  }

  return (
    <form
      onSubmit={handleSubmit(handleSendMessage)}
      className='mt-4 flex items-end gap-2 absolute inset-0 top-auto px-4 z-20'
      style={{
        bottom: "calc(var(--tg-viewport-safe-area-inset-bottom) + var(--safe-padding) + 10px",
      }}
    >
      <motion.div className='flex-1' layout transition={{ duration: 0.2, ease: "easeInOut" }}>
        <TextareaField
          name='content'
          type='rounded'
          register={register}
          error={errors.content}
          placeholder='Type a message...'
          appearance='liquid-glass'
          onFocus={onInputFocus}
        />
      </motion.div>

      <AnimatePresence>
        {messageText?.trim() && (
          <motion.button
            type='submit'
            disabled={sendMessageMutation.isPending}
            className='bg-accent rounded-full flex items-center justify-center disabled:opacity-50 w-[46px] h-[46px]'
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            {sendMessageMutation.isPending ? (
              <div className='w-4 h-4 border-2 border-white-20 border-t-white rounded-full animate-spin' />
            ) : (
              <img src={IconArrow} alt='' />
            )}
          </motion.button>
        )}
      </AnimatePresence>
    </form>
  )
}
