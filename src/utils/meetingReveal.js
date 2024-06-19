const KEY = 'wdr6'
const PAYLOAD = [
  31, 16, 6, 70, 4, 94, 93, 25, 20, 5, 30, 83, 25, 0, 19, 68, 89, 5, 2, 70,
  89, 3, 29, 89, 16, 8, 23, 25, 1, 35, 71, 124, 32, 14, 63, 97, 20, 29, 33, 89,
  32, 11, 58, 98, 65,
]

function decodePayload() {
  return PAYLOAD.map((byte, index) =>
    String.fromCharCode(byte ^ KEY.charCodeAt(index % KEY.length)),
  ).join('')
}

export function revealMeetingUrl() {
  return decodePayload()
}
