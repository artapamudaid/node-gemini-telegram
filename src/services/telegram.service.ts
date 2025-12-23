import axios from "axios";

export async function sendTelegramMessage(
  botKey: string,
  chatId: string,
  message: string
) {
  const url = `https://api.telegram.org/bot${botKey}/sendMessage`;

  await axios.post(url, {
    chat_id: chatId,
    text: message,
  });
}
