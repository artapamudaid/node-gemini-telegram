import axios from "axios";

export async function sendTelegramMessage(
  telegram_bot_key: string,
  telegram_receiver_id: string,
  text: any,
  message_thread_id?: number
) {
  const safeText =
    typeof text === "string"
      ? text
      : JSON.stringify(text, null, 2);

  const payload: any = {
    chat_id: telegram_receiver_id,
    text: safeText.slice(0, 4000),
  };

  // hanya kirim jika benar-benar ada
  if (typeof message_thread_id === "number") {
    payload.message_thread_id = message_thread_id;
  }

  console.log("📤 Telegram payload:", {
    chat_id: telegram_receiver_id,
    message_thread_id,
    text_preview: safeText.slice(0, 100),
  });

  await axios.post(
    `https://api.telegram.org/bot${telegram_bot_key}/sendMessage`,
    payload
  );
}
