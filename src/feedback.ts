import { MessageAction, MessageRequest } from "./types";

const SELECTOR_ATTR = 'data-selector';
const PLAYABLE_SELECTOR_VALUE = 'vocabulary-playable-item';
const FEEDBACK_SELECTOR_VALUE = 'custom-feedback-item';
const SPEAK_SELECTOR_VALUE = 'speak-item';
const ITEM_STATE_ATTR = 'data-item-state';
const ITEM_STATE_ERROR_VALUE = 'error';

let currentAudio: HTMLAudioElement = null;

const BUTTON_HTML = `
  <button data-selector="custom-feedback-item" type="button" class="audio-feedback-button">
    <span style="position: absolute; display: flex;">
      <svg class="feedback-svg-icon" style="width: 1.5rem; height: 1.5rem;vertical-align: middle;fill: currentColor;overflow: hidden;" version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 287.386 287.386" xml:space="preserve">
        <g>
          <g>
            <path d="M62.743,155.437v98.42c0,5.867,4.741,10.605,10.605,10.605c5.854,0,10.605-4.738,10.605-10.605v-98.42
              c0-5.856-4.751-10.605-10.605-10.605C67.484,144.832,62.743,149.576,62.743,155.437z"/>
            <path d="M29.456,264.582h23.351v-116.85c0.064-0.56,0.166-1.119,0.166-1.693c0-50.412,40.69-91.42,90.698-91.42
              c50.002,0,90.692,41.008,90.692,91.42c0,0.771,0.113,1.518,0.228,2.263v116.28h23.354c16.254,0,29.442-13.64,29.442-30.469
              v-60.936c0-13.878-8.989-25.57-21.261-29.249c-1.129-66.971-55.608-121.124-122.45-121.124
              c-66.86,0-121.347,54.158-122.465,121.15C8.956,147.638,0,159.32,0,173.187v60.926C0,250.932,13.187,264.582,29.456,264.582z"/>
            <path d="M203.454,155.437v98.42c0,5.867,4.748,10.605,10.604,10.605s10.604-4.738,10.604-10.605v-98.42
              c0-5.856-4.748-10.605-10.604-10.605C208.191,144.832,203.454,149.576,203.454,155.437z"/>
          </g>
        </g>
      </svg>
    </span>
    <span class="audio-feedback-text">
      <span>%sentence%</span>
    </span>
  </button>
`

const playAudio = (e: Element, audioData: string) => {
  if (currentAudio) {
    currentAudio.pause();
  }

  currentAudio = new Audio(`data:audio/wav;base64,${audioData}`);

  currentAudio.addEventListener('play', () => {
    e.classList.add('feedback-playing');
  });

  currentAudio.addEventListener('ended', () => {
    e.classList.remove('feedback-playing');
  });

  currentAudio.play();
};

const addAudioFeedbackButton = async (node: Node) => {
  const req: MessageRequest = {operation: MessageAction.AudioRequest};
  const response = await chrome.runtime.sendMessage(req);

  if (response) {
    const div = document.createElement('div');
    div.innerHTML = BUTTON_HTML.replace(/%sentence%/g, node.textContent).trim();

    const button = div.firstChild;

    node.parentNode.insertBefore(button, node.nextSibling);

    button.addEventListener('click', () => playAudio(<Element>button, response.audio));
  }
};

const removeAudioFeedbackButton = async () => {
  const button = document.querySelector(`[${SELECTOR_ATTR}=${FEEDBACK_SELECTOR_VALUE}]`);
  if (button) {
    button.parentNode.removeChild(button);
  }
};

const observer = new MutationObserver(mutations => {
  const handleChildListMutations = (nodes: NodeList) => {
    for (const node of nodes) {
      const el = <Element>node;
      if (el.getAttribute && el.getAttribute(SELECTOR_ATTR) === PLAYABLE_SELECTOR_VALUE && el.parentElement) {
        addAudioFeedbackButton(node);
      }
    }
  }

  const handleAttributesMutations = (node: Node, attr: string) => {
    const el = <Element>node;
    if (attr === ITEM_STATE_ATTR && el.getAttribute(SELECTOR_ATTR) === SPEAK_SELECTOR_VALUE) {
      if (el.getAttribute(ITEM_STATE_ATTR) === ITEM_STATE_ERROR_VALUE) {
        addAudioFeedbackButton(node);
      } else {
        removeAudioFeedbackButton()
      }
    }
  }

  for (const mutation of mutations) {
    switch (mutation.type) {
      case 'childList':
        handleChildListMutations(mutation.addedNodes)
        break;
      case 'attributes':
        handleAttributesMutations(mutation.target, mutation.attributeName)
        break;
      default:
        break;
    }
  }
});

observer.observe(document, {attributes: true, childList: true, subtree: true });
