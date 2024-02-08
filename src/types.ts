interface AudioInfo {
  tabId: number;
  requestId: string;
  audio: string;
}

interface AudioInfoMap<AudioInfo> {
  [tabId: number]: AudioInfo;
}

enum MessageAction {
  AudioRequest,
  AudioDelete,
}

interface MessageRequest {
  operation: MessageAction;
}

export { AudioInfo, AudioInfoMap, MessageRequest, MessageAction }
