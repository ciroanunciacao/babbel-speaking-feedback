import { AudioInfo, AudioInfoMap, MessageAction, MessageRequest } from "./types";

const lastAudioMap: AudioInfoMap<AudioInfo> = {};

chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    const {tabId, requestId, requestBody} = details;

    if (requestBody && requestBody.raw && Array.isArray(requestBody.raw) && requestBody.raw.length) {
      const decoder = new TextDecoder('utf-8');
      const request = JSON.parse(decoder.decode(requestBody.raw[0].bytes));

      const audioInfo: AudioInfo = {
        tabId,
        requestId,
        audio: request.audio_file_base64,
      };

      if (!lastAudioMap[tabId]) {
        lastAudioMap[tabId] = audioInfo;
      }

      console.log(lastAudioMap);
    }
  },
  {
    types: ['xmlhttprequest'],
    urls: [
      '*://api.babbel-staging.io/gamma/v2/*/evaluate_pronunciation/*',
      '*://api.babbel.io/gamma/v2/*/evaluate_pronunciation/*',
    ],
  },
  ['requestBody']
);

chrome.runtime.onMessage.addListener((request: MessageRequest, sender, sendResponse) => {
  switch (request.operation) {
    case MessageAction.AudioRequest:
      sendResponse(lastAudioMap[sender.tab.id])
      break;
    case MessageAction.AudioDelete:
      delete lastAudioMap[sender.tab.id];
      sendResponse(true)
      break;
    default:
      sendResponse(null);
      break;
  }
});
