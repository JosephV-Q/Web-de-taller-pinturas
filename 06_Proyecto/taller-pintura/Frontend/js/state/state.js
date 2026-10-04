export const state = {
  style: null,
  imageBase64: null,
  mediaType: null,
  currentOrderId: null,
  chatHistory: []
};

export let selectedStars = 0;

export function setSelectedStars(value) {
  selectedStars = value;
}
